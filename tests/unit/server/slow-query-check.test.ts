import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const SRC = readFileSync(resolve(ROOT, 'server/api/cron/slow-query-check.post.ts'), 'utf-8')

describe('EXPLAIN ANALYZE / slow query optimization (#137)', () => {
  describe('Thresholds', () => {
    it('defines SLOW_THRESHOLD_MS at 500ms', () => {
      expect(SRC).toContain('SLOW_THRESHOLD_MS = 500')
    })

    it('defines ALERT_THRESHOLD_MS at 2000ms', () => {
      expect(SRC).toContain('ALERT_THRESHOLD_MS = 2000')
    })
  })

  describe('Query capture', () => {
    it('uses get_slow_queries RPC', () => {
      expect(SRC).toContain(".rpc('get_slow_queries'")
    })

    it('passes threshold as parameter', () => {
      expect(SRC).toContain('p_threshold_ms')
    })

    it('captures query_hash, query_text, calls, exec times', () => {
      expect(SRC).toContain('query_hash')
      expect(SRC).toContain('query_text')
      expect(SRC).toContain('calls')
      expect(SRC).toContain('mean_exec_ms')
      expect(SRC).toContain('max_exec_ms')
      expect(SRC).toContain('total_exec_ms')
    })

    it('tracks rows_per_call', () => {
      expect(SRC).toContain('rows_per_call')
    })
  })

  describe('Storage', () => {
    it('stores in slow_query_logs table', () => {
      expect(SRC).toContain("from('slow_query_logs')")
    })

    it('uses upsert to avoid duplicates', () => {
      expect(SRC).toContain('.upsert(')
      expect(SRC).toContain('ignoreDuplicates')
    })

    it('includes vertical field', () => {
      expect(SRC).toContain('vertical')
    })
  })

  describe('Alerting', () => {
    it('alerts on queries exceeding ALERT_THRESHOLD_MS', () => {
      expect(SRC).toContain('ALERT_THRESHOLD_MS')
      expect(SRC).toContain('SLOW QUERY ALERT')
    })

    it('logs query text (truncated to 200 chars)', () => {
      expect(SRC).toContain('substring(0, 200)')
    })

    it('uses logger.warn for slow query alerts', () => {
      expect(SRC).toContain('logger.warn')
    })
  })

  describe('Auth & error handling', () => {
    it('requires CRON_SECRET', () => {
      expect(SRC).toContain('verifyCronSecret')
    })

    it('handles RPC failure gracefully', () => {
      expect(SRC).toContain('RPC failed')
      expect(SRC).toContain("ok: false")
    })

    it('handles insert failure gracefully', () => {
      expect(SRC).toContain('Insert failed')
    })
  })

  describe('Response shape', () => {
    it('returns captured count', () => {
      expect(SRC).toContain('captured: slowQueries.length')
    })

    it('returns alerted count', () => {
      expect(SRC).toContain('alerted: alerted.length')
    })
  })
})
