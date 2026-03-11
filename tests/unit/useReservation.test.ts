import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useReservation } from '../../app/composables/useReservation'

// ─── Stubs ────────────────────────────────────────────────────────────────────

function makeChain(data: unknown = null, error: unknown = null, count = 0) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'in', 'gte', 'order', 'select', 'update', 'limit'].forEach((m) => {
    chain[m] = () => chain
  })
  chain.maybeSingle = () => Promise.resolve({ data, error })
  chain.single = () => Promise.resolve({ data, error })
  const resolved = { data, error, count }
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

function stubClient() {
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => makeChain([]),
      update: () => ({ eq: () => ({ eq: () => ({ in: () => Promise.resolve({ data: null, error: null }) }) }) }),
    }),
  }))
}

const sampleReservation = {
  id: 'res-1',
  vehicle_id: 'v-1',
  buyer_id: 'user-1',
  seller_id: 's-1',
  deposit_cents: 5000,
  stripe_payment_intent_id: null,
  status: 'active' as const,
  seller_response: null,
  seller_responded_at: null,
  buyer_confirmed_at: null,
  expires_at: '2026-12-31T00:00:00Z',
  subscription_freebie: false,
  created_at: '2026-01-01',
}

const sampleRow = {
  ...sampleReservation,
  vehicles: { title: 'Volvo FH 2020', main_image: 'img.jpg' },
  seller: { raw_user_meta_data: { full_name: 'Dealer User' } },
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
  vi.stubGlobal('useSubscriptionPlan', () => ({ currentPlan: { value: 'free' } }))
  vi.stubGlobal('nextTick', () => Promise.resolve())
  vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ id: 'res-1', status: 'pending' }))
  stubClient()
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('reservations starts as empty array', () => {
    const c = useReservation()
    expect(c.reservations.value).toHaveLength(0)
  })

  it('loading starts as false', () => {
    const c = useReservation()
    expect(c.loading.value).toBe(false)
  })

  it('creating starts as false', () => {
    const c = useReservation()
    expect(c.creating.value).toBe(false)
  })
})

// ─── timeRemaining ────────────────────────────────────────────────────────────

