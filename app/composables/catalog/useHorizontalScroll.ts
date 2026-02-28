/**
 * Horizontal scroll with grab-to-drag for desktop filter bars.
 * Manages scroll arrows visibility, mouse-grab dragging, and cleanup.
 */
export function useHorizontalScroll() {
  const scrollContainer = ref<HTMLElement | null>(null)
  const canScrollLeft = ref(false)
  const canScrollRight = ref(false)

  function updateScrollState() {
    const el = scrollContainer.value
    if (!el) return
    canScrollLeft.value = el.scrollLeft > 0
    canScrollRight.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 1
  }

  function scrollLeftBy() {
    scrollContainer.value?.scrollBy({ left: -200, behavior: 'smooth' })
  }

  function scrollRightBy() {
    scrollContainer.value?.scrollBy({ left: 200, behavior: 'smooth' })
  }

  // Grab-to-drag
  let isGrabbing = false
  let startX = 0
  let scrollLeftStart = 0

  function onGrabStart(e: MouseEvent) {
    const el = scrollContainer.value
    if (!el) return
    const tag = (e.target as HTMLElement).tagName
    if (['INPUT', 'SELECT', 'BUTTON', 'LABEL'].includes(tag)) return
    isGrabbing = true
    startX = e.pageX - el.offsetLeft
    scrollLeftStart = el.scrollLeft
    el.style.cursor = 'grabbing'
    document.addEventListener('mousemove', onGrabMove)
    document.addEventListener('mouseup', onGrabEnd)
  }

  function onGrabMove(e: MouseEvent) {
    if (!isGrabbing) return
    const el = scrollContainer.value
    if (!el) return
    e.preventDefault()
    const x = e.pageX - el.offsetLeft
    el.scrollLeft = scrollLeftStart - (x - startX)
  }

  function onGrabEnd() {
    isGrabbing = false
    const el = scrollContainer.value
    if (el) el.style.cursor = 'grab'
    document.removeEventListener('mousemove', onGrabMove)
    document.removeEventListener('mouseup', onGrabEnd)
  }

  onMounted(() => {
    const el = scrollContainer.value
    if (el) {
      el.addEventListener('scroll', updateScrollState, { passive: true })
      nextTick(updateScrollState)
    }
  })

  onUnmounted(() => {
    scrollContainer.value?.removeEventListener('scroll', updateScrollState)
    document.removeEventListener('mousemove', onGrabMove)
    document.removeEventListener('mouseup', onGrabEnd)
  })

  return {
    scrollContainer,
    canScrollLeft,
    canScrollRight,
    updateScrollState,
    scrollLeftBy,
    scrollRightBy,
    onGrabStart,
  }
}
