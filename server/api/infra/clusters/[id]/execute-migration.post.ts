/**
 * POST /api/infra/clusters/:id/execute-migration
 *
 * Execute a vertical migration from the source cluster (:id) to a target cluster.
 * Admin-only endpoint.
 *
 * Since cross-cluster Supabase connections are not possible from within a server route,
 * this endpoint:
 * - Exports the data as JSON (for manual import into the target cluster)
 * - Updates the cluster metadata (verticals arrays, weight_used)
 * - Logs the migration activity
 * - Returns progress/results with next steps
 *
 * Body: { verticalToMigrate: string, targetClusterId: string }
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

interface ExecuteMigrationBody {
  verticalToMigrate: string
  targetClusterId: string
}

interface TableMigrationResult {
  name: string
  rows: number
}

interface ClusterResult {
  id: string
  verticals: string[]
  weight_used: number
}

interface MigrationResult {
  status: string
  tables_migrated: TableMigrationResult[]
  exported_data: Record<string, unknown[]>
  source_cluster: ClusterResult
  target_cluster: ClusterResult
  next_steps: string[]
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event): Promise<MigrationResult> => {
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
  const body = await readBody<ExecuteMigrationBody>(event)

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

  // ── Step 1: Set source cluster status to 'migrating' ───────────────────
  const { error: statusError } = await supabase
    .from('infra_clusters')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ status: 'migrating' } as any)
    .eq('id', sourceClusterId)

  if (statusError) {
    throw createError({
      statusCode: 500,
      message: `Failed to update cluster status: ${statusError.message}`,
    })
  }

  // ── Step 2: Export data from each table with vertical filters ──────────
  const tablesMigrated: TableMigrationResult[] = []
  const exportedData: Record<string, unknown[]> = {}

  try {
    // 2a. Dealers filtered by vertical
    const { data: dealers } = await supabase.from('dealers').select('*').eq('vertical', vertical)

    const dealerData = dealers ?? []
    exportedData.dealers = dealerData
    tablesMigrated.push({ name: 'dealers', rows: dealerData.length })

    // 2b. Vehicles via dealer join
    const dealerIds = dealerData.map((d: Record<string, unknown>) => d.id as string)
    let vehicleData: unknown[] = []

    if (dealerIds.length > 0) {
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('*')
        .in('dealer_id', dealerIds)

      vehicleData = vehicles ?? []
    }

    exportedData.vehicles = vehicleData
    tablesMigrated.push({ name: 'vehicles', rows: vehicleData.length })

    // 2c. Categories (shared - copy all)
    const { data: categories } = await supabase.from('categories').select('*')

    const categoryData = categories ?? []
    exportedData.categories = categoryData
    tablesMigrated.push({ name: 'categories', rows: categoryData.length })

    // 2d. Subcategories (shared - copy all)
    const { data: subcategories } = await supabase.from('subcategories').select('*')

    const subcategoryData = subcategories ?? []
    exportedData.subcategories = subcategoryData
    tablesMigrated.push({ name: 'subcategories', rows: subcategoryData.length })

    // 2e. vertical_config filtered by slug
    const { data: verticalConfig } = await supabase
      .from('vertical_config')
      .select('*')
      .eq('slug', vertical)

    const verticalConfigData = verticalConfig ?? []
    exportedData.vertical_config = verticalConfigData
    tablesMigrated.push({ name: 'vertical_config', rows: verticalConfigData.length })

    // 2f. active_landings filtered by vertical
    const { data: landings } = await supabase
      .from('active_landings')
      .select('*')
      .eq('vertical', vertical)

    const landingsData = landings ?? []
    exportedData.active_landings = landingsData
    tablesMigrated.push({ name: 'active_landings', rows: landingsData.length })

    // 2g. articles filtered by vertical
    const { data: articles } = await supabase.from('articles').select('*').eq('vertical', vertical)

    const articlesData = articles ?? []
    exportedData.articles = articlesData
    tablesMigrated.push({ name: 'articles', rows: articlesData.length })
  } catch (exportError: unknown) {
    // Revert status on failure
    await supabase
      .from('infra_clusters')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ status: 'active' } as any)
      .eq('id', sourceClusterId)

    const message = exportError instanceof Error ? exportError.message : 'Unknown export error'
    throw createError({
      statusCode: 500,
      message: `Data export failed: ${message}`,
    })
  }

  // ── Step 3: Update cluster verticals arrays ────────────────────────────
  type ClusterExt = { verticals: string[] | null; weight_used: number | null }
  const src = sourceCluster as unknown as ClusterExt
  const tgt = targetCluster as unknown as ClusterExt

  const sourceVerticals = Array.isArray(src.verticals)
    ? src.verticals.filter((v: string) => v !== vertical)
    : []

  const targetVerticals = Array.isArray(tgt.verticals) ? [...tgt.verticals, vertical] : [vertical]

  // ── Step 4: Recalculate weight_used ────────────────────────────────────
  const totalMigratedRows = tablesMigrated.reduce((sum, t) => sum + t.rows, 0)
  const sourceWeightUsed = Math.max(0, Number(src.weight_used ?? 0) - totalMigratedRows * 0.001)
  const targetWeightUsed = Number(tgt.weight_used ?? 0) + totalMigratedRows * 0.001

  // Update source cluster
  const { error: sourceUpdateError } = await supabase
    .from('infra_clusters')
    .update({
      verticals: sourceVerticals,
      weight_used: Math.round(sourceWeightUsed * 100) / 100,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .eq('id', sourceClusterId)

  if (sourceUpdateError) {
    throw createError({
      statusCode: 500,
      message: `Failed to update source cluster: ${sourceUpdateError.message}`,
    })
  }

  // Update target cluster
  const { error: targetUpdateError } = await supabase
    .from('infra_clusters')
    .update({
      verticals: targetVerticals,
      weight_used: Math.round(targetWeightUsed * 100) / 100,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .eq('id', body.targetClusterId)

  if (targetUpdateError) {
    throw createError({
      statusCode: 500,
      message: `Failed to update target cluster: ${targetUpdateError.message}`,
    })
  }

  // ── Step 5: Set status back to 'active' ────────────────────────────────
  await supabase
    .from('infra_clusters')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ status: 'active' } as any)
    .eq('id', sourceClusterId)

  // ── Step 6: Log to activity_logs ───────────────────────────────────────
  await supabase.from('activity_logs').insert({
    action: 'cluster_migration',
    user_id: user.id,
    metadata: {
      vertical,
      source_cluster_id: sourceClusterId,
      target_cluster_id: body.targetClusterId,
      tables_migrated: tablesMigrated,
      total_rows: totalMigratedRows,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)

  // ── Return results ─────────────────────────────────────────────────────
  return {
    status: 'completed',
    tables_migrated: tablesMigrated,
    exported_data: exportedData,
    source_cluster: {
      id: sourceClusterId,
      verticals: sourceVerticals,
      weight_used: Math.round(sourceWeightUsed * 100) / 100,
    },
    target_cluster: {
      id: body.targetClusterId,
      verticals: targetVerticals,
      weight_used: Math.round(targetWeightUsed * 100) / 100,
    },
    next_steps: [
      'Apply migrations to target cluster: npx supabase db push --project-ref TARGET_REF',
      'Import exported data to target cluster',
      'Update Cloudflare Pages env vars for the vertical',
    ],
  }
})
