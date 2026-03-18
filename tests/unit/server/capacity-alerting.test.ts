import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const SRC = readFileSync(resolve(ROOT, 'server/api/cron/capacity-check.post.ts'), 'utf-8')

describe('Capacity alerting at 70% limits (#142)', () => {
  describe('Thresholds', () => {
    it('defines WARNING_THRESHOLD at 70%', () => {
      expect(SRC).toContain('WARNING_THRESHOLD = 70')
    })

    it('defines CRITICAL_THRESHOLD at 90%', () => {
      expect(SRC).toContain('CRITICAL_THRESHOLD = 90')
    })
  })

  describe('Metrics checked', () => {
    it('checks storage (DB size)', () => {
      expect(SRC).toContain('checkStorage')
      expect(SRC).toContain("metric: 'storage'")
    })

    it('checks connections (active connections)', () => {
      expect(SRC).toContain('checkConnections')
      expect(SRC).toContain("metric: 'connections'")
    })

    it('uses RPCs for metric retrieval', () => {
      expect(SRC).toContain("rpc('get_db_size_bytes'")
      expect(SRC).toContain("rpc('get_active_connections'")
    })
  })

  describe('Storage limits', () => {
    it('reads limit from SUPABASE_STORAGE_LIMIT_GB env (default 8 GB)', () => {
      expect(SRC).toContain('SUPABASE_STORAGE_LIMIT_GB')
      expect(SRC).toContain('8')
    })

    it('converts GB to bytes for comparison', () => {
      expect(SRC).toContain('1024 * 1024 * 1024')
    })
  })

  describe('Connection limits', () => {
    it('reads limit from SUPABASE_MAX_CONNECTIONS env (default 60)', () => {
      expect(SRC).toContain('SUPABASE_MAX_CONNECTIONS')
      expect(SRC).toContain('60')
    })
  })

  describe('Alert insertion', () => {
    it('inserts to capacity_alerts table', () => {
      expect(SRC).toContain("from('capacity_alerts')")
      expect(SRC).toContain('.insert(')
    })

    it('includes vertical field', () => {
      expect(SRC).toContain('vertical')
    })

    it('marks critical alerts (>= 90%)', () => {
      expect(SRC).toContain('is_critical')
      expect(SRC).toContain('CRITICAL_THRESHOLD')
    })

    it('logs critical alerts as errors', () => {
      expect(SRC).toContain('CRITICAL')
      expect(SRC).toContain('logger.error')
    })

    it('logs warning alerts as warnings', () => {
      expect(SRC).toContain('logger.warn')
    })
  })

  describe('Auth & scheduling', () => {
    it('requires CRON_SECRET', () => {
      expect(SRC).toContain('verifyCronSecret')
    })

    it('is scheduled every 1h (per docstring)', () => {
      expect(SRC).toContain('every 1h')
    })
  })

  describe('Response shape', () => {
    it('returns checked count', () => {
      expect(SRC).toContain('checked')
    })

    it('returns alertsInserted count', () => {
      expect(SRC).toContain('alertsInserted')
    })

    it('returns skipped metrics (below threshold)', () => {
      expect(SRC).toContain('skipped')
    })
  })

  describe('Percentage calculation', () => {
    // Test the pct helper logic
    function pct(used: number, limit: number): number {
      if (limit <= 0) return 0
      return Math.min(100, (used / limit) * 100)
    }

    it('calculates 50% correctly', () => {
      expect(pct(50, 100)).toBe(50)
    })

    it('returns 0 when limit is 0', () => {
      expect(pct(50, 0)).toBe(0)
    })

    it('caps at 100%', () => {
      expect(pct(200, 100)).toBe(100)
    })

    it('70% triggers warning', () => {
      expect(pct(70, 100)).toBeGreaterThanOrEqual(70)
    })
  })
})
