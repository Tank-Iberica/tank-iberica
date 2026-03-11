/**
 * Chaos testing helpers — simulate provider failures.
 *
 * Use in integration tests to verify the app degrades gracefully
 * when external providers (Supabase, Stripe, Resend, Cloudinary) fail.
 *
 * Usage:
 *   import { createChaosSupabase, createChaosStripe } from '~/tests/helpers/chaos'
 *
 *   const supabase = createChaosSupabase({ failRate: 0.5, latencyMs: 2000 })
 *   const stripe = createChaosStripe({ failRate: 1.0 }) // always fail
 */

/** Chaos configuration */
export interface ChaosConfig {
  /** Probability of failure (0.0 = never, 1.0 = always). Default: 0.5 */
  failRate?: number
  /** Added latency in ms (simulates slow network). Default: 0 */
  latencyMs?: number
  /** Custom error message. Default: provider-specific */
  errorMessage?: string
  /** Specific methods to fail (if empty, all methods can fail). */
  failMethods?: string[]
}

const DEFAULT_CONFIG: Required<ChaosConfig> = {
  failRate: 0.5,
  latencyMs: 0,
  errorMessage: '',
  failMethods: [],
}

function shouldFail(config: Required<ChaosConfig>, method?: string): boolean {
  if (config.failMethods.length > 0 && method && !config.failMethods.includes(method)) {
    return false
  }
  return Math.random() < config.failRate
}

async function maybeDelay(config: Required<ChaosConfig>): Promise<void> {
  if (config.latencyMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, config.latencyMs))
  }
}

/**
 * Creates a Supabase-like client that randomly fails queries.
 * Returns an object with `.from()` that mimics Supabase query builder.
 */
export function createChaosSupabase(userConfig?: ChaosConfig) {
  const config = { ...DEFAULT_CONFIG, ...userConfig }

  function createQueryBuilder(table: string) {
    const builder: Record<string, unknown> = {}

    const chainMethods = [
      'select',
      'insert',
      'update',
      'delete',
      'upsert',
      'eq',
      'neq',
      'gt',
      'gte',
      'lt',
      'lte',
      'like',
      'ilike',
      'is',
      'in',
      'contains',
      'containedBy',
      'range',
      'order',
      'limit',
      'single',
      'maybeSingle',
      'textSearch',
      'match',
      'not',
      'or',
      'filter',
    ]

    for (const method of chainMethods) {
      builder[method] = (..._args: unknown[]) => builder
    }

    // Terminal methods that return data
    const resolve = async () => {
      await maybeDelay(config)
      if (shouldFail(config, table)) {
        return {
          data: null,
          error: {
            message: config.errorMessage || `Chaos: Supabase ${table} query failed (simulated)`,
            code: 'PGRST000',
            details: 'Chaos testing — simulated provider failure',
          },
          count: null,
          status: 500,
          statusText: 'Internal Server Error',
        }
      }
      return { data: [], error: null, count: 0, status: 200, statusText: 'OK' }
    }

    builder.then = (onFulfilled: (v: unknown) => unknown) => resolve().then(onFulfilled)

    return builder
  }

  return {
    from: (table: string) => createQueryBuilder(table),
    auth: {
      getUser: async () => {
        await maybeDelay(config)
        if (shouldFail(config, 'auth.getUser')) {
          return { data: { user: null }, error: { message: 'Chaos: auth failure' } }
        }
        return { data: { user: { id: 'test-user', email: 'test@test.com' } }, error: null }
      },
      getSession: async () => {
        await maybeDelay(config)
        if (shouldFail(config, 'auth.getSession')) {
          return { data: { session: null }, error: { message: 'Chaos: session failure' } }
        }
        return { data: { session: { access_token: 'fake-token' } }, error: null }
      },
    },
    storage: {
      from: (_bucket: string) => ({
        upload: async () => {
          await maybeDelay(config)
          if (shouldFail(config, 'storage.upload')) {
            return { data: null, error: { message: 'Chaos: storage upload failed' } }
          }
          return { data: { path: 'test/file.jpg' }, error: null }
        },
        getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/test.jpg' } }),
      }),
    },
  }
}

/**
 * Creates a Stripe-like client that randomly fails API calls.
 */
export function createChaosStripe(userConfig?: ChaosConfig) {
  const config = { ...DEFAULT_CONFIG, ...userConfig }

  async function maybeThrow(operation: string): Promise<void> {
    await maybeDelay(config)
    if (shouldFail(config, operation)) {
      const error = new Error(
        config.errorMessage || `Chaos: Stripe ${operation} failed (simulated)`,
      )
      ;(error as Record<string, unknown>).type = 'StripeAPIError'
      ;(error as Record<string, unknown>).statusCode = 503
      throw error
    }
  }

  return {
    checkout: {
      sessions: {
        create: async (params: Record<string, unknown>) => {
          await maybeThrow('checkout.sessions.create')
          return { id: 'cs_test_chaos', url: 'https://checkout.stripe.com/test', ...params }
        },
      },
    },
    subscriptions: {
      retrieve: async (id: string) => {
        await maybeThrow('subscriptions.retrieve')
        return { id, status: 'active', current_period_end: Date.now() / 1000 + 86400 }
      },
      cancel: async (id: string) => {
        await maybeThrow('subscriptions.cancel')
        return { id, status: 'canceled' }
      },
    },
    customers: {
      create: async (params: Record<string, unknown>) => {
        await maybeThrow('customers.create')
        return { id: 'cus_test_chaos', ...params }
      },
    },
    billingPortal: {
      sessions: {
        create: async (params: Record<string, unknown>) => {
          await maybeThrow('billingPortal.sessions.create')
          return { url: 'https://billing.stripe.com/test', ...params }
        },
      },
    },
  }
}

/**
 * Creates a Resend-like email client that randomly fails.
 */
export function createChaosResend(userConfig?: ChaosConfig) {
  const config = { ...DEFAULT_CONFIG, ...userConfig }

  return {
    emails: {
      send: async (params: Record<string, unknown>) => {
        await maybeDelay(config)
        if (shouldFail(config, 'emails.send')) {
          throw new Error(config.errorMessage || 'Chaos: Resend email send failed (simulated)')
        }
        return { id: 'email_chaos_test', ...params }
      },
    },
  }
}

/**
 * Creates a timeout simulator for any async function.
 * Wraps a function and makes it timeout after the specified duration.
 */
export function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  errorMessage = 'Chaos: Operation timed out',
): () => Promise<T> {
  return () =>
    Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs),
      ),
    ])
}

/**
 * Network partition simulator — all calls fail for a duration, then recover.
 */
export function createNetworkPartition(durationMs: number) {
  let partitionActive = false
  let partitionTimer: ReturnType<typeof setTimeout> | null = null

  return {
    /** Start the partition — all chaos clients should check isPartitioned() */
    start() {
      partitionActive = true
      partitionTimer = setTimeout(() => {
        partitionActive = false
      }, durationMs)
    },
    /** Stop the partition early */
    stop() {
      partitionActive = false
      if (partitionTimer) clearTimeout(partitionTimer)
    },
    /** Check if partition is currently active */
    isPartitioned(): boolean {
      return partitionActive
    },
    /** Create a chaos config that fails 100% when partitioned, 0% otherwise */
    toChaosConfig(): ChaosConfig {
      return {
        failRate: partitionActive ? 1.0 : 0.0,
        errorMessage: 'Network partition: provider unreachable',
        latencyMs: partitionActive ? 5000 : 0,
      }
    },
  }
}
