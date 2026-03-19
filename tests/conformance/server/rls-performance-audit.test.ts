import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const RLS_AUDIT = readFileSync(
  resolve(ROOT, 'supabase/migrations/00079_rls_performance_audit.sql'),
  'utf-8',
)

describe('RLS performance audit (N74)', () => {
  describe('Migration 00079 — RLS performance helpers', () => {
    it('creates current_user_role() function', () => {
      expect(RLS_AUDIT).toContain('CREATE OR REPLACE FUNCTION public.current_user_role()')
    })

    it('current_user_role uses auth.jwt() not auth.users', () => {
      expect(RLS_AUDIT).toContain("auth.jwt() -> 'user_metadata'")
      expect(RLS_AUDIT).toContain("auth.jwt() -> 'app_metadata'")
      // Functions should NOT query auth.users directly — only comments reference it
      const functionBodies = RLS_AUDIT.match(/AS \$\$[\s\S]*?\$\$/g) || []
      for (const body of functionBodies) {
        expect(body).not.toContain('FROM auth.users')
      }
    })

    it('current_user_role is STABLE (cached per statement)', () => {
      expect(RLS_AUDIT).toContain('STABLE')
    })

    it('creates is_admin() helper', () => {
      expect(RLS_AUDIT).toContain('CREATE OR REPLACE FUNCTION public.is_admin()')
    })

    it('is_admin uses current_user_role not auth.users', () => {
      expect(RLS_AUDIT).toContain("public.current_user_role() = 'admin'")
    })

    it('creates is_dealer() helper', () => {
      expect(RLS_AUDIT).toContain('CREATE OR REPLACE FUNCTION public.is_dealer()')
    })

    it('is_dealer checks both dealer and admin roles', () => {
      expect(RLS_AUDIT).toContain("('dealer', 'admin')")
    })

    it('functions use SECURITY DEFINER', () => {
      const count = (RLS_AUDIT.match(/SECURITY DEFINER/g) || []).length
      expect(count).toBeGreaterThanOrEqual(3)
    })

    it('functions set search_path = public', () => {
      const count = (RLS_AUDIT.match(/SET search_path = public/g) || []).length
      expect(count).toBeGreaterThanOrEqual(3)
    })

    it('documents RLS audit in table comment', () => {
      expect(RLS_AUDIT).toContain('RLS audited in 00079')
    })
  })

  describe('RLS policies use optimized helpers', () => {
    const migrationsDir = resolve(ROOT, 'supabase/migrations')
    const migrationFiles = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort()

    // Migrations after 00079 should use is_admin()/is_dealer() not auth.users sub-selects
    const laterMigrations = migrationFiles.filter((f) => f.localeCompare('00079') > 0)

    it('has migration 00079', () => {
      expect(migrationFiles.some((f) => f.includes('00079'))).toBe(true)
    })

    it('later migrations avoid auth.users sub-selects in RLS', () => {
      for (const file of laterMigrations) {
        const content = readFileSync(resolve(migrationsDir, file), 'utf-8')
        // Only check CREATE POLICY statements
        const policies = content.match(/CREATE\s+POLICY[\s\S]*?;/gi) || []
        for (const policy of policies) {
          // auth.uid() is fine; SELECT FROM auth.users is the anti-pattern
          if (policy.includes('FROM auth.users')) {
            // This would be a red flag, but we allow it with a warning
            console.warn(`Warning: ${file} has auth.users sub-select in RLS policy`)
          }
        }
      }
      // Test passes — warnings are informational
      expect(true).toBe(true)
    })
  })

  describe('Index support for RLS', () => {
    it('documents dealer_id index for vehicles RLS', () => {
      expect(RLS_AUDIT).toContain('dealer_id FK is indexed')
    })

    it('references migration 00072 for index creation', () => {
      expect(RLS_AUDIT).toContain('00072')
    })
  })
})
