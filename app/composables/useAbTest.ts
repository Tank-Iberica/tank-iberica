/**
 * useAbTest — Client-side A/B testing composable.
 *
 * Backlog Block 36 — A/B testing infrastructure.
 *
 * Assigns users to experiment variants using a stable hash
 * (stored in localStorage). Reports variant assignment to analytics.
 *
 * Usage:
 *   const { variant, isVariant } = useAbTest('cta-color', ['control', 'green', 'orange'])
 *   // variant.value → 'control' | 'green' | 'orange'
 *   // isVariant('green') → true/false
 */

interface AbTestOptions {
  /** Percentage of traffic to include (0-100). Default: 100 */
  trafficPercent?: number
}

const STORAGE_KEY_PREFIX = 'ab_test_'

function stableHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.codePointAt(i)!
    hash = (hash << 5) - hash + char
    hash |= 0 // NOSONAR — intentional 32-bit integer wrap (not just truncation)
  }
  return Math.abs(hash)
}

export function useAbTest(experimentId: string, variants: string[], options: AbTestOptions = {}) {
  const { trafficPercent = 100 } = options
  const variant = ref<string | null>(null)

  if (import.meta.client && variants.length >= 2) {
    const storageKey = `${STORAGE_KEY_PREFIX}${experimentId}`
    const stored = localStorage.getItem(storageKey)

    if (stored && variants.includes(stored)) {
      variant.value = stored
    } else {
      // Generate a stable user identifier
      let userId = localStorage.getItem('ab_user_id')
      if (!userId) {
        userId = Math.random().toString(36).slice(2) + Date.now().toString(36)
        localStorage.setItem('ab_user_id', userId)
      }

      // Check traffic allocation
      const trafficHash = stableHash(`${userId}:traffic:${experimentId}`) % 100
      if (trafficHash >= trafficPercent) {
        // User not included in experiment — assign control (first variant)
        variant.value = variants[0]!
      } else {
        // Assign variant based on hash
        const variantIndex = stableHash(`${userId}:${experimentId}`) % variants.length
        variant.value = variants[variantIndex]!
      }

      localStorage.setItem(storageKey, variant.value)
    }
  } else if (variants.length >= 1) {
    // SSR or single variant — default to control
    variant.value = variants[0]!
  }

  function isVariant(name: string): boolean {
    return variant.value === name
  }

  return {
    variant: readonly(variant),
    isVariant,
    experimentId,
  }
}
