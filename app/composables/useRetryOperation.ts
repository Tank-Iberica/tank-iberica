/**
 * useRetryOperation — Error recovery with retry for critical operations.
 *
 * Provides a composable that wraps async operations with automatic retry,
 * exponential backoff, state preservation, and a "Reintentar" button for the UI.
 *
 * Backlog N42 — Error recovery con retry en operaciones críticas
 *
 * @example
 * const { execute, isLoading, error, retryCount, canRetry, retry } = useRetryOperation({
 *   maxRetries: 3,
 *   backoffMs: 1000,
 * })
 *
 * await execute(() => submitLead(data))
 * // On error: error.value has the message, retry() re-executes
 */

export interface RetryOperationOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number
  /** Initial backoff delay in ms (default: 1000, doubles each retry) */
  backoffMs?: number
  /** Whether to retry automatically or wait for user action (default: false = manual) */
  autoRetry?: boolean
  /** Optional callback on final failure */
  onFinalFailure?: (error: unknown) => void
}

/**
 * Composable for error recovery with retry, exponential backoff, and UI "Reintentar" button.
 * @param options - Configuration for max retries, backoff, and auto-retry behavior
 * @returns Reactive retry state and execute/retry methods
 */
export function useRetryOperation(options: RetryOperationOptions = {}) {
  const {
    maxRetries = 3,
    backoffMs = 1000,
    autoRetry = false,
    onFinalFailure,
  } = options

  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const retryCount = ref(0)
  const lastError = ref<unknown>(null)

  // Store the last operation for retry
  let _lastOperation: (() => Promise<unknown>) | null = null
  let _lastResult: unknown = null

  const canRetry = computed(() => retryCount.value < maxRetries && error.value !== null)

  /** Calculate backoff delay with exponential increase */
  function getBackoffDelay(): number {
    return backoffMs * Math.pow(2, retryCount.value - 1)
  }

  /** Wait for specified ms */
  function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Execute an async operation with retry support.
   * Returns the result on success, null on failure.
   */
  async function execute<T>(operation: () => Promise<T>): Promise<T | null> {
    _lastOperation = operation
    isLoading.value = true
    error.value = null
    retryCount.value = 0
    lastError.value = null

    try {
      const result = await operation()
      _lastResult = result
      isLoading.value = false
      return result
    } catch (err) {
      lastError.value = err
      error.value = err instanceof Error ? err.message : String(err)

      if (autoRetry) {
        return await _autoRetryLoop(operation)
      }

      isLoading.value = false
      return null
    }
  }

  /** Auto-retry loop with exponential backoff */
  async function _autoRetryLoop<T>(operation: () => Promise<T>): Promise<T | null> {
    while (retryCount.value < maxRetries) {
      retryCount.value++
      const waitMs = getBackoffDelay()
      await delay(waitMs)

      try {
        const result = await operation()
        _lastResult = result
        error.value = null
        isLoading.value = false
        return result
      } catch (err) {
        lastError.value = err
        error.value = err instanceof Error ? err.message : String(err)
      }
    }

    // All retries exhausted
    isLoading.value = false
    onFinalFailure?.(lastError.value)
    return null
  }

  /**
   * Manually retry the last failed operation.
   * Returns the result on success, null on failure.
   */
  async function retry<T>(): Promise<T | null> {
    if (!_lastOperation || !canRetry.value) return null

    retryCount.value++
    isLoading.value = true
    error.value = null

    const waitMs = getBackoffDelay()
    await delay(waitMs)

    try {
      const result = await _lastOperation()
      _lastResult = result
      error.value = null
      isLoading.value = false
      return result as T
    } catch (err) {
      lastError.value = err
      error.value = err instanceof Error ? err.message : String(err)
      isLoading.value = false

      if (retryCount.value >= maxRetries) {
        onFinalFailure?.(err)
      }

      return null
    }
  }

  /** Reset state (clear error, retry count) */
  function reset(): void {
    isLoading.value = false
    error.value = null
    retryCount.value = 0
    lastError.value = null
    _lastOperation = null
    _lastResult = null
  }

  return {
    execute,
    retry,
    reset,
    isLoading: readonly(isLoading),
    error: readonly(error),
    retryCount: readonly(retryCount),
    canRetry,
    maxRetries,
  }
}
