import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { H3Event } from 'h3'

// ─── Module mock (static imports from h3) ────────────────────────────────────

const { mockGetHeader, mockCreateError } = vi.hoisted(() => ({
  mockGetHeader: vi.fn<[H3Event, string], string | undefined>(),
  mockCreateError: vi.fn((opts: { statusCode: number; message: string }) => {
    const err = new Error(opts.message) as Error & { statusCode?: number }
    err.statusCode = opts.statusCode
    return err
  }),
}))

vi.mock('h3', () => ({
  getHeader: mockGetHeader,
  createError: mockCreateError,
}))

import { verifyCronSecret } from '../../../server/utils/verifyCronSecret'

const SECRET = 'cron-secret-xyz'
const mockEvent = {} as H3Event
const originalNodeEnv = process.env.NODE_ENV

beforeEach(() => {
  vi.clearAllMocks()
  process.env.NODE_ENV = 'test'
  delete process.env.CRON_SECRET
  vi.stubGlobal('useRuntimeConfig', () => ({
    cronSecret: SECRET,
    public: { vertical: 'tracciona' },
  }))
  // Default: no headers
  mockGetHeader.mockReturnValue(undefined)
})

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv
})

describe('verifyCronSecret', () => {
  it('passes when body secret matches', () => {
    expect(() => verifyCronSecret(mockEvent, SECRET)).not.toThrow()
  })

  it('passes when x-cron-secret header matches', () => {
    mockGetHeader.mockImplementation((_e, header) =>
      header === 'x-cron-secret' ? SECRET : undefined,
    )
    expect(() => verifyCronSecret(mockEvent)).not.toThrow()
  })

  it('passes when Authorization Bearer header matches', () => {
    mockGetHeader.mockImplementation((_e, header) =>
      header === 'authorization' ? `Bearer ${SECRET}` : undefined,
    )
    expect(() => verifyCronSecret(mockEvent)).not.toThrow()
  })

  it('throws 401 when no secret provided in any way', () => {
    expect(() => verifyCronSecret(mockEvent)).toThrow()
    expect(mockCreateError).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 }),
    )
  })

  it('throws 401 when wrong body secret', () => {
    expect(() => verifyCronSecret(mockEvent, 'wrong-secret')).toThrow()
  })

  it('throws 401 when wrong header secret', () => {
    mockGetHeader.mockImplementation((_e, header) =>
      header === 'x-cron-secret' ? 'wrong' : undefined,
    )
    expect(() => verifyCronSecret(mockEvent)).toThrow()
  })

  it('allows execution in dev when no cronSecret configured', () => {
    process.env.NODE_ENV = 'development'
    vi.stubGlobal('useRuntimeConfig', () => ({ cronSecret: '', public: {} }))
    delete process.env.CRON_SECRET
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => verifyCronSecret(mockEvent)).not.toThrow()
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('throws 500 in production when no cronSecret configured', () => {
    process.env.NODE_ENV = 'production'
    vi.stubGlobal('useRuntimeConfig', () => ({ cronSecret: '', public: {} }))
    delete process.env.CRON_SECRET
    expect(() => verifyCronSecret(mockEvent)).toThrow()
    expect(mockCreateError).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500 }),
    )
  })

  it('uses CRON_SECRET env var as fallback', () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ cronSecret: '', public: {} }))
    process.env.CRON_SECRET = SECRET
    expect(() => verifyCronSecret(mockEvent, SECRET)).not.toThrow()
    delete process.env.CRON_SECRET
  })
})
