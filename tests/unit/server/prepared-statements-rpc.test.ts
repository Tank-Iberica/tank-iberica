import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')

describe('Prepared statements via RPCs (#245)', () => {
  describe('Top queries use RPCs', () => {
    it('search_vehicles uses RPC (not inline query)', () => {
      const src = readFileSync(resolve(ROOT, 'server/api/search.get.ts'), 'utf-8')
      expect(src).toContain(".rpc('search_vehicles'")
    })

    it('dealer dashboard stats uses RPC', () => {
      const src = readFileSync(resolve(ROOT, 'app/composables/useDealerDashboard.ts'), 'utf-8')
      expect(src).toContain(".rpc('get_dealer_dashboard_stats'")
    })

    it('dealer top vehicles uses RPC', () => {
      const src = readFileSync(resolve(ROOT, 'app/composables/useDealerDashboard.ts'), 'utf-8')
      expect(src).toContain(".rpc('get_dealer_top_vehicles'")
    })

    it('dealer rating summary uses RPC', () => {
      const src = readFileSync(resolve(ROOT, 'app/components/DealerPortal.vue'), 'utf-8')
      expect(src).toContain(".rpc('get_dealer_rating_summary'")
    })

    it('RBAC permission check uses RPC', () => {
      const src = readFileSync(resolve(ROOT, 'server/utils/rbac.ts'), 'utf-8')
      expect(src).toContain(".rpc('has_permission'")
    })

    it('fingerprint upsert uses RPC', () => {
      const src = readFileSync(resolve(ROOT, 'server/utils/recordFingerprint.ts'), 'utf-8')
      expect(src).toContain(".rpc('upsert_user_fingerprint'")
    })
  })

  describe('Admin/cron operations use RPCs', () => {
    it('slow query check uses RPC', () => {
      const src = readFileSync(resolve(ROOT, 'server/api/cron/slow-query-check.post.ts'), 'utf-8')
      expect(src).toContain(".rpc('get_slow_queries'")
    })

    it('materialized view refresh uses RPC', () => {
      const src = readFileSync(resolve(ROOT, 'server/api/cron/refresh-matviews.post.ts'), 'utf-8')
      expect(src).toContain(".rpc('refresh_matview'")
    })

    it('capacity check uses RPC for DB size', () => {
      const src = readFileSync(resolve(ROOT, 'server/api/cron/capacity-check.post.ts'), 'utf-8')
      expect(src).toContain(".rpc('get_db_size_bytes'")
    })

    it('capacity check uses RPC for active connections', () => {
      const src = readFileSync(resolve(ROOT, 'server/api/cron/capacity-check.post.ts'), 'utf-8')
      expect(src).toContain(".rpc('get_active_connections'")
    })

    it('onboarding velocity uses RPC', () => {
      const src = readFileSync(resolve(ROOT, 'server/api/admin/onboarding-velocity.get.ts'), 'utf-8')
      expect(src).toContain(".rpc('calculate_onboarding_velocity'")
    })
  })

  describe('SQL functions exist in migrations', () => {
    const migrationsDir = resolve(ROOT, 'supabase/migrations')
    const migrationFiles = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'))
    const allMigrations = migrationFiles
      .map((f) => readFileSync(resolve(migrationsDir, f), 'utf-8'))
      .join('\n')

    it('has_permission function exists', () => {
      expect(allMigrations).toContain('has_permission')
    })

    it('is_admin function exists', () => {
      expect(allMigrations).toContain('is_admin')
    })

    it('update_updated_at function exists', () => {
      expect(allMigrations).toContain('update_updated_at')
    })

    it('total SQL functions count > 10', () => {
      const functionCount = (allMigrations.match(/CREATE\s+(OR\s+REPLACE\s+)?FUNCTION/gi) || []).length
      expect(functionCount).toBeGreaterThan(10)
    })
  })
})
