/**
 * Tests for server/utils/circuitBreaker.ts
 * Covers: state transitions (CLOSED → OPEN → HALF_OPEN → CLOSED), probe recovery,
 * error propagation, manual reset, and monitoring helpers.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  callWithCircuitBreaker,
  getCircuitState,
  resetCircuit,
  getAllCircuits,
  CircuitOpenError,
} from '../../../server/utils/circuitBreaker'

function makeSuccess<T>(value: T) {
  return () => Promise.resolve(value)
}

function makeFailure(message = 'service error') {
  return () => Promise.reject(new Error(message))
}

describe('circuitBreaker', () => {
  beforeEach(() => {
    // Reset all circuits between tests
    resetCircuit('test-service')
    resetCircuit('ai')
    resetCircuit('stripe')
  })

  // ── CLOSED state ────────────────────────────────────────────────────────────

  describe('CLOSED state', () => {
    it('calls fn and returns result when circuit is closed', async () => {
      const result = await callWithCircuitBreaker('test-service', makeSuccess('ok'))
      expect(result).toBe('ok')
    })

    it('re-throws errors when fn fails (circuit still CLOSED below threshold)', async () => {
      await expect(
        callWithCircuitBreaker('test-service', makeFailure('boom'), { failureThreshold: 5 }),
      ).rejects.toThrow('boom')
    })

    it('stays CLOSED below failure threshold', async () => {
      for (let i = 0; i < 4; i++) {
        await callWithCircuitBreaker('test-service', makeFailure()).catch(() => {})
      }
      const { state } = getCircuitState('test-service')
      expect(state).toBe('CLOSED')
    })
  })

  // ── OPEN state ──────────────────────────────────────────────────────────────

  describe('OPEN state (tripped)', () => {
    async function tripCircuit(name = 'test-service', threshold = 5) {
      for (let i = 0; i < threshold; i++) {
        await callWithCircuitBreaker(name, makeFailure(), { failureThreshold: threshold }).catch(
          () => {},
        )
      }
    }

    it('trips to OPEN after reaching failure threshold', async () => {
      await tripCircuit()
      const { state } = getCircuitState('test-service')
      expect(state).toBe('OPEN')
    })

    it('throws CircuitOpenError when circuit is OPEN', async () => {
      await tripCircuit()
      await expect(
        callWithCircuitBreaker('test-service', makeSuccess('should not call')),
      ).rejects.toBeInstanceOf(CircuitOpenError)
    })

    it('CircuitOpenError has correct circuit name and retryAfterSec', async () => {
      await tripCircuit()
      try {
        await callWithCircuitBreaker('test-service', makeSuccess('ok'), { cooldownMs: 10_000 })
        expect.fail('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(CircuitOpenError)
        expect((err as CircuitOpenError).circuit).toBe('test-service')
        expect((err as CircuitOpenError).retryAfterSec).toBeGreaterThan(0)
      }
    })

    it('does NOT call fn when circuit is OPEN', async () => {
      await tripCircuit()
      const fn = vi.fn().mockResolvedValue('result')
      await callWithCircuitBreaker('test-service', fn).catch(() => {})
      expect(fn).not.toHaveBeenCalled()
    })

    it('trips immediately on first failure when threshold=1', async () => {
      await callWithCircuitBreaker('test-service', makeFailure(), {
        failureThreshold: 1,
      }).catch(() => {})
      const { state } = getCircuitState('test-service')
      expect(state).toBe('OPEN')
    })
  })

  // ── HALF_OPEN / Recovery ────────────────────────────────────────────────────

  describe('HALF_OPEN state (probe recovery)', () => {
    it('transitions to HALF_OPEN after cooldown', async () => {
      // Trip with threshold=1, cooldown=0 (immediate recovery eligibility)
      await callWithCircuitBreaker('test-service', makeFailure(), {
        failureThreshold: 1,
        cooldownMs: 0,
      }).catch(() => {})

      expect(getCircuitState('test-service').state).toBe('OPEN')

      // After cooldown=0 elapsed, a new call should probe (HALF_OPEN → check)
      // The probe succeeds → CLOSED
      const result = await callWithCircuitBreaker('test-service', makeSuccess('recovered'), {
        failureThreshold: 1,
        cooldownMs: 0,
      })
      expect(result).toBe('recovered')
      expect(getCircuitState('test-service').state).toBe('CLOSED')
    })

    it('re-opens circuit if probe fails in HALF_OPEN', async () => {
      // Trip and wait for cooldown
      await callWithCircuitBreaker('test-service', makeFailure(), {
        failureThreshold: 1,
        cooldownMs: 0,
      }).catch(() => {})

      // Probe fails → back to OPEN
      await callWithCircuitBreaker('test-service', makeFailure(), {
        failureThreshold: 1,
        cooldownMs: 0,
      }).catch(() => {})

      expect(getCircuitState('test-service').state).toBe('OPEN')
    })

    it('resets failure count after successful recovery', async () => {
      // Trip and recover
      await callWithCircuitBreaker('test-service', makeFailure(), {
        failureThreshold: 1,
        cooldownMs: 0,
      }).catch(() => {})

      await callWithCircuitBreaker('test-service', makeSuccess('ok'), {
        failureThreshold: 1,
        cooldownMs: 0,
      })

      const { failures } = getCircuitState('test-service')
      expect(failures).toBe(0)
    })
  })

  // ── Independent circuits ────────────────────────────────────────────────────

  describe('independent circuits', () => {
    it('circuits for different services are independent', async () => {
      // Trip 'ai' circuit
      for (let i = 0; i < 5; i++) {
        await callWithCircuitBreaker('ai', makeFailure()).catch(() => {})
      }

      // 'stripe' circuit should still work
      const result = await callWithCircuitBreaker('stripe', makeSuccess(42))
      expect(result).toBe(42)
      expect(getCircuitState('ai').state).toBe('OPEN')
      expect(getCircuitState('stripe').state).toBe('CLOSED')
    })
  })

  // ── Monitoring helpers ──────────────────────────────────────────────────────

  describe('monitoring helpers', () => {
    it('getCircuitState returns initial CLOSED state for unknown circuit', () => {
      resetCircuit('brand-new')
      const state = getCircuitState('brand-new')
      expect(state.state).toBe('CLOSED')
      expect(state.failures).toBe(0)
      expect(state.lastFailedAt).toBeNull()
    })

    it('getCircuitState includes name field', () => {
      const state = getCircuitState('test-service')
      expect(state.name).toBe('test-service')
    })

    it('getAllCircuits returns all known circuits', async () => {
      await callWithCircuitBreaker('ai', makeSuccess('ok'))
      await callWithCircuitBreaker('stripe', makeSuccess('ok'))
      const all = getAllCircuits()
      const names = all.map((c) => c.name)
      expect(names).toContain('ai')
      expect(names).toContain('stripe')
    })

    it('resetCircuit removes circuit from state', async () => {
      await callWithCircuitBreaker('ai', makeFailure(), { failureThreshold: 1 }).catch(() => {})
      expect(getCircuitState('ai').state).toBe('OPEN')

      resetCircuit('ai')

      // After reset, circuit starts fresh (CLOSED)
      expect(getCircuitState('ai').state).toBe('CLOSED')
    })

    it('records lastFailedAt on failure', async () => {
      const before = Date.now()
      await callWithCircuitBreaker('test-service', makeFailure()).catch(() => {})
      const { lastFailedAt } = getCircuitState('test-service')
      expect(lastFailedAt).toBeGreaterThanOrEqual(before)
    })

    it('records lastSucceededAt on success', async () => {
      const before = Date.now()
      await callWithCircuitBreaker('test-service', makeSuccess('ok'))
      const { lastSucceededAt } = getCircuitState('test-service')
      expect(lastSucceededAt).toBeGreaterThanOrEqual(before)
    })
  })

  // ── CircuitOpenError ────────────────────────────────────────────────────────

  describe('CircuitOpenError', () => {
    it('is an instance of Error', () => {
      const err = new CircuitOpenError('openai', 30)
      expect(err).toBeInstanceOf(Error)
    })

    it('has correct name property', () => {
      const err = new CircuitOpenError('openai', 30)
      expect(err.name).toBe('CircuitOpenError')
    })

    it('has correct message', () => {
      const err = new CircuitOpenError('openai', 30)
      expect(err.message).toContain('openai')
      expect(err.message).toContain('30s')
    })
  })
})
