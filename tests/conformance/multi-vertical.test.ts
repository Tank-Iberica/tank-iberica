import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../..')

describe('Multi-Vertical infrastructure (Fase 6)', () => {
  // ── 6.4: Admin vertical selector ──
  describe('Admin vertical selector (#250)', () => {
    const header = readFileSync(
      resolve(ROOT, 'app/components/admin/layout/AdminHeader.vue'),
      'utf-8',
    )

    it('has switchVertical function', () => {
      expect(header).toContain('switchVertical')
    })

    it('uses @change event on dropdown', () => {
      expect(header).toContain('@change="switchVertical')
    })

    it('is in admin layout header', () => {
      expect(header).toContain('<template>')
    })
  })

  // ── 6.5: Inter-vertical data isolation (RLS) ──
  describe('Inter-vertical data isolation RLS (#254)', () => {
    const migDir = resolve(ROOT, 'supabase/migrations')

    it('has vertical isolation migration (00062)', () => {
      expect(existsSync(resolve(migDir, '00062_vertical_isolation.sql'))).toBe(true)
    })

    it('has vehicles vertical column migration (00063)', () => {
      expect(existsSync(resolve(migDir, '00063_vehicles_vertical_column.sql'))).toBe(true)
    })

    it('has schema separation migration (00088)', () => {
      expect(existsSync(resolve(migDir, '00088_schema_separation.sql'))).toBe(true)
    })

    it('has vertical-isolation security tests', () => {
      expect(existsSync(resolve(ROOT, 'tests/security/vertical-isolation.test.ts'))).toBe(true)
    })

    it('has analytics vertical isolation coverage (in useAnalyticsTracking.test.ts)', () => {
      expect(existsSync(resolve(ROOT, 'tests/unit/useAnalyticsTracking.test.ts'))).toBe(true)
    })
  })

  // ── 6.6: E2E test vertical Horecaria ──
  describe('E2E test vertical Horecaria (#253)', () => {
    const script = readFileSync(resolve(ROOT, 'scripts/create-vertical.mjs'), 'utf-8')

    it('create-vertical supports --smoke-test flag', () => {
      expect(script).toContain('smoke-test')
    })

    it('create-vertical generates SQL migration', () => {
      expect(script).toContain('.sql')
    })

    it('create-vertical generates deploy checklist', () => {
      expect(script).toContain('deploy-checklist')
    })

    it('horecaria defaults exist in localizedTerm', () => {
      const cfg = readFileSync(resolve(ROOT, 'app/composables/useVerticalConfig.ts'), 'utf-8')
      expect(cfg).toContain('horecaria')
    })
  })

  // ── 6.7: Dashboard admin cross-vertical ──
  describe('Dashboard admin cross-vertical (#251)', () => {
    const adminDir = resolve(ROOT, 'app/composables/admin')

    it('has admin infrastructure composable', () => {
      expect(existsSync(resolve(adminDir, 'useAdminInfrastructura.ts'))).toBe(true)
    })

    it('has admin vertical config composable', () => {
      expect(existsSync(resolve(adminDir, 'useAdminVerticalConfig.ts'))).toBe(true)
    })

    it('admin config references vertical_config', () => {
      const src = readFileSync(resolve(adminDir, 'useAdminVerticalConfig.ts'), 'utf-8')
      expect(src).toContain('vertical_config')
    })
  })

  // ── 6.8: CRUD vertical_config UI ──
  describe('CRUD vertical_config admin (#252)', () => {
    const src = readFileSync(
      resolve(ROOT, 'app/composables/admin/useAdminVerticalConfig.ts'),
      'utf-8',
    )

    it('can load verticals', () => {
      expect(src).toContain('vertical_config')
    })

    it('exports from admin composable', () => {
      expect(src).toContain('export')
    })
  })

  // ── 6.9: Cross-vertical user account ──
  describe('Cross-vertical user account (N56)', () => {
    // Users table is shared — auth is Supabase Auth (same email across verticals)
    const verticalIsolation = readFileSync(
      resolve(ROOT, 'supabase/migrations/00062_vertical_isolation.sql'),
      'utf-8',
    )

    it('vertical isolation does not duplicate users table', () => {
      // Users remain shared in auth.users
      expect(verticalIsolation).not.toContain('CREATE TABLE users')
    })

    it('data isolation is per-entity (vehicles, articles), not per-user', () => {
      expect(verticalIsolation).toContain('vertical')
    })
  })

  // ── 6.10: Realtime connection manager ──
  describe('Supabase Realtime connection management (N70)', () => {
    const conversation = readFileSync(resolve(ROOT, 'app/composables/useConversation.ts'), 'utf-8')

    it('tracks realtime channel reference', () => {
      expect(conversation).toContain('realtimeChannel')
    })

    it('has unsubscribe cleanup', () => {
      expect(conversation).toContain('unsubscribeRealtime')
    })

    it('uses channel per conversation (not global)', () => {
      expect(conversation).toContain('channel(')
    })

    it('calls .subscribe()', () => {
      expect(conversation).toContain('.subscribe()')
    })
  })

  // ── 6.11: Presence system ──
  describe('Presence system ("X users viewing") (#297)', () => {
    const src = readFileSync(resolve(ROOT, 'app/composables/usePresence.ts'), 'utf-8')

    it('exports usePresence composable', () => {
      expect(src).toContain('export function usePresence')
    })

    it('returns viewerCount as readonly', () => {
      expect(src).toContain('readonly(viewerCount)')
    })

    it('returns join and leave functions', () => {
      expect(src).toContain('join,')
      expect(src).toContain('leave,')
    })

    it('creates channel per entity', () => {
      expect(src).toContain('presence:${entityType}:${entityId}')
    })

    it('handles presence sync event', () => {
      expect(src).toContain("event: 'sync'")
    })

    it('handles presence join event', () => {
      expect(src).toContain("event: 'join'")
    })

    it('handles presence leave event', () => {
      expect(src).toContain("event: 'leave'")
    })

    it('tracks user with joined_at timestamp', () => {
      expect(src).toContain('joined_at')
    })

    it('counts unique users (deduplicates)', () => {
      expect(src).toContain('countPresences')
      expect(src).toContain('new Set')
    })

    it('cleans up channel on leave', () => {
      expect(src).toContain('untrack')
      expect(src).toContain('removeChannel')
    })

    it('resets viewerCount to 0 on leave', () => {
      expect(src).toContain('viewerCount.value = 0')
    })
  })

  // ── 6.12: Realtime capacity evaluation ──
  describe('Supabase Realtime capacity evaluation (#296)', () => {
    const presence = readFileSync(resolve(ROOT, 'app/composables/usePresence.ts'), 'utf-8')
    const conversation = readFileSync(resolve(ROOT, 'app/composables/useConversation.ts'), 'utf-8')

    it('presence uses unique channel names to avoid collisions', () => {
      expect(presence).toContain('presence:${entityType}:${entityId}')
    })

    it('conversation uses unique channel per conversation', () => {
      expect(conversation).toContain('conv-')
    })

    it('channels are properly cleaned up to free resources', () => {
      expect(presence).toContain('removeChannel')
    })

    it('presenceState counts unique users', () => {
      expect(presence).toContain('presenceState')
      expect(presence).toContain('seen.size')
    })
  })
})
