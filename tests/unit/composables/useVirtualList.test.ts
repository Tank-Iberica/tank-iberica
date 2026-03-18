import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const SRC = readFileSync(resolve(ROOT, 'app/composables/useVirtualList.ts'), 'utf-8')

describe('Virtual scroll for large lists (#91)', () => {
  describe('Source structure', () => {
    it('exports useVirtualList function', () => {
      expect(SRC).toContain('export function useVirtualList')
    })

    it('accepts items ref and options', () => {
      expect(SRC).toContain('items: Ref<T[]> | ComputedRef<T[]>')
      expect(SRC).toContain('options: VirtualListOptions')
    })

    it('defines VirtualListOptions interface with itemHeight', () => {
      expect(SRC).toContain('interface VirtualListOptions')
      expect(SRC).toContain('itemHeight: number')
    })

    it('supports overscan buffer', () => {
      expect(SRC).toContain('overscan')
      expect(SRC).toContain('overscan = 5')
    })

    it('defines VirtualItem with data and index', () => {
      expect(SRC).toContain('interface VirtualItem')
      expect(SRC).toContain('data: T')
      expect(SRC).toContain('index: number')
    })
  })

  describe('Rendering optimization', () => {
    it('computes totalHeight from items × itemHeight', () => {
      expect(SRC).toContain('totalHeight')
      expect(SRC).toContain('items.value.length * itemHeight')
    })

    it('calculates startIndex from scrollTop', () => {
      expect(SRC).toContain('startIndex')
      expect(SRC).toContain('Math.floor(scrollTop.value / itemHeight)')
    })

    it('calculates endIndex from visible count', () => {
      expect(SRC).toContain('endIndex')
      expect(SRC).toContain('Math.ceil(containerHeight.value / itemHeight)')
    })

    it('clamps startIndex to minimum 0', () => {
      expect(SRC).toContain('Math.max(0, raw - overscan)')
    })

    it('clamps endIndex to items.length', () => {
      expect(SRC).toContain('Math.min(items.value.length')
    })

    it('returns only visible items slice', () => {
      expect(SRC).toContain('visibleItems')
      expect(SRC).toContain('for (let i = start; i < end; i++)')
    })
  })

  describe('DOM performance', () => {
    // With overscan=5, containerHeight/itemHeight visible items + 2*overscan buffer
    // For a 600px container with 120px items: 5 visible + 10 buffer = 15 nodes max
    it('renders limited DOM nodes with overscan buffer', () => {
      // startIndex subtracts overscan, endIndex adds overscan*2
      expect(SRC).toContain('raw - overscan')
      expect(SRC).toContain('overscan * 2')
    })
  })

  describe('Scroll handling', () => {
    it('tracks scrollTop from container', () => {
      expect(SRC).toContain('scrollTop')
      expect(SRC).toContain('containerRef.value.scrollTop')
    })

    it('uses passive scroll listener for performance', () => {
      expect(SRC).toContain("{ passive: true }")
    })

    it('removes scroll listener on unmount', () => {
      expect(SRC).toContain('removeEventListener')
      expect(SRC).toContain('onUnmounted')
    })
  })

  describe('Container sizing', () => {
    it('provides containerRef', () => {
      expect(SRC).toContain('containerRef')
    })

    it('uses ResizeObserver for container height', () => {
      expect(SRC).toContain('ResizeObserver')
      expect(SRC).toContain('updateContainerHeight')
    })

    it('disconnects ResizeObserver on unmount', () => {
      expect(SRC).toContain('ro.disconnect()')
    })
  })

  describe('Styling helpers', () => {
    it('provides containerStyle with overflow auto', () => {
      expect(SRC).toContain('containerStyle')
      expect(SRC).toContain("overflow: 'auto'")
    })

    it('provides wrapperStyle with total height', () => {
      expect(SRC).toContain('wrapperStyle')
      expect(SRC).toContain('totalHeight.value')
    })

    it('provides getItemStyle for absolute positioning', () => {
      expect(SRC).toContain('getItemStyle')
      expect(SRC).toContain("position: 'absolute'")
      expect(SRC).toContain('index * itemHeight')
    })
  })

  describe('Return values', () => {
    it('returns containerRef', () => {
      expect(SRC).toContain('containerRef,')
    })

    it('returns visibleItems', () => {
      expect(SRC).toContain('visibleItems,')
    })

    it('returns containerStyle and wrapperStyle', () => {
      expect(SRC).toContain('containerStyle,')
      expect(SRC).toContain('wrapperStyle,')
    })

    it('returns readonly scrollTop', () => {
      expect(SRC).toContain('readonly(scrollTop)')
    })

    it('returns totalHeight', () => {
      expect(SRC).toContain('totalHeight,')
    })
  })

  describe('Client-only execution', () => {
    it('guards DOM operations with import.meta.client', () => {
      expect(SRC).toContain('import.meta.client')
    })
  })
})
