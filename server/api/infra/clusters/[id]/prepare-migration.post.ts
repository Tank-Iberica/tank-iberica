/**
 * POST /api/infra/clusters/:id/prepare-migration
 *
 * Generate a migration plan for moving a vertical from the source cluster
 * (identified by :id) to a target cluster.
 * Admin-only endpoint.
 *
 * Body: { verticalToMigrate: string, targetClusterId: string }
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

interface PrepareMigrationBody {
  verticalToMigrate: string
  targetClusterId: string
}

interface TablePlan {
  name: string
  filter: string
  estimated_rows: number
}

interface ClusterRef {
  id: string
  name: string
}

interface MigrationPlan {
  vertical: string
  source_cluster: ClusterRef
  target_cluster: ClusterRef
  tables: TablePlan[]
  tables_excluded: string[]
  warnings: string[]
  estimated_time_seconds: number
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function countRows(
  supabase: ReturnType<typeof serverSupabaseServiceRole>,
  table: string,
  column: string,
  value: string,
): Promise<number> {
  const { count } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq(column, value)

  return count ?? 0
}

async function countAllRows(
  supabase: ReturnType<typeof serverSupabaseServiceRole>,
  table: string,
): Promise<number> {
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })

  return count ?? 0
}

export default defineEventHandler(async (event): Promise<MigrationPlan> => {
  // ── Auth: admin only ────────────────────────────────────────────────────
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const supabase = serverSupabaseServiceRole(event)

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

  if (userData?.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  // ── Validate params ────────────────────────────────────────────────────
  const sourceClusterId = getRouterParam(event, 'id')
  if (!sourceClusterId || !UUID_REGEX.test(sourceClusterId)) {
    throw createError({ statusCode: 400, message: 'Invalid source cluster ID' })
  }

  // ── Validate body ──────────────────────────────────────────────────────
  const body = await readBody<PrepareMigrationBody>(event)

  if (!body.verticalToMigrate || typeof body.verticalToMigrate !== 'string') {
    throw createError({ statusCode: 400, message: 'verticalToMigrate is required' })
  }

  if (
    !body.targetClusterId ||
    typeof body.targetClusterId !== 'string' ||
    !UUID_REGEX.test(body.targetClusterId)
  ) {
    throw createError({ statusCode: 400, message: 'targetClusterId must be a valid UUID' })
  }

  if (sourceClusterId === body.targetClusterId) {
    throw createError({ statusCode: 400, message: 'Source and target clusters must be different' })
  }

  // ── Fetch source and target clusters ───────────────────────────────────
  const [sourceResult, targetResult] = await Promise.all([
    supabase.from('infra_clusters').select('*').eq('id', sourceClusterId).single(),
    supabase.from('infra_clusters').select('*').eq('id', body.targetClusterId).single(),
  ])

  if (sourceResult.error || !sourceResult.data) {
    throw createError({ statusCode: 404, message: 'Source cluster not found' })
  }

  if (targetResult.error || !targetResult.data) {
    throw createError({ statusCode: 404, message: 'Target cluster not found' })
  }

  const sourceCluster = sourceResult.data
  const targetCluster = targetResult.data
  const vertical = body.verticalToMigrate

  // ── Count rows for each table ──────────────────────────────────────────
  // Dealers filtered by vertical
  const dealerCount = await countRows(supabase, 'dealers', 'vertical', vertical)

  // Vehicles: filtered via dealer join — get dealer IDs first, then count vehicles
  let vehicleCount = 0
  const { data: dealerIds } = await supabase.from('dealers').select('id').eq('vertical', vertical)

  if (dealerIds && dealerIds.length > 0) {
    const ids = dealerIds.map((d: Record<string, unknown>) => d.id as string)
    const { count } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .in('dealer_id', ids)

    vehicleCount = count ?? 0
  }

  // Categories and subcategories — shared, copy all
  const [categoryCount, subcategoryCount] = await Promise.all([
    countAllRows(supabase, 'categories'),
    countAllRows(supabase, 'subcategories'),
  ])

  // vertical_config filtered by slug
  const verticalConfigCount = await countRows(supabase, 'vertical_config', 'slug', vertical)

  // active_landings filtered by vertical
  const activeLandingsCount = await countRows(supabase, 'active_landings', 'vertical', vertical)

  // articles filtered by vertical
  const articlesCount = await countRows(supabase, 'articles', 'vertical', vertical)

  // ── Build migration plan ───────────────────────────────────────────────
  const tables: TablePlan[] = [
    {
      name: 'vehicles',
      filter: `vertical = '${vertical}' via dealer join`,
      estimated_rows: vehicleCount,
    },
    {
      name: 'dealers',
      filter: `vertical = '${vertical}'`,
      estimated_rows: dealerCount,
    },
    {
      name: 'categories',
      filter: 'shared - copy all',
      estimated_rows: categoryCount,
    },
    {
      name: 'subcategories',
      filter: 'shared - copy all',
      estimated_rows: subcategoryCount,
    },
    {
      name: 'vertical_config',
      filter: `slug = '${vertical}'`,
      estimated_rows: verticalConfigCount,
    },
    {
      name: 'active_landings',
      filter: `vertical = '${vertical}'`,
      estimated_rows: activeLandingsCount,
    },
    {
      name: 'articles',
      filter: `vertical = '${vertical}'`,
      estimated_rows: articlesCount,
    },
  ]

  const totalRows = tables.reduce((sum, t) => sum + t.estimated_rows, 0)
  const estimatedTimeSeconds = Math.max(30, Math.ceil(totalRows / 100) * 5)

  return {
    vertical,
    source_cluster: {
      id: sourceCluster.id as string,
      name: sourceCluster.name as string,
    },
    target_cluster: {
      id: targetCluster.id as string,
      name: targetCluster.name as string,
    },
    tables,
    tables_excluded: ['users', 'infra_metrics', 'infra_alerts', 'analytics_events'],
    warnings: [
      'Auth system is separate — users will need to re-register on new cluster',
      "Images don't need migration — they are served from Cloudinary/CF Images",
    ],
    estimated_time_seconds: estimatedTimeSeconds,
  }
})