describe('timeRemaining', () => {
  it('returns formatted time for future expiry', () => {
    const c = useReservation()
    const futureDate = new Date(Date.now() + 3 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString()
    const reservation = { ...sampleReservation, expires_at: futureDate }
    const result = c.timeRemaining(reservation)
    expect(result).toMatch(/\d+h \d+m/)
  })

  it('returns 0h 0m for expired reservation', () => {
    const c = useReservation()
    const pastDate = new Date(Date.now() - 1000).toISOString()
    const reservation = { ...sampleReservation, status: 'expired' as const, expires_at: pastDate }
    expect(c.timeRemaining(reservation)).toBe('0h 0m')
  })

  it('returns exact hours and minutes', () => {
    const c = useReservation()
    // Exactly 2 hours from now
    const twoHours = new Date(Date.now() + 2 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString()
    const reservation = { ...sampleReservation, expires_at: twoHours }
    const result = c.timeRemaining(reservation)
    expect(result).toMatch(/2h 1[45]m/)
  })

  it('returns 0h Xm when less than an hour remains', () => {
    const c = useReservation()
    const thirtyMin = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    const reservation = { ...sampleReservation, expires_at: thirtyMin }
    const result = c.timeRemaining(reservation)
    expect(result).toMatch(/0h (29|30)m/)
  })
})

// ─── getDepositInfo ───────────────────────────────────────────────────────────

describe('getDepositInfo', () => {
  it('returns default when no user', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = useReservation()
    const info = await c.getDepositInfo()
    expect(info.amount_cents).toBe(5000)
    expect(info.is_free).toBe(false)
    expect(info.free_remaining).toBe(0)
  })

  it('returns 5000 cents for free plan', async () => {
    vi.stubGlobal('useSubscriptionPlan', () => ({ currentPlan: { value: 'free' } }))
    const c = useReservation()
    const info = await c.getDepositInfo()
    expect(info.amount_cents).toBe(5000)
    expect(info.is_free).toBe(false)
  })

  it('returns lower deposit for premium plan with no freebies used', async () => {
    vi.stubGlobal('useSubscriptionPlan', () => ({ currentPlan: { value: 'premium' } }))
    // 0 freebies used → free_remaining = 3 → is_free
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([], null, 0),
      }),
    }))
    const c = useReservation()
    const info = await c.getDepositInfo()
    expect(info.is_free).toBe(true)
    expect(info.free_remaining).toBe(3)
    expect(info.amount_cents).toBe(0)
  })

  it('charges deposit when freebies exhausted', async () => {
    vi.stubGlobal('useSubscriptionPlan', () => ({ currentPlan: { value: 'basic' } }))
    // 1 freebie already used out of 1 per month
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([], null, 1),
      }),
    }))
    const c = useReservation()
    const info = await c.getDepositInfo()
    expect(info.is_free).toBe(false)
    expect(info.free_remaining).toBe(0)
    expect(info.amount_cents).toBe(2500)
  })

  it('returns founding plan config (same as premium)', async () => {
    vi.stubGlobal('useSubscriptionPlan', () => ({ currentPlan: { value: 'founding' } }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([], null, 0),
      }),
    }))
    const c = useReservation()
    const info = await c.getDepositInfo()
    expect(info.is_free).toBe(true)
    expect(info.free_remaining).toBe(3)
    expect(info.amount_cents).toBe(0)
  })

  it('falls back to free plan for unknown plan name', async () => {
    vi.stubGlobal('useSubscriptionPlan', () => ({ currentPlan: { value: 'enterprise' } }))
    const c = useReservation()
    const info = await c.getDepositInfo()
    expect(info.amount_cents).toBe(5000)
    expect(info.is_free).toBe(false)
    expect(info.free_remaining).toBe(0)
  })

  it('treats null count as 0 freebies used', async () => {
    vi.stubGlobal('useSubscriptionPlan', () => ({ currentPlan: { value: 'premium' } }))
    // count is null
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([], null, null as unknown as number),
      }),
    }))
    const c = useReservation()
    const info = await c.getDepositInfo()
    expect(info.is_free).toBe(true)
    expect(info.free_remaining).toBe(3)
  })

  it('throws on DB error when counting freebies', async () => {
    vi.stubGlobal('useSubscriptionPlan', () => ({ currentPlan: { value: 'premium' } }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([], new Error('DB count failed'), 0),
      }),
    }))
    const c = useReservation()
    await expect(c.getDepositInfo()).rejects.toThrow('DB count failed')
  })

  it('returns partial free_remaining for basic plan with some freebies used', async () => {
    vi.stubGlobal('useSubscriptionPlan', () => ({ currentPlan: { value: 'basic' } }))
    // basic has 1 free per month, 0 used
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([], null, 0),
      }),
    }))
    const c = useReservation()
    const info = await c.getDepositInfo()
    expect(info.is_free).toBe(true)
    expect(info.free_remaining).toBe(1)
    expect(info.amount_cents).toBe(0)
  })

  it('clamps free_remaining to 0 when count exceeds quota', async () => {
    vi.stubGlobal('useSubscriptionPlan', () => ({ currentPlan: { value: 'basic' } }))
    // basic has 1 free per month, but 5 counted (edge case)
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([], null, 5),
      }),
    }))
    const c = useReservation()
    const info = await c.getDepositInfo()
    expect(info.free_remaining).toBe(0)
    expect(info.is_free).toBe(false)
    expect(info.amount_cents).toBe(2500)
  })
})

// ─── fetchMyReservations ──────────────────────────────────────────────────────

