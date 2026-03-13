/**
 * Tests for GET /api/admin/dealers/health-scores
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockServerUser, mockGetQuery } = vi.hoisted(() => ({
  mockServerUser: vi.fn(),
  mockGetQuery: vi.fn(),
}))

vi.mock('h3', async (importOriginal) => {
  const actual = await importOriginal<typeof import('h3')>()
  return {
    ...actual,
    defineEventHandler: (fn: Function) => fn,
    getQuery: (...a: unknown[]) => mockGetQuery(...a),
  }
})

vi.mock('#supabase/server', () => ({
  serverSupabaseUser: (...a: unknown[]) => mockServerUser(...a),
  serverSupabaseServiceRole: () => mockSupabase,
}))

vi.mock('~~/server/utils/safeError', () => ({
  safeError: (_code: number, msg: string) => {
    const err = new Error(msg) as Error & { statusCode: number }
    err.statusCode = _code
    return err
  },
}))

vi.mock('~~/server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

let mockSupabase: Record<string, unknown>

const ADMIN_USER = { id: 'admin-1' }
const DEALER_USER = { id: 'dealer-1' }

function makeSupabase(
  opts: {
    userRole?: string
    dealers?: unknown[]
    dealersError?: unknown
    vehicles?: unknown[]
    images?: unknown[]
  } = {},
) {
  const {
    userRole = 'admin',
    dealers = [
      {
        id: 'd1',
        company_name: 'Dealer One',
        avg_response_time_hours: 12,
        logo_url: 'https://cdn.example.com/logo.png',
      },
      { id: 'd2', company_name: 'Dealer Two', avg_response_time_hours: null, logo_url: null },
    ],
    dealersError = null,
    vehicles = [
      { dealer_id: 'd1' },
      { dealer_id: 'd1' },
      { dealer_id: 'd1' },
      { dealer_id: 'd1' },
      { dealer_id: 'd1' },
      { dealer_id: 'd2' },
    ],
    images = [
      { vehicles: { dealer_id: 'd1' } },
      { vehicles: { dealer_id: 'd1' } },
      { vehicles: { dealer_id: 'd1' } },
      { vehicles: { dealer_id: 'd1' } },
    ],
  } = opts

  const fromImpl = (table: string) => {
    const chain: Record<string, unknown> = {}
    chain.select = () => chain
    chain.eq = () => chain
    chain.not = () => chain
    chain.order = () => chain
    chain.range = () =>
      Promise.resolve({ data: table === 'dealers' ? dealers : [], error: dealersError })
    chain.is = () => chain
    chain.maybeSingle = () => {
      if (table === 'users') return Promise.resolve({ data: { role: userRole }, error: null })
      return Promise.resolve({ data: null, error: null })
    }
    if (table === 'vehicles') {
      // handler: .from('vehicles').select('dealer_id').eq('status', 'published')
      chain.select = () => chain
      chain.eq = () => Promise.resolve({ data: vehicles, error: null })
    }
    if (table === 'vehicle_images') {
      chain.select = () => chain
      chain.not = () => Promise.resolve({ data: images, error: null })
    }
    return chain
  }

  return { from: vi.fn().mockImplementation(fromImpl) }
}

import healthScoresHandler from '../../../server/api/admin/dealers/health-scores.get'

describe('GET /api/admin/dealers/health-scores', () => {
  beforeEach(() => {
    mockGetQuery.mockReturnValue({ limit: 50, offset: 0 })
    mockServerUser.mockResolvedValue(ADMIN_USER)
    mockSupabase = makeSupabase()
  })

  it('returns ok=true with dealer array for admin', async () => {
    const result = await healthScoresHandler({} as any)
    expect((result as any).ok).toBe(true)
    expect(Array.isArray((result as any).dealers)).toBe(true)
  })

  it('returns 401 when not authenticated', async () => {
    mockServerUser.mockResolvedValue(null)
    await expect(healthScoresHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns 403 for non-admin user', async () => {
    mockServerUser.mockResolvedValue(DEALER_USER)
    mockSupabase = makeSupabase({ userRole: 'dealer' })
    await expect(healthScoresHandler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('includes dealer company_name in results', async () => {
    const result = await healthScoresHandler({} as any)
    const dealers = (result as any).dealers as Array<{ company_name: string }>
    expect(dealers.some((d) => d.company_name === 'Dealer One')).toBe(true)
  })

  it('includes healthTotal score in results', async () => {
    const result = await healthScoresHandler({} as any)
    const dealers = (result as any).dealers as Array<{ healthTotal: number }>
    for (const d of dealers) {
      expect(typeof d.healthTotal).toBe('number')
      expect(d.healthTotal).toBeGreaterThanOrEqual(0)
      expect(d.healthTotal).toBeLessThanOrEqual(100)
    }
  })

  it('includes badge field in results', async () => {
    const result = await healthScoresHandler({} as any)
    const dealers = (result as any).dealers as Array<{ badge: string }>
    for (const d of dealers) {
      expect(['top', 'verified', 'none']).toContain(d.badge)
    }
  })

  it('assigns top badge when score >= 80', async () => {
    mockSupabase = makeSupabase({
      dealers: [
        {
          id: 'd_top',
          company_name: 'Top Dealer',
          avg_response_time_hours: 5,
          logo_url: 'https://cdn.example.com/logo.png',
        },
      ],
      vehicles: Array.from({ length: 40 }, () => ({ dealer_id: 'd_top' })),
      images: Array.from({ length: 200 }, () => ({ vehicles: { dealer_id: 'd_top' } })),
    })
    const result = await healthScoresHandler({} as any)
    const d = (result as any).dealers[0]
    expect(d.badge).toBe('top')
  })

  it('assigns none badge when score < 60', async () => {
    mockSupabase = makeSupabase({
      dealers: [
        { id: 'd_low', company_name: 'Low Dealer', avg_response_time_hours: null, logo_url: null },
      ],
      vehicles: [],
      images: [],
    })
    const result = await healthScoresHandler({} as any)
    const d = (result as any).dealers[0]
    expect(d.badge).toBe('none')
    expect(d.healthTotal).toBe(0)
  })

  it('handles null response time gracefully', async () => {
    const result = await healthScoresHandler({} as any)
    const nullDealer = (result as any).dealers.find((d: any) => d.company_name === 'Dealer Two')
    expect(nullDealer).toBeTruthy()
    expect(nullDealer.healthTotal).toBeGreaterThanOrEqual(0)
  })

  it('returns total count', async () => {
    const result = await healthScoresHandler({} as any)
    expect(typeof (result as any).total).toBe('number')
  })
})
