import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useLeadTracking } from '../../app/composables/useLeadTracking'

// ─── Stub helpers ──────────────────────────────────────────────────────────────

function stubClient(mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })) {
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({ insert: mockInsert }),
  }))
  return mockInsert
}

beforeEach(() => {
  vi.clearAllMocks()
  stubClient()
})

// ─── trackContactClick ────────────────────────────────────────────────────────

describe('trackContactClick', () => {
  it('calls insert with event_type contact_click', () => {
    const mockInsert = stubClient()
    const c = useLeadTracking()
    c.trackContactClick('vehicle-1', 'dealer-1', 'phone')
    expect(mockInsert).toHaveBeenCalledTimes(1)
    const [row] = mockInsert.mock.calls[0] as [Record<string, unknown>]
    expect(row.event_type).toBe('contact_click')
  })

  it('includes vehicle_id in metadata', () => {
    const mockInsert = stubClient()
    const c = useLeadTracking()
    c.trackContactClick('vehicle-1', 'dealer-1', 'whatsapp')
    const [row] = mockInsert.mock.calls[0] as [Record<string, unknown>]
    const metadata = row.metadata as Record<string, unknown>
    expect(metadata.vehicle_id).toBe('vehicle-1')
  })

  it('includes method in metadata', () => {
    const mockInsert = stubClient()
    const c = useLeadTracking()
    c.trackContactClick('v1', 'd1', 'form')
    const [row] = mockInsert.mock.calls[0] as [Record<string, unknown>]
    const metadata = row.metadata as Record<string, unknown>
    expect(metadata.method).toBe('form')
  })

  it('sets entity_type to lead (contact_click does not include "view")', () => {
    const mockInsert = stubClient()
    const c = useLeadTracking()
    c.trackContactClick('v1', 'd1', 'phone')
    const [row] = mockInsert.mock.calls[0] as [Record<string, unknown>]
    expect(row.entity_type).toBe('lead')
  })

  it('sets entity_id from vehicle_id in data', () => {
    const mockInsert = stubClient()
    const c = useLeadTracking()
    c.trackContactClick('vehicle-42', 'dealer-1', 'phone')
    const [row] = mockInsert.mock.calls[0] as [Record<string, unknown>]
    expect(row.entity_id).toBe('vehicle-42')
  })
})

// ─── trackFichaView ───────────────────────────────────────────────────────────

describe('trackFichaView', () => {
  it('calls insert with event_type ficha_view', () => {
    const mockInsert = stubClient()
    const c = useLeadTracking()
    c.trackFichaView('vehicle-1', 'dealer-1')
    const [row] = mockInsert.mock.calls[0] as [Record<string, unknown>]
    expect(row.event_type).toBe('ficha_view')
  })

  it('sets entity_type to vehicle (ficha_view contains "view")', () => {
    const mockInsert = stubClient()
    const c = useLeadTracking()
    c.trackFichaView('v1', 'd1')
    const [row] = mockInsert.mock.calls[0] as [Record<string, unknown>]
    expect(row.entity_type).toBe('vehicle')
  })

  it('includes vehicle_id and dealer_id in metadata', () => {
    const mockInsert = stubClient()
    const c = useLeadTracking()
    c.trackFichaView('vehicle-1', 'dealer-5')
    const [row] = mockInsert.mock.calls[0] as [Record<string, unknown>]
    const metadata = row.metadata as Record<string, unknown>
    expect(metadata.vehicle_id).toBe('vehicle-1')
    expect(metadata.dealer_id).toBe('dealer-5')
  })
})

// ─── trackFavorite ────────────────────────────────────────────────────────────

describe('trackFavorite', () => {
  it('calls insert with event_type favorite_add', () => {
    const mockInsert = stubClient()
    const c = useLeadTracking()
    c.trackFavorite('vehicle-1')
    const [row] = mockInsert.mock.calls[0] as [Record<string, unknown>]
    expect(row.event_type).toBe('favorite_add')
  })

  it('sets entity_type to lead (favorite_add does not include "view")', () => {
    const mockInsert = stubClient()
    const c = useLeadTracking()
    c.trackFavorite('v1')
    const [row] = mockInsert.mock.calls[0] as [Record<string, unknown>]
    expect(row.entity_type).toBe('lead')
  })

  it('includes vehicle_id in metadata', () => {
    const mockInsert = stubClient()
    const c = useLeadTracking()
    c.trackFavorite('vehicle-99')
    const [row] = mockInsert.mock.calls[0] as [Record<string, unknown>]
    const metadata = row.metadata as Record<string, unknown>
    expect(metadata.vehicle_id).toBe('vehicle-99')
  })
})
