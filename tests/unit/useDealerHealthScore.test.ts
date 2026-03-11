import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDealerHealthScore } from '../../app/composables/useDealerHealthScore'

// ─── Supabase mock helpers ────────────────────────────────────────────────────

function stubSupabaseForScore({
  dealerProfile = {},
  vehicles = [],
  images = [],
  dealerError = null,
}: {
  dealerProfile?: Record<string, unknown>
  vehicles?: Record<string, unknown>[]
  images?: Record<string, unknown>[]
  dealerError?: unknown
} = {}) {
  const profile = {
    id: 'dealer-1',
    logo_url: null,
    bio: null,
    phone: null,
    email: null,
    avg_response_time_hours: null,
    ...dealerProfile,
  }

  vi.stubGlobal('useSupabaseClient', () => ({
    from: (table: string) => {
      if (table === 'dealers') {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve(
                  dealerError
                    ? { data: null, error: dealerError }
                    : { data: profile, error: null },
                ),
            }),
          }),
        }
      }
      if (table === 'vehicles') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => Promise.resolve({ data: vehicles, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'vehicle_images') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: images, error: null }),
          }),
        }
      }
      return {
        select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
      }
    },
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('getVerticalSlug', () => 'tracciona')
  stubSupabaseForScore()
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('score.total starts as 0', () => {
    const c = useDealerHealthScore('dealer-1')
    expect(c.score.value.total).toBe(0)
  })

  it('loading starts as false', () => {
    const c = useDealerHealthScore('dealer-1')
    expect(c.loading.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useDealerHealthScore('dealer-1')
    expect(c.error.value).toBeNull()
  })

  it('badgeEligible starts as false (score <= 80)', () => {
    const c = useDealerHealthScore('dealer-1')
    expect(c.badgeEligible.value).toBe(false)
  })
})

// ─── calculateScore — empty dealerId ──────────────────────────────────────────

describe('calculateScore — empty dealerId', () => {
  it('returns empty breakdown when dealerId is empty', async () => {
    const c = useDealerHealthScore('')
    const result = await c.calculateScore()
    expect(result.total).toBe(0)
  })

  it('sets error when dealerId is empty', async () => {
    const c = useDealerHealthScore('')
    await c.calculateScore()
    expect(c.error.value).toBeTruthy()
  })

  it('sets loading to false after early return', async () => {
    const c = useDealerHealthScore('')
    await c.calculateScore()
    expect(c.loading.value).toBe(false)
  })
})

// ─── calculateScore — supabase error ─────────────────────────────────────────

describe('calculateScore — supabase error', () => {
  it('sets error when dealer fetch fails', async () => {
    stubSupabaseForScore({ dealerError: { message: 'DB error' } })
    const c = useDealerHealthScore('dealer-1')
    await c.calculateScore()
    expect(c.error.value).toBeTruthy()
  })

  it('returns empty breakdown on supabase error', async () => {
    stubSupabaseForScore({ dealerError: { message: 'DB error' } })
    const c = useDealerHealthScore('dealer-1')
    const result = await c.calculateScore()
    expect(result.total).toBe(0)
  })

  it('sets loading to false after error', async () => {
    stubSupabaseForScore({ dealerError: { message: 'DB error' } })
    const c = useDealerHealthScore('dealer-1')
    await c.calculateScore()
    expect(c.loading.value).toBe(false)
  })
})

// ─── calculateScore — photos score ───────────────────────────────────────────

