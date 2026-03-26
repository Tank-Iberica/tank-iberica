/**
 * useFeatureUnlocks — checks and manages feature unlock status (credit-gated).
 *
 * Features: 'saved_searches' | 'alerts'
 * Each starts with 1 free slot; unlimited after paying 1 credit.
 */

type UnlockableFeature = 'saved_searches' | 'alerts'

/** Composable for checking and managing credit-gated feature unlock status. */
export function useFeatureUnlocks() {
  const unlocks = useState<Record<string, boolean>>('feature-unlocks', () => ({}))
  const loading = ref(false)

  async function fetchStatus(features: UnlockableFeature[] = ['saved_searches', 'alerts']) {
    loading.value = true
    try {
      const { data } = await useFetch('/api/feature-unlocks/status', {
        params: { features: features.join(',') },
      })
      if (data.value?.unlocks) {
        for (const [key, val] of Object.entries(data.value.unlocks)) {
          unlocks.value[key] = !!val
        }
      }
    } finally {
      loading.value = false
    }
  }

  async function unlock(
    feature: UnlockableFeature,
  ): Promise<{ success: boolean; creditsRemaining?: number }> {
    try {
      const result = await $fetch('/api/feature-unlocks/unlock', {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: { feature },
      })
      if (result.unlocked) {
        unlocks.value[feature] = true
        return {
          success: true,
          creditsRemaining: 'creditsRemaining' in result ? result.creditsRemaining : undefined,
        }
      }
      return { success: false }
    } catch (err: unknown) {
      const status = (err as { statusCode?: number })?.statusCode
      if (status === 402) return { success: false }
      throw err
    }
  }

  function isUnlocked(feature: UnlockableFeature): boolean {
    return !!unlocks.value[feature]
  }

  return {
    unlocks: readonly(unlocks),
    loading: readonly(loading),
    fetchStatus,
    unlock,
    isUnlocked,
  }
}