describe('fetchMyReservations', () => {
  it('does nothing when no user', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = useReservation()
    await c.fetchMyReservations()
    expect(c.reservations.value).toHaveLength(0)
  })

  it('does not set loading when no user', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = useReservation()
    await c.fetchMyReservations()
    // loading was never set to true, stays false
    expect(c.loading.value).toBe(false)
  })

  it('sets loading to false after success', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
      }),
    }))
    const c = useReservation()
    await c.fetchMyReservations()
    expect(c.loading.value).toBe(false)
  })

  it('maps reservation rows from DB', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([sampleRow]),
      }),
    }))
    const c = useReservation()
    await c.fetchMyReservations()
    expect(c.reservations.value).toHaveLength(1)
    expect(c.reservations.value[0].vehicle_title).toBe('Volvo FH 2020')
    expect(c.reservations.value[0].seller_name).toBe('Dealer User')
  })

  it('handles null vehicles and seller data gracefully', async () => {
    const rowNoJoins = {
      ...sampleReservation,
      vehicles: null,
      seller: null,
    }
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([rowNoJoins]),
      }),
    }))
    const c = useReservation()
    await c.fetchMyReservations()
    expect(c.reservations.value).toHaveLength(1)
    expect(c.reservations.value[0].vehicle_title).toBeUndefined()
    expect(c.reservations.value[0].vehicle_image).toBeUndefined()
    expect(c.reservations.value[0].seller_name).toBeUndefined()
  })

  it('handles seller with null raw_user_meta_data', async () => {
    const rowNullMeta = {
      ...sampleReservation,
      vehicles: { title: 'Test', main_image: 'img.jpg' },
      seller: { raw_user_meta_data: null },
    }
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([rowNullMeta]),
      }),
    }))
    const c = useReservation()
    await c.fetchMyReservations()
    expect(c.reservations.value[0].seller_name).toBeUndefined()
  })

  it('maps multiple rows', async () => {
    const row2 = { ...sampleRow, id: 'res-2', vehicle_id: 'v-2' }
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([sampleRow, row2]),
      }),
    }))
    const c = useReservation()
    await c.fetchMyReservations()
    expect(c.reservations.value).toHaveLength(2)
  })

  it('sets loading to false even on DB error', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, new Error('DB fail')),
      }),
    }))
    const c = useReservation()
    // Should throw, but loading must still be reset
    try {
      await c.fetchMyReservations()
    } catch (_) {
      // expected
    }
    expect(c.loading.value).toBe(false)
  })

  it('handles null data with no error (empty result)', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, null),
      }),
    }))
    const c = useReservation()
    await c.fetchMyReservations()
    expect(c.reservations.value).toHaveLength(0)
  })

  it('maps all reservation fields correctly', async () => {
    const fullRow = {
      id: 'res-full',
      vehicle_id: 'v-full',
      buyer_id: 'user-1',
      seller_id: 's-full',
      deposit_cents: 2500,
      stripe_payment_intent_id: 'pi_123',
      status: 'seller_responded',
      seller_response: 'We accept your reservation',
      seller_responded_at: '2026-06-15T10:00:00Z',
      buyer_confirmed_at: null,
      expires_at: '2026-07-01T00:00:00Z',
      subscription_freebie: true,
      created_at: '2026-06-01',
      vehicles: { title: 'MAN TGX', main_image: 'man.jpg' },
      seller: { raw_user_meta_data: { full_name: 'Pro Dealer' } },
    }
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([fullRow]),
      }),
    }))
    const c = useReservation()
    await c.fetchMyReservations()
    const r = c.reservations.value[0]
    expect(r.id).toBe('res-full')
    expect(r.deposit_cents).toBe(2500)
    expect(r.stripe_payment_intent_id).toBe('pi_123')
    expect(r.status).toBe('seller_responded')
    expect(r.seller_response).toBe('We accept your reservation')
    expect(r.subscription_freebie).toBe(true)
    expect(r.vehicle_title).toBe('MAN TGX')
    expect(r.vehicle_image).toBe('man.jpg')
    expect(r.seller_name).toBe('Pro Dealer')
  })
})

// ─── respondToReservation ─────────────────────────────────────────────────────

describe('respondToReservation', () => {
  it('throws when message is too short', async () => {
    const c = useReservation()
    await expect(c.respondToReservation('res-1', 'short')).rejects.toThrow('at least 50')
  })

  it('throws with exactly 49 characters', async () => {
    const c = useReservation()
    await expect(c.respondToReservation('res-1', 'a'.repeat(49))).rejects.toThrow('at least 50')
  })

  it('accepts message of exactly 50 characters', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        update: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }),
      }),
    }))
    const c = useReservation()
    const longMsg = 'a'.repeat(50)
    await expect(c.respondToReservation('res-1', longMsg)).resolves.toBeUndefined()
  })

  it('accepts message longer than 50 characters', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        update: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }),
      }),
    }))
    const c = useReservation()
    await expect(c.respondToReservation('res-1', 'a'.repeat(200))).resolves.toBeUndefined()
  })

  it('throws on DB error', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        update: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: null, error: new Error('Update fail') }) }) }),
      }),
    }))
    const c = useReservation()
    await expect(c.respondToReservation('res-1', 'a'.repeat(60))).rejects.toThrow('Update fail')
  })

  it('updates local state when reservation is in the list', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        update: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }),
      }),
    }))
    const c = useReservation()
    // Pre-populate reservations
    c.reservations.value = [{ ...sampleReservation, status: 'active' }]

    const msg = 'a'.repeat(60)
    await c.respondToReservation('res-1', msg)

    expect(c.reservations.value[0].status).toBe('seller_responded')
    expect(c.reservations.value[0].seller_response).toBe(msg)
    expect(c.reservations.value[0].seller_responded_at).toBeTruthy()
  })

  it('does not modify local state when reservation not in list', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        update: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }),
      }),
    }))
    const c = useReservation()
    // Pre-populate with different ID
    c.reservations.value = [{ ...sampleReservation, id: 'other-id' }]

    await c.respondToReservation('res-1', 'a'.repeat(60))
    // Status should not have changed
    expect(c.reservations.value[0].status).toBe('active')
  })

  it('throws with empty message', async () => {
    const c = useReservation()
    await expect(c.respondToReservation('res-1', '')).rejects.toThrow('at least 50')
  })
})

