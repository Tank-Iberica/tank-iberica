/**
 * Tests for server/utils/recordFingerprint.ts
 *
 * Tests: djb2 hash consistency, ipHint extraction, fire-and-forget behavior,
 * RPC call payload, error swallowing.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoisted mocks (needed because vi.mock factories are hoisted)
const mockRpc = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }))
const mockGetHeaderFn = vi.hoisted(() => vi.fn())

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: () => ({ rpc: mockRpc }),
}))

vi.mock('~~/server/utils/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

vi.mock('h3', async (importOriginal) => {
  const actual = await importOriginal<typeof import('h3')>()
  return { ...actual, getHeader: mockGetHeaderFn }
})

import { recordFingerprint } from '~~/server/utils/recordFingerprint'

const mockEvent = {} as Parameters<typeof recordFingerprint>[0]

describe('recordFingerprint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRpc.mockResolvedValue({ error: null })
  })

  it('calls upsert_user_fingerprint RPC with correct params', async () => {
    mockGetHeaderFn.mockImplementation((_event: unknown, header: string) => {
      if (header === 'user-agent') return 'Mozilla/5.0 TestBrowser/1.0'
      if (header === 'accept-language') return 'es-ES,es;q=0.9'
      if (header === 'cf-connecting-ip') return '93.184.216.34'
      return null
    })

    recordFingerprint(mockEvent, 'user-uuid-1234')
    await new Promise((r) => setTimeout(r, 20))

    expect(mockRpc).toHaveBeenCalledOnce()
    const [rpcName, params] = mockRpc.mock.calls[0] as [string, Record<string, unknown>]
    expect(rpcName).toBe('upsert_user_fingerprint')
    expect(params.p_user_id).toBe('user-uuid-1234')
    expect(typeof params.p_fp_hash).toBe('string')
    expect(params.p_fp_hash).toMatch(/^[0-9a-f]+$/)
    expect(params.p_ua_hint).toContain('Mozilla/5.0')
    expect(params.p_ip_hint).toBe('93.184')
  })

  it('generates consistent fp_hash for same UA + language', async () => {
    const calls: string[] = []
    mockGetHeaderFn.mockImplementation((_event: unknown, header: string) => {
      if (header === 'user-agent') return 'TestAgent/2.0'
      if (header === 'accept-language') return 'en-US'
      return null
    })
    mockRpc.mockImplementation((_name: string, params: Record<string, unknown>) => {
      calls.push(params.p_fp_hash as string)
      return Promise.resolve({ error: null })
    })

    recordFingerprint(mockEvent, 'user-a')
    recordFingerprint(mockEvent, 'user-b')
    await new Promise((r) => setTimeout(r, 20))

    expect(calls).toHaveLength(2)
    expect(calls[0]).toBe(calls[1])
  })

  it('truncates ua_hint to 120 chars', async () => {
    const longUA = 'A'.repeat(200)
    mockGetHeaderFn.mockImplementation((_event: unknown, header: string) => {
      if (header === 'user-agent') return longUA
      if (header === 'accept-language') return 'en'
      return null
    })
    let capturedHint = ''
    mockRpc.mockImplementation((_name: string, params: Record<string, unknown>) => {
      capturedHint = params.p_ua_hint as string
      return Promise.resolve({ error: null })
    })

    recordFingerprint(mockEvent, 'user-a')
    await new Promise((r) => setTimeout(r, 20))

    expect(capturedHint.length).toBe(120)
  })

  it('uses null for ip_hint when no IP headers present', async () => {
    mockGetHeaderFn.mockImplementation((_event: unknown, header: string) => {
      if (header === 'user-agent') return 'TestAgent'
      if (header === 'accept-language') return 'en'
      return null
    })
    let capturedIpHint: unknown = 'NOT_SET'
    mockRpc.mockImplementation((_name: string, params: Record<string, unknown>) => {
      capturedIpHint = params.p_ip_hint
      return Promise.resolve({ error: null })
    })

    recordFingerprint(mockEvent, 'user-a')
    await new Promise((r) => setTimeout(r, 20))

    expect(capturedIpHint).toBeNull()
  })

  it('extracts first two octets from IPv4 address', async () => {
    mockGetHeaderFn.mockImplementation((_event: unknown, header: string) => {
      if (header === 'user-agent') return 'TestAgent'
      if (header === 'accept-language') return 'en'
      if (header === 'cf-connecting-ip') return '192.168.1.100'
      return null
    })
    let capturedIpHint = ''
    mockRpc.mockImplementation((_name: string, params: Record<string, unknown>) => {
      capturedIpHint = params.p_ip_hint as string
      return Promise.resolve({ error: null })
    })

    recordFingerprint(mockEvent, 'user-a')
    await new Promise((r) => setTimeout(r, 20))

    expect(capturedIpHint).toBe('192.168')
  })

  it('falls back to x-forwarded-for when cf-connecting-ip is absent', async () => {
    mockGetHeaderFn.mockImplementation((_event: unknown, header: string) => {
      if (header === 'user-agent') return 'TestAgent'
      if (header === 'accept-language') return 'en'
      if (header === 'x-forwarded-for') return '10.0.5.1, 172.16.0.1'
      return null
    })
    let capturedIpHint = ''
    mockRpc.mockImplementation((_name: string, params: Record<string, unknown>) => {
      capturedIpHint = params.p_ip_hint as string
      return Promise.resolve({ error: null })
    })

    recordFingerprint(mockEvent, 'user-a')
    await new Promise((r) => setTimeout(r, 20))

    expect(capturedIpHint).toBe('10.0') // first IP in chain
  })

  it('swallows RPC errors without throwing', async () => {
    mockGetHeaderFn.mockReturnValue('test')
    mockRpc.mockResolvedValue({ error: { message: 'DB connection failed' } })

    expect(() => recordFingerprint(mockEvent, 'user-a')).not.toThrow()
    await new Promise((r) => setTimeout(r, 20))
    expect(mockRpc).toHaveBeenCalled()
  })

  it('swallows unexpected exceptions without throwing', async () => {
    mockGetHeaderFn.mockReturnValue('test')
    mockRpc.mockRejectedValue(new Error('Network timeout'))

    expect(() => recordFingerprint(mockEvent, 'user-a')).not.toThrow()
    await new Promise((r) => setTimeout(r, 20))
  })
})
