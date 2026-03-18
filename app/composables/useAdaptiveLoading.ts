/**
 * useAdaptiveLoading — Adapts UX based on network quality.
 *
 * Uses Navigator.connection (Network Information API) when available.
 * Falls back to "good" connection for unsupported browsers.
 *
 * Usage:
 *   const { isSlowConnection, effectiveType, shouldReduceData } = useAdaptiveLoading()
 *   if (shouldReduceData.value) { /* serve lower quality images * / }
 *
 * #399 — Adaptive loading por calidad de red (audit #4 N124)
 */

interface NetworkInfo {
  effectiveType?: string
  downlink?: number
  saveData?: boolean
}

/** Composable for adaptive loading. */
export function useAdaptiveLoading() {
  const effectiveType = ref<string>('4g')
  const saveData = ref(false)

  if (import.meta.client) {
    const nav = navigator as Navigator & { connection?: NetworkInfo }
    const conn = nav.connection

    if (conn) {
      effectiveType.value = conn.effectiveType ?? '4g'
      saveData.value = conn.saveData ?? false

      // Listen for changes
      if ('addEventListener' in (conn as EventTarget)) {
        (conn as EventTarget).addEventListener('change', () => {
          effectiveType.value = conn.effectiveType ?? '4g'
          saveData.value = conn.saveData ?? false
        })
      }
    }
  }

  const isSlowConnection = computed(() =>
    effectiveType.value === 'slow-2g'
    || effectiveType.value === '2g'
    || effectiveType.value === '3g',
  )

  const shouldReduceData = computed(() =>
    saveData.value || isSlowConnection.value,
  )

  return {
    /** Effective connection type: 'slow-2g' | '2g' | '3g' | '4g' */
    effectiveType: readonly(effectiveType),
    /** Whether the user has enabled data saver mode */
    saveData: readonly(saveData),
    /** True on 2G/3G connections */
    isSlowConnection,
    /** True if images/prefetch should be reduced (slow or saveData) */
    shouldReduceData,
  }
}