// ─── createReservation ────────────────────────────────────────────────────────

describe('createReservation', () => {
  it('throws when no user', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = useReservation()
    await expect(c.createReservation('v-1')).rejects.toThrow('logged in')
  })

  it('throws when active reservation already exists', async () => {
    // getActiveReservationForVehicle returns an existing reservation
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(sampleReservation, null),
        update: () => ({ eq: () => ({ eq: () => ({ in: () => Promise.resolve({ data: null, error: null }) }) }) }),
      }),
    }))
    const c = useReservation()
    await expect(c.createReservation('v-1')).rejects.toThrow('active reservation already exists')
  })

  it('creates reservation and returns it', async () => {
    const createdRes = {
      id: 'res-new',
      vehicle_id: 'v-1',
      buyer_id: 'user-1',
      seller_id: 's-1',
      deposit_cents: 5000,
      stripe_payment_intent_id: null,
      status: 'pending',
      seller_response: null,
      seller_responded_at: null,
      buyer_confirmed_at: null,
      expires_at: '2026-12-31T00:00:00Z',
      subscription_freebie: false,
      created_at: '2026-01-01',
    }
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue(createdRes))
    // getActiveReservationForVehicle should return null (no existing)
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, null, 0),
        update: () => ({ eq: () => ({ eq: () => ({ in: () => Promise.resolve({ data: null, error: null }) }) }) }),
      }),
    }))
    const c = useReservation()
    const result = await c.createReservation('v-1')
    expect(result.id).toBe('res-new')
    expect(result.status).toBe('pending')
  })

  it('adds created reservation to local state', async () => {
    const createdRes = { ...sampleReservation, id: 'res-new', status: 'pending' as const }
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue(createdRes))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, null, 0),
        update: () => ({ eq: () => ({ eq: () => ({ in: () => Promise.resolve({ data: null, error: null }) }) }) }),
      }),
    }))
    const c = useReservation()
    await c.createReservation('v-1')
    expect(c.reservations.value).toHaveLength(1)
    expect(c.reservations.value[0].id).toBe('res-new')
  })

  it('sets creating to false after success', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue(sampleReservation))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, null, 0),
        update: () => ({ eq: () => ({ eq: () => ({ in: () => Promise.resolve({ data: null, error: null }) }) }) }),
      }),
    }))
    const c = useReservation()
    await c.createReservation('v-1')
    expect(c.creating.value).toBe(false)
  })

  it('sets creating to false after API failure', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('API error')))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, null, 0),
        update: () => ({ eq: () => ({ eq: () => ({ in: () => Promise.resolve({ data: null, error: null }) }) }) }),
      }),
    }))
    const c = useReservation()
    try {
      await c.createReservation('v-1')
    } catch (_) {
      // expected
    }
    expect(c.creating.value).toBe(false)
  })

  it('calls $fetch with correct parameters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(sampleReservation)
    vi.stubGlobal('$fetch', fetchMock)
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, null, 0),
        update: () => ({ eq: () => ({ eq: () => ({ in: () => Promise.resolve({ data: null, error: null }) }) }) }),
      }),
    }))
    const c = useReservation()
    await c.createReservation('v-1')
    expect(fetchMock).toHaveBeenCalledWith('/api/reservations/create', {
      method: 'POST',
      body: {
        vehicleId: 'v-1',
        depositCents: 5000,
      },
    })
  })
})

