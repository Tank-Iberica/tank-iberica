import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useHorizontalScroll } from '../../app/composables/catalog/useHorizontalScroll'

// ─── Stubs ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('ref', (v: unknown) => {
    let _v = v
    return { get value() { return _v }, set value(x) { _v = x } }
  })
  vi.stubGlobal('onMounted', vi.fn())
  vi.stubGlobal('onUnmounted', vi.fn())
  vi.stubGlobal('nextTick', vi.fn().mockResolvedValue(undefined))
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('scrollContainer starts as null', () => {
    const c = useHorizontalScroll()
    expect(c.scrollContainer.value).toBeNull()
  })

  it('canScrollLeft starts as false', () => {
    const c = useHorizontalScroll()
    expect(c.canScrollLeft.value).toBe(false)
  })

  it('canScrollRight starts as false', () => {
    const c = useHorizontalScroll()
    expect(c.canScrollRight.value).toBe(false)
  })
})

// ─── updateScrollState ────────────────────────────────────────────────────────

describe('updateScrollState', () => {
  it('does nothing when scrollContainer is null', () => {
    const c = useHorizontalScroll()
    expect(() => c.updateScrollState()).not.toThrow()
  })

  it('sets canScrollLeft when scrollLeft > 0', () => {
    const c = useHorizontalScroll()
    const mockEl = {
      scrollLeft: 100,
      scrollWidth: 1000,
      clientWidth: 400,
    } as HTMLElement
    c.scrollContainer.value = mockEl
    c.updateScrollState()
    expect(c.canScrollLeft.value).toBe(true)
  })

  it('sets canScrollRight when not at end', () => {
    const c = useHorizontalScroll()
    const mockEl = {
      scrollLeft: 0,
      scrollWidth: 1000,
      clientWidth: 400,
    } as HTMLElement
    c.scrollContainer.value = mockEl
    c.updateScrollState()
    expect(c.canScrollRight.value).toBe(true)
  })

  it('canScrollLeft is false when at start', () => {
    const c = useHorizontalScroll()
    const mockEl = {
      scrollLeft: 0,
      scrollWidth: 1000,
      clientWidth: 400,
    } as HTMLElement
    c.scrollContainer.value = mockEl
    c.updateScrollState()
    expect(c.canScrollLeft.value).toBe(false)
  })

  it('canScrollRight is false when at end', () => {
    const c = useHorizontalScroll()
    const mockEl = {
      scrollLeft: 600,
      scrollWidth: 1000,
      clientWidth: 400,
    } as HTMLElement
    c.scrollContainer.value = mockEl
    c.updateScrollState()
    expect(c.canScrollRight.value).toBe(false)
  })
})

// ─── scrollLeftBy / scrollRightBy ────────────────────────────────────────────

describe('scrollLeftBy / scrollRightBy', () => {
  it('does nothing when scrollContainer is null', () => {
    const c = useHorizontalScroll()
    expect(() => c.scrollLeftBy()).not.toThrow()
    expect(() => c.scrollRightBy()).not.toThrow()
  })

  it('calls scrollBy with negative left for scrollLeftBy', () => {
    const c = useHorizontalScroll()
    const scrollBy = vi.fn()
    c.scrollContainer.value = { scrollBy } as unknown as HTMLElement
    c.scrollLeftBy()
    expect(scrollBy).toHaveBeenCalledWith({ left: -200, behavior: 'smooth' })
  })

  it('calls scrollBy with positive left for scrollRightBy', () => {
    const c = useHorizontalScroll()
    const scrollBy = vi.fn()
    c.scrollContainer.value = { scrollBy } as unknown as HTMLElement
    c.scrollRightBy()
    expect(scrollBy).toHaveBeenCalledWith({ left: 200, behavior: 'smooth' })
  })
})

// ─── onGrabStart ─────────────────────────────────────────────────────────────

describe('onGrabStart', () => {
  it('does nothing when scrollContainer is null', () => {
    const c = useHorizontalScroll()
    const fakeEvent = { target: { tagName: 'DIV' }, pageX: 100 } as unknown as MouseEvent
    expect(() => c.onGrabStart(fakeEvent)).not.toThrow()
  })

  it('does nothing when target is a BUTTON', () => {
    const c = useHorizontalScroll()
    const fakeEl = { offsetLeft: 0, scrollLeft: 0, style: {}, addEventListener: vi.fn() } as unknown as HTMLElement
    c.scrollContainer.value = fakeEl
    const fakeEvent = { target: { tagName: 'BUTTON' }, pageX: 100 } as unknown as MouseEvent
    expect(() => c.onGrabStart(fakeEvent)).not.toThrow()
    // style.cursor should NOT be set to 'grabbing' since it's a BUTTON
    expect((fakeEl as HTMLElement).style.cursor).not.toBe('grabbing')
  })

  it('sets cursor to grabbing when starting drag on DIV', () => {
    const c = useHorizontalScroll()
    const fakeEl = {
      offsetLeft: 0, scrollLeft: 0,
      style: { cursor: '' },
      addEventListener: vi.fn(),
    } as unknown as HTMLElement
    c.scrollContainer.value = fakeEl
    const fakeEvent = { target: { tagName: 'DIV' }, pageX: 100 } as unknown as MouseEvent
    // Mock document.addEventListener
    const docAdd = vi.spyOn(document, 'addEventListener').mockImplementation(vi.fn())
    c.onGrabStart(fakeEvent)
    expect((fakeEl as HTMLElement).style.cursor).toBe('grabbing')
    docAdd.mockRestore()
  })
})
