/**
 * Tests for useCopyToClipboard composable.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, readonly } from 'vue'

// Stub Vue auto-imports
vi.stubGlobal('ref', ref)
vi.stubGlobal('readonly', readonly)

import { useCopyToClipboard } from '../../../app/composables/useCopyToClipboard'

function mockClipboard(writeText: (...args: unknown[]) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    writable: true,
    configurable: true,
  })
}

function removeClipboard() {
  Object.defineProperty(navigator, 'clipboard', {
    value: undefined,
    writable: true,
    configurable: true,
  })
}

describe('useCopyToClipboard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockClipboard(vi.fn().mockResolvedValue(undefined))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('returns copy function and copied ref', () => {
    const { copy, copied } = useCopyToClipboard()
    expect(typeof copy).toBe('function')
    expect(copied.value).toBe(false)
  })

  it('copies text using navigator.clipboard.writeText', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    mockClipboard(writeText)

    const { copy } = useCopyToClipboard()
    const result = await copy('hello world')
    expect(result).toBe(true)
    expect(writeText).toHaveBeenCalledWith('hello world')
  })

  it('sets copied to true after successful copy', async () => {
    const { copy, copied } = useCopyToClipboard()
    await copy('test')
    expect(copied.value).toBe(true)
  })

  it('resets copied to false after timeout', async () => {
    const { copy, copied } = useCopyToClipboard(1000)
    await copy('test')
    expect(copied.value).toBe(true)

    vi.advanceTimersByTime(1000)
    expect(copied.value).toBe(false)
  })

  it('uses default 2000ms reset timeout', async () => {
    const { copy, copied } = useCopyToClipboard()
    await copy('test')

    vi.advanceTimersByTime(1999)
    expect(copied.value).toBe(true)

    vi.advanceTimersByTime(1)
    expect(copied.value).toBe(false)
  })

  it('returns false for empty string', async () => {
    const { copy, copied } = useCopyToClipboard()
    const result = await copy('')
    expect(result).toBe(false)
    expect(copied.value).toBe(false)
  })

  it('clears previous timer on rapid copies', async () => {
    const { copy, copied } = useCopyToClipboard(1000)
    await copy('first')
    vi.advanceTimersByTime(500)
    await copy('second')
    // After 500ms more, first timer would have fired but shouldn't
    vi.advanceTimersByTime(500)
    expect(copied.value).toBe(true)
    // After full second from last copy
    vi.advanceTimersByTime(500)
    expect(copied.value).toBe(false)
  })

  it('uses textarea fallback when clipboard API unavailable', async () => {
    removeClipboard()

    // Ensure execCommand exists in test env
    if (!document.execCommand) {
      (document as any).execCommand = vi.fn().mockReturnValue(true)
    }

    const appendSpy = vi.spyOn(document.body, 'appendChild').mockReturnValue(null as never)
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockReturnValue(null as never)
    const execSpy = vi.spyOn(document, 'execCommand').mockReturnValue(true)

    const { copy, copied } = useCopyToClipboard()
    const result = await copy('fallback text')

    expect(result).toBe(true)
    expect(copied.value).toBe(true)
    expect(appendSpy).toHaveBeenCalled()
    expect(execSpy).toHaveBeenCalledWith('copy')
    expect(removeSpy).toHaveBeenCalled()

    appendSpy.mockRestore()
    removeSpy.mockRestore()
    execSpy.mockRestore()
  })

  it('returns false and sets copied to false on error', async () => {
    mockClipboard(vi.fn().mockRejectedValue(new Error('Permission denied')))

    const { copy, copied } = useCopyToClipboard()
    const result = await copy('fail')
    expect(result).toBe(false)
    expect(copied.value).toBe(false)
  })
})