// ─── cancelReservation ────────────────────────────────────────────────────────

describe('cancelReservation', () => {
  it('throws when no user', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = useReservation()
    await expect(c.cancelReservation('res-1')).rejects.toThrow('logged in')
  })

  it('updates status to refunded on success', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        update: () => ({ eq: () => ({ eq: () => ({ in: () => Promise.resolve({ data: null, error: null }) }) }) }),
      }),
    }))
    const c = useReservation()
    c.reservations.value = [{ ...sampleReservation }]
    await c.cancelReservation('res-1')
    expect(c.reservations.value[0].status).toBe('refunded')
  })

  it('throws on DB error', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        update: () => ({ eq: () => ({ eq: () => ({ in: () => Promise.resolve({ data: null, error: new Error('Cancel fail') }) }) }) }),
      }),
    }))
    const c = useReservation()
    await expect(c.cancelReservation('res-1')).rejects.toThrow('Cancel fail')
  })

  it('does not modify local state when reservation not in list', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        update: () => ({ eq: () => ({ eq: () => ({ in: () => Promise.resolve({ data: null, error: null }) }) }) }),
      }),
    }))
    const c = useReservation()
    c.reservations.value = [{ ...sampleReservation, id: 'other-id' }]
    await c.cancelReservation('res-1')
    expect(c.reservations.value[0].status).toBe('active')
  })
})

// ─── confirmReservation ─────────────────────────────────────────────────────

describe('confirmReservation', () => {
  it('throws when no user', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = useReservation()
    await expect(c.confirmReservation('res-1')).rejects.toThrow('logged in')
  })

  it('updates status to completed on success', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        update: () => ({ eq: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }) }),
      }),
    }))
    const c = useReservation()
    c.reservations.value = [{ ...sampleReservation, status: 'seller_responded' }]
    await c.confirmReservation('res-1')
    expect(c.reservations.value[0].status).toBe('completed')
    expect(c.reservations.value[0].buyer_confirmed_at).toBeTruthy()
  })

  it('throws on DB error', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        update: () => ({ eq: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: null, error: new Error('Confirm fail') }) }) }) }),
      }),
    }))
    const c = useReservation()
    await expect(c.confirmReservation('res-1')).rejects.toThrow('Confirm fail')
  })

  it('does not modify local state when reservation not found', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        update: () => ({ eq: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }) }),
      }),
    }))
    const c = useReservation()
    c.reservations.value = [{ ...sampleReservation, id: 'other' }]
    await c.confirmReservation('res-1')
    expect(c.reservations.value[0].status).toBe('active')
  })
})

// ─── getActiveReservationForVehicle ──────────────────────────────────────────

describe('getActiveReservationForVehicle', () => {
  it('returns reservation when one exists', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(sampleReservation, null),
      }),
    }))
    const c = useReservation()
    const result = await c.getActiveReservationForVehicle('v-1')
    expect(result).toBeTruthy()
    expect(result!.id).toBe('res-1')
  })

  it('returns null when no active reservation', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, null),
      }),
    }))
    const c = useReservation()
    const result = await c.getActiveReservationForVehicle('v-1')
    expect(result).toBeNull()
  })

  it('throws on DB error', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, new Error('Query failed')),
      }),
    }))
    const c = useReservation()
    await expect(c.getActiveReservationForVehicle('v-1')).rejects.toThrow('Query failed')
  })
})

// ─── isVehicleReserved ──────────────────────────────────────────────────────

describe('isVehicleReserved', () => {
  it('returns true when count > 0', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, null, 2),
      }),
    }))
    const c = useReservation()
    const result = await c.isVehicleReserved('v-1')
    expect(result).toBe(true)
  })

  it('returns false when count is 0', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, null, 0),
      }),
    }))
    const c = useReservation()
    const result = await c.isVehicleReserved('v-1')
    expect(result).toBe(false)
  })

  it('returns false when count is null', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, null, null as unknown as number),
      }),
    }))
    const c = useReservation()
    const result = await c.isVehicleReserved('v-1')
    expect(result).toBe(false)
  })

  it('throws on DB error', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, new Error('Count failed')),
      }),
    }))
    const c = useReservation()
    await expect(c.isVehicleReserved('v-1')).rejects.toThrow('Count failed')
  })
})
