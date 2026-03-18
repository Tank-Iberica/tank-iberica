/**
 * useScrollDepth — Tracks how far a user scrolls on a page.
 *
 * Registers a scroll listener on mount and tracks milestone percentages (25/50/75/100).
 * Used on vehicle detail pages for analytics.
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useAnalyticsTracking } from '~/composables/useAnalyticsTracking'

/**
 * Composable for scroll depth.
 *
 * @param vehicleId
 */
export function useScrollDepth(vehicleId: string) {
  const depth = ref(0)
  const maxDepth = ref(0)
  const reached = ref<Set<number>>(new Set())
  const { trackScrollDepth } = useAnalyticsTracking()

  const milestones = [25, 50, 75, 100] as const

  function handleScroll() {
    if (!import.meta.client) return

    const scrollTop = window.scrollY
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    if (docHeight <= 0) return

    const pct = Math.round((scrollTop / docHeight) * 100)
    depth.value = pct
    if (pct > maxDepth.value) maxDepth.value = pct

    for (const m of milestones) {
      if (pct >= m && !reached.value.has(m)) {
        reached.value.add(m)
        trackScrollDepth(vehicleId, m)
      }
    }
  }

  onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', handleScroll)
  })

  return { depth, maxDepth, reached }
}
