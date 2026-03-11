import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useToast } from '../../app/composables/useToast'

// ─── Setup ────────────────────────────────────────────────────────────────

// useToast uses module-level `toasts` ref — clear between tests via clear()
beforeEach(() => {
  vi.clearAllMocks()
  // Clear any toasts from previous tests
  const t = useToast()
  t.clear()
})

// ─── show ─────────────────────────────────────────────────────────────────

describe('show', () => {
  it('adds a toast to the list', () => {
    const t = useToast()
    t.show('Hello', 'info', 0)
    expect(t.toasts.value).toHaveLength(1)
  })

  it('toast has correct message, type, and duration', () => {
    const t = useToast()
    t.show('Test message', 'error', 3000)
    const toast = t.toasts.value[0]!
    expect(toast.message).toBe('Test message')
    expect(toast.type).toBe('error')
    expect(toast.duration).toBe(3000)
  })

  it('defaults to type "info" and duration 5000', () => {
    const t = useToast()
    t.show('Default')
    const toast = t.toasts.value[0]!
    expect(toast.type).toBe('info')
    expect(toast.duration).toBe(5000)
  })

  it('each toast has a unique numeric id', () => {
    const t = useToast()
    t.show('msg1', 'info', 0)
    t.show('msg2', 'info', 0)
    const ids = t.toasts.value.map((toast) => toast.id)
    expect(new Set(ids).size).toBe(2)
    expect(typeof ids[0]).toBe('number')
  })

  it('can add multiple toasts', () => {
    const t = useToast()
    t.show('a', 'success', 0)
    t.show('b', 'warning', 0)
    t.show('c', 'error', 0)
    expect(t.toasts.value).toHaveLength(3)
  })

  it('message is passed through i18n t() (mock returns key as-is)', () => {
    const t = useToast()
    t.show('admin.save.success', 'success', 0)
    // Our useI18n mock: t(key) => key
    expect(t.toasts.value[0]!.message).toBe('admin.save.success')
  })
})

// ─── remove ───────────────────────────────────────────────────────────────

describe('remove', () => {
  it('removes toast by id', () => {
    const t = useToast()
    t.show('msg-1', 'info', 0)
    t.show('msg-2', 'info', 0)
    const id = t.toasts.value[0]!.id
    t.remove(id)
    expect(t.toasts.value).toHaveLength(1)
    expect(t.toasts.value[0]!.message).toBe('msg-2')
  })

  it('does nothing for unknown id', () => {
    const t = useToast()
    t.show('msg', 'info', 0)
    t.remove(999_999)
    expect(t.toasts.value).toHaveLength(1)
  })
})

// ─── clear ────────────────────────────────────────────────────────────────

describe('clear', () => {
  it('removes all toasts', () => {
    const t = useToast()
    t.show('a', 'info', 0)
    t.show('b', 'info', 0)
    t.clear()
    expect(t.toasts.value).toHaveLength(0)
  })

  it('is safe to call when already empty', () => {
    const t = useToast()
    expect(() => t.clear()).not.toThrow()
    expect(t.toasts.value).toHaveLength(0)
  })
})

// ─── convenience methods ──────────────────────────────────────────────────

describe('success', () => {
  it('adds a toast with type "success"', () => {
    const t = useToast()
    t.success('Saved!', 0)
    expect(t.toasts.value[0]!.type).toBe('success')
    expect(t.toasts.value[0]!.message).toBe('Saved!')
  })
})

describe('error', () => {
  it('adds a toast with type "error"', () => {
    const t = useToast()
    t.error('Something went wrong', 0)
    expect(t.toasts.value[0]!.type).toBe('error')
  })
})

describe('warning', () => {
  it('adds a toast with type "warning"', () => {
    const t = useToast()
    t.warning('Be careful', 0)
    expect(t.toasts.value[0]!.type).toBe('warning')
  })
})

describe('info', () => {
  it('adds a toast with type "info"', () => {
    const t = useToast()
    t.info('FYI', 0)
    expect(t.toasts.value[0]!.type).toBe('info')
  })
})
