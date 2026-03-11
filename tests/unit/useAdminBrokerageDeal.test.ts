import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  useAdminBrokerageDeal,
  getDealPhase,
  getActionLabel,
  getActorLabel,
} from '../../app/composables/admin/useAdminBrokerageDeal'

// ─── Supabase chain mock ──────────────────────────────────────────────────

function makeChain(result: unknown = { data: [], error: null }) {
  const chain: Record<string, (..._: unknown[]) => unknown> = {}
  for (const m of [
    'select', 'insert', 'update', 'delete',
    'eq', 'neq', 'not', 'in', 'or', 'order', 'limit', 'match',
  ]) {
    chain[m] = () => chain
  }
  chain['single'] = () => ({ then: (resolve: (v: unknown) => unknown) => resolve(result) })
  Object.assign(chain, { then: (resolve: (v: unknown) => unknown) => resolve(result) })
  return chain
}

let mockFrom: ReturnType<typeof vi.fn>

vi.stubGlobal('useSupabaseClient', () => ({
  from: (...args: unknown[]) => mockFrom(...args),
}))

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom = vi.fn(() => makeChain({ data: [], error: null }))
})

function makeDealId(id: string | null = 'deal-1') {
  return { value: id }
}

// ─── Pure helpers ─────────────────────────────────────────────────────────

describe('getDealPhase', () => {
  it('returns "qualifying" for qualifying_buyer', () => {
    expect(getDealPhase('qualifying_buyer')).toBe('qualifying')
  })

  it('returns "active" for human_takeover', () => {
    expect(getDealPhase('human_takeover')).toBe('active')
  })

  it('returns "closed" for deal_closed', () => {
    expect(getDealPhase('deal_closed')).toBe('closed')
  })

  it('returns "unknown" for unrecognized status', () => {
    expect(getDealPhase('nonexistent' as never)).toBe('unknown')
  })
})

describe('getActionLabel', () => {
  it('returns "Deal creado" for deal_created', () => {
    expect(getActionLabel('deal_created')).toBe('Deal creado')
  })

  it('returns "Estado cambiado" for status_changed', () => {
    expect(getActionLabel('status_changed')).toBe('Estado cambiado')
  })

  it('returns "Mensaje anadido" for message_added', () => {
    expect(getActionLabel('message_added')).toBe('Mensaje anadido')
  })

  it('returns action itself for unknown action', () => {
    expect(getActionLabel('custom_action')).toBe('custom_action')
  })
})

