/**
 * useVirtualList — Virtual scrolling composable (#91)
 *
 * Renders only visible items in a long list (+ buffer).
 * Reduces DOM nodes from N to ~50 for lists of 100+ items.
 *
 * Usage:
 *   const { containerRef, visibleItems, containerStyle, wrapperStyle } = useVirtualList(items, { itemHeight: 120 })
 *
 *   <div ref="containerRef" :style="containerStyle">
 *     <div :style="wrapperStyle">
 *       <div v-for="{ data, index } in visibleItems" :key="index">
 *         {{ data.title }}
 *       </div>
 *     </div>
 *   </div>
 */

interface VirtualListOptions {
  /** Fixed height per item in pixels */
  itemHeight: number
  /** Number of extra items to render above/below viewport */
  overscan?: number
}

interface VirtualItem<T> {
  data: T
  index: number
}

export function useVirtualList<T>(items: Ref<T[]> | ComputedRef<T[]>, options: VirtualListOptions) {
  const { itemHeight, overscan = 5 } = options

  const containerRef = ref<HTMLElement | null>(null)
  const scrollTop = ref(0)
  const containerHeight = ref(0)

  // Total height of all items
  const totalHeight = computed(() => items.value.length * itemHeight)

  // Range of visible items
  const startIndex = computed(() => {
    const raw = Math.floor(scrollTop.value / itemHeight)
    return Math.max(0, raw - overscan)
  })

  const endIndex = computed(() => {
    const visibleCount = Math.ceil(containerHeight.value / itemHeight)
    return Math.min(items.value.length, startIndex.value + visibleCount + overscan * 2)
  })

  // Items to render
  const visibleItems = computed<VirtualItem<T>[]>(() => {
    const result: VirtualItem<T>[] = []
    const start = startIndex.value
    const end = endIndex.value
    for (let i = start; i < end; i++) {
      result.push({ data: items.value[i]!, index: i })
    }
    return result
  })

  // Container style: fixed height, overflow scroll
  const containerStyle = computed(() => ({
    overflow: 'auto' as const,
    position: 'relative' as const,
  }))

  // Wrapper style: translates items into position
  const wrapperStyle = computed(() => ({
    height: `${totalHeight.value}px`,
    position: 'relative' as const,
  }))

  // Item style: absolute positioning
  function getItemStyle(index: number) {
    return {
      position: 'absolute' as const,
      top: `${index * itemHeight}px`,
      left: '0',
      right: '0',
      height: `${itemHeight}px`,
    }
  }

  function onScroll() {
    if (containerRef.value) {
      scrollTop.value = containerRef.value.scrollTop
    }
  }

  function updateContainerHeight() {
    if (containerRef.value) {
      containerHeight.value = containerRef.value.clientHeight
    }
  }

  if (import.meta.client) {
    watch(containerRef, (el) => {
      if (el) {
        el.addEventListener('scroll', onScroll, { passive: true })
        updateContainerHeight()

        const ro = new ResizeObserver(() => updateContainerHeight())
        ro.observe(el)

        onUnmounted(() => {
          el.removeEventListener('scroll', onScroll)
          ro.disconnect()
        })
      }
    })
  }

  return {
    containerRef,
    visibleItems,
    containerStyle,
    wrapperStyle,
    getItemStyle,
    totalHeight,
    scrollTop: readonly(scrollTop),
  }
}
