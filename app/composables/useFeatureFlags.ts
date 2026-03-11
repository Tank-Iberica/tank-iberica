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
  vertical: string | null
}

// Lazy-initialized singleton state (no side effects on import)
let _flagStore: Ref<Map<string, FeatureFlag>> | null = null
let _loaded: Ref<boolean> | null = null

function getFlagStore(): Ref<Map<string, FeatureFlag>> {
  if (!_flagStore) _flagStore = ref<Map<string, FeatureFlag>>(new Map())
  return _flagStore
}
function getLoaded(): Ref<boolean> {
  if (!_loaded) _loaded = ref(false)
  return _loaded
}

async function loadFlags(): Promise<void> {
  const loaded = getLoaded()
  if (loaded.value) return

  const flagStore = getFlagStore()
  const client = useSupabaseClient()
  const { data } = await client
    .from('feature_flags')
    .select('key, enabled, percentage, allowed_dealers, vertical')

  if (data) {
    const map = new Map<string, FeatureFlag>()
    for (const row of data as FeatureFlag[]) {
      map.set(`${row.key}:${row.vertical ?? '_global'}`, row)
    }
    flagStore.value = map
  }
  loaded.value = true
}

/**
 * Returns a reactive boolean for a feature flag.
 * Checks vertical-specific override first, then global flag.
 *
 * Usage:
 *   const auctionsEnabled = useFeatureFlag('auctions')
 *   const auctionsForVertical = useFeatureFlag('auctions', 'tracciona')
 */
export function useFeatureFlag(key: string, vertical?: string): Ref<boolean> {
  const flagStore = getFlagStore()
  const enabled = ref(false)

  loadFlags().then(() => {
    // Check vertical-specific override first
    const verticalFlag = vertical ? flagStore.value.get(`${key}:${vertical}`) : undefined
    const globalFlag = flagStore.value.get(`${key}:_global`)
    const flag = verticalFlag ?? globalFlag
    enabled.value = flag?.enabled ?? false
  })

  return enabled
}

/**
 * Reload flags from the database (e.g. after admin toggle).
 */
export function refreshFeatureFlags(): void {
  const loaded = getLoaded()
  loaded.value = false
  loadFlags()
}
