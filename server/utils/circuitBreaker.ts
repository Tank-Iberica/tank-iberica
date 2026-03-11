/**
 * Lightweight circuit breaker for external service calls.
 *
 * State machine:
 *   CLOSED   → normal operation. Tracks failure count.
 *   OPEN     → service is failing. Rejects calls immediately after cooldown period.
 *   HALF_OPEN → probe state. Allows one call to test recovery.
 *
 * Module-level state persists within a Node.js/CF Workers isolate, protecting
 * against cascading failures when external services (AI, Stripe, Cloudinary,
 * WhatsApp) experience outages.
 *
 * Usage:
 *   const result = await callWithCircuitBreaker('openai', () => openai.chat(...))
 */

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

interface CircuitStats {
  state: CircuitState
  failures: number
  lastFailedAt: number | null
  lastSucceededAt: number | null
  nextProbeAt: number | null
}

export interface CircuitBreakerOptions {
  /** Number of consecutive failures before tripping to OPEN. Default: 5 */
  failureThreshold?: number
  /** Time in ms before trying a probe request after OPEN. Default: 30000 (30s) */
  cooldownMs?: number
  /** Whether to re-throw the original error. Default: true */
  rethrow?: boolean
}

// Module-level state — survives across requests in the same isolate
const circuits = new Map<string, CircuitStats>()

function getCircuit(name: string): CircuitStats {
  if (!circuits.has(name)) {
    circuits.set(name, {
      state: 'CLOSED',
      failures: 0,
      lastFailedAt: null,
      lastSucceededAt: null,
      nextProbeAt: null,
    })
  }
  return circuits.get(name)!
}

/**
 * Record a successful call — resets failure count and closes the circuit.
 */
function recordSuccess(circuit: CircuitStats): void {
  circuit.state = 'CLOSED'
  circuit.failures = 0
  circuit.lastSucceededAt = Date.now()
  circuit.nextProbeAt = null
}

/**
 * Record a failed call — increments failure count and may trip the circuit.
 */
function recordFailure(circuit: CircuitStats, failureThreshold: number, cooldownMs: number): void {
  circuit.failures++
  circuit.lastFailedAt = Date.now()

  if (circuit.state === 'HALF_OPEN' || circuit.failures >= failureThreshold) {
    circuit.state = 'OPEN'
    circuit.nextProbeAt = Date.now() + cooldownMs
  }
}

/**
 * Execute a function protected by the named circuit breaker.
 *
 * @param name - Unique identifier for the external service (e.g. 'openai', 'stripe', 'cloudinary')
 * @param fn - Async function to execute
 * @param options - Circuit breaker configuration
 * @returns The result of fn() if the circuit is CLOSED or HALF_OPEN and the call succeeds
 * @throws CircuitOpenError if the circuit is OPEN, or the original error if fn() fails
 */
export async function callWithCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  options: CircuitBreakerOptions = {},
): Promise<T> {
  const { failureThreshold = 5, cooldownMs = 30_000, rethrow = true } = options
  const circuit = getCircuit(name)
  const now = Date.now()

  // OPEN — check if cooldown has elapsed for a probe
  if (circuit.state === 'OPEN') {
    if (circuit.nextProbeAt && now < circuit.nextProbeAt) {
      const waitSec = Math.ceil((circuit.nextProbeAt - now) / 1000)
      throw new CircuitOpenError(name, waitSec)
    }
    // Cooldown elapsed — transition to HALF_OPEN for a probe request
    circuit.state = 'HALF_OPEN'
  }

  try {
    const result = await fn()
    recordSuccess(circuit)
    return result
  } catch (err) {
    recordFailure(circuit, failureThreshold, cooldownMs)
    if (rethrow) throw err
    throw err
  }
}

/**
 * Get the current state of a named circuit (for monitoring/logging).
 */
export function getCircuitState(name: string): CircuitStats & { name: string } {
  return { name, ...getCircuit(name) }
}

/**
 * Manually reset a circuit to CLOSED state (for admin operations or testing).
 */
export function resetCircuit(name: string): void {
  circuits.delete(name)
}

/**
 * Get all circuit states (for health endpoint or monitoring).
 */
export function getAllCircuits(): Array<CircuitStats & { name: string }> {
  return Array.from(circuits.entries()).map(([name, stats]) => ({ name, ...stats }))
}

/**
 * Error thrown when a circuit is OPEN (service is considered down).
 */
export class CircuitOpenError extends Error {
  readonly name = 'CircuitOpenError'
  readonly circuit: string
  readonly retryAfterSec: number

  constructor(circuit: string, retryAfterSec: number) {
    super(`Circuit '${circuit}' is OPEN — service unavailable. Retry in ~${retryAfterSec}s.`)
    this.circuit = circuit
    this.retryAfterSec = retryAfterSec
  }
}