describe('getActorLabel', () => {
  it('returns "Sistema" for "system"', () => {
    expect(getActorLabel('system')).toBe('Sistema')
  })

  it('returns "Tracciona IA" for tracciona_ai', () => {
    expect(getActorLabel('tracciona_ai')).toBe('Tracciona IA')
  })

  it('returns "Tank Humano" for tank_human', () => {
    expect(getActorLabel('tank_human')).toBe('Tank Humano')
  })

  it('strips tank_human: prefix for specific humans', () => {
    expect(getActorLabel('tank_human:john@tank.es')).toBe('Tank: john@tank.es')
  })

  it('returns actor itself for unknown actor', () => {
    expect(getActorLabel('custom_actor')).toBe('custom_actor')
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('deal starts as null', () => {
    const c = useAdminBrokerageDeal(makeDealId(null))
    expect(c.deal.value).toBeNull()
  })

  it('messages starts as empty array', () => {
    const c = useAdminBrokerageDeal(makeDealId(null))
    expect(c.messages.value).toEqual([])
  })

  it('auditLog starts as empty array', () => {
    const c = useAdminBrokerageDeal(makeDealId(null))
    expect(c.auditLog.value).toEqual([])
  })

  it('loading starts as false', () => {
    const c = useAdminBrokerageDeal(makeDealId(null))
    expect(c.loading.value).toBe(false)
  })

  it('saving starts as false', () => {
    const c = useAdminBrokerageDeal(makeDealId(null))
    expect(c.saving.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useAdminBrokerageDeal(makeDealId(null))
    expect(c.error.value).toBeNull()
  })

  it('validNextStatuses starts as empty (no deal)', () => {
    const c = useAdminBrokerageDeal(makeDealId(null))
    expect(c.validNextStatuses.value).toEqual([])
  })

  it('dealPhase starts as "unknown" (no deal)', () => {
    const c = useAdminBrokerageDeal(makeDealId(null))
    expect(c.dealPhase.value).toBe('unknown')
  })
})

// ─── fetchDealDetail ──────────────────────────────────────────────────────

describe('fetchDealDetail', () => {
  it('does nothing when dealId is null', async () => {
    const c = useAdminBrokerageDeal(makeDealId(null))
    await c.fetchDealDetail()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('calls supabase.from("brokerage_deals")', async () => {
    const c = useAdminBrokerageDeal(makeDealId('deal-1'))
    await c.fetchDealDetail()
    expect(mockFrom).toHaveBeenCalledWith('brokerage_deals')
  })

  it('calls supabase.from("brokerage_messages")', async () => {
    const c = useAdminBrokerageDeal(makeDealId('deal-1'))
    await c.fetchDealDetail()
    expect(mockFrom).toHaveBeenCalledWith('brokerage_messages')
  })

  it('calls supabase.from("brokerage_audit_log")', async () => {
    const c = useAdminBrokerageDeal(makeDealId('deal-1'))
    await c.fetchDealDetail()
    expect(mockFrom).toHaveBeenCalledWith('brokerage_audit_log')
  })

  it('populates deal from deal result', async () => {
    const dealData = {
      id: 'deal-1',
      status: 'qualifying_buyer',
      buyer_id: null,
      deal_mode: 'broker',
    }
    mockFrom.mockImplementation((table: string) => {
      if (table === 'brokerage_deals') {
        return makeChain({ data: dealData, error: null })
      }
      return makeChain({ data: [], error: null })
    })
    const c = useAdminBrokerageDeal(makeDealId('deal-1'))
    await c.fetchDealDetail()
    expect(c.deal.value).toMatchObject({ id: 'deal-1', status: 'qualifying_buyer' })
  })

  it('sets loading to false after fetch', async () => {
    const c = useAdminBrokerageDeal(makeDealId('deal-1'))
    await c.fetchDealDetail()
    expect(c.loading.value).toBe(false)
  })

  it('sets error on deal fetch failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('db error') }))
    const c = useAdminBrokerageDeal(makeDealId('deal-1'))
    await c.fetchDealDetail()
    expect(c.error.value).toBeTruthy()
  })
})

// ─── transitionStatus ─────────────────────────────────────────────────────

describe('transitionStatus', () => {
  it('returns false when deal is null', async () => {
    const c = useAdminBrokerageDeal(makeDealId(null))
    const ok = await c.transitionStatus('manual_review')
    expect(ok).toBe(false)
  })

  it('returns false for invalid transition', async () => {
    const c = useAdminBrokerageDeal(makeDealId('deal-1'))
    // Set deal manually
    c.deal.value = { id: 'deal-1', status: 'deal_closed' } as never
    const ok = await c.transitionStatus('qualifying_buyer')
    expect(ok).toBe(false)
  })

  it('sets error message for invalid transition', async () => {
    const c = useAdminBrokerageDeal(makeDealId('deal-1'))
    c.deal.value = { id: 'deal-1', status: 'deal_closed' } as never
    await c.transitionStatus('qualifying_buyer')
    expect(c.error.value).toBeTruthy()
  })

  it('calls from("brokerage_deals") for valid transition', async () => {
    const c = useAdminBrokerageDeal(makeDealId('deal-1'))
    c.deal.value = { id: 'deal-1', status: 'qualifying_buyer' } as never
    await c.transitionStatus('manual_review')
    expect(mockFrom).toHaveBeenCalledWith('brokerage_deals')
  })

  it('sets saving to false after completion', async () => {
    const c = useAdminBrokerageDeal(makeDealId('deal-1'))
    c.deal.value = { id: 'deal-1', status: 'qualifying_buyer' } as never
    await c.transitionStatus('manual_review')
    expect(c.saving.value).toBe(false)
  })

  it('returns false on supabase error', async () => {
    mockFrom.mockReturnValue(makeChain({ error: new Error('update error') }))
    const c = useAdminBrokerageDeal(makeDealId('deal-1'))
    c.deal.value = { id: 'deal-1', status: 'qualifying_buyer' } as never
    const ok = await c.transitionStatus('manual_review')
    expect(ok).toBe(false)
  })
})

// ─── addMessage ───────────────────────────────────────────────────────────

describe('addMessage', () => {
  it('returns false when deal is null', async () => {
    const c = useAdminBrokerageDeal(makeDealId(null))
    const ok = await c.addMessage({
      content: 'Hello',
      direction: 'outbound',
      channel: 'whatsapp',
      sender_entity: 'tank_human',
      recipient_entity: 'buyer',
    })
    expect(ok).toBe(false)
  })

  it('calls from("brokerage_messages") when deal is set', async () => {
    const c = useAdminBrokerageDeal(makeDealId('deal-1'))
    c.deal.value = { id: 'deal-1', status: 'human_takeover' } as never
    await c.addMessage({
      content: 'Hello',
      direction: 'outbound',
      channel: 'whatsapp',
      sender_entity: 'tank_human',
      recipient_entity: 'buyer',
    })
    expect(mockFrom).toHaveBeenCalledWith('brokerage_messages')
  })

  it('returns false on insert error', async () => {
    mockFrom.mockReturnValue(makeChain({ error: new Error('insert error') }))
    const c = useAdminBrokerageDeal(makeDealId('deal-1'))
    c.deal.value = { id: 'deal-1', status: 'human_takeover' } as never
    const ok = await c.addMessage({
      content: 'Hello',
      direction: 'outbound',
      channel: 'whatsapp',
      sender_entity: 'tank_human',
      recipient_entity: 'buyer',
    })
    expect(ok).toBe(false)
  })

  it('sets saving to false after completion', async () => {
    const c = useAdminBrokerageDeal(makeDealId('deal-1'))
    c.deal.value = { id: 'deal-1', status: 'human_takeover' } as never
    await c.addMessage({
      content: 'Test',
      direction: 'inbound',
      channel: 'email',
      sender_entity: 'buyer',
      recipient_entity: 'tank_human',
    })
    expect(c.saving.value).toBe(false)
  })
})

// ─── updateDealFields ─────────────────────────────────────────────────────

describe('updateDealFields', () => {
  it('returns false when deal is null', async () => {
    const c = useAdminBrokerageDeal(makeDealId(null))
    const ok = await c.updateDealFields({ human_assignee: 'John' })
    expect(ok).toBe(false)
  })

  it('calls from("brokerage_deals") when deal is set', async () => {
    const c = useAdminBrokerageDeal(makeDealId('deal-1'))
    c.deal.value = { id: 'deal-1', status: 'human_takeover' } as never
    await c.updateDealFields({ human_assignee: 'John' })
    expect(mockFrom).toHaveBeenCalledWith('brokerage_deals')
  })

  it('returns false on update error', async () => {
    mockFrom.mockReturnValue(makeChain({ error: new Error('update error') }))
    const c = useAdminBrokerageDeal(makeDealId('deal-1'))
    c.deal.value = { id: 'deal-1', status: 'human_takeover' } as never
    const ok = await c.updateDealFields({ human_assignee: 'John' })
    expect(ok).toBe(false)
  })
})

// ─── assignHuman ──────────────────────────────────────────────────────────

describe('assignHuman', () => {
  it('calls updateDealFields with human_assignee', async () => {
    const c = useAdminBrokerageDeal(makeDealId('deal-1'))
    c.deal.value = { id: 'deal-1', status: 'human_takeover' } as never
    await c.assignHuman('Maria Garcia')
    expect(mockFrom).toHaveBeenCalledWith('brokerage_deals')
  })

  it('returns false when deal is null', async () => {
    const c = useAdminBrokerageDeal(makeDealId(null))
    const ok = await c.assignHuman('Maria Garcia')
    expect(ok).toBe(false)
  })
})
