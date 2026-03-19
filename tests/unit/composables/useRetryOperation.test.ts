import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, computed, readonly } from 'vue'

// Mock Nuxt auto-imports
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('readonly', readonly)

import { useRetryOperation } from '../../../app/composables/useRetryOperation'

describe('useRetryOperation — Error recovery with retry (N42)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout'] })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Return shape', () => {
    it('returns expected API', () => {
      const result = useRetryOperation()
      expect(result).toHaveProperty('execute')
      expect(result).toHaveProperty('retry')
      expect(result).toHaveProperty('reset')
      expect(result).toHaveProperty('isLoading')
      expect(result).toHaveProperty('error')
      expect(result).toHaveProperty('retryCount')
      expect(result).toHaveProperty('canRetry')
      expect(result).toHaveProperty('maxRetries')
    })

    it('defaults maxRetries to 3', () => {
      const { maxRetries } = useRetryOperation()
      expect(maxRetries).toBe(3)
    })

    it('initial state is clean', () => {
      const { isLoading, error, retryCount, canRetry } = useRetryOperation()
      expect(isLoading.value).toBe(false)
      expect(error.value).toBeNull()
      expect(retryCount.value).toBe(0)
      expect(canRetry.value).toBe(false)
    })
  })

  describe('execute', () => {
    it('returns result on success', async () => {
      const { execute } = useRetryOperation()
      const result = await execute(() => Promise.resolve('ok'))
      expect(result).toBe('ok')
    })

    it('sets isLoading during operation', async () => {
      const { execute, isLoading } = useRetryOperation()
      let loadingDuringExec = false

      await execute(async () => {
        loadingDuringExec = isLoading.value
        return 'done'
      })
      expect(loadingDuringExec).toBe(true)
      expect(isLoading.value).toBe(false)
    })

    it('captures Error message on failure', async () => {
      const { execute, error } = useRetryOperation()
      await execute(() => Promise.reject(new Error('Network failed')))
      expect(error.value).toBe('Network failed')
    })

    it('captures string error on failure', async () => {
      const { execute, error } = useRetryOperation()
      await execute(() => Promise.reject('string error'))
      expect(error.value).toBe('string error')
    })

    it('sets isLoading to false on failure (manual mode)', async () => {
      const { execute, isLoading } = useRetryOperation()
      await execute(() => Promise.reject(new Error('fail')))
      expect(isLoading.value).toBe(false)
    })
  })

  describe('canRetry', () => {
    it('is false when no error', async () => {
      const { execute, canRetry } = useRetryOperation()
      await execute(() => Promise.resolve('ok'))
      expect(canRetry.value).toBe(false)
    })

    it('is true when error and retries available', async () => {
      const { execute, canRetry } = useRetryOperation({ maxRetries: 3 })
      await execute(() => Promise.reject(new Error('fail')))
      expect(canRetry.value).toBe(true)
    })

    it('is false when maxRetries exhausted', async () => {
      let callCount = 0
      const { execute, canRetry } = useRetryOperation({
        maxRetries: 2,
        autoRetry: true,
        backoffMs: 10,
      })

      const promise = execute(() => {
        callCount++
        return Promise.reject(new Error('fail'))
      })

      // Advance through retries
      await vi.advanceTimersByTimeAsync(10) // retry 1
      await vi.advanceTimersByTimeAsync(20) // retry 2
      await promise

      expect(canRetry.value).toBe(false)
    })
  })

  describe('manual retry', () => {
    it('re-executes last operation', async () => {
      let callCount = 0
      const operation = () => {
        callCount++
        if (callCount === 1) return Promise.reject(new Error('fail'))
        return Promise.resolve('success')
      }

      const { execute, retry, error } = useRetryOperation({ backoffMs: 10 })
      await execute(operation)
      expect(error.value).toBe('fail')

      const retryPromise = retry()
      await vi.advanceTimersByTimeAsync(10) // backoff delay
      const result = await retryPromise

      expect(result).toBe('success')
      expect(error.value).toBeNull()
    })

    it('increments retryCount on each retry', async () => {
      const { execute, retry, retryCount } = useRetryOperation({ backoffMs: 10 })
      await execute(() => Promise.reject(new Error('fail')))
      expect(retryCount.value).toBe(0)

      const retryPromise = retry()
      await vi.advanceTimersByTimeAsync(10)
      await retryPromise
      expect(retryCount.value).toBe(1)
    })

    it('returns null if no last operation', async () => {
      const { retry } = useRetryOperation()
      const result = await retry()
      expect(result).toBeNull()
    })

    it('returns null if canRetry is false', async () => {
      const { execute, retry } = useRetryOperation({ maxRetries: 0 })
      await execute(() => Promise.reject(new Error('fail')))
      const result = await retry()
      expect(result).toBeNull()
    })
  })

  describe('autoRetry', () => {
    it('retries automatically with exponential backoff', async () => {
      let callCount = 0
      const operation = () => {
        callCount++
        if (callCount <= 2) return Promise.reject(new Error('fail'))
        return Promise.resolve('recovered')
      }

      const { execute } = useRetryOperation({
        maxRetries: 3,
        backoffMs: 100,
        autoRetry: true,
      })

      const promise = execute(operation)
      await vi.advanceTimersByTimeAsync(100) // retry 1: 100ms
      await vi.advanceTimersByTimeAsync(200) // retry 2: 200ms
      const result = await promise

      expect(result).toBe('recovered')
      expect(callCount).toBe(3)
    })

    it('calls onFinalFailure when all retries exhausted', async () => {
      const onFinalFailure = vi.fn()
      const { execute } = useRetryOperation({
        maxRetries: 2,
        backoffMs: 10,
        autoRetry: true,
        onFinalFailure,
      })

      const promise = execute(() => Promise.reject(new Error('permanent fail')))
      await vi.advanceTimersByTimeAsync(10) // retry 1
      await vi.advanceTimersByTimeAsync(20) // retry 2
      await promise

      expect(onFinalFailure).toHaveBeenCalledOnce()
    })
  })

  describe('reset', () => {
    it('clears all state', async () => {
      const { execute, reset, isLoading, error, retryCount, canRetry } = useRetryOperation()
      await execute(() => Promise.reject(new Error('fail')))
      expect(error.value).toBe('fail')

      reset()
      expect(isLoading.value).toBe(false)
      expect(error.value).toBeNull()
      expect(retryCount.value).toBe(0)
      expect(canRetry.value).toBe(false)
    })

    it('prevents retry after reset', async () => {
      const { execute, reset, retry } = useRetryOperation()
      await execute(() => Promise.reject(new Error('fail')))
      reset()
      const result = await retry()
      expect(result).toBeNull()
    })
  })
})
