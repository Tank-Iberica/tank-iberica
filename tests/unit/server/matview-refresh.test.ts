import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const SRC = readFileSync(resolve(ROOT, 'server/api/cron/refresh-matviews.post.ts'), 'utf-8')

describe('Materialized views refresh schedule (#144)', () => {
  describe('Cron endpoint structure', () => {
    it('is a POST endpoint (cron-triggered)', () => {
      expect(SRC).toContain('defineEventHandler')
    })

    it('requires CRON_SECRET auth', () => {
      expect(SRC).toContain('verifyCronSecret')
    })

    it('defines MATVIEWS list', () => {
      expect(SRC).toContain('MATVIEWS')
    })

    it('refreshes mv_dashboard_kpis', () => {
      expect(SRC).toContain('mv_dashboard_kpis')
    })

    it('refreshes mv_search_facets', () => {
      expect(SRC).toContain('mv_search_facets')
    })
  })

  describe('Refresh mechanics', () => {
    it('uses RPC to refresh views', () => {
      expect(SRC).toContain(".rpc('refresh_matview'")
    })

    it('passes view_name parameter', () => {
      expect(SRC).toContain('view_name: view')
    })

    it('iterates over all matviews', () => {
      expect(SRC).toContain('for (const view of MATVIEWS)')
    })

    it('tracks duration per view', () => {
      expect(SRC).toContain('Date.now()')
      expect(SRC).toContain('ms')
    })
  })

  describe('Error handling', () => {
    it('logs errors per view', () => {
      expect(SRC).toContain("results[view] = 'error'")
      expect(SRC).toContain('logger.error')
    })

    it('counts failed refreshes', () => {
      expect(SRC).toContain('failed')
      expect(SRC).toContain("r === 'error'")
    })

    it('returns ok: false when any view fails', () => {
      expect(SRC).toContain('ok: failed === 0')
    })
  })

  describe('Response shape', () => {
    it('returns results per view', () => {
      expect(SRC).toContain('results')
    })

    it('returns total duration', () => {
      expect(SRC).toContain('durationMs')
    })

    it('returns failed count', () => {
      expect(SRC).toContain('failed')
    })
  })

  describe('Migration for matviews', () => {
    const migrationsDir = resolve(ROOT, 'supabase/migrations')
    const migrationFiles = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'))
    const allMigrations = migrationFiles
      .map((f) => readFileSync(resolve(migrationsDir, f), 'utf-8'))
      .join('\n')

    it('refresh_matview SQL function exists', () => {
      expect(allMigrations).toContain('refresh_matview')
    })
  })
})