describe('photos score', () => {
  it('gets 10 points for >3 avg photos per vehicle', async () => {
    stubSupabaseForScore({
      dealerProfile: { logo_url: null, avg_response_time_hours: null },
      vehicles: [{ id: 'v1', description_es: null, description_en: null, updated_at: null, status: 'published' }],
      images: [{ vehicle_id: 'v1' }, { vehicle_id: 'v1' }, { vehicle_id: 'v1' }, { vehicle_id: 'v1' }],
    })
    const c = useDealerHealthScore('dealer-1')
    const result = await c.calculateScore()
    expect(result.photosScore).toBe(10)
  })

  it('gets 0 photos score when no vehicles', async () => {
    stubSupabaseForScore({ vehicles: [], images: [] })
    const c = useDealerHealthScore('dealer-1')
    const result = await c.calculateScore()
    expect(result.photosScore).toBe(0)
  })

  it('gets partial photos score for <3 avg photos', async () => {
    stubSupabaseForScore({
      vehicles: [{ id: 'v1', description_es: null, description_en: null, updated_at: null, status: 'published' }],
      images: [{ vehicle_id: 'v1' }], // 1 photo, avg = 1, 1/3 * 10 ≈ 3
    })
    const c = useDealerHealthScore('dealer-1')
    const result = await c.calculateScore()
    expect(result.photosScore).toBe(3) // round(1/3 * 10) = 3
  })
})

// ─── calculateScore — description score ──────────────────────────────────────

describe('description score', () => {
  it('gets 10 points when avg description > 100 chars', async () => {
    const longDesc = 'A'.repeat(150)
    stubSupabaseForScore({
      vehicles: [{ id: 'v1', description_es: longDesc, description_en: null, updated_at: null, status: 'published' }],
    })
    const c = useDealerHealthScore('dealer-1')
    const result = await c.calculateScore()
    expect(result.descriptionScore).toBe(10)
  })

  it('gets 0 description score when no vehicles', async () => {
    stubSupabaseForScore({ vehicles: [] })
    const c = useDealerHealthScore('dealer-1')
    const result = await c.calculateScore()
    expect(result.descriptionScore).toBe(0)
  })

  it('uses longest description (es vs en)', async () => {
    stubSupabaseForScore({
      vehicles: [{ id: 'v1', description_es: 'short', description_en: 'A'.repeat(150), updated_at: null, status: 'published' }],
    })
    const c = useDealerHealthScore('dealer-1')
    const result = await c.calculateScore()
    expect(result.descriptionScore).toBe(10)
  })
})

// ─── calculateScore — response score ─────────────────────────────────────────

describe('response score', () => {
  it('gets 20 points for response time <= 24h', async () => {
    stubSupabaseForScore({ dealerProfile: { avg_response_time_hours: 12 } })
    const c = useDealerHealthScore('dealer-1')
    const result = await c.calculateScore()
    expect(result.responseScore).toBe(20)
  })

  it('gets 20 points for exactly 24h response', async () => {
    stubSupabaseForScore({ dealerProfile: { avg_response_time_hours: 24 } })
    const c = useDealerHealthScore('dealer-1')
    const result = await c.calculateScore()
    expect(result.responseScore).toBe(20)
  })

  it('gets 0 points for response time >= 72h', async () => {
    stubSupabaseForScore({ dealerProfile: { avg_response_time_hours: 72 } })
    const c = useDealerHealthScore('dealer-1')
    const result = await c.calculateScore()
    expect(result.responseScore).toBe(0)
  })

  it('gets 0 points when avg_response_time_hours is null', async () => {
    stubSupabaseForScore({ dealerProfile: { avg_response_time_hours: null } })
    const c = useDealerHealthScore('dealer-1')
    const result = await c.calculateScore()
    expect(result.responseScore).toBe(0)
  })

  it('scales linearly between 24h and 72h', async () => {
    // 48h: (72-48)/(72-24) * 20 = 24/48 * 20 = 10
    stubSupabaseForScore({ dealerProfile: { avg_response_time_hours: 48 } })
    const c = useDealerHealthScore('dealer-1')
    const result = await c.calculateScore()
    expect(result.responseScore).toBe(10)
  })
})

// ─── calculateScore — profile score ──────────────────────────────────────────

