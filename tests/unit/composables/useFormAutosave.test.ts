import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'

// Mock localStorage
const storage = new Map<string, string>()
const mockLocalStorage = {
  getItem: vi.fn((key: string) => storage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
  removeItem: vi.fn((key: string) => storage.delete(key)),
}
Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true })

// Mock Nuxt auto-imports
vi.stubGlobal('ref', ref)
const mountCallbacks: Function[] = []
const unmountCallbacks: Function[] = []
vi.stubGlobal(
  'onMounted',
  vi.fn((cb: Function) => mountCallbacks.push(cb)),
)
vi.stubGlobal(
  'onUnmounted',
  vi.fn((cb: Function) => unmountCallbacks.push(cb)),
)

// Mock window events
const addedListeners = new Map<string, Function>()
const mockWindow = {
  addEventListener: vi.fn((event: string, handler: Function) => {
    addedListeners.set(event, handler)
  }),
  removeEventListener: vi.fn((event: string, _handler: Function) => {
    addedListeners.delete(event)
  }),
}
vi.stubGlobal('window', mockWindow)

import { useFormAutosave } from '../../../app/composables/useFormAutosave'

describe('Auto-save formularios largos (#281)', () => {
  beforeEach(() => {
    storage.clear()
    mountCallbacks.length = 0
    unmountCallbacks.length = 0
    addedListeners.clear()
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function setup(
    formData: Record<string, unknown> = { name: 'test', email: 'a@b.com' },
    options: any = {},
  ) {
    const form = ref(formData) as any
    const result = useFormAutosave('contrato', form, options)
    mountCallbacks.forEach((cb) => cb())
    return { form, ...result }
  }

  describe('Return shape', () => {
    it('returns hasDraft, saveDraft, restoreDraft, clearDraft, draftSavedAt', () => {
      const result = setup()
      expect(result).toHaveProperty('hasDraft')
      expect(result).toHaveProperty('saveDraft')
      expect(result).toHaveProperty('restoreDraft')
      expect(result).toHaveProperty('clearDraft')
      expect(result).toHaveProperty('draftSavedAt')
    })

    it('hasDraft starts as false when no saved draft', () => {
      const { hasDraft } = setup()
      expect(hasDraft.value).toBe(false)
    })
  })

  describe('saveDraft', () => {
    it('saves form data to localStorage with prefix', () => {
      const { saveDraft } = setup()
      saveDraft()

      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      const callArgs = mockLocalStorage.setItem.mock.calls.find(
        (c: any[]) => c[0] === 'tracciona_draft_contrato',
      )
      expect(callArgs).toBeTruthy()

      const saved = JSON.parse(callArgs![1])
      expect(saved.data).toEqual({ name: 'test', email: 'a@b.com' })
      expect(saved.savedAt).toBeTypeOf('number')
    })

    it('applies beforeSave transform when provided', () => {
      const beforeSave = vi.fn((data: any) => ({ name: data.name }))
      const { saveDraft } = setup({ name: 'test', email: 'secret@example.com' }, { beforeSave })
      saveDraft()

      const callArgs = mockLocalStorage.setItem.mock.calls.find(
        (c: any[]) => c[0] === 'tracciona_draft_contrato',
      )
      const saved = JSON.parse(callArgs![1])
      expect(saved.data).toEqual({ name: 'test' })
      expect(saved.data.email).toBeUndefined()
    })

    it('handles localStorage errors silently', () => {
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Quota exceeded')
      })
      const { saveDraft } = setup()
      expect(() => saveDraft()).not.toThrow()
    })
  })

  describe('restoreDraft', () => {
    it('merges draft into form ref', () => {
      storage.set(
        'tracciona_draft_contrato',
        JSON.stringify({
          data: { name: 'restored', email: 'old@b.com' },
          savedAt: Date.now(),
        }),
      )

      const { form, restoreDraft } = setup({ name: 'new', email: 'new@b.com' })
      restoreDraft()

      expect(form.value.name).toBe('restored')
      expect(form.value.email).toBe('old@b.com')
    })

    it('calls onRestore callback with restored data', () => {
      storage.set(
        'tracciona_draft_contrato',
        JSON.stringify({
          data: { name: 'restored' },
          savedAt: Date.now(),
        }),
      )

      const onRestore = vi.fn()
      const result = setup({ name: 'new', email: '' }, { onRestore })
      result.restoreDraft()

      expect(onRestore).toHaveBeenCalledWith({ name: 'restored' })
    })

    it('clears draft after restoring', () => {
      storage.set(
        'tracciona_draft_contrato',
        JSON.stringify({
          data: { name: 'restored' },
          savedAt: Date.now(),
        }),
      )

      const { restoreDraft, hasDraft } = setup()
      restoreDraft()

      expect(hasDraft.value).toBe(false)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('tracciona_draft_contrato')
    })

    it('does nothing when no draft exists', () => {
      const { form, restoreDraft } = setup({ name: 'original', email: '' })
      restoreDraft()
      expect(form.value.name).toBe('original')
    })
  })

  describe('clearDraft', () => {
    it('removes draft from localStorage', () => {
      storage.set('tracciona_draft_contrato', 'something')
      const { clearDraft } = setup()
      clearDraft()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('tracciona_draft_contrato')
    })

    it('resets hasDraft to false', () => {
      storage.set(
        'tracciona_draft_contrato',
        JSON.stringify({
          data: { name: 'x' },
          savedAt: Date.now(),
        }),
      )
      const { hasDraft, clearDraft } = setup()
      expect(hasDraft.value).toBe(true)
      clearDraft()
      expect(hasDraft.value).toBe(false)
    })
  })

  describe('Lifecycle', () => {
    it('detects existing draft on mount', () => {
      storage.set(
        'tracciona_draft_contrato',
        JSON.stringify({
          data: { name: 'saved' },
          savedAt: Date.now(),
        }),
      )
      const { hasDraft } = setup()
      expect(hasDraft.value).toBe(true)
    })

    it('starts autosave interval on mount', () => {
      setup()
      vi.clearAllMocks()

      vi.advanceTimersByTime(30_000)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    it('supports custom interval', () => {
      setup({ name: 'test', email: '' }, { interval: 5_000 })
      vi.clearAllMocks()

      vi.advanceTimersByTime(5_000)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    it('registers beforeunload handler on mount', () => {
      setup()
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function))
    })

    it('cleans up interval and event listener on unmount', () => {
      setup()
      unmountCallbacks.forEach((cb) => cb())
      expect(mockWindow.removeEventListener).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function),
      )
    })
  })

  describe('draftSavedAt', () => {
    it('returns null when no draft', () => {
      const { draftSavedAt } = setup()
      expect(draftSavedAt()).toBeNull()
    })

    it('returns a Date when draft exists', () => {
      const now = Date.now()
      storage.set(
        'tracciona_draft_contrato',
        JSON.stringify({
          data: { name: 'x' },
          savedAt: now,
        }),
      )
      const { draftSavedAt } = setup()
      const date = draftSavedAt()
      expect(date).not.toBeNull()
      expect(date!.getTime()).toBe(now)
    })
  })
})
