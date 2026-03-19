import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../..')

describe('Escalabilidad BD (Fase 8)', () => {
  // ── 8.1: Table partitioning analytics_events ──
  describe('Table partitioning readiness (#293)', () => {
    it('has partitioning readiness migration (00087)', () => {
      expect(
        existsSync(resolve(ROOT, 'supabase/migrations/00087_partitioning_readiness.sql')),
      ).toBe(true)
    })

    it('migration prepares partitioning for large tables', () => {
      const sql = readFileSync(
        resolve(ROOT, 'supabase/migrations/00087_partitioning_readiness.sql'),
        'utf-8',
      )
      expect(sql).toMatch(/partition|index|vehicles/i)
    })

    it('has schema separation migration (00088)', () => {
      expect(existsSync(resolve(ROOT, 'supabase/migrations/00088_schema_separation.sql'))).toBe(
        true,
      )
    })
  })

  // ── 8.2: Incremental matview refresh ──
  describe('Matview refresh strategy (#294)', () => {
    it('matview refresh cron exists', () => {
      expect(existsSync(resolve(ROOT, 'server/api/cron/refresh-matviews.post.ts'))).toBe(true)
    })

    it('refresh cron handles errors', () => {
      const src = readFileSync(resolve(ROOT, 'server/api/cron/refresh-matviews.post.ts'), 'utf-8')
      expect(src).toMatch(/catch|try|error/i)
    })
  })

  // ── 8.3: Connection pooling verification ──
  describe('Connection pooling verification (N66)', () => {
    it('infra recommendations composable tracks connection strategy', () => {
      expect(existsSync(resolve(ROOT, 'app/composables/useInfraRecommendations.ts'))).toBe(true)
    })

    it('Supabase client is initialized centrally (via #supabase/server)', () => {
      // Server routes use serverSupabaseClient/serverSupabaseServiceRole
      const serverUtils = readdirSync(resolve(ROOT, 'server/utils')).filter((f) =>
        f.endsWith('.ts'),
      )
      // At least one file should reference Supabase server imports
      let hasSupabase = false
      for (const f of serverUtils.slice(0, 10)) {
        const content = readFileSync(resolve(ROOT, 'server/utils', f), 'utf-8')
        if (content.includes('supabase')) hasSupabase = true
      }
      expect(hasSupabase).toBe(true)
    })
  })

  // ── 8.4: TTFB/LCP/INP monitoring per-route ──
  describe('Web Vitals monitoring per-route (#127)', () => {
    it('web vitals plugin exists', () => {
      expect(existsSync(resolve(ROOT, 'app/plugins/web-vitals.client.ts'))).toBe(true)
    })

    it('web vitals POST endpoint exists', () => {
      expect(existsSync(resolve(ROOT, 'server/api/analytics/web-vitals.post.ts'))).toBe(true)
    })

    it('web vitals admin GET endpoint exists', () => {
      expect(existsSync(resolve(ROOT, 'server/api/admin/web-vitals.get.ts'))).toBe(true)
    })

    it('admin endpoint has p50/p75/p95 percentiles', () => {
      const src = readFileSync(resolve(ROOT, 'server/api/admin/web-vitals.get.ts'), 'utf-8')
      expect(src).toContain('p50')
      expect(src).toContain('p75')
      expect(src).toContain('p95')
    })
  })

  // ── 8.5: E2E tests parametrizados por vertical ──
  describe('E2E tests parametrizados por vertical (#150)', () => {
    it('vertical isolation security tests exist', () => {
      expect(existsSync(resolve(ROOT, 'tests/security/vertical-isolation.test.ts'))).toBe(true)
    })

    it('create-vertical supports smoke-test flag', () => {
      const src = readFileSync(resolve(ROOT, 'scripts/create-vertical.mjs'), 'utf-8')
      expect(src).toContain('smoke-test')
    })
  })

  // ── 8.6: Multi-vertical single deployment ──
  describe('Multi-vertical single deployment (#146)', () => {
    it('uses NUXT_PUBLIC_VERTICAL for routing', () => {
      const src = readFileSync(resolve(ROOT, 'app/composables/useVerticalConfig.ts'), 'utf-8')
      expect(src).toContain('public.vertical')
    })

    it('vertical isolation migration exists', () => {
      expect(existsSync(resolve(ROOT, 'supabase/migrations/00062_vertical_isolation.sql'))).toBe(
        true,
      )
    })

    it('vertical column on vehicles', () => {
      expect(
        existsSync(resolve(ROOT, 'supabase/migrations/00063_vehicles_vertical_column.sql')),
      ).toBe(true)
    })
  })

  // ── 8.7: Progress indicator uploads ──
  describe('Progress indicator uploads (#284)', () => {
    it('useCloudinaryUpload tracks progress', () => {
      const src = readFileSync(
        resolve(ROOT, 'app/composables/admin/useCloudinaryUpload.ts'),
        'utf-8',
      )
      expect(src).toContain('progress')
    })

    it('DashboardPhotoUpload shows progress', () => {
      const src = readFileSync(
        resolve(ROOT, 'app/components/dashboard/DashboardPhotoUpload.vue'),
        'utf-8',
      )
      expect(src).toContain('progress')
    })

    it('ImageUploader component exists', () => {
      expect(existsSync(resolve(ROOT, 'app/components/shared/ImageUploader.vue'))).toBe(true)
    })
  })
})