describe('profile score', () => {
  it('gets 0 for empty profile', async () => {
    stubSupabaseForScore({ dealerProfile: { logo_url: null, bio: null, phone: null, email: null } })
    const c = useDealerHealthScore('dealer-1')
    const result = await c.calculateScore()
    expect(result.profileScore).toBe(0)
  })

  it('gets 10 for fully complete profile', async () => {
    stubSupabaseForScore({
      dealerProfile: {
        logo_url: 'https://cdn.com/logo.png',
        bio: 'We are a dealer',
        phone: '+34 600 000 001',
        email: 'dealer@example.com',
      },
    })
    const c = useDealerHealthScore('dealer-1')
    const result = await c.calculateScore()
    expect(result.profileScore).toBe(10)
  })

  it('counts bio as object with localized string', async () => {
    stubSupabaseForScore({
      dealerProfile: {
        logo_url: null,
        bio: { es: 'Somos una empresa', en: 'We are a company' },
        phone: null,
        email: null,
      },
    })
    const c = useDealerHealthScore('dealer-1')
    const result = await c.calculateScore()
    expect(result.profileScore).toBeGreaterThan(0)
  })
})

// ─── calculateScore — vehicles score ─────────────────────────────────────────

describe('vehicles score', () => {
  it('gets 0 for less than 5 vehicles', async () => {
    const vehicles = Array.from({ length: 4 }, (_, i) => ({
      id: `v${i}`, description_es: null, description_en: null, updated_at: null, status: 'published',
    }))
    stubSupabaseForScore({ vehicles })
    const c = useDealerHealthScore('dealer-1')
    const result = await c.calculateScore()
    expect(result.vehiclesScore).toBe(0)
  })

  it('gets 10 for exactly 5 vehicles', async () => {
    const vehicles = Array.from({ length: 5 }, (_, i) => ({
      id: `v${i}`, description_es: null, description_en: null, updated_at: null, status: 'published',
    }))
    stubSupabaseForScore({ vehicles })
    const c = useDealerHealthScore('dealer-1')
    const result = await c.calculateScore()
    expect(result.vehiclesScore).toBe(10)
  })

  it('caps vehicles score at 40 (20+ vehicles)', async () => {
    const vehicles = Array.from({ length: 25 }, (_, i) => ({
      id: `v${i}`, description_es: null, description_en: null, updated_at: null, status: 'published',
    }))
    stubSupabaseForScore({ vehicles })
    const c = useDealerHealthScore('dealer-1')
    const result = await c.calculateScore()
    expect(result.vehiclesScore).toBe(40)
  })
})

// ─── calculateScore — total ───────────────────────────────────────────────────

describe('total score', () => {
  it('total is sum of all component scores', async () => {
    stubSupabaseForScore({
      dealerProfile: {
        logo_url: 'https://cdn.com/logo.png',
        bio: 'Bio text',
        phone: '+34 600',
        email: 'e@e.com',
        avg_response_time_hours: 12,
      },
      vehicles: [{ id: 'v1', description_es: 'A'.repeat(150), description_en: null, updated_at: new Date().toISOString(), status: 'published' }],
      images: [{ vehicle_id: 'v1' }, { vehicle_id: 'v1' }, { vehicle_id: 'v1' }, { vehicle_id: 'v1' }],
    })
    const c = useDealerHealthScore('dealer-1')
    const result = await c.calculateScore()
    const computed = result.photosScore + result.descriptionScore + result.responseScore +
      result.priceUpdateScore + result.profileScore + result.vehiclesScore
    expect(result.total).toBe(computed)
  })

  it('sets loading to false after calculateScore', async () => {
    const c = useDealerHealthScore('dealer-1')
    await c.calculateScore()
    expect(c.loading.value).toBe(false)
  })

  it('updates score.value with result', async () => {
    stubSupabaseForScore({
      dealerProfile: { avg_response_time_hours: 24 },
    })
    const c = useDealerHealthScore('dealer-1')
    await c.calculateScore()
    expect(c.score.value.responseScore).toBe(20)
  })
})
