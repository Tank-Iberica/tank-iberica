import { describe, it, expect, vi, beforeEach } from 'vitest'

// Stub Vue lifecycle hooks globally before importing the composable
vi.stubGlobal('onMounted', vi.fn((cb: Function) => cb()))
vi.stubGlobal('onBeforeUnmount', vi.fn())

import { useUnsavedChanges } from '../../app/composables/useUnsavedChanges'

describe('useUnsavedChanges', () => {
  const addSpy = vi.spyOn(window, 'addEventListener')
  const removeSpy = vi.spyOn(window, 'removeEventListener')

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('isDirty starts false', () => {
    const { isDirty } = useUnsavedChanges()
    expect(isDirty.value).toBe(false)
  })

  it('markDirty sets isDirty to true', () => {
    const { isDirty, markDirty } = useUnsavedChanges()
    markDirty()
    expect(isDirty.value).toBe(true)
  })

  it('markClean sets isDirty to false', () => {
    const { isDirty, markDirty, markClean } = useUnsavedChanges()
    markDirty()
    markClean()
    expect(isDirty.value).toBe(false)
  })

  it('registers beforeunload listener on mount', () => {
    useUnsavedChanges()
    expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))
  })

  it('onBeforeUnload sets returnValue when dirty', () => {
    const { markDirty } = useUnsavedChanges()
    markDirty()

    // Get the listener that was registered
    const listener = addSpy.mock.calls.find(
      (c) => c[0] === 'beforeunload',
    )?.[1] as EventListener
    expect(listener).toBeDefined()

    const event = { preventDefault: vi.fn(), returnValue: '' } as any
    listener(event)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(event.returnValue).toBe('')
  })

  it('onBeforeUnload does nothing when clean', () => {
    useUnsavedChanges()

    const listener = addSpy.mock.calls.find(
      (c) => c[0] === 'beforeunload',
    )?.[1] as EventListener

    const event = { preventDefault: vi.fn(), returnValue: '' } as any
    listener(event)
    expect(event.preventDefault).not.toHaveBeenCalled()
  })
})
