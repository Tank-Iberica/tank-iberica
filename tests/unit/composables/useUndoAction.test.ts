import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'

// Mock Nuxt auto-imports
vi.stubGlobal('ref', ref)
vi.stubGlobal('readonly', (r: any) => r)
vi.stubGlobal(
  'useState',
  vi.fn((_key: string, init?: () => unknown) => ref(init ? init() : null)),
)

import { useUndoAction } from '../../../app/composables/useUndoAction'

describe('useUndoAction — Undo snackbar (N4)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    vi.mocked(useState).mockImplementation(
      (_key: string, init?: () => unknown) => ref(init ? init() : []) as any,
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function makeConfig(overrides: Record<string, any> = {}) {
    return {
      message: 'Item eliminado',
      execute: vi.fn(),
      undo: vi.fn(),
      optimistic: vi.fn(),
      rollback: vi.fn(),
      ...overrides,
    }
  }

  describe('Return shape', () => {
    it('returns expected API', () => {
      const result = useUndoAction()
      expect(result).toHaveProperty('performWithUndo')
      expect(result).toHaveProperty('cancelAction')
      expect(result).toHaveProperty('pendingActions')
      expect(result).toHaveProperty('hasPending')
      expect(result).toHaveProperty('UNDO_TIMEOUT_MS')
    })

    it('default timeout is 8000ms', () => {
      const { UNDO_TIMEOUT_MS } = useUndoAction()
      expect(UNDO_TIMEOUT_MS).toBe(8000)
    })
  })

  describe('performWithUndo', () => {
    it('returns an action id', () => {
      const { performWithUndo } = useUndoAction()
      const id = performWithUndo(makeConfig())
      expect(typeof id).toBe('number')
      expect(id).toBeGreaterThan(0)
    })

    it('calls optimistic immediately', () => {
      const { performWithUndo } = useUndoAction()
      const config = makeConfig()
      performWithUndo(config)
      expect(config.optimistic).toHaveBeenCalledOnce()
    })

    it('does NOT call execute immediately', () => {
      const { performWithUndo } = useUndoAction()
      const config = makeConfig()
      performWithUndo(config)
      expect(config.execute).not.toHaveBeenCalled()
    })

    it('executes permanently after default timeout', () => {
      const { performWithUndo } = useUndoAction()
      const config = makeConfig()
      performWithUndo(config)

      vi.advanceTimersByTime(8000)
      expect(config.execute).toHaveBeenCalledOnce()
    })

    it('does NOT execute before timeout', () => {
      const { performWithUndo } = useUndoAction()
      const config = makeConfig()
      performWithUndo(config)

      vi.advanceTimersByTime(7999)
      expect(config.execute).not.toHaveBeenCalled()
    })

    it('supports custom timeout', () => {
      const { performWithUndo } = useUndoAction()
      const config = makeConfig({ timeoutMs: 3000 })
      performWithUndo(config)

      vi.advanceTimersByTime(2999)
      expect(config.execute).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1)
      expect(config.execute).toHaveBeenCalledOnce()
    })

    it('adds to pendingActions', () => {
      const { performWithUndo, pendingActions } = useUndoAction()
      performWithUndo(makeConfig())
      expect(pendingActions.value.length).toBe(1)
      expect(pendingActions.value[0].message).toBe('Item eliminado')
    })

    it('tracks multiple pending actions', () => {
      const { performWithUndo, pendingActions } = useUndoAction()
      performWithUndo(makeConfig({ message: 'First' }))
      performWithUndo(makeConfig({ message: 'Second' }))
      expect(pendingActions.value.length).toBe(2)
    })

    it('removes from pending after execution', () => {
      const { performWithUndo, pendingActions } = useUndoAction()
      performWithUndo(makeConfig())
      expect(pendingActions.value.length).toBe(1)

      vi.advanceTimersByTime(8000)
      expect(pendingActions.value.length).toBe(0)
    })

    it('calls rollback if execute throws', () => {
      const { performWithUndo } = useUndoAction()
      const config = makeConfig({
        execute: vi.fn(() => {
          throw new Error('DB error')
        }),
      })
      performWithUndo(config)

      vi.advanceTimersByTime(8000)
      expect(config.rollback).toHaveBeenCalledOnce()
    })
  })

  describe('cancelAction', () => {
    it('prevents permanent execution', async () => {
      const { performWithUndo, cancelAction } = useUndoAction()
      const config = makeConfig()
      const id = performWithUndo(config)

      vi.advanceTimersByTime(3000)
      await cancelAction(id)

      vi.advanceTimersByTime(10000)
      expect(config.execute).not.toHaveBeenCalled()
    })

    it('calls rollback and undo handler on cancel', async () => {
      // Must use same instance because pendingActions is per-useState call
      const actionsRef = ref<any[]>([])
      vi.mocked(useState).mockReturnValue(actionsRef as any)
      const { performWithUndo, cancelAction } = useUndoAction()
      const config = makeConfig()
      const id = performWithUndo(config)

      await cancelAction(id)
      expect(config.rollback).toHaveBeenCalledOnce()
      expect(config.undo).toHaveBeenCalledOnce()
    })

    it('removes from pendingActions', async () => {
      const { performWithUndo, cancelAction, pendingActions } = useUndoAction()
      const config = makeConfig()
      const id = performWithUndo(config)
      expect(pendingActions.value.length).toBe(1)

      await cancelAction(id)
      expect(pendingActions.value.length).toBe(0)
    })

    it('returns false for non-existent action', async () => {
      const { cancelAction } = useUndoAction()
      const result = await cancelAction(99999)
      expect(result).toBe(false)
    })

    it('returns true for valid cancel', async () => {
      const { performWithUndo, cancelAction } = useUndoAction()
      const id = performWithUndo(makeConfig())
      const result = await cancelAction(id)
      expect(result).toBe(true)
    })
  })

  describe('hasPending', () => {
    it('returns false when no actions', () => {
      const { hasPending } = useUndoAction()
      expect(hasPending()).toBe(false)
    })

    it('returns true when action is pending', () => {
      const { performWithUndo, hasPending } = useUndoAction()
      performWithUndo(makeConfig())
      expect(hasPending()).toBe(true)
    })

    it('returns false after action completes', () => {
      const { performWithUndo, hasPending } = useUndoAction()
      performWithUndo(makeConfig())
      vi.advanceTimersByTime(8000)
      expect(hasPending()).toBe(false)
    })
  })
})
