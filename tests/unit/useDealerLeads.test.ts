import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDealerLeads } from '../../app/composables/useDealerLeads'

// ─── Stubs ────────────────────────────────────────────────────────────────────

function makeChain(data: unknown = [], error: unknown = null, count = 0) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'or', 'order', 'select', 'ilike', 'update', 'neq'].forEach((m) => {
    chain[m] = () => chain
  })
  const resolved = { data, error, count }
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  chain.single = () => Promise.resolve({ data: Array.isArray(data) ? (data[0] ?? null) : data, error })
  return chain
}

function stubClient(data: unknown[] = [], error: unknown = null, count = 0) {
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => makeChain(data, error, count),
      update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    }),
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  stubClient()
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('leads starts as empty array', () => {
    const c = useDealerLeads('dealer-1')
    expect(c.leads.value).toHaveLength(0)
  })

  it('currentLead starts as null', () => {
    const c = useDealerLeads('dealer-1')
    expect(c.currentLead.value).toBeNull()
  })

  it('loading starts as false', () => {
    const c = useDealerLeads('dealer-1')
    expect(c.loading.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useDealerLeads('dealer-1')
    expect(c.error.value).toBeNull()
  })

  it('total starts as 0', () => {
    const c = useDealerLeads('dealer-1')
    expect(c.total.value).toBe(0)
  })
})

// ─── loadLeads ────────────────────────────────────────────────────────────────

describe('loadLeads', () => {
  it('sets error when dealerId is null', async () => {
    const c = useDealerLeads(null)
    await c.loadLeads()
    expect(c.error.value).toBeTruthy()
  })

  it('accepts string dealerId', async () => {
    const c = useDealerLeads('dealer-1')
    await c.loadLeads()
    expect(c.loading.value).toBe(false)
  })

  it('accepts ref dealerId', async () => {
    const c = useDealerLeads({ value: 'dealer-1' })
    await c.loadLeads()
    expect(c.loading.value).toBe(false)
  })

  it('handles null ref dealerId', async () => {
    const c = useDealerLeads({ value: null })
    await c.loadLeads()
    expect(c.error.value).toBeTruthy()
  })

  it('sets leads from DB', async () => {
    stubClient([{
      id: 'lead-1',
      dealer_id: 'dealer-1',
      vehicle_id: 'v-1',
      buyer_name: 'John',
      buyer_email: 'john@example.com',
      buyer_phone: null,
      buyer_location: null,
      message: 'Interested',
      status: 'new',
      dealer_notes: null,
      close_reason: null,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
      status_history: null,
      vehicles: { brand: 'Volvo', model: 'FH', year: 2020 },
    }], null, 1)
    const c = useDealerLeads('dealer-1')
    await c.loadLeads()
    expect(c.leads.value).toHaveLength(1)
    expect(c.total.value).toBe(1)
  })

  it('sets error on DB failure', async () => {
    stubClient(null, new Error('DB error'))
    const c = useDealerLeads('dealer-1')
    await c.loadLeads()
    expect(c.error.value).toBeTruthy()
  })

  it('sets loading to false after success', async () => {
    const c = useDealerLeads('dealer-1')
    await c.loadLeads()
    expect(c.loading.value).toBe(false)
  })
})

// ─── loadLead ─────────────────────────────────────────────────────────────────

describe('loadLead', () => {
  it('sets currentLead to null when no data', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
    }))
    const c = useDealerLeads('dealer-1')
    await c.loadLead('lead-1')
    expect(c.currentLead.value).toBeNull()
  })

  it('sets currentLead from DB', async () => {
    const sampleLead = {
      id: 'lead-1', dealer_id: 'dealer-1', vehicle_id: null, buyer_name: 'Jane',
      buyer_email: null, buyer_phone: null, buyer_location: null, message: null,
      status: 'new', dealer_notes: null, close_reason: null,
      created_at: null, updated_at: null, status_history: null, vehicles: null,
    }
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(sampleLead),
      }),
    }))
    const c = useDealerLeads('dealer-1')
    await c.loadLead('lead-1')
    expect(c.currentLead.value?.id).toBe('lead-1')
  })
})

// ─── updateLeadStatus ─────────────────────────────────────────────────────────

