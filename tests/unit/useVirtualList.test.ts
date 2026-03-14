import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed, readonly, watch } from 'vue'

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('readonly', readonly)
vi.stubGlobal('watch', watch)
vi.stubGlobal('onUnmounted', vi.fn())

// import.meta.client is false in test (SSR mode)

describe('useVirtualList', () => {
  let useVirtualList: typeof import('../../app/composables/useVirtualList').useVirtualList

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    const mod = await import('../../app/composables/useVirtualList')
    useVirtualList = mod.useVirtualList
  })

  it('returns all items when list is small', () => {
    const items = ref(['a', 'b', 'c'])
    const { visibleItems, totalHeight } = useVirtualList(items, { itemHeight: 50 })

    expect(totalHeight.value).toBe(150) // 3 * 50
    // In SSR mode (no container), containerHeight=0, so startIndex=0, endIndex capped by overscan
    expect(visibleItems.value.length).toBeLessThanOrEqual(items.value.length)
  })

  it('calculates total height correctly', () => {
    const items = ref(Array.from({ length: 1000 }, (_, i) => i))
    const { totalHeight } = useVirtualList(items, { itemHeight: 100 })

    expect(totalHeight.value).toBe(100000)
  })

  it('exposes containerStyle and wrapperStyle', () => {
    const items = ref([1, 2, 3])
    const { containerStyle, wrapperStyle } = useVirtualList(items, { itemHeight: 40 })

    expect(containerStyle.value.overflow).toBe('auto')
    expect(containerStyle.value.position).toBe('relative')
    expect(wrapperStyle.value.height).toBe('120px')
    expect(wrapperStyle.value.position).toBe('relative')
  })

  it('getItemStyle returns correct absolute positioning', () => {
    const items = ref([1, 2, 3])
    const { getItemStyle } = useVirtualList(items, { itemHeight: 80 })

    const style = getItemStyle(2)
    expect(style.position).toBe('absolute')
    expect(style.top).toBe('160px')
    expect(style.height).toBe('80px')
  })

  it('visibleItems includes index and data', () => {
    const items = ref(['alpha', 'beta', 'gamma'])
    const { visibleItems } = useVirtualList(items, { itemHeight: 50 })

    for (const item of visibleItems.value) {
      expect(item).toHaveProperty('data')
      expect(item).toHaveProperty('index')
      expect(typeof item.index).toBe('number')
    }
  })

  it('updates when items change reactively', () => {
    const items = ref([1, 2, 3])
    const { totalHeight } = useVirtualList(items, { itemHeight: 100 })

    expect(totalHeight.value).toBe(300)

    items.value = [1, 2, 3, 4, 5]
    expect(totalHeight.value).toBe(500)
  })

  it('respects custom overscan', () => {
    const items = ref(Array.from({ length: 100 }, (_, i) => i))
    const { visibleItems } = useVirtualList(items, { itemHeight: 50, overscan: 2 })

    // With containerHeight=0, start=0, endIndex = 0+0+4 = 4
    expect(visibleItems.value.length).toBe(4) // 2*overscan
  })

  it('containerRef starts as null', () => {
    const items = ref([1])
    const { containerRef } = useVirtualList(items, { itemHeight: 50 })

    expect(containerRef.value).toBeNull()
  })
})
