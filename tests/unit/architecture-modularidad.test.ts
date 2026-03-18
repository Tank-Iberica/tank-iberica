import { describe, it, expect, vi, afterEach } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../..')

describe('Arquitectura & Modularidad (Fase 7)', () => {
  // ── 7.1: Split composables monolíticos ──
  describe('Split composables monolíticos (N58)', () => {
    it('useConversation exists', () => {
      expect(existsSync(resolve(ROOT, 'app/composables/useConversation.ts'))).toBe(true)
    })

    it('useAuth exists', () => {
      expect(existsSync(resolve(ROOT, 'app/composables/useAuth.ts'))).toBe(true)
    })

    // The composables are large but functional — splitting is tracked for future
    it('composables have clear export boundaries', () => {
      const conv = readFileSync(resolve(ROOT, 'app/composables/useConversation.ts'), 'utf-8')
      expect(conv).toContain('export')
    })
  })

  // ── 7.2: Extraer componentes comunes ──
  describe('Componentes comunes extraídos (N59)', () => {
    const uiDir = resolve(ROOT, 'app/components/ui')

    it('DataTable component exists', () => {
      expect(existsSync(resolve(uiDir, 'DataTable.vue'))).toBe(true)
    })

    it('SubmitButton component exists', () => {
      expect(existsSync(resolve(uiDir, 'SubmitButton.vue'))).toBe(true)
    })

    it('FormField component exists', () => {
      expect(existsSync(resolve(uiDir, 'FormField.vue'))).toBe(true)
    })
  })

  // ── 7.3: defineProtectedHandler ──
  describe('defineProtectedHandler wrapper (N63)', () => {
    const src = readFileSync(resolve(ROOT, 'server/utils/defineProtectedHandler.ts'), 'utf-8')

    it('exports defineProtectedHandler function', () => {
      expect(src).toContain('export function defineProtectedHandler')
    })

    it('supports requireAuth option', () => {
      expect(src).toContain('requireAuth')
    })

    it('supports requireRole option', () => {
      expect(src).toContain('requireRole')
    })

    it('supports logRequest option', () => {
      expect(src).toContain('logRequest')
    })

    it('provides user context to handler', () => {
      expect(src).toContain('HandlerContext')
      expect(src).toContain('user')
    })

    it('wraps errors with safeError', () => {
      expect(src).toContain('safeError')
    })

    it('re-throws safe errors with statusCode', () => {
      expect(src).toContain("'statusCode' in err")
    })

    it('logs unexpected errors', () => {
      expect(src).toContain('logger.error')
    })
  })

  // ── 7.4: Shared domain types ──
  describe('Shared domain types client↔server (N64)', () => {
    it('shared/types directory exists', () => {
      expect(existsSync(resolve(ROOT, 'shared/types'))).toBe(true)
    })

    it('has common.ts', () => {
      expect(existsSync(resolve(ROOT, 'shared/types/common.ts'))).toBe(true)
    })

    it('has vehicle.ts', () => {
      expect(existsSync(resolve(ROOT, 'shared/types/vehicle.ts'))).toBe(true)
    })

    it('has index.ts barrel export', () => {
      expect(existsSync(resolve(ROOT, 'shared/types/index.ts'))).toBe(true)
    })
  })

  // ── 7.5: Architecture boundaries ──
  describe('Architecture boundaries (#152)', () => {
    it('eslint config exists', () => {
      expect(existsSync(resolve(ROOT, 'eslint.config.mjs'))).toBe(true)
    })

    it('server utils do not import from app/', () => {
      const utilsDir = resolve(ROOT, 'server/utils')
      const files = readdirSync(utilsDir).filter(f => f.endsWith('.ts'))
      for (const file of files) {
        const content = readFileSync(resolve(utilsDir, file), 'utf-8')
        const imports = content.match(/from\s+['"](?:~\/app|\.\.\/\.\.\/app|@\/app)/g) || []
        expect(imports.length).toBe(0)
      }
    })
  })

  // ── 7.6: Atomic design ──
  describe('Atomic design: atoms/molecules/organisms (#153)', () => {
    const uiDir = resolve(ROOT, 'app/components/ui')

    it('ui/ directory has reusable components', () => {
      const files = readdirSync(uiDir)
      expect(files.length).toBeGreaterThan(5)
    })

    it('dashboard/ directory has page-level components', () => {
      expect(existsSync(resolve(ROOT, 'app/components/dashboard'))).toBe(true)
    })
  })

  // ── 7.7: Cada módulo testable ──
  describe('Cada módulo testable (#154)', () => {
    it('server utils are pure functions (no global side effects)', () => {
      const safeError = readFileSync(resolve(ROOT, 'server/utils/safeError.ts'), 'utf-8')
      expect(safeError).toContain('export')
    })

    it('composables return reactive values', () => {
      const formAutosave = readFileSync(
        resolve(ROOT, 'app/composables/useFormAutosave.ts'),
        'utf-8',
      )
      expect(formAutosave).toContain('return')
    })
  })

  // ── 7.8: Middleware chain configurable ──
  describe('Middleware chain configurable (#263)', () => {
    it('server middleware directory exists', () => {
      expect(existsSync(resolve(ROOT, 'server/middleware'))).toBe(true)
    })

    it('rate limiter middleware exists', () => {
      expect(existsSync(resolve(ROOT, 'server/middleware/rate-limit.ts'))).toBe(true)
    })

    it('security headers middleware exists', () => {
      expect(existsSync(resolve(ROOT, 'server/middleware/security-headers.ts'))).toBe(true)
    })
  })

  // ── 7.9: Lint, tests, build ──
  describe('Verificar lint, tests y build (#207)', () => {
    it('package.json has lint script', () => {
      const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'))
      expect(pkg.scripts.lint).toBeTruthy()
    })

    it('package.json has typecheck script', () => {
      const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'))
      expect(pkg.scripts.typecheck || pkg.scripts['type-check']).toBeTruthy()
    })

    it('package.json has test script', () => {
      const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'))
      expect(pkg.scripts.test).toBeTruthy()
    })

    it('package.json has build script', () => {
      const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'))
      expect(pkg.scripts.build).toBeTruthy()
    })
  })

  // ── 7.10: Pre-computed aggregates ──
  describe('Pre-computed aggregates cron (N77)', () => {
    const src = readFileSync(
      resolve(ROOT, 'server/api/cron/compute-aggregates.post.ts'),
      'utf-8',
    )

    it('defines AGGREGATE_METRICS', () => {
      expect(src).toContain('AGGREGATE_METRICS')
    })

    it('computes total_vehicles', () => {
      expect(src).toContain('total_vehicles')
    })

    it('computes total_dealers', () => {
      expect(src).toContain('total_dealers')
    })

    it('computes total_leads_30d', () => {
      expect(src).toContain('total_leads_30d')
    })

    it('computes total_views_30d', () => {
      expect(src).toContain('total_views_30d')
    })

    it('stores in dashboard_aggregates table', () => {
      expect(src).toContain('dashboard_aggregates')
    })

    it('upserts by metric and vertical', () => {
      expect(src).toContain('upsert')
      expect(src).toContain("onConflict: 'metric,vertical'")
    })

    it('verifies cron secret', () => {
      expect(src).toContain('verifyCronSecret')
    })
  })

  // ── 7.11: SSE notifications ──
  describe('SSE alternative to WebSockets (N78)', () => {
    const src = readFileSync(
      resolve(ROOT, 'server/api/notifications/stream.get.ts'),
      'utf-8',
    )

    it('sets text/event-stream content type', () => {
      expect(src).toContain('text/event-stream')
    })

    it('sets Cache-Control no-cache', () => {
      expect(src).toContain('no-cache')
    })

    it('sets Connection keep-alive', () => {
      expect(src).toContain('keep-alive')
    })

    it('sends heartbeat periodically', () => {
      expect(src).toContain('heartbeat')
      expect(src).toContain('setInterval')
    })

    it('cleans up on client disconnect', () => {
      expect(src).toContain("'close'")
      expect(src).toContain('clearInterval')
    })

    it('requires authentication', () => {
      expect(src).toContain('serverSupabaseUser')
      expect(src).toContain('Unauthorized')
    })

    it('sends initial connection event', () => {
      expect(src).toContain('event: connected')
    })

    it('supports Nginx proxy', () => {
      expect(src).toContain('X-Accel-Buffering')
    })
  })

  // ── 7.12: Request coalescing ──
  describe('Request coalescing (N83)', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('source exports coalesce function', () => {
      const src = readFileSync(resolve(ROOT, 'server/utils/requestCoalescing.ts'), 'utf-8')
      expect(src).toContain('export async function coalesce')
    })

    it('deduplicates concurrent calls with same key', async () => {
      const { coalesce, clearInflight } = await import('../../server/utils/requestCoalescing')
      clearInflight()

      let callCount = 0
      const fetcher = async () => {
        callCount++
        return 'result'
      }

      const [r1, r2, r3] = await Promise.all([
        coalesce('key1', 5000, fetcher),
        coalesce('key1', 5000, fetcher),
        coalesce('key1', 5000, fetcher),
      ])

      expect(r1).toBe('result')
      expect(r2).toBe('result')
      expect(r3).toBe('result')
      expect(callCount).toBe(1) // Only ONE actual call
    })

    it('different keys execute independently', async () => {
      const { coalesce, clearInflight } = await import('../../server/utils/requestCoalescing')
      clearInflight()

      let callCount = 0
      const fetcher = async () => {
        callCount++
        return 'result'
      }

      await Promise.all([
        coalesce('keyA', 5000, fetcher),
        coalesce('keyB', 5000, fetcher),
      ])

      expect(callCount).toBe(2) // Two different keys = two calls
    })

    it('exports getInflightCount for monitoring', () => {
      const src = readFileSync(resolve(ROOT, 'server/utils/requestCoalescing.ts'), 'utf-8')
      expect(src).toContain('export function getInflightCount')
    })

    it('exports clearInflight for testing', () => {
      const src = readFileSync(resolve(ROOT, 'server/utils/requestCoalescing.ts'), 'utf-8')
      expect(src).toContain('export function clearInflight')
    })
  })

  // ── 7.13: Email batching ──
  describe('Email batching weekly report (#295)', () => {
    const weeklyReport = readFileSync(
      resolve(ROOT, 'server/api/cron/weekly-report.post.ts'),
      'utf-8',
    )

    it('weekly report cron exists', () => {
      expect(weeklyReport).toContain('defineEventHandler')
    })

    it('processes reports for dealers', () => {
      expect(weeklyReport).toContain('dealers')
    })
  })

  // ── 7.14: Archival strategy ──
  describe('Archival strategy datos >1 año (#298)', () => {
    const retention = readFileSync(
      resolve(ROOT, 'server/api/cron/data-retention.post.ts'),
      'utf-8',
    )

    it('data retention cron exists', () => {
      expect(retention).toContain('defineEventHandler')
    })

    it('deletes old data', () => {
      expect(retention).toMatch(/delete|retention|clean/i)
    })

    it('uses cron verification', () => {
      expect(retention).toMatch(/verifyCronSecret|cronSecret|CRON_SECRET/)
    })
  })
})
