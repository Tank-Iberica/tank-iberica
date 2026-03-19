import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed, nextTick } from 'vue'

// Stub Nuxt auto-imports
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('readonly', (r: any) => r)
vi.stubGlobal('watch', vi.fn())
vi.stubGlobal('onUnmounted', vi.fn())

import { useVirtualList } from '../../../app/composables/useVirtualList'

describe('Virtual scroll for large lists (#91)', () => {
  const makeItems = (n: number) =>
    ref(Array.from({ length: n }, (_, i) => ({ id: i, title: `Item ${i}` })))

  beforeEach(() => {
    vi.mocked(watch).mockReset()
    vi.mocked(onUnmounted).mockReset()
  })

  describe('Initialization', () => {
    it('returns expected shape', () => {
      const items = makeItems(100)
      const result = useVirtualList(items, { itemHeight: 50 })

      expect(result).toHaveProperty('containerRef')
      expect(result).toHaveProperty('visibleItems')
      expect(result).toHaveProperty('containerStyle')
      expect(result).toHaveProperty('wrapperStyle')
      expect(result).toHaveProperty('getItemStyle')
      expect(result).toHaveProperty('totalHeight')
      expect(result).toHaveProperty('scrollTop')
    })

    it('uses default overscan of 5', () => {
      const items = makeItems(100)
      const { visibleItems } = useVirtualList(items, { itemHeight: 50 })
      // With scrollTop=0, containerHeight=0: startIndex=max(0, 0-5)=0, endIndex=min(100, 0+0+10)=10
      expect(visibleItems.value.length).toBeLessThanOrEqual(10)
    })

    it('accepts custom overscan', () => {
      const items = makeItems(100)
      const { visibleItems } = useVirtualList(items, { itemHeight: 50, overscan: 2 })
      // With scrollTop=0, containerHeight=0: startIndex=max(0, 0-2)=0, endIndex=min(100, 0+0+4)=4
      expect(visibleItems.value.length).toBeLessThanOrEqual(4)
    })
  })

  describe('totalHeight computation', () => {
    it('computes total height as items × itemHeight', () => {
      const items = makeItems(200)
      const { totalHeight } = useVirtualList(items, { itemHeight: 60 })
      expect(totalHeight.value).toBe(200 * 60)
    })

    it('updates when items change', () => {
      const items = ref([{ id: 1 }, { id: 2 }])
      const { totalHeight } = useVirtualList(items, { itemHeight: 100 })
      expect(totalHeight.value).toBe(200)

      items.value = [{ id: 1 }, { id: 2 }, { id: 3 }]
      expect(totalHeight.value).toBe(300)
    })

    it('is 0 for empty list', () => {
      const items = ref<any[]>([])
      const { totalHeight } = useVirtualList(items, { itemHeight: 50 })
      expect(totalHeight.value).toBe(0)
    })
  })

  describe('visibleItems computation', () => {
    it('returns VirtualItem objects with data and index', () => {
      const items = makeItems(20)
      const { visibleItems } = useVirtualList(items, { itemHeight: 50 })

      for (const item of visibleItems.value) {
        expect(item).toHaveProperty('data')
        expect(item).toHaveProperty('index')
        expect(typeof item.index).toBe('number')
      }
    })

    it('limits rendered items with overscan buffer', () => {
      const items = makeItems(1000)
      const { visibleItems } = useVirtualList(items, { itemHeight: 50, overscan: 3 })
      // At scrollTop=0, containerHeight=0: renders at most overscan*2 items
      expect(visibleItems.value.length).toBeLessThanOrEqual(6)
      expect(visibleItems.value.length).toBeLessThan(1000)
    })

    it('indices match original item positions', () => {
      const items = makeItems(50)
      const { visibleItems } = useVirtualList(items, { itemHeight: 50 })

      for (const item of visibleItems.value) {
        expect(item.data).toEqual(items.value[item.index])
      }
    })

    it('never returns negative indices', () => {
      const items = makeItems(5)
      const { visibleItems } = useVirtualList(items, { itemHeight: 50, overscan: 100 })
      for (const item of visibleItems.value) {
        expect(item.index).toBeGreaterThanOrEqual(0)
      }
    })

    it('never exceeds items length', () => {
      const items = makeItems(10)
      const { visibleItems } = useVirtualList(items, { itemHeight: 50, overscan: 100 })
      for (const item of visibleItems.value) {
        expect(item.index).toBeLessThan(10)
      }
    })
  })

  describe('Style helpers', () => {
    it('containerStyle has overflow auto and relative position', () => {
      const items = makeItems(10)
      const { containerStyle } = useVirtualList(items, { itemHeight: 50 })
      expect(containerStyle.value).toEqual({
        overflow: 'auto',
        position: 'relative',
      })
    })

    it('wrapperStyle height matches totalHeight', () => {
      const items = makeItems(10)
      const { wrapperStyle } = useVirtualList(items, { itemHeight: 50 })
      expect(wrapperStyle.value).toEqual({
        height: '500px',
        position: 'relative',
      })
    })

    it('getItemStyle returns absolute positioning', () => {
      const items = makeItems(10)
      const { getItemStyle } = useVirtualList(items, { itemHeight: 80 })

      const style = getItemStyle(3)
      expect(style).toEqual({
        position: 'absolute',
        top: '240px',
        left: '0',
        right: '0',
        height: '80px',
      })
    })

    it('getItemStyle top is index × itemHeight', () => {
      const items = makeItems(10)
      const { getItemStyle } = useVirtualList(items, { itemHeight: 120 })

      expect(getItemStyle(0).top).toBe('0px')
      expect(getItemStyle(5).top).toBe('600px')
      expect(getItemStyle(9).top).toBe('1080px')
    })
  })

  describe('scrollTop tracking', () => {
    it('initializes scrollTop at 0', () => {
      const items = makeItems(10)
      const { scrollTop } = useVirtualList(items, { itemHeight: 50 })
      expect(scrollTop.value).toBe(0)
    })
  })

  describe('Reactive updates', () => {
    it('wrapperStyle updates when items change', () => {
      const items = ref([{ id: 1 }])
      const { wrapperStyle } = useVirtualList(items, { itemHeight: 100 })
      expect(wrapperStyle.value.height).toBe('100px')

      items.value = [{ id: 1 }, { id: 2 }, { id: 3 }]
      expect(wrapperStyle.value.height).toBe('300px')
    })

    it('visibleItems updates when items change', () => {
      const items = ref([{ id: 1 }])
      const { visibleItems } = useVirtualList(items, { itemHeight: 50, overscan: 10 })
      expect(visibleItems.value.length).toBe(1)

      items.value = [{ id: 1 }, { id: 2 }, { id: 3 }]
      expect(visibleItems.value.length).toBe(3)
    })
  })

  describe('Edge cases', () => {
    it('handles single item', () => {
      const items = ref([{ id: 1 }])
      const { totalHeight, visibleItems } = useVirtualList(items, { itemHeight: 50 })
      expect(totalHeight.value).toBe(50)
      expect(visibleItems.value.length).toBe(1)
      expect(visibleItems.value[0].data).toEqual({ id: 1 })
      expect(visibleItems.value[0].index).toBe(0)
    })

    it('handles empty list', () => {
      const items = ref<any[]>([])
      const { totalHeight, visibleItems, wrapperStyle } = useVirtualList(items, { itemHeight: 50 })
      expect(totalHeight.value).toBe(0)
      expect(visibleItems.value).toEqual([])
      expect(wrapperStyle.value.height).toBe('0px')
    })

    it('handles very large lists efficiently', () => {
      const items = makeItems(100_000)
      const { visibleItems, totalHeight } = useVirtualList(items, { itemHeight: 50, overscan: 5 })
      expect(totalHeight.value).toBe(5_000_000)
      // Without scroll, only buffer items rendered
      expect(visibleItems.value.length).toBeLessThan(20)
    })
  })
})