describe('updateLeadStatus', () => {
  it('does nothing when dealerId is null', async () => {
    const c = useDealerLeads(null)
    await c.updateLeadStatus('lead-1', 'closed')
    expect(c.error.value).toBeNull() // no error, just skipped
  })

  it('completes without error on success', async () => {
    const c = useDealerLeads('dealer-1')
    await c.updateLeadStatus('lead-1', 'contacted')
    expect(c.error.value).toBeNull()
  })
})

// ─── updateLeadStatus — local state updates ─────────────────────────────────

describe('updateLeadStatus local state', () => {
  it('updates local lead in leads array when found', async () => {
    const sampleLead = {
      id: 'lead-1', dealer_id: 'dealer-1', vehicle_id: null,
      buyer_name: 'Jane', buyer_email: null, buyer_phone: null,
      buyer_location: null, message: null, status: 'new',
      dealer_notes: null, close_reason: null, created_at: null,
      updated_at: null, status_history: null, vehicles: null,
    }
    stubClient([sampleLead], null, 1)
    const c = useDealerLeads('dealer-1')
    await c.loadLeads()
    expect(c.leads.value).toHaveLength(1)

    // Now update the lead status
    const result = await c.updateLeadStatus('lead-1', 'contacted', 'Called buyer')
    expect(result).toBe(true)
    expect(c.leads.value[0]!.status).toBe('contacted')
    expect(c.leads.value[0]!.dealer_notes).toBe('Called buyer')
    expect(c.leads.value[0]!.status_history).toHaveLength(1)
    expect(c.leads.value[0]!.status_history[0]!.from).toBe('new')
    expect(c.leads.value[0]!.status_history[0]!.to).toBe('contacted')
  })

  it('updates currentLead when its id matches', async () => {
    const sampleLead = {
      id: 'lead-1', dealer_id: 'dealer-1', vehicle_id: null,
      buyer_name: 'Jane', buyer_email: null, buyer_phone: null,
      buyer_location: null, message: null, status: 'new',
      dealer_notes: null, close_reason: null, created_at: null,
      updated_at: null, status_history: null, vehicles: null,
    }
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(sampleLead),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }))
    const c = useDealerLeads('dealer-1')
    await c.loadLead('lead-1')
    expect(c.currentLead.value).not.toBeNull()

    const result = await c.updateLeadStatus('lead-1', 'won')
    expect(result).toBe(true)
    expect(c.currentLead.value!.status).toBe('won')
  })

  it('preserves existing dealer_notes when notes not provided', async () => {
    const sampleLead = {
      id: 'lead-1', dealer_id: 'dealer-1', vehicle_id: null,
      buyer_name: 'Jane', buyer_email: null, buyer_phone: null,
      buyer_location: null, message: null, status: 'new',
      dealer_notes: 'Existing notes', close_reason: null, created_at: null,
      updated_at: null, status_history: null, vehicles: null,
    }
    stubClient([sampleLead], null, 1)
    const c = useDealerLeads('dealer-1')
    await c.loadLeads()

    await c.updateLeadStatus('lead-1', 'viewed')
    expect(c.leads.value[0]!.dealer_notes).toBe('Existing notes')
  })

  it('uses default "new" status when lead not found in local state', async () => {
    stubClient()
    const c = useDealerLeads('dealer-1')
    // No loadLeads or loadLead — lead is not in local state
    const result = await c.updateLeadStatus('unknown-lead', 'contacted')
    expect(result).toBe(true)
    // Should not crash; it uses 'new' as oldStatus
  })

  it('returns false and sets error on DB failure', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(),
        update: () => ({
          eq: () => Promise.resolve({ data: null, error: new Error('Update failed') }),
        }),
      }),
    }))
    const c = useDealerLeads('dealer-1')
    const result = await c.updateLeadStatus('lead-1', 'lost')
    expect(result).toBe(false)
    expect(c.error.value).toBeTruthy()
  })

  it('sets generic error message for non-Error throw', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(),
        update: () => ({
          eq: () => Promise.reject('string error'),
        }),
      }),
    }))
    const c = useDealerLeads('dealer-1')
    const result = await c.updateLeadStatus('lead-1', 'lost')
    expect(result).toBe(false)
    expect(c.error.value).toBe('Error updating lead status')
  })
})

