import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const GALLERY = readFileSync(resolve(ROOT, 'app/components/vehicle/ImageGallery.vue'), 'utf-8')

describe('Touch gestures in vehicle gallery (N6)', () => {
  describe('Touch event handlers', () => {
    it('has @touchstart handler', () => {
      expect(GALLERY).toContain('@touchstart="onTouchStart"')
    })

    it('has @touchend handler', () => {
      expect(GALLERY).toContain('@touchend="onTouchEnd"')
    })

    it('defines onTouchStart function', () => {
      expect(GALLERY).toContain('function onTouchStart')
    })

    it('defines onTouchEnd function', () => {
      expect(GALLERY).toContain('function onTouchEnd')
    })
  })

  describe('Swipe detection', () => {
    it('records touch start X position', () => {
      expect(GALLERY).toContain('touchStartX')
      expect(GALLERY).toContain('e.touches[0]')
    })

    it('calculates swipe diff on touchend', () => {
      expect(GALLERY).toContain('e.changedTouches[0]')
    })

    it('has a minimum swipe threshold (50px)', () => {
      expect(GALLERY).toContain('Math.abs(diff) > 50')
    })

    it('swipe left triggers next()', () => {
      expect(GALLERY).toContain('if (diff > 0) next()')
    })

    it('swipe right triggers prev()', () => {
      expect(GALLERY).toContain('else prev()')
    })
  })

  describe('CSS touch handling', () => {
    it('has touch-action: pan-y for vertical scroll passthrough', () => {
      expect(GALLERY).toContain('touch-action: pan-y')
    })
  })

  describe('Navigation functions', () => {
    it('has next() function', () => {
      expect(GALLERY).toMatch(/function\s+next\s*\(/)
    })

    it('has prev() function', () => {
      expect(GALLERY).toMatch(/function\s+prev\s*\(/)
    })

    it('wraps around at end of images', () => {
      // next() wraps to 0 when at last image
      expect(GALLERY).toContain('currentIndex.value + 1 : 0')
    })
  })

  describe('Gallery is responsive', () => {
    it('has aspect-ratio for consistent sizing', () => {
      expect(GALLERY).toContain('aspect-ratio')
    })

    it('images fill container', () => {
      expect(GALLERY).toContain('width: 100%')
      expect(GALLERY).toContain('height: 100%')
    })
  })
})
