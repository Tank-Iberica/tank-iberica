import { describe, it, expect, beforeEach } from 'vitest'
import {
  recordLatency,
  getEndpointMetrics,
  getAllEndpointMetrics,
  getTopSlowest,
  getGlobalMetrics,
  resetMetrics,
} from '../../../server/utils/latencyMetrics'

describe('Latency Metrics Store (#140 — per-endpoint p50/p95/p99)', () => {
  beforeEach(() => {
    resetMetrics()
  })

  describe('recordLatency', () => {
    it('records and retrieves metrics for an endpoint', () => {
      recordLatency('/api/vehicles', 50)
      recordLatency('/api/vehicles', 100)
      recordLatency('/api/vehicles', 200)

      const metrics = getEndpointMetrics('/api/vehicles')
      expect(metrics).not.toBeNull()
      expect(metrics!.count).toBe(3)
      expect(metrics!.min).toBe(50)
      expect(metrics!.max).toBe(200)
    })

    it('normalizes dynamic path segments (numeric IDs)', () => {
      recordLatency('/api/vehicles/123', 50)
      recordLatency('/api/vehicles/456', 100)

      const metrics = getEndpointMetrics('/api/vehicles/:id')
      expect(metrics).not.toBeNull()
      expect(metrics!.count).toBe(2)
    })

    it('normalizes UUIDs in paths', () => {
      recordLatency('/api/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890', 50)
      recordLatency('/api/users/deadbeef-1234-5678-abcd-ef1234567890', 100)

      const metrics = getEndpointMetrics('/api/users/:uuid')
      expect(metrics).not.toBeNull()
      expect(metrics!.count).toBe(2)
    })

    it('strips query parameters', () => {
      recordLatency('/api/vehicles?page=1&limit=20', 50)
      recordLatency('/api/vehicles?page=2', 100)

      const metrics = getEndpointMetrics('/api/vehicles')
      expect(metrics).not.toBeNull()
      expect(metrics!.count).toBe(2)
    })

    it('tracks error count', () => {
      recordLatency('/api/test', 50, false)
      recordLatency('/api/test', 500, true)
      recordLatency('/api/test', 100, false)

      const metrics = getEndpointMetrics('/api/test')
      expect(metrics!.errors).toBe(1)
      expect(metrics!.errorRate).toBeCloseTo(1 / 3)
    })
  })

  describe('percentile calculations', () => {
    it('calculates p50/p95/p99 correctly', () => {
      // Generate 100 durations: 1ms, 2ms, ..., 100ms
      for (let i = 1; i <= 100; i++) {
        recordLatency('/api/test', i)
      }

      const metrics = getEndpointMetrics('/api/test')!
      expect(metrics.p50).toBe(50)
      expect(metrics.p95).toBe(95)
      expect(metrics.p99).toBe(99)
      expect(metrics.avg).toBe(51) // Math.round(5050/100) = 51
      expect(metrics.min).toBe(1)
      expect(metrics.max).toBe(100)
    })

    it('handles single request', () => {
      recordLatency('/api/single', 42)

      const metrics = getEndpointMetrics('/api/single')!
      expect(metrics.p50).toBe(42)
      expect(metrics.p95).toBe(42)
      expect(metrics.p99).toBe(42)
      expect(metrics.count).toBe(1)
    })
  })

  describe('getAllEndpointMetrics', () => {
    it('returns all endpoints sorted by p95 descending', () => {
      recordLatency('/api/fast', 10)
      recordLatency('/api/slow', 500)
      recordLatency('/api/medium', 100)

      const all = getAllEndpointMetrics()
      expect(all.length).toBe(3)
      expect(all[0].path).toBe('/api/slow')
      expect(all[2].path).toBe('/api/fast')
    })
  })

  describe('getTopSlowest', () => {
    it('returns top N slowest endpoints', () => {
      for (let i = 0; i < 5; i++) {
        recordLatency(`/api/endpoint-${i}`, (i + 1) * 100)
      }

      const top3 = getTopSlowest(3)
      expect(top3.length).toBe(3)
      expect(top3[0].p95).toBeGreaterThanOrEqual(top3[1].p95)
      expect(top3[1].p95).toBeGreaterThanOrEqual(top3[2].p95)
    })
  })

  describe('getGlobalMetrics', () => {
    it('aggregates across all endpoints', () => {
      recordLatency('/api/a', 10)
      recordLatency('/api/b', 20)
      recordLatency('/api/c', 30, true)

      const global = getGlobalMetrics()
      expect(global.count).toBe(3)
      expect(global.errors).toBe(1)
      expect(global.endpointsTracked).toBe(3)
      expect(global.min).toBe(10)
      expect(global.max).toBe(30)
    })

    it('returns zeros when no data', () => {
      const global = getGlobalMetrics()
      expect(global.count).toBe(0)
      expect(global.endpointsTracked).toBe(0)
      expect(global.p50).toBe(0)
    })
  })

  describe('resetMetrics', () => {
    it('clears all stored data', () => {
      recordLatency('/api/test', 50)
      expect(getEndpointMetrics('/api/test')).not.toBeNull()

      resetMetrics()
      expect(getEndpointMetrics('/api/test')).toBeNull()
      expect(getGlobalMetrics().endpointsTracked).toBe(0)
    })
  })

  describe('circular buffer', () => {
    it('limits entries per endpoint (does not grow unbounded)', () => {
      // Record more than MAX_ENTRIES_PER_ENDPOINT (1000)
      for (let i = 0; i < 1500; i++) {
        recordLatency('/api/buffer-test', i)
      }

      const metrics = getEndpointMetrics('/api/buffer-test')!
      expect(metrics.count).toBe(1500) // total count tracks all
      // But the internal buffer stays bounded — verified by memory not blowing up
      // The min should be from the last 1000 entries (500-1499), not 0
      expect(metrics.min).toBeGreaterThanOrEqual(500)
    })
  })
})
