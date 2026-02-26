/**
 * Client-side feature flag composable.
 *
 * Reads flags from the feature_flags table via Supabase.
 * Caches results for the session.
 */

interface FeatureFlag {
  key: string
  enabled: boolean
  percentage: number
  allowed_dealers: string[] | null
}

const flagStore = ref<Map<string, FeatureFlag>>(new Map())
const loaded = ref(false)

async function loadFlags(): Promise<void> {
  if (loaded.value) return

  const client = useSupabaseClient()
  const { data } = await client
    .from('feature_flags')
    .select('key, enabled, percentage, allowed_dealers')

  if (data) {
    const map = new Map<string, FeatureFlag>()
    for (const row of data as FeatureFlag[]) {
      map.set(row.key, row)
    }
    flagStore.value = map
  }
  loaded.value = true
}

/**
 * Returns a reactive boolean for a feature flag.
 *
 * Usage:
 *   const auctionsEnabled = useFeatureFlag('auctions')
 *   <div v-if="auctionsEnabled">...</div>
 */
export function useFeatureFlag(key: string): Ref<boolean> {
  const enabled = ref(false)

  loadFlags().then(() => {
    const flag = flagStore.value.get(key)
    enabled.value = flag?.enabled ?? false
  })

  return enabled
}

/**
 * Reload flags from the database (e.g. after admin toggle).
 */
export function refreshFeatureFlags(): void {
  loaded.value = false
  loadFlags()
}
