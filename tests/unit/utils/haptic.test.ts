/**
 * Tests for app/utils/haptic.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hapticLight, hapticSuccess, hapticError, hapticMedium } from '../../../app/utils/haptic'

describe('haptic utilities', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { vibrate: vi.fn() })
  })

  it('hapticLight calls vibrate with 10', () => {
    hapticLight()
    expect(navigator.vibrate).toHaveBeenCalledWith(10)
  })

  it('hapticMedium calls vibrate with 20', () => {
    hapticMedium()
    expect(navigator.vibrate).toHaveBeenCalledWith(20)
  })

  it('hapticSuccess calls vibrate with double-tap pattern', () => {
    hapticSuccess()
    expect(navigator.vibrate).toHaveBeenCalledWith([10, 50, 10])
  })

  it('hapticError calls vibrate with error pattern', () => {
    hapticError()
    expect(navigator.vibrate).toHaveBeenCalledWith([30, 20, 30])
  })

  it('silently no-ops when vibrate is unavailable', () => {
    vi.stubGlobal('navigator', {})
    expect(() => hapticLight()).not.toThrow()
    expect(() => hapticSuccess()).not.toThrow()
    expect(() => hapticError()).not.toThrow()
    expect(() => hapticMedium()).not.toThrow()
  })

  it('silently no-ops when navigator is undefined', () => {
    vi.stubGlobal('navigator', undefined)
    expect(() => hapticLight()).not.toThrow()
  })
})
