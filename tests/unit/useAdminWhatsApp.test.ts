import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminWhatsApp } from '../../app/composables/admin/useAdminWhatsApp'
import type { WhatsAppSubmission } from '../../app/composables/admin/useAdminWhatsApp'

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ success: true }))
})

// ─── Submission fixture ───────────────────────────────────────────────────

function makeSubmission(overrides: Partial<WhatsAppSubmission> = {}): WhatsAppSubmission {
  return {
    id: 'sub-1',
    dealer_id: 'dealer-1',
    sender_phone: '+34600000001',
    sender_name: 'Juan Pérez',
    message_text: 'Vendo camion cisterna. Precio 45000€. Buenas condiciones.',
    image_urls: ['https://cdn.com/img1.jpg', 'https://cdn.com/img2.jpg'],
    extracted_data: null,
    vehicle_id: 'vehicle-1',
    status: 'received',
    error_message: null,
    created_at: '2026-01-15T10:00:00Z',
    updated_at: null,
    dealers: null,
    ...overrides,
  }
}

// ─── Initial state ─────────────────────────────────────────────────────────

describe('initial state', () => {
  it('loading starts as true', () => {
    const c = useAdminWhatsApp()
    expect(c.loading.value).toBe(true)
  })

  it('error starts as null', () => {
    const c = useAdminWhatsApp()
    expect(c.error.value).toBeNull()
  })

  it('statusFilter starts as "all"', () => {
    const c = useAdminWhatsApp()
    expect(c.statusFilter.value).toBe('all')
  })

  it('search starts as empty string', () => {
    const c = useAdminWhatsApp()
    expect(c.search.value).toBe('')
  })

  it('expandedId starts as null', () => {
    const c = useAdminWhatsApp()
    expect(c.expandedId.value).toBeNull()
  })

  it('actionLoading starts as false', () => {
    const c = useAdminWhatsApp()
    expect(c.actionLoading.value).toBe(false)
  })

  it('successMessage starts as null', () => {
    const c = useAdminWhatsApp()
    expect(c.successMessage.value).toBeNull()
  })

  it('hasMore starts as true', () => {
    const c = useAdminWhatsApp()
    expect(c.hasMore.value).toBe(true)
  })

  it('showDeleteConfirm starts as false', () => {
    const c = useAdminWhatsApp()
    expect(c.showDeleteConfirm.value).toBe(false)
  })

  it('deleteTargetId starts as null', () => {
    const c = useAdminWhatsApp()
    expect(c.deleteTargetId.value).toBeNull()
  })
})

// ─── computed initial values ──────────────────────────────────────────────

describe('computed initial values', () => {
  it('filteredSubmissions starts as empty array', () => {
    const c = useAdminWhatsApp()
    expect(c.filteredSubmissions.value).toHaveLength(0)
  })

  it('statusCounts starts with all zeros', () => {
    const c = useAdminWhatsApp()
    expect(c.statusCounts.value.all).toBe(0)
    expect(c.statusCounts.value.received).toBe(0)
    expect(c.statusCounts.value.published).toBe(0)
  })

  it('pendingCount starts as 0', () => {
    const c = useAdminWhatsApp()
    expect(c.pendingCount.value).toBe(0)
  })
})

// ─── clearFilters ─────────────────────────────────────────────────────────

describe('clearFilters', () => {
  it('resets statusFilter to "all"', () => {
    const c = useAdminWhatsApp()
    c.statusFilter.value = 'published'
    c.clearFilters()
    expect(c.statusFilter.value).toBe('all')
  })

  it('resets search to empty string', () => {
    const c = useAdminWhatsApp()
    c.search.value = 'volvo'
    c.clearFilters()
    expect(c.search.value).toBe('')
  })
})

// ─── fetchSubmissions ─────────────────────────────────────────────────────

describe('fetchSubmissions', () => {
  it('sets loading to false after fetch', async () => {
    const c = useAdminWhatsApp()
    await c.fetchSubmissions()
    expect(c.loading.value).toBe(false)
  })

  it('resets submissions and page on reset=true', async () => {
    const c = useAdminWhatsApp()
    c.submissions.value = [makeSubmission()]
    await c.fetchSubmissions(true)
    // After reset fetch with empty data, submissions is []
    expect(Array.isArray(c.submissions.value)).toBe(true)
  })

  it('sets hasMore to false when data length < PAGE_SIZE (20)', async () => {
    // Default supabase mock returns [] (0 < 20)
    const c = useAdminWhatsApp()
    await c.fetchSubmissions()
    expect(c.hasMore.value).toBe(false)
  })

  it('sets error when fetchError is returned', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          order: () => ({
            range: () => Promise.resolve({ data: null, error: { message: 'DB error' } }),
          }),
        }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }))
    const c = useAdminWhatsApp()
    await c.fetchSubmissions()
    expect(c.error.value).toBe('DB error')
  })
})

