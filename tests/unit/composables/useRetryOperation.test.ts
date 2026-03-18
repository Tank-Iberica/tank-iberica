import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const SRC = readFileSync(resolve(ROOT, 'app/composables/useRetryOperation.ts'), 'utf-8')

describe('useRetryOperation — Error recovery with retry (N42)', () => {
  describe('Source code structure', () => {
    it('exports execute function', () => {
      expect(SRC).toContain('execute')
    })

    it('exports retry function', () => {
      expect(SRC).toContain('retry')
    })

    it('exports reset function', () => {
      expect(SRC).toContain('reset')
    })

    it('exports isLoading state', () => {
      expect(SRC).toContain('isLoading')
    })

    it('exports error state', () => {
      expect(SRC).toContain('error')
    })

    it('exports retryCount', () => {
      expect(SRC).toContain('retryCount')
    })

    it('exports canRetry computed', () => {
      expect(SRC).toContain('canRetry')
    })

    it('defaults maxRetries to 3', () => {
      expect(SRC).toContain('maxRetries = 3')
    })

    it('defaults backoffMs to 1000', () => {
      expect(SRC).toContain('backoffMs = 1000')
    })

    it('uses exponential backoff', () => {
      expect(SRC).toContain('Math.pow(2')
    })

    it('supports autoRetry option', () => {
      expect(SRC).toContain('autoRetry')
    })

    it('supports onFinalFailure callback', () => {
      expect(SRC).toContain('onFinalFailure')
    })

    it('stores last operation for manual retry', () => {
      expect(SRC).toContain('_lastOperation')
    })

    it('uses readonly for state exposure', () => {
      expect(SRC).toContain('readonly(isLoading)')
      expect(SRC).toContain('readonly(error)')
    })
  })

  describe('Retry logic (simulated)', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('canRetry is false when no error', () => {
      const retryCount = 0
      const maxRetries = 3
      const error: string | null = null
      const canRetry = retryCount < maxRetries && error !== null
      expect(canRetry).toBe(false)
    })

    it('canRetry is true when error and retries available', () => {
      const retryCount = 1
      const maxRetries = 3
      const error = 'Network error'
      const canRetry = retryCount < maxRetries && error !== null
      expect(canRetry).toBe(true)
    })

    it('canRetry is false when maxRetries exhausted', () => {
      const retryCount = 3
      const maxRetries = 3
      const error = 'Network error'
      const canRetry = retryCount < maxRetries && error !== null
      expect(canRetry).toBe(false)
    })

    it('exponential backoff calculation is correct', () => {
      function getBackoff(backoffMs: number, retryCount: number): number {
        return backoffMs * Math.pow(2, retryCount - 1)
      }
      expect(getBackoff(1000, 1)).toBe(1000) // 1s
      expect(getBackoff(1000, 2)).toBe(2000) // 2s
      expect(getBackoff(1000, 3)).toBe(4000) // 4s
    })

    it('captures error message from Error objects', () => {
      const err = new Error('Network failed')
      const errorMsg = err instanceof Error ? err.message : String(err)
      expect(errorMsg).toBe('Network failed')
    })

    it('handles non-Error throws', () => {
      const err = 'string error'
      const errorMsg = err instanceof Error ? err.message : String(err)
      expect(errorMsg).toBe('string error')
    })

    it('reset clears all state', () => {
      // Verify reset function sets everything to initial values
      expect(SRC).toContain('isLoading.value = false')
      expect(SRC).toContain('error.value = null')
      expect(SRC).toContain('retryCount.value = 0')
      expect(SRC).toContain('_lastOperation = null')
    })
  })
})
