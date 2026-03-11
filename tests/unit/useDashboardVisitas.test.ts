import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDashboardVisitas } from '../../app/composables/dashboard/useDashboardVisitas'

// ─── Stubs ────────────────────────────────────────────────────────────────────

const mockDealerProfile = { value: { id: 'dealer-1' } as unknown }

function makeChain(data: unknown = [], error: unknown = null) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'order', 'select', 'insert', 'delete', 'update', 'limit'].forEach((m) => { chain[m] = () => chain })
  const resolved = { data, error }
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

const sampleSlot = {
  id: 'slot-1', dealer_id: 'dealer-1', day_of_week: 1,
  start_time: '09:00', end_time: '18:00', max_visitors: 5, is_active: true,
}

const sampleBooking = {
  id: 'booking-1', dealer_id: 'dealer-1', slot_id: 'slot-1', vehicle_id: 'v-1',
  buyer_name: 'Juan', buyer_email: 'juan@test.com',
  visit_date: '2026-06-15', visit_time: '10:00', status: 'pending',
  notes: null, created_at: '2026-01-01',
  vehicles: { brand: 'Volvo', model: 'FH' },
}

beforeEach(() => {
  vi.clearAllMocks()
  mockDealerProfile.value = { id: 'dealer-1' }
  vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
  vi.stubGlobal('ref', (v: unknown) => {
    let _v = v
    return { get value() { return _v }, set value(x) { _v = x } }
  })
  vi.stubGlobal('reactive', (obj: object) => obj)
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
  vi.stubGlobal('useDealerDashboard', () => ({
    dealerProfile: mockDealerProfile,
    loadDealer: vi.fn().mockResolvedValue(mockDealerProfile.value),
  }))
  vi.stubGlobal('useSupabaseClient', () => ({
    from: (table: string) => {
      if (table === 'visit_slots') return makeChain([sampleSlot])
      if (table === 'visit_bookings') return makeChain([sampleBooking])
      return makeChain()
    },
  }))
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('slots starts as empty array', () => {
    const c = useDashboardVisitas()
    expect(c.slots.value).toHaveLength(0)
  })

  it('bookings starts as empty array', () => {
    const c = useDashboardVisitas()
    expect(c.bookings.value).toHaveLength(0)
  })

  it('loading starts as false', () => {
    const c = useDashboardVisitas()
    expect(c.loading.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useDashboardVisitas()
    expect(c.error.value).toBeNull()
  })

  it('visitsEnabled starts as true', () => {
    const c = useDashboardVisitas()
    expect(c.visitsEnabled.value).toBe(true)
  })
})

// ─── sortedSlots ──────────────────────────────────────────────────────────────

describe('sortedSlots', () => {
  it('returns empty when no slots', () => {
    const c = useDashboardVisitas()
    expect(c.sortedSlots.value).toHaveLength(0)
  })

  it('sorts by day_of_week then start_time', () => {
    const c = useDashboardVisitas()
    c.slots.value = [
      { ...sampleSlot, id: 's2', day_of_week: 3, start_time: '08:00' },
      { ...sampleSlot, id: 's1', day_of_week: 1, start_time: '09:00' },
      { ...sampleSlot, id: 's3', day_of_week: 2, start_time: '10:00' },
    ]
    const sorted = c.sortedSlots.value
    expect(sorted[0].id).toBe('s1')
    expect(sorted[1].id).toBe('s3')
    expect(sorted[2].id).toBe('s2')
  })
})

// ─── isSlotFormValid ──────────────────────────────────────────────────────────

describe('isSlotFormValid', () => {
  it('returns true when start_time < end_time and max_visitors > 0', () => {
    const c = useDashboardVisitas()
    c.slotForm.start_time = '09:00'
    c.slotForm.end_time = '18:00'
    c.slotForm.max_visitors = 5
    expect(c.isSlotFormValid.value).toBe(true)
  })

  it('returns false when start_time >= end_time', () => {
    const c = useDashboardVisitas()
    c.slotForm.start_time = '18:00'
    c.slotForm.end_time = '09:00'
    c.slotForm.max_visitors = 5
    expect(c.isSlotFormValid.value).toBe(false)
  })

  it('returns false when max_visitors is 0', () => {
    const c = useDashboardVisitas()
    c.slotForm.start_time = '09:00'
    c.slotForm.end_time = '18:00'
    c.slotForm.max_visitors = 0
    expect(c.isSlotFormValid.value).toBe(false)
  })
})

// ─── upcomingBookings ─────────────────────────────────────────────────────────

describe('upcomingBookings', () => {
  it('includes pending bookings regardless of date', () => {
    const c = useDashboardVisitas()
    c.bookings.value = [{ ...sampleBooking, visit_date: '2020-01-01', status: 'pending' as never }]
    expect(c.upcomingBookings.value).toHaveLength(1)
  })

  it('excludes past confirmed bookings', () => {
    const c = useDashboardVisitas()
    c.bookings.value = [{ ...sampleBooking, visit_date: '2020-01-01', status: 'confirmed' as never }]
    expect(c.upcomingBookings.value).toHaveLength(0)
  })

  it('sorts upcoming by visit_date ascending', () => {
    const c = useDashboardVisitas()
    c.bookings.value = [
      { ...sampleBooking, id: 'b2', visit_date: '2026-07-01', status: 'pending' as never },
      { ...sampleBooking, id: 'b1', visit_date: '2026-06-01', status: 'pending' as never },
    ]
    const upcoming = c.upcomingBookings.value
    expect(upcoming[0].id).toBe('b1')
  })
})

// ─── getDayLabel / getStatusClass ────────────────────────────────────────────

describe('getDayLabel', () => {
  it('returns a label for day 1 (Monday)', () => {
    const c = useDashboardVisitas()
    const label = c.getDayLabel(1)
    expect(label).toBeTruthy()
  })

  it('returns a label for each day 1-7', () => {
    const c = useDashboardVisitas()
    for (let i = 1; i <= 7; i++) {
      expect(c.getDayLabel(i)).toBeTruthy()
    }
  })
})

describe('getStatusClass', () => {
  it('returns a class string for pending', () => {
    const c = useDashboardVisitas()
    const cls = c.getStatusClass('pending')
    expect(cls).toBeTruthy()
    expect(typeof cls).toBe('string')
  })

  it('returns class for confirmed', () => {
    const c = useDashboardVisitas()
    expect(c.getStatusClass('confirmed')).toBeTruthy()
  })
})

// ─── updateSlotFormField ──────────────────────────────────────────────────────

describe('updateSlotFormField', () => {
  it('updates day_of_week', () => {
    const c = useDashboardVisitas()
    c.updateSlotFormField('day_of_week', 3)
    expect(c.slotForm.day_of_week).toBe(3)
  })

  it('updates max_visitors', () => {
    const c = useDashboardVisitas()
    c.updateSlotFormField('max_visitors', 10)
    expect(c.slotForm.max_visitors).toBe(10)
  })

  it('updates start_time', () => {
    const c = useDashboardVisitas()
    c.updateSlotFormField('start_time', '08:30')
    expect(c.slotForm.start_time).toBe('08:30')
  })
})

// ─── init (loadData) ──────────────────────────────────────────────────────────

describe('init', () => {
  it('loads slots and bookings', async () => {
    const c = useDashboardVisitas()
    await c.init()
    expect(c.slots.value).toHaveLength(1)
    expect(c.bookings.value).toHaveLength(1)
    expect(c.loading.value).toBe(false)
  })

  it('sets error when no dealer profile', async () => {
    mockDealerProfile.value = null
    vi.stubGlobal('useDealerDashboard', () => ({
      dealerProfile: mockDealerProfile,
      loadDealer: vi.fn().mockResolvedValue(null),
    }))
    const c = useDashboardVisitas()
    await c.init()
    expect(c.error.value).toBeTruthy()
  })

  it('sets error when slots query throws', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => {
        const chain: Record<string, unknown> = {}
        ;['eq', 'order', 'select', 'limit'].forEach((m) => { chain[m] = () => chain })
        chain.then = (resolve: (v: unknown) => void) => Promise.resolve({ data: null, error: { message: 'Slots error' } }).then(resolve)
        chain.catch = (reject: (e: unknown) => void) => Promise.resolve({ data: null, error: { message: 'Slots error' } }).catch(reject)
        return chain
      },
    }))
    const c = useDashboardVisitas()
    await c.init()
    expect(c.error.value).toBeTruthy()
    expect(c.loading.value).toBe(false)
  })
})