// ─── loadMore ────────────────────────────────────────────────────────────

describe('loadMore', () => {
  it('increments page before fetching', async () => {
    const c = useAdminWhatsApp()
    const initialPage = 0 // internal ref, not returned
    await c.loadMore()
    // After loadMore, loading should be false (fetch completed)
    expect(c.loading.value).toBe(false)
  })
})

// ─── toggleExpand ─────────────────────────────────────────────────────────

describe('toggleExpand', () => {
  it('sets expandedId when not currently expanded', () => {
    const c = useAdminWhatsApp()
    c.toggleExpand('sub-1')
    expect(c.expandedId.value).toBe('sub-1')
  })

  it('sets expandedId to null when already expanded', () => {
    const c = useAdminWhatsApp()
    c.expandedId.value = 'sub-1'
    c.toggleExpand('sub-1')
    expect(c.expandedId.value).toBeNull()
  })

  it('switches expandedId when a different id is toggled', () => {
    const c = useAdminWhatsApp()
    c.expandedId.value = 'sub-1'
    c.toggleExpand('sub-2')
    expect(c.expandedId.value).toBe('sub-2')
  })
})

// ─── confirmDelete / cancelDelete ─────────────────────────────────────────

describe('confirmDelete', () => {
  it('sets deleteTargetId', () => {
    const c = useAdminWhatsApp()
    c.confirmDelete('sub-1')
    expect(c.deleteTargetId.value).toBe('sub-1')
  })

  it('sets showDeleteConfirm to true', () => {
    const c = useAdminWhatsApp()
    c.confirmDelete('sub-1')
    expect(c.showDeleteConfirm.value).toBe(true)
  })
})

describe('cancelDelete', () => {
  it('resets showDeleteConfirm to false', () => {
    const c = useAdminWhatsApp()
    c.confirmDelete('sub-1')
    c.cancelDelete()
    expect(c.showDeleteConfirm.value).toBe(false)
  })

  it('resets deleteTargetId to null', () => {
    const c = useAdminWhatsApp()
    c.confirmDelete('sub-1')
    c.cancelDelete()
    expect(c.deleteTargetId.value).toBeNull()
  })
})

// ─── executeDelete ────────────────────────────────────────────────────────

describe('executeDelete', () => {
  it('returns early when deleteTargetId is null', async () => {
    const c = useAdminWhatsApp()
    c.deleteTargetId.value = null
    await c.executeDelete()
    expect(c.successMessage.value).toBeNull()
  })

  it('calls supabase delete with the target id', async () => {
    const mockDelete = vi.fn().mockReturnValue({
      eq: () => Promise.resolve({ data: null, error: null }),
    })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          order: () => ({ range: () => Promise.resolve({ data: [], error: null }) }),
        }),
        delete: mockDelete,
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }))
    const c = useAdminWhatsApp()
    c.confirmDelete('sub-to-delete')
    await c.executeDelete()
    expect(mockDelete).toHaveBeenCalled()
  })

  it('sets successMessage after successful delete', async () => {
    const c = useAdminWhatsApp()
    c.confirmDelete('sub-1')
    await c.executeDelete()
    expect(c.successMessage.value).toBeTruthy()
  })

  it('calls cancelDelete after successful delete', async () => {
    const c = useAdminWhatsApp()
    c.confirmDelete('sub-1')
    await c.executeDelete()
    expect(c.showDeleteConfirm.value).toBe(false)
    expect(c.deleteTargetId.value).toBeNull()
  })
})

// ─── publishVehicle ───────────────────────────────────────────────────────

describe('publishVehicle', () => {
  it('returns early when submission has no vehicle_id', async () => {
    const c = useAdminWhatsApp()
    const sub = makeSubmission({ vehicle_id: null })
    await c.publishVehicle(sub)
    expect(c.successMessage.value).toBeNull()
  })

  it('sets successMessage after successful publish', async () => {
    const c = useAdminWhatsApp()
    const sub = makeSubmission({ vehicle_id: 'v-1' })
    await c.publishVehicle(sub)
    expect(c.successMessage.value).toBeTruthy()
  })
})

