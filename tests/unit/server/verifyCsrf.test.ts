import { describe, it, expect, vi, beforeEach } from 'vitest'
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

import { verifyCsrf } from '../../../server/utils/verifyCsrf'

const mockEvent = {} as H3Event

beforeEach(() => {
  vi.clearAllMocks()
})

describe('verifyCsrf', () => {
  it('does not throw when X-Requested-With is XMLHttpRequest', () => {
    mockGetHeader.mockReturnValue('XMLHttpRequest')
    expect(() => verifyCsrf(mockEvent)).not.toThrow()
  })

  it('throws when X-Requested-With header is missing', () => {
    mockGetHeader.mockReturnValue(undefined)
    expect(() => verifyCsrf(mockEvent)).toThrow()
  })

  it('throws when X-Requested-With has wrong value', () => {
    mockGetHeader.mockReturnValue('fetch')
    expect(() => verifyCsrf(mockEvent)).toThrow()
  })

  it('throws when X-Requested-With is empty string', () => {
    mockGetHeader.mockReturnValue('')
    expect(() => verifyCsrf(mockEvent)).toThrow()
  })

  it('calls createError with 403 status on failure', () => {
    mockGetHeader.mockReturnValue(undefined)
    try { verifyCsrf(mockEvent) } catch { /* expected */ }
    expect(mockCreateError).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403 }),
    )
  })
})