// ─── addSlot ─────────────────────────────────────────────────────────────────

describe('addSlot', () => {
  it('does nothing when form is invalid', async () => {
    const c = useDashboardVisitas()
    c.slotForm.start_time = '18:00'
    c.slotForm.end_time = '09:00' // invalid
    await c.addSlot()
    expect(c.saving.value).toBe(false)
    expect(c.successMsg.value).toBeNull()
  })

  it('inserts slot and reloads data on success', async () => {
    const insertFn = vi.fn(() => Promise.resolve({ data: null, error: null }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'visit_slots') {
          return {
            ...makeChain([sampleSlot]),
            insert: insertFn,
          }
        }
        return makeChain([sampleBooking])
      },
    }))
    const c = useDashboardVisitas()
    c.slotForm.start_time = '09:00'
    c.slotForm.end_time = '18:00'
    c.slotForm.max_visitors = 5
    await c.addSlot()
    expect(insertFn).toHaveBeenCalled()
    expect(c.successMsg.value).toBeTruthy()
    expect(c.saving.value).toBe(false)
  })

  it('sets error when insert throws', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        ...makeChain([sampleSlot]),
        insert: () => Promise.resolve({ data: null, error: { message: 'Insert failed' } }),
      }),
    }))
    const c = useDashboardVisitas()
    c.slotForm.start_time = '09:00'
    c.slotForm.end_time = '18:00'
    c.slotForm.max_visitors = 5
    await c.addSlot()
    expect(c.error.value).toBeTruthy()
    expect(c.saving.value).toBe(false)
  })

  it('sets error when no dealer profile', async () => {
    mockDealerProfile.value = null
    const c = useDashboardVisitas()
    c.slotForm.start_time = '09:00'
    c.slotForm.end_time = '18:00'
    c.slotForm.max_visitors = 5
    await c.addSlot()
    expect(c.error.value).toBeTruthy()
  })
})

