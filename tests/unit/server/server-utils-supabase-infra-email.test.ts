/**
 * Tests for:
 * - server/utils/supabaseAdmin.ts
 * - server/utils/email-templates/infra-alert.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────

const { mockServerSupabaseServiceRole } = vi.hoisted(() => ({
  mockServerSupabaseServiceRole: vi.fn().mockReturnValue({ from: vi.fn() }),
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: mockServerSupabaseServiceRole,
}))

vi.stubGlobal('useRuntimeConfig', () => ({
  supabaseServiceRoleKey: 'test-service-role-key',
  public: {},
}))

// ── Static imports ────────────────────────────────────────────────────────────

import { useSupabaseAdmin, useSupabaseRestHeaders } from '../../../server/utils/supabaseAdmin'
import { infraAlertEmailHtml, infraAlertSubject } from '../../../server/utils/email-templates/infra-alert'

// ══ supabaseAdmin.ts ════════════════════════════════════════════════════════

describe('useSupabaseAdmin', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('delegates to serverSupabaseServiceRole', () => {
    const fakeClient = { from: vi.fn() }
    mockServerSupabaseServiceRole.mockReturnValue(fakeClient)
    const result = useSupabaseAdmin({} as any)
    expect(result).toBe(fakeClient)
    expect(mockServerSupabaseServiceRole).toHaveBeenCalledWith({})
  })
})

describe('useSupabaseRestHeaders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'env-service-key'
  })

  afterEach(() => {
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  it('returns url and headers when both configured', () => {
    const result = useSupabaseRestHeaders()
    expect(result).not.toBeNull()
    expect(result!.url).toBe('https://test.supabase.co')
    expect(result!.headers.apikey).toBeTruthy()
    expect(result!.headers.Authorization).toContain('Bearer ')
    expect(result!.headers['Content-Type']).toBe('application/json')
    expect(result!.headers.Prefer).toBe('return=minimal')
  })

  it('returns null when SUPABASE_URL is missing', () => {
    delete process.env.SUPABASE_URL
    const result = useSupabaseRestHeaders()
    expect(result).toBeNull()
  })

  it('returns null when service role key is missing', () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    vi.stubGlobal('useRuntimeConfig', () => ({ supabaseServiceRoleKey: undefined, public: {} }))
    const result = useSupabaseRestHeaders()
    expect(result).toBeNull()
    vi.stubGlobal('useRuntimeConfig', () => ({ supabaseServiceRoleKey: 'test-key', public: {} }))
  })

  it('uses runtime config key over env when available', () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'env-key'
    vi.stubGlobal('useRuntimeConfig', () => ({
      supabaseServiceRoleKey: 'config-key',
      public: {},
    }))
    const result = useSupabaseRestHeaders()
    // Config key takes precedence
    expect(result!.headers.apikey).toBe('config-key')
    vi.stubGlobal('useRuntimeConfig', () => ({ supabaseServiceRoleKey: 'test-service-role-key', public: {} }))
  })
})

// ══ email-templates/infra-alert.ts ══════════════════════════════════════════

describe('infraAlertEmailHtml', () => {
  const baseOpts = {
    component: 'supabase',
    metric: 'db_size_bytes',
    usagePercent: 85,
    value: 900 * 1024 * 1024, // 900 MB
    limit: 1024 * 1024 * 1024, // 1 GB
    level: 'warning' as const,
  }

  it('returns valid HTML string', () => {
    const html = infraAlertEmailHtml(baseOpts)
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('</html>')
  })

  it('includes component label in output', () => {
    const html = infraAlertEmailHtml(baseOpts)
    expect(html).toContain('Supabase')
  })

  it('includes metric label in output', () => {
    const html = infraAlertEmailHtml(baseOpts)
    expect(html).toContain('Database Size')
  })

  it('includes usage percent', () => {
    const html = infraAlertEmailHtml(baseOpts)
    expect(html).toContain('85%')
  })

  it('applies warning level colors', () => {
    const html = infraAlertEmailHtml({ ...baseOpts, level: 'warning' })
    expect(html).toContain('WARNING')
    expect(html).toContain('#FFC107') // warning badge color
  })

  it('applies critical level colors', () => {
    const html = infraAlertEmailHtml({ ...baseOpts, level: 'critical' })
    expect(html).toContain('CRITICAL')
    expect(html).toContain('#DC3545')
  })

  it('applies emergency level colors', () => {
    const html = infraAlertEmailHtml({ ...baseOpts, level: 'emergency' })
    expect(html).toContain('EMERGENCY')
    expect(html).toContain('#FF0000')
  })

  it('formats db_size_bytes as GB when >= 1GB', () => {
    const html = infraAlertEmailHtml({
      ...baseOpts,
      value: 2 * 1024 * 1024 * 1024,
      limit: 4 * 1024 * 1024 * 1024,
    })
    expect(html).toContain('GB')
  })

  it('formats db_size_bytes as MB when < 1GB', () => {
    const html = infraAlertEmailHtml({
      ...baseOpts,
      value: 500 * 1024 * 1024, // 500 MB
      limit: 1 * 1024 * 1024 * 1024,
    })
    expect(html).toContain('MB')
  })

  it('formats db_size_bytes as KB when < 1MB', () => {
    const html = infraAlertEmailHtml({
      ...baseOpts,
      value: 500 * 1024, // 500 KB
      limit: 1 * 1024 * 1024,
    })
    expect(html).toContain('KB')
  })

  it('formats db_size_bytes as B when < 1KB', () => {
    const html = infraAlertEmailHtml({
      ...baseOpts,
      value: 512,
      limit: 1024,
    })
    expect(html).toContain(' B')
  })

  it('formats cloudinary_storage as GB when >= 1GB', () => {
    const html = infraAlertEmailHtml({
      component: 'cloudinary',
      metric: 'cloudinary_storage',
      usagePercent: 70,
      value: 2 * 1024 * 1024 * 1024,
      limit: 3 * 1024 * 1024 * 1024,
      level: 'warning',
    })
    expect(html).toContain('GB')
  })

  it('formats cloudinary_storage as MB when < 1GB', () => {
    const html = infraAlertEmailHtml({
      component: 'cloudinary',
      metric: 'cloudinary_storage',
      usagePercent: 50,
      value: 500 * 1024 * 1024,
      limit: 1 * 1024 * 1024 * 1024,
      level: 'warning',
    })
    expect(html).toContain('MB')
  })

  it('formats cloudinary_storage value as bytes when value < 1KB', () => {
    const html = infraAlertEmailHtml({
      component: 'cloudinary',
      metric: 'cloudinary_storage',
      usagePercent: 1,
      value: 512,
      limit: 1024, // keep limit as bytes too
      level: 'info',
    })
    // Value 512 bytes → toLocaleString('es-ES') = '512'
    expect(html).toContain('512')
  })

  it('formats generic metrics as number', () => {
    const html = infraAlertEmailHtml({
      component: 'resend',
      metric: 'resend_emails_today',
      usagePercent: 60,
      value: 150,
      limit: 250,
      level: 'warning',
    })
    expect(html).toContain('150')
  })

  it('caps progress bar width at 100% when usagePercent > 100', () => {
    const html = infraAlertEmailHtml({ ...baseOpts, usagePercent: 120 })
    expect(html).toContain('width:100%')
    expect(html).not.toContain('width:120%')
  })

  it('uses raw component name when not in COMPONENT_LABELS', () => {
    const html = infraAlertEmailHtml({ ...baseOpts, component: 'custom-service' })
    expect(html).toContain('custom-service')
  })

  it('uses raw metric name when not in METRIC_LABELS', () => {
    const html = infraAlertEmailHtml({ ...baseOpts, metric: 'custom_metric' })
    expect(html).toContain('custom_metric')
  })

  it('falls back to warning style for unknown level', () => {
    const html = infraAlertEmailHtml({ ...baseOpts, level: 'unknown' as any })
    expect(html).toContain('#FFC107') // warning badge color
  })
})

describe('infraAlertSubject', () => {
  it('includes component label and usage percent', () => {
    const subject = infraAlertSubject('supabase', 85)
    expect(subject).toContain('Supabase')
    expect(subject).toContain('85%')
    expect(subject).toContain('[Tracciona]')
  })

  it('uses raw component name when not in labels', () => {
    const subject = infraAlertSubject('my-service', 90)
    expect(subject).toContain('my-service')
  })

  it('uses cloudinary label for cloudinary component', () => {
    const subject = infraAlertSubject('cloudinary', 75)
    expect(subject).toContain('Cloudinary')
    expect(subject).toContain('75%')
  })
})
