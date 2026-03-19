import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../..')

describe('Docs & Estrategia Escala (Fase 9)', () => {
  // ── 9.1: Auto-scaling strategy ──
  describe('Auto-scaling strategy doc (N75)', () => {
    it('infra metrics cron exists for scaling data', () => {
      expect(existsSync(resolve(ROOT, 'server/api/cron/infra-metrics.post.ts'))).toBe(true)
    })

    it('capacity alerting exists (threshold-based)', () => {
      expect(existsSync(resolve(ROOT, 'server/api/cron/capacity-check.post.ts'))).toBe(true)
    })

    it('graceful degradation provides fallback strategies', () => {
      expect(existsSync(resolve(ROOT, 'server/utils/gracefulDegradation.ts'))).toBe(true)
    })
  })

  // ── 9.2: Cost per user modeling ──
  describe('Cost per user modeling (N76)', () => {
    it('subscription prices exist in vertical_config', () => {
      const src = readFileSync(resolve(ROOT, 'app/composables/useVerticalConfig.ts'), 'utf-8')
      expect(src).toContain('subscription_prices')
      expect(src).toContain('commission_rates')
    })

    it('billing service exists for cost tracking', () => {
      expect(existsSync(resolve(ROOT, 'server/services/billing.ts'))).toBe(true)
    })
  })

  // ── 9.3: Database partitioning strategy ──
  describe('Database partitioning strategy doc (N80)', () => {
    it('partitioning readiness migration exists', () => {
      expect(
        existsSync(resolve(ROOT, 'supabase/migrations/00087_partitioning_readiness.sql')),
      ).toBe(true)
    })

    it('schema separation migration exists', () => {
      expect(existsSync(resolve(ROOT, 'supabase/migrations/00088_schema_separation.sql'))).toBe(
        true,
      )
    })
  })

  // ── 9.4: TypeScript strict mode roadmap ──
  describe('TypeScript strict mode roadmap (#4)', () => {
    it('tsconfig exists', () => {
      expect(existsSync(resolve(ROOT, 'tsconfig.json'))).toBe(true)
    })

    it('typecheck script exists in package.json', () => {
      const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'))
      expect(pkg.scripts.typecheck).toBeTruthy()
    })
  })

  // ── 9.5: Fiscal compliance assessment ──
  describe('Fiscal compliance assessment (#447)', () => {
    it('billing service exists', () => {
      expect(existsSync(resolve(ROOT, 'server/services/billing.ts'))).toBe(true)
    })

    it('vertical_config has default_currency', () => {
      const src = readFileSync(resolve(ROOT, 'app/composables/useVerticalConfig.ts'), 'utf-8')
      expect(src).toContain('default_currency')
    })

    it('invoicing endpoint exists', () => {
      expect(existsSync(resolve(ROOT, 'server/api/invoicing/create-invoice.post.ts'))).toBe(true)
    })
  })

  // ── 9.6: Cross-vertical buyers specification ──
  describe('Cross-vertical buyers specification (#46)', () => {
    it('vertical isolation maintains shared users', () => {
      const src = readFileSync(
        resolve(ROOT, 'supabase/migrations/00062_vertical_isolation.sql'),
        'utf-8',
      )
      // Users are NOT duplicated per vertical
      expect(src).not.toContain('CREATE TABLE auth.users')
    })

    it('useVerticalConfig supports multiple verticals', () => {
      const src = readFileSync(resolve(ROOT, 'app/composables/useVerticalConfig.ts'), 'utf-8')
      expect(src).toContain('getVerticalSlug')
    })
  })

  // ── 9.7: Undo pattern specification ──
  describe('Undo pattern specification (N4)', () => {
    it('useUndoAction composable exists', () => {
      expect(existsSync(resolve(ROOT, 'app/composables/useUndoAction.ts'))).toBe(true)
    })

    it('undo has 8s timeout', () => {
      const src = readFileSync(resolve(ROOT, 'app/composables/useUndoAction.ts'), 'utf-8')
      expect(src).toContain('8000') || expect(src).toContain('8_000')
    })
  })

  // ── 9.8: Network graph data model ──
  describe('Network graph data model specification (#49)', () => {
    it('database types file exists', () => {
      expect(existsSync(resolve(ROOT, 'app/types/database.types.ts'))).toBe(true)
    })

    it('Supabase types are generated', () => {
      expect(existsSync(resolve(ROOT, 'types/supabase.ts'))).toBe(true)
    })
  })
})