// ─── loadLeads with filters ──────────────────────────────────────────────────

describe('loadLeads with filters', () => {
  it('applies status filter', async () => {
    const selectSpy = vi.fn()
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: (...args: unknown[]) => {
          selectSpy(...args)
          return makeChain([], null, 0)
        },
      }),
    }))
    const c = useDealerLeads('dealer-1')
    await c.loadLeads({ status: 'won' })
    expect(c.loading.value).toBe(false)
  })

  it('applies vehicleId filter', async () => {
    const c = useDealerLeads('dealer-1')
    await c.loadLeads({ vehicleId: 'v-123' })
    expect(c.loading.value).toBe(false)
  })

  it('applies search filter', async () => {
    const c = useDealerLeads('dealer-1')
    await c.loadLeads({ search: 'John' })
    expect(c.loading.value).toBe(false)
  })

  it('maps vehicle fields correctly from joined data', async () => {
    stubClient([{
      id: 'lead-1', dealer_id: 'dealer-1', vehicle_id: 'v-1',
      buyer_name: 'John', buyer_email: 'john@test.com', buyer_phone: '+34600',
      buyer_location: 'Madrid', message: 'Hi', status: 'contacted',
      dealer_notes: 'Notes', close_reason: null, created_at: '2026-01-01',
      updated_at: '2026-01-02',
      status_history: [{ from: 'new', to: 'contacted', changed_at: '2026-01-02', notes: null }],
      vehicles: { brand: 'Scania', model: 'R500', year: 2022 },
    }], null, 1)
    const c = useDealerLeads('dealer-1')
    await c.loadLeads()
    expect(c.leads.value[0]!.vehicle_brand).toBe('Scania')
    expect(c.leads.value[0]!.vehicle_model).toBe('R500')
    expect(c.leads.value[0]!.vehicle_year).toBe(2022)
    expect(c.leads.value[0]!.status_history).toHaveLength(1)
  })

  it('handles non-Error exception in loadLeads', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => { throw 'string exception' },
      }),
    }))
    const c = useDealerLeads('dealer-1')
    await c.loadLeads()
    expect(c.error.value).toBe('Error loading leads')
  })
})

// ─── loadLead error handling ─────────────────────────────────────────────────

describe('loadLead error handling', () => {
  it('returns null when dealerId is null', async () => {
    const c = useDealerLeads(null)
    const result = await c.loadLead('lead-1')
    expect(result).toBeNull()
  })

  it('sets error on DB failure', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: new Error('Not found') }),
            }),
          }),
        }),
      }),
    }))
    const c = useDealerLeads('dealer-1')
    const result = await c.loadLead('lead-1')
    expect(result).toBeNull()
    expect(c.error.value).toBeTruthy()
  })

  it('sets generic error message for non-Error exceptions', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => Promise.reject('string error'),
            }),
          }),
        }),
      }),
    }))
    const c = useDealerLeads('dealer-1')
    const result = await c.loadLead('lead-1')
    expect(result).toBeNull()
    expect(c.error.value).toBe('Error loading lead')
  })

  it('sets loading to false after error', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => Promise.reject(new Error('fail')),
            }),
          }),
        }),
      }),
    }))
    const c = useDealerLeads('dealer-1')
    await c.loadLead('lead-1')
    expect(c.loading.value).toBe(false)
  })
})

// ─── updateLeadNotes ──────────────────────────────────────────────────────────

