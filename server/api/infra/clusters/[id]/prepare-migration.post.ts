/**
 * POST /api/infra/clusters/:id/prepare-migration
 *
 * Generate a migration plan for moving a vertical from the source cluster
 * (identified by :id) to a target cluster.
 * Admin-only endpoint.
 *
 * Body: { verticalToMigrate: string, targetClusterId: string }
 */
import { defineEventHandler, getRouterParam } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { safeError } from '../../../../utils/safeError'
import { validateBody } from '../../../../utils/validateBody'

const prepareMigrationSchema = z.object({
  verticalToMigrate: z.string().min(1).max(128),
  targetClusterId: z.string().uuid(),
})

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

async function countRows(
  supabase: ReturnType<typeof serverSupabaseServiceRole>,
  table: string,
  column: string,
  value: string,
): Promise<number> {
  // head: true → no data returned, just count
  const { count } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq(column, value)

  return count ?? 0
}

async function countAllRows(
  supabase: ReturnType<typeof serverSupabaseServiceRole>,
  table: string,
): Promise<number> {
  // head: true → no data returned, just count
  const { count } = await supabase.from(table).select('id', { count: 'exact', head: true })

  return count ?? 0
}

export default defineEventHandler(async (event): Promise<MigrationPlan> => {
  // ── Auth: admin only ────────────────────────────────────────────────────
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Unauthorized')
  }

  const supabase = serverSupabaseServiceRole(event)

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

  if (userData?.role !== 'admin') {
    throw safeError(403, 'Forbidden')
  }

  // ── Validate params ────────────────────────────────────────────────────
  const sourceClusterId = getRouterParam(event, 'id')
  if (!sourceClusterId || !/^[0-9a-f-]{36}$/i.test(sourceClusterId)) {
    throw safeError(400, 'Invalid source cluster ID')
  }

  // ── Validate body ──────────────────────────────────────────────────────
  const body = await validateBody(event, prepareMigrationSchema)

  if (sourceClusterId === body.targetClusterId) {
    throw safeError(400, 'Source and target clusters must be different')
  }

  // ── Fetch source and target clusters ───────────────────────────────────
  // select('*') intentional — cluster migration needs all columns for data integrity
  const [sourceResult, targetResult] = await Promise.all([
    supabase.from('infra_clusters').select('*').eq('id', sourceClusterId).single(),
    supabase.from('infra_clusters').select('*').eq('id', body.targetClusterId).single(),
  ])

  if (sourceResult.error || !sourceResult.data) {
    throw safeError(404, 'Source cluster not found')
  }

  if (targetResult.error || !targetResult.data) {
    throw safeError(404, 'Target cluster not found')
  }

  const sourceCluster = sourceResult.data
  const targetCluster = targetResult.data
  const vertical = body.verticalToMigrate

  // ── Count rows for each table ──────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sbAny = supabase as any
  // Dealers filtered by vertical
  const dealerCount = await countRows(sbAny, 'dealers', 'vertical', vertical)

  // Vehicles: filtered via dealer join — get dealer IDs first, then count vehicles
  let vehicleCount = 0
  const { data: dealerIds } = await supabase.from('dealers').select('id').eq('vertical', vertical)

  if (dealerIds?.length) {
    const ids = dealerIds.map((d: Record<string, unknown>) => d.id as string)
    const { count } = await supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .in('dealer_id', ids)

    vehicleCount = count ?? 0
  }

  // Categories and subcategories — shared, copy all
  const [categoryCount, subcategoryCount] = await Promise.all([
    countAllRows(sbAny, 'categories'),
    countAllRows(sbAny, 'subcategories'),
  ])

  // vertical_config filtered by slug
  const verticalConfigCount = await countRows(sbAny, 'vertical_config', 'slug', vertical)

  // active_landings filtered by vertical
  const activeLandingsCount = await countRows(sbAny, 'active_landings', 'vertical', vertical)

  // articles filtered by vertical
  const articlesCount = await countRows(sbAny, 'articles', 'vertical', vertical)

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
