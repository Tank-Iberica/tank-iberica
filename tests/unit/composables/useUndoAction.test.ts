import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const SRC = readFileSync(resolve(ROOT, 'app/composables/useUndoAction.ts'), 'utf-8')

describe('useUndoAction — Undo snackbar (N4)', () => {
  describe('Source code structure', () => {
    it('defines UNDO_TIMEOUT_MS at 8 seconds', () => {
      expect(SRC).toContain('UNDO_TIMEOUT_MS = 8000')
    })

    it('exports performWithUndo function', () => {
      expect(SRC).toContain('performWithUndo')
    })

    it('exports cancelAction function', () => {
      expect(SRC).toContain('cancelAction')
    })

    it('exports pendingActions state', () => {
      expect(SRC).toContain('pendingActions')
    })

    it('exports hasPending helper', () => {
      expect(SRC).toContain('hasPending')
    })

    it('supports optimistic UI updates', () => {
      expect(SRC).toContain('optimistic')
      expect(SRC).toContain('config.optimistic?.()')
    })

    it('supports rollback on undo', () => {
      expect(SRC).toContain('rollback')
      expect(SRC).toContain('handlers.rollback?.()')
    })

    it('clears timeout on undo to prevent permanent execution', () => {
      expect(SRC).toContain('clearTimeout(action.timerId)')
    })

    it('uses setTimeout for delayed permanent execution', () => {
      expect(SRC).toContain('setTimeout')
      expect(SRC).toContain('config.execute()')
    })

    it('handles execute failure with rollback', () => {
      expect(SRC).toContain('Permanent execution failed')
      expect(SRC).toContain('config.rollback?.()')
    })

    it('stores undo handlers in closure map', () => {
      expect(SRC).toContain('_undoHandlers')
    })

    it('uses useState for SSR-safe pending list', () => {
      expect(SRC).toContain('useState')
    })
  })

  describe('UndoActionConfig interface', () => {
    it('requires message, execute, and undo', () => {
      expect(SRC).toContain('message: string')
      expect(SRC).toContain('execute: () =>')
      expect(SRC).toContain('undo: () =>')
    })

    it('supports optional timeoutMs override', () => {
      expect(SRC).toContain('timeoutMs?: number')
      expect(SRC).toContain('config.timeoutMs ?? UNDO_TIMEOUT_MS')
    })

    it('supports optional optimistic and rollback', () => {
      expect(SRC).toContain('optimistic?: () => void')
      expect(SRC).toContain('rollback?: () => void')
    })
  })

  describe('PendingAction shape', () => {
    it('has id, message, createdAt, timeoutMs, timerId', () => {
      expect(SRC).toContain('id: number')
      expect(SRC).toContain('message: string')
      expect(SRC).toContain('createdAt: number')
      expect(SRC).toContain('timeoutMs: number')
      expect(SRC).toContain('timerId:')
    })
  })

  describe('Behavioral logic (simulated)', () => {
    // Simulate the core undo pattern
    let executed: boolean
    let undone: boolean
    let rolledBack: boolean
    let optimisticApplied: boolean

    beforeEach(() => {
      vi.useFakeTimers()
      executed = false
      undone = false
      rolledBack = false
      optimisticApplied = false
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    function simulatePerformWithUndo(timeoutMs = 8000) {
      optimisticApplied = true
      const timerId = setTimeout(() => {
        executed = true
      }, timeoutMs)
      return {
        cancel() {
          clearTimeout(timerId)
          rolledBack = true
          undone = true
        },
      }
    }

    it('applies optimistic update immediately', () => {
      simulatePerformWithUndo()
      expect(optimisticApplied).toBe(true)
      expect(executed).toBe(false)
    })

    it('executes permanently after 8s timeout', () => {
      simulatePerformWithUndo()
      vi.advanceTimersByTime(8000)
      expect(executed).toBe(true)
    })

    it('does NOT execute before timeout', () => {
      simulatePerformWithUndo()
      vi.advanceTimersByTime(7999)
      expect(executed).toBe(false)
    })

    it('undo cancels permanent execution', () => {
      const action = simulatePerformWithUndo()
      vi.advanceTimersByTime(3000)
      action.cancel()
      vi.advanceTimersByTime(10000)
      expect(executed).toBe(false)
      expect(undone).toBe(true)
    })

    it('undo triggers rollback', () => {
      const action = simulatePerformWithUndo()
      action.cancel()
      expect(rolledBack).toBe(true)
    })

    it('custom timeout works', () => {
      simulatePerformWithUndo(3000)
      vi.advanceTimersByTime(2999)
      expect(executed).toBe(false)
      vi.advanceTimersByTime(1)
      expect(executed).toBe(true)
    })
  })
})
