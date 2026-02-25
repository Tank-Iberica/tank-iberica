import type { Ref } from 'vue'

interface ViewabilityOptions {
  source: 'direct' | 'prebid' | 'adsense'
  position: string
  onViewable?: () => void
}

/**
 * MRC-standard viewability tracking for ads using IntersectionObserver.
 *
 * MRC Standard: 50% of pixels visible for >= 1 continuous second = viewable impression.
 *
 * Logs a `viewable_impression` event to the `ad_events` table once the
 * threshold is met. The event is fired at most once per composable instance.
 */
export function useAdViewability(
  elementRef: Ref<HTMLElement | null>,
  adId: string | null,
  options: ViewabilityOptions,
) {
  const supabase = useSupabaseClient()
  const route = useRoute()
  const isViewable = ref(false)
  const timeInView = ref(0)

  let observer: IntersectionObserver | null = null
  let viewTimer: ReturnType<typeof setTimeout> | null = null
  let trackingInterval: ReturnType<typeof setInterval> | null = null
  let enteredViewAt: number | null = null
  let viewableLogged = false

  function startViewTimer() {
    if (viewTimer || viewableLogged) return
    enteredViewAt = Date.now()

    // After 1 second of continuous 50%+ visibility, fire viewable_impression
    viewTimer = setTimeout(() => {
      if (!viewableLogged && adId) {
        viewableLogged = true
        isViewable.value = true
        const elapsed = enteredViewAt ? Date.now() - enteredViewAt : 1000
        timeInView.value = elapsed

        logViewableImpression()
        options.onViewable?.()
      }
    }, 1000)

    // Continue tracking cumulative time-in-view every 500ms
    trackingInterval = setInterval(() => {
      if (enteredViewAt) {
        timeInView.value = Date.now() - enteredViewAt
      }
    }, 500)
  }

  function stopViewTimer() {
    if (viewTimer) {
      clearTimeout(viewTimer)
      viewTimer = null
    }
    if (trackingInterval) {
      clearInterval(trackingInterval)
      trackingInterval = null
    }
    enteredViewAt = null
  }

  /**
   * Insert a `viewable_impression` event into `ad_events`.
   * Uses the same column set that `useAds.registerEvent` uses so reporting
   * queries stay consistent. The `page_path` encodes the current route,
   * which already tells us where the ad was rendered.
   */
  async function logViewableImpression() {
    if (!adId) return
    try {
      await supabase.from('ad_events').insert({
        ad_id: adId,
        event_type: 'viewable_impression',
        page_path: route.fullPath,
      })
    } catch {
      // Silent fail — fire-and-forget analytics
    }
  }

  /** Pause timer when the tab is hidden; observer handles re-entry. */
  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      stopViewTimer()
    }
    // When the tab becomes visible again the IntersectionObserver callback
    // will fire if the element is still >= 50% in the viewport, which in
    // turn calls startViewTimer(). No manual restart needed here.
  }

  function setupObserver() {
    if (!elementRef.value) return

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio >= 0.5) {
            startViewTimer()
          } else {
            stopViewTimer()
          }
        }
      },
      { threshold: [0, 0.5, 1.0] },
    )

    observer.observe(elementRef.value)
    document.addEventListener('visibilitychange', onVisibilityChange)
  }

  function cleanup() {
    stopViewTimer()
    observer?.disconnect()
    observer = null
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }

  // Re-init when the template ref changes (e.g. conditional rendering)
  watch(elementRef, (el) => {
    cleanup()
    if (el) setupObserver()
  })

  onMounted(() => {
    if (elementRef.value) setupObserver()
  })

  onUnmounted(cleanup)

  return { isViewable, timeInView }
}