// ─── deleteSlot ──────────────────────────────────────────────────────────────

describe('deleteSlot', () => {
  it('removes slot from local state on success', async () => {
    const deleteFn = vi.fn(() => ({ eq: () => Promise.resolve({ data: null, error: null }) }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'visit_slots') return { ...makeChain([sampleSlot]), delete: deleteFn }
        return makeChain([sampleBooking])
      },
    }))
    const c = useDashboardVisitas()
    await c.init()
    expect(c.slots.value).toHaveLength(1)
    await c.deleteSlot('slot-1')
    expect(c.slots.value).toHaveLength(0)
    expect(c.successMsg.value).toBeTruthy()
    expect(c.saving.value).toBe(false)
  })

  it('sets error when delete throws', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        ...makeChain([sampleSlot]),
        delete: () => ({ eq: () => Promise.resolve({ data: null, error: { message: 'Delete failed' } }) }),
      }),
    }))
    const c = useDashboardVisitas()
    await c.deleteSlot('slot-1')
    expect(c.error.value).toBeTruthy()
    expect(c.saving.value).toBe(false)
  })
})

// ─── updateBookingStatus ─────────────────────────────────────────────────────

describe('updateBookingStatus', () => {
  it('updates booking status in local state on success', async () => {
    const updateFn = vi.fn(() => ({ eq: () => Promise.resolve({ data: null, error: null }) }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'visit_bookings') return { ...makeChain([sampleBooking]), update: updateFn }
        return makeChain([sampleSlot])
      },
    }))
    const c = useDashboardVisitas()
    await c.init()
    expect(c.bookings.value[0].status).toBe('pending')
    await c.updateBookingStatus('booking-1', 'confirmed')
    expect(c.bookings.value[0].status).toBe('confirmed')
    expect(c.successMsg.value).toBeTruthy()
    expect(c.saving.value).toBe(false)
  })

  it('sets cancelled message when cancelling', async () => {
    const updateFn = vi.fn(() => ({ eq: () => Promise.resolve({ data: null, error: null }) }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'visit_bookings') return { ...makeChain([sampleBooking]), update: updateFn }
        return makeChain([sampleSlot])
      },
    }))
    const c = useDashboardVisitas()
    await c.init()
    await c.updateBookingStatus('booking-1', 'cancelled')
    expect(c.successMsg.value).toBeTruthy()
  })

  it('sets error when update throws', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        ...makeChain([sampleBooking]),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: { message: 'Update failed' } }) }),
      }),
    }))
    const c = useDashboardVisitas()
    await c.updateBookingStatus('booking-1', 'confirmed')
    expect(c.error.value).toBeTruthy()
    expect(c.saving.value).toBe(false)
  })
})

// ─── fmtDate ─────────────────────────────────────────────────────────────────

describe('fmtDate', () => {
  it('returns -- for null date', () => {
    const c = useDashboardVisitas()
    expect(c.fmtDate(null)).toBe('--')
  })

  it('formats a valid date string', () => {
    const c = useDashboardVisitas()
    const result = c.fmtDate('2026-06-15')
    expect(result).toBeTruthy()
    expect(result).not.toBe('--')
  })
})

// ─── getStatusClass extended ─────────────────────────────────────────────────

describe('getStatusClass — cancelled', () => {
  it('returns class for cancelled', () => {
    const c = useDashboardVisitas()
    expect(c.getStatusClass('cancelled')).toBeTruthy()
  })
})
