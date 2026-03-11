/**
 * Server-side feature flag checks.
 *
 * Reads from the feature_flags table via Supabase REST API.
 * Caches flags in-memory for 60 seconds to avoid hitting the DB on every request.
 */
import { $fetch } from 'ofetch'
import { logger } from './logger'

interface FeatureFlag {
  key: string
  enabled: boolean
  percentage: number
  allowed_dealers: string[] | null
  vertical: string | null
}

// Simple in-memory cache
let flagCache: Map<string, FeatureFlag> = new Map()
let cacheExpiry = 0
const CACHE_TTL_MS = 60_000 // 60 seconds

async function loadFlags(): Promise<void> {
  const now = Date.now()
  if (now < cacheExpiry && flagCache.size > 0) return

  const rest = useSupabaseRestHeaders()
  if (!rest) {
    logger.warn('[featureFlags] No Supabase credentials — all flags default to disabled')
    return
  }

  try {
    const data = await $fetch<FeatureFlag[]>(
      `${rest.url}/rest/v1/feature_flags?select=key,enabled,percentage,allowed_dealers,vertical`,
      { headers: rest.headers },
    )
    flagCache = new Map(data.map((f) => [`${f.key}:${f.vertical ?? '_global'}`, f]))
    cacheExpiry = now + CACHE_TTL_MS
  } catch (err) {
    logger.error('[featureFlags] Failed to load flags:', { error: String(err) })
  }
}

/**
 * Check if a feature flag is enabled.
 *
 * @param key - The flag key (e.g. 'auctions')
 * @param dealerId - Optional dealer ID for dealer-specific rollouts
 * @param vertical - Optional vertical slug for per-vertical overrides
 * @returns true if the feature is enabled for this context
 */
export async function isFeatureEnabled(
  key: string,
  dealerId?: string,
  vertical?: string,
): Promise<boolean> {
  await loadFlags()

  // Check vertical-specific override first, then global
  const flag = (vertical && flagCache.get(`${key}:${vertical}`)) || flagCache.get(`${key}:_global`)
  if (!flag) return false
  if (!flag.enabled) return false

  // Check dealer allowlist
  if (flag.allowed_dealers && flag.allowed_dealers.length > 0) {
    if (!dealerId || !flag.allowed_dealers.includes(dealerId)) return false
  }

  // Check percentage rollout
  if (flag.percentage < 100) {
    // Deterministic hash based on key + dealerId for consistent behavior
    const seed = dealerId ? `${key}:${dealerId}` : key
    const hash = simpleHash(seed)
    if (hash % 100 >= flag.percentage) return false
  }

  return true
}

/**
 * Simple string hash for deterministic percentage rollout.
 */
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.codePointAt(i) ?? 0
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Invalidate the flag cache (e.g. after admin update).
 */
export function invalidateFeatureFlagCache(): void {
  cacheExpiry = 0
  flagCache = new Map()
}