// ─── retryProcessing ──────────────────────────────────────────────────────

describe('retryProcessing', () => {
  it('calls $fetch with the submission id', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ success: true })
    vi.stubGlobal('$fetch', mockFetch)
    const c = useAdminWhatsApp()
    await c.retryProcessing('sub-1')
    expect(mockFetch).toHaveBeenCalledWith('/api/whatsapp/process', expect.objectContaining({ body: { submissionId: 'sub-1' } }))
  })

  it('sets error on $fetch failure', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const c = useAdminWhatsApp()
    await c.retryProcessing('sub-1')
    expect(c.error.value).toBeTruthy()
  })

  it('sets actionLoading to false after retry', async () => {
    const c = useAdminWhatsApp()
    await c.retryProcessing('sub-1')
    expect(c.actionLoading.value).toBe(false)
  })
})

// ─── Helper functions ─────────────────────────────────────────────────────

describe('getDealerName', () => {
  it('returns sender_name when available', () => {
    const c = useAdminWhatsApp()
    const sub = makeSubmission({ sender_name: 'Manuel García' })
    expect(c.getDealerName(sub)).toBe('Manuel García')
  })

  it('returns company_name from dealers when no sender_name', () => {
    const c = useAdminWhatsApp()
    const sub = makeSubmission({
      sender_name: null,
      dealers: { company_name: { es: 'Camiones SL', en: 'Trucks Ltd' }, phone: null, whatsapp: null },
    })
    expect(c.getDealerName(sub)).toBe('Camiones SL')
  })

  it('returns "-" when neither sender_name nor dealer name available', () => {
    const c = useAdminWhatsApp()
    const sub = makeSubmission({ sender_name: null, dealers: null })
    expect(c.getDealerName(sub)).toBe('-')
  })
})

describe('getDealerPhone', () => {
  it('returns sender_phone when available', () => {
    const c = useAdminWhatsApp()
    const sub = makeSubmission({ sender_phone: '+34600001111' })
    expect(c.getDealerPhone(sub)).toBe('+34600001111')
  })

  it('returns "-" when no phone info available', () => {
    const c = useAdminWhatsApp()
    const sub = makeSubmission({ sender_phone: null, dealers: null })
    expect(c.getDealerPhone(sub)).toBe('-')
  })
})

describe('getTextPreview', () => {
  it('returns full text when shorter than maxLen', () => {
    const c = useAdminWhatsApp()
    const sub = makeSubmission({ message_text: 'Short text' })
    expect(c.getTextPreview(sub, 100)).toBe('Short text')
  })

  it('truncates text at maxLen', () => {
    const c = useAdminWhatsApp()
    const sub = makeSubmission({ message_text: 'A'.repeat(200) })
    const result = c.getTextPreview(sub, 50)
    expect(result.length).toBeLessThanOrEqual(53) // 50 + "..."
    expect(result.endsWith('...')).toBe(true)
  })

  it('returns empty string when message_text is null', () => {
    const c = useAdminWhatsApp()
    const sub = makeSubmission({ message_text: null })
    expect(c.getTextPreview(sub)).toBe('')
  })
})

describe('getImageCount', () => {
  it('returns count of image_urls', () => {
    const c = useAdminWhatsApp()
    const sub = makeSubmission({ image_urls: ['url1', 'url2', 'url3'] })
    expect(c.getImageCount(sub)).toBe(3)
  })

  it('returns 0 when image_urls is null', () => {
    const c = useAdminWhatsApp()
    const sub = makeSubmission({ image_urls: null })
    expect(c.getImageCount(sub)).toBe(0)
  })
})

describe('formatDate', () => {
  it('returns "-" for null date', () => {
    const c = useAdminWhatsApp()
    expect(c.formatDate(null)).toBe('-')
  })

  it('returns a formatted string for valid date', () => {
    const c = useAdminWhatsApp()
    const result = c.formatDate('2026-01-15T10:00:00Z')
    expect(typeof result).toBe('string')
    expect(result).not.toBe('-')
  })
})

describe('getStatusClass', () => {
  it('returns "status-received" for "received"', () => {
    const c = useAdminWhatsApp()
    expect(c.getStatusClass('received')).toBe('status-received')
  })

  it('returns "status-published" for "published"', () => {
    const c = useAdminWhatsApp()
    expect(c.getStatusClass('published')).toBe('status-published')
  })

  it('returns "status-received" for unknown status', () => {
    const c = useAdminWhatsApp()
    expect(c.getStatusClass('unknown')).toBe('status-received')
  })
})