describe('updateLeadNotes', () => {
  it('does nothing when dealerId is null', async () => {
    const c = useDealerLeads(null)
    await c.updateLeadNotes('lead-1', 'some notes')
    expect(c.error.value).toBeNull()
  })

  it('completes without error on success', async () => {
    const c = useDealerLeads('dealer-1')
    await c.updateLeadNotes('lead-1', 'some notes')
    expect(c.error.value).toBeNull()
  })

  it('updates local leads array on success', async () => {
    const sampleLead = {
      id: 'lead-1', dealer_id: 'dealer-1', vehicle_id: null,
      buyer_name: 'Jane', buyer_email: null, buyer_phone: null,
      buyer_location: null, message: null, status: 'new',
      dealer_notes: null, close_reason: null, created_at: null,
      updated_at: null, status_history: null, vehicles: null,
    }
    stubClient([sampleLead], null, 1)
    const c = useDealerLeads('dealer-1')
    await c.loadLeads()

    await c.updateLeadNotes('lead-1', 'New notes here')
    expect(c.leads.value[0]!.dealer_notes).toBe('New notes here')
  })

  it('updates currentLead on success', async () => {
    const sampleLead = {
      id: 'lead-1', dealer_id: 'dealer-1', vehicle_id: null,
      buyer_name: 'Jane', buyer_email: null, buyer_phone: null,
      buyer_location: null, message: null, status: 'new',
      dealer_notes: null, close_reason: null, created_at: null,
      updated_at: null, status_history: null, vehicles: null,
    }
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(sampleLead),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }))
    const c = useDealerLeads('dealer-1')
    await c.loadLead('lead-1')

    await c.updateLeadNotes('lead-1', 'Updated note')
    expect(c.currentLead.value!.dealer_notes).toBe('Updated note')
  })

  it('returns false on DB error', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(),
        update: () => ({
          eq: () => Promise.resolve({ data: null, error: new Error('DB error') }),
        }),
      }),
    }))
    const c = useDealerLeads('dealer-1')
    const result = await c.updateLeadNotes('lead-1', 'notes')
    expect(result).toBe(false)
    expect(c.error.value).toBeTruthy()
  })

  it('sets generic error for non-Error exception', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(),
        update: () => ({
          eq: () => Promise.reject('string fail'),
        }),
      }),
    }))
    const c = useDealerLeads('dealer-1')
    const result = await c.updateLeadNotes('lead-1', 'notes')
    expect(result).toBe(false)
    expect(c.error.value).toBe('Error updating notes')
  })
})

// ─── updateCloseReason ────────────────────────────────────────────────────────

describe('updateCloseReason', () => {
  it('returns true on success', async () => {
    const c = useDealerLeads('dealer-1')
    const result = await c.updateCloseReason('lead-1', 'Lost to competitor')
    expect(result).toBe(true)
  })

  it('updates currentLead.close_reason on success', async () => {
    const sampleLead = {
      id: 'lead-1', dealer_id: 'dealer-1', vehicle_id: null,
      buyer_name: 'Jane', buyer_email: null, buyer_phone: null,
      buyer_location: null, message: null, status: 'lost',
      dealer_notes: null, close_reason: null, created_at: null,
      updated_at: null, status_history: null, vehicles: null,
    }
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(sampleLead),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }))
    const c = useDealerLeads('dealer-1')
    await c.loadLead('lead-1')

    await c.updateCloseReason('lead-1', 'Budget constraints')
    expect(c.currentLead.value!.close_reason).toBe('Budget constraints')
  })

  it('does not update currentLead when id does not match', async () => {
    const sampleLead = {
      id: 'lead-1', dealer_id: 'dealer-1', vehicle_id: null,
      buyer_name: 'Jane', buyer_email: null, buyer_phone: null,
      buyer_location: null, message: null, status: 'lost',
      dealer_notes: null, close_reason: null, created_at: null,
      updated_at: null, status_history: null, vehicles: null,
    }
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(sampleLead),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }))
    const c = useDealerLeads('dealer-1')
    await c.loadLead('lead-1')

    await c.updateCloseReason('lead-999', 'Price too high')
    expect(c.currentLead.value!.close_reason).toBeNull()
  })

  it('returns false on DB error', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(),
        update: () => ({
          eq: () => Promise.resolve({ data: null, error: new Error('DB fail') }),
        }),
      }),
    }))
    const c = useDealerLeads('dealer-1')
    const result = await c.updateCloseReason('lead-1', 'reason')
    expect(result).toBe(false)
    expect(c.error.value).toBeTruthy()
  })

  it('sets generic error for non-Error exception', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(),
        update: () => ({
          eq: () => Promise.reject('string error'),
        }),
      }),
    }))
    const c = useDealerLeads('dealer-1')
    const result = await c.updateCloseReason('lead-1', 'reason')
    expect(result).toBe(false)
    expect(c.error.value).toBe('Error updating close reason')
  })
})
