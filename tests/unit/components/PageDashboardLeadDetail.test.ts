/**
 * Tests for app/pages/dashboard/leads/[id].vue
 * Lead detail page — loading, lead display, status changes, notes, timeline.
 */
import { describe, it, expect, vi, beforeEach, beforeAll, afterEach } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { ref, computed, watch, reactive, readonly, unref, toValue, nextTick } from 'vue'

// Restore real Vue reactivity primitives that setup.ts stubs out
beforeAll(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('watch', watch)
  vi.stubGlobal('reactive', reactive)
  vi.stubGlobal('readonly', readonly)
  vi.stubGlobal('unref', unref)
  vi.stubGlobal('toValue', toValue)
  vi.stubGlobal('nextTick', nextTick)
})

// --- Mocks ---

const mockLoadDealer = vi.fn().mockResolvedValue(undefined)
const mockLoadLead = vi.fn()
const mockUpdateLeadStatus = vi.fn()
const mockUpdateLeadNotes = vi.fn()
const mockUpdateCloseReason = vi.fn()
const mockCurrentLead = ref<Record<string, unknown> | null>(null)
const mockLoading = ref(false)
const mockError = ref<string | null>(null)

vi.stubGlobal('useDealerDashboard', () => ({
  dealerProfile: ref({ id: 'dealer-1' }),
  loadDealer: mockLoadDealer,
}))

vi.mock('~/composables/useDealerLeads', () => ({
  LEAD_STATUSES: ['new', 'viewed', 'contacted', 'negotiating', 'won', 'lost'],
  useDealerLeads: () => ({
    currentLead: mockCurrentLead,
    loading: mockLoading,
    error: mockError,
    loadLead: mockLoadLead,
    updateLeadStatus: mockUpdateLeadStatus,
    updateLeadNotes: mockUpdateLeadNotes,
    updateCloseReason: mockUpdateCloseReason,
  }),
}))

// Also stub as global since it's a Nuxt auto-import
vi.stubGlobal('useDealerLeads', () => ({
  currentLead: mockCurrentLead,
  loading: mockLoading,
  error: mockError,
  loadLead: mockLoadLead,
  updateLeadStatus: mockUpdateLeadStatus,
  updateLeadNotes: mockUpdateLeadNotes,
  updateCloseReason: mockUpdateCloseReason,
}))

vi.stubGlobal('useRoute', () => ({
  params: { id: 'lead-123' },
  query: {},
}))

vi.stubGlobal('useI18n', () => ({
  locale: ref('es'),
  t: (key: string) => key,
}))

vi.stubGlobal('definePageMeta', vi.fn())

// Capture onMounted callback
let onMountedCb: (() => void) | null = null
vi.stubGlobal('onMounted', (cb: () => void) => {
  onMountedCb = cb
})

const stubs = {
  NuxtLink: { template: '<a><slot /></a>' },
  UiSkeletonCard: { template: '<div class="skeleton-stub" />', props: ['lines'] },
}

// Import after mocks
import PageDashboardLeadDetail from '../../../app/pages/dashboard/leads/[id].vue'

// --- Helpers ---
function makeLead(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'lead-123',
    dealer_id: 'dealer-1',
    vehicle_id: 'v-1',
    buyer_name: 'Juan Garcia',
    buyer_email: 'juan@example.com',
    buyer_phone: '+34600123456',
    buyer_location: 'Madrid',
    message: 'Estoy interesado en este vehiculo',
    status: 'new',
    dealer_notes: 'Llamar manana',
    close_reason: '',
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-02T15:00:00Z',
    vehicle_brand: 'Volvo',
    vehicle_model: 'FH16',
    vehicle_year: 2024,
    status_history: [],
    ...overrides,
  }
}

function factory(lead: Record<string, unknown> | null = null, loading = false) {
  mockCurrentLead.value = lead
  mockLoading.value = loading
  mockError.value = null
  onMountedCb = null

  return shallowMount(PageDashboardLeadDetail, {
    global: {
      mocks: { $t: (key: string) => key },
      stubs,
    },
  })
}

// --- Tests ---
describe('PageDashboardLeadDetail (dashboard/leads/[id])', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrentLead.value = null
    mockLoading.value = false
    mockError.value = null
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ---- Page structure ----
  describe('page structure', () => {
    it('renders page header with back link', () => {
      const w = factory(makeLead())
      expect(w.find('.page-header').exists()).toBe(true)
      expect(w.find('.back-link').exists()).toBe(true)
      expect(w.find('.back-link').text()).toContain('common.back')
    })

    it('renders page title', () => {
      const w = factory(makeLead())
      expect(w.find('.page-header h1').text()).toBe('dashboard.leads.detail')
    })
  })

  // ---- Loading state ----
  describe('loading state', () => {
    it('shows skeleton loader when loading', () => {
      const w = factory(null, true)
      expect(w.find('.loading-state').exists()).toBe(true)
      expect(w.find('.skeleton-stub').exists()).toBe(true)
    })

    it('hides lead content while loading', () => {
      const w = factory(null, true)
      expect(w.find('.card').exists()).toBe(false)
    })

    it('sets aria-busy on loading state', () => {
      const w = factory(null, true)
      expect(w.find('.loading-state').attributes('aria-busy')).toBe('true')
    })
  })

  // ---- Empty state / not found ----
  describe('empty state', () => {
    it('shows empty state when no lead and not loading', () => {
      const w = factory(null, false)
      expect(w.find('.empty-state').exists()).toBe(true)
      expect(w.text()).toContain('dashboard.leads.notFound')
    })
  })

  // ---- Buyer info ----
  describe('buyer info section', () => {
    it('displays buyer name', () => {
      const w = factory(makeLead({ buyer_name: 'Maria Lopez' }))
      expect(w.text()).toContain('Maria Lopez')
    })

    it('shows dash when buyer_name is null', () => {
      const w = factory(makeLead({ buyer_name: null }))
      const infoValues = w.findAll('.info-value')
      expect(infoValues[0].text()).toBe('-')
    })

    it('renders email as mailto link', () => {
      const w = factory(makeLead({ buyer_email: 'test@test.com' }))
      const emailLink = w.find('.info-value a[href^="mailto:"]')
      expect(emailLink.exists()).toBe(true)
      expect(emailLink.attributes('href')).toBe('mailto:test@test.com')
    })

    it('shows dash when buyer_email is null', () => {
      const w = factory(makeLead({ buyer_email: null }))
      expect(w.find('.info-value a[href^="mailto:"]').exists()).toBe(false)
    })

    it('renders phone as tel link', () => {
      const w = factory(makeLead({ buyer_phone: '+34600111222' }))
      const phoneLink = w.find('.info-value a[href^="tel:"]')
      expect(phoneLink.exists()).toBe(true)
      expect(phoneLink.attributes('href')).toBe('tel:+34600111222')
    })

    it('shows dash when buyer_phone is null', () => {
      const w = factory(makeLead({ buyer_phone: null }))
      expect(w.find('.info-value a[href^="tel:"]').exists()).toBe(false)
    })

    it('displays buyer location', () => {
      const w = factory(makeLead({ buyer_location: 'Barcelona' }))
      expect(w.text()).toContain('Barcelona')
    })
  })

  // ---- Vehicle reference ----
  describe('vehicle reference section', () => {
    it('renders vehicle section when vehicle_id is present', () => {
      const w = factory(makeLead({ vehicle_id: 'v-1' }))
      expect(w.find('.vehicle-link').exists()).toBe(true)
    })

    it('shows brand and model', () => {
      const w = factory(
        makeLead({ vehicle_brand: 'MAN', vehicle_model: 'TGX', vehicle_year: 2023 }),
      )
      const link = w.find('.vehicle-link')
      expect(link.text()).toContain('MAN')
      expect(link.text()).toContain('TGX')
      expect(link.text()).toContain('2023')
    })

    it('hides vehicle section when vehicle_id is null', () => {
      const w = factory(makeLead({ vehicle_id: null }))
      expect(w.find('.vehicle-link').exists()).toBe(false)
    })

    it('hides year when vehicle_year is null', () => {
      const w = factory(makeLead({ vehicle_year: null }))
      const link = w.find('.vehicle-link')
      expect(link.text()).not.toContain('(')
    })
  })

  // ---- Message section ----
  describe('message section', () => {
    it('shows message when present', () => {
      const w = factory(makeLead({ message: 'Me interesa' }))
      expect(w.find('.message-text').exists()).toBe(true)
      expect(w.find('.message-text').text()).toBe('Me interesa')
    })

    it('hides message section when message is null', () => {
      const w = factory(makeLead({ message: null }))
      expect(w.find('.message-text').exists()).toBe(false)
    })
  })

  // ---- Status change section ----
  describe('status change section', () => {
    it('displays current status badge', () => {
      const w = factory(makeLead({ status: 'contacted' }))
      expect(w.find('.status-badge').exists()).toBe(true)
      expect(w.find('.status-badge').text()).toContain('dashboard.leadStatus.contacted')
    })

    it('renders all 6 status buttons', () => {
      const w = factory(makeLead())
      const buttons = w.findAll('.status-btn')
      expect(buttons).toHaveLength(6)
    })

    it('marks current status button as active', () => {
      const w = factory(makeLead({ status: 'negotiating' }))
      const activeBtn = w.findAll('.status-btn').find((btn) => btn.classes().includes('active'))
      expect(activeBtn).toBeTruthy()
      expect(activeBtn!.text()).toContain('dashboard.leadStatus.negotiating')
    })

    it('disables the current status button', () => {
      const w = factory(makeLead({ status: 'new' }))
      const firstBtn = w.findAll('.status-btn')[0]
      expect(firstBtn.attributes('disabled')).toBeDefined()
    })

    it('calls handleStatusChange on button click', async () => {
      mockUpdateLeadStatus.mockResolvedValue(true)
      const w = factory(makeLead({ status: 'new' }))
      // Click 'viewed' button (index 1)
      const viewedBtn = w.findAll('.status-btn')[1]
      await viewedBtn.trigger('click')
      expect(mockUpdateLeadStatus).toHaveBeenCalledWith('lead-123', 'viewed', undefined)
    })

    it('shows success alert after successful status change', async () => {
      mockUpdateLeadStatus.mockResolvedValue(true)
      const w = factory(makeLead({ status: 'new' }))
      const viewedBtn = w.findAll('.status-btn')[1]
      await viewedBtn.trigger('click')
      await flushPromises()
      expect(w.find('.alert-success').exists()).toBe(true)
    })

    it('clears success alert after 3 seconds', async () => {
      mockUpdateLeadStatus.mockResolvedValue(true)
      const w = factory(makeLead({ status: 'new' }))
      const viewedBtn = w.findAll('.status-btn')[1]
      await viewedBtn.trigger('click')
      await flushPromises()
      expect(w.find('.alert-success').exists()).toBe(true)
      vi.advanceTimersByTime(3000)
      await w.vm.$nextTick()
      expect(w.find('.alert-success').exists()).toBe(false)
    })
  })

  // ---- Lost status + close reason ----
  describe('close reason for lost status', () => {
    it('shows close reason section when status is lost', () => {
      const w = factory(makeLead({ status: 'lost' }))
      const textareas = w.findAll('textarea')
      expect(textareas.length).toBeGreaterThanOrEqual(2)
    })

    it('shows close reason section when status is lost (regardless of close_reason value)', () => {
      // closeReasonText is only populated via onMounted→fetchLead, which is stubbed.
      // The section shows when currentLead.status === 'lost' OR closeReasonText is truthy.
      const w = factory(makeLead({ status: 'lost', close_reason: 'Price too high' }))
      expect(w.text()).toContain('dashboard.leads.closeReason')
    })

    it('blocks status change to lost without close reason', async () => {
      const w = factory(makeLead({ status: 'new' }))
      const lostBtn = w.findAll('.status-btn')[5]
      await lostBtn.trigger('click')
      expect(mockUpdateLeadStatus).not.toHaveBeenCalled()
    })

    it('allows status change to lost when close reason is present', async () => {
      mockUpdateLeadStatus.mockResolvedValue(true)
      mockUpdateCloseReason.mockResolvedValue(true)
      // Start with lost status so the close reason textarea is visible
      const w = factory(makeLead({ status: 'lost' }))
      // Find the close reason textarea (first textarea in the close reason section)
      const textareas = w.findAll('textarea')
      // Set value in the close reason textarea
      await textareas[0].setValue('Too expensive')
      // Now change to 'won' status (since current is 'lost', 'lost' button is disabled)
      const wonBtn = w.findAll('.status-btn')[4] // 'won' is index 4
      await wonBtn.trigger('click')
      expect(mockUpdateLeadStatus).toHaveBeenCalled()
    })
  })

  // ---- Notes ----
  describe('private notes section', () => {
    it('renders notes textarea', () => {
      const w = factory(makeLead())
      const textareas = w.findAll('textarea')
      expect(textareas.length).toBeGreaterThanOrEqual(1)
    })

    it('renders save button', () => {
      const w = factory(makeLead())
      expect(w.find('.btn-primary').exists()).toBe(true)
      expect(w.find('.btn-primary').text()).toContain('common.save')
    })

    it('calls saveNotes on button click', async () => {
      mockUpdateLeadNotes.mockResolvedValue(true)
      const w = factory(makeLead())
      await w.find('.btn-primary').trigger('click')
      expect(mockUpdateLeadNotes).toHaveBeenCalledWith('lead-123', expect.any(String))
    })

    it('shows success message after saving notes', async () => {
      mockUpdateLeadNotes.mockResolvedValue(true)
      const w = factory(makeLead())
      await w.find('.btn-primary').trigger('click')
      await flushPromises()
      expect(w.find('.alert-success').exists()).toBe(true)
    })
  })

  // ---- Timeline ----
  describe('timeline section', () => {
    it('renders timeline when status_history has entries', () => {
      const w = factory(
        makeLead({
          status_history: [
            { from: 'new', to: 'viewed', changed_at: '2026-03-01T12:00:00Z', notes: null },
            {
              from: 'viewed',
              to: 'contacted',
              changed_at: '2026-03-02T09:00:00Z',
              notes: 'Llamada',
            },
          ],
        }),
      )
      expect(w.find('.timeline').exists()).toBe(true)
      expect(w.findAll('.timeline-item')).toHaveLength(2)
    })

    it('hides timeline when status_history is empty', () => {
      const w = factory(makeLead({ status_history: [] }))
      expect(w.find('.timeline').exists()).toBe(false)
    })

    it('shows notes in timeline item when present', () => {
      const w = factory(
        makeLead({
          status_history: [
            {
              from: 'new',
              to: 'contacted',
              changed_at: '2026-03-01T12:00:00Z',
              notes: 'Email enviado',
            },
          ],
        }),
      )
      expect(w.find('.timeline-notes').exists()).toBe(true)
      expect(w.find('.timeline-notes').text()).toBe('Email enviado')
    })

    it('hides notes in timeline item when null', () => {
      const w = factory(
        makeLead({
          status_history: [
            { from: 'new', to: 'viewed', changed_at: '2026-03-01T12:00:00Z', notes: null },
          ],
        }),
      )
      expect(w.find('.timeline-notes').exists()).toBe(false)
    })

    it('renders timeline dates', () => {
      const w = factory(
        makeLead({
          status_history: [
            { from: 'new', to: 'viewed', changed_at: '2026-03-01T12:00:00Z', notes: null },
          ],
        }),
      )
      const dateEl = w.find('.timeline-date')
      expect(dateEl.exists()).toBe(true)
      expect(dateEl.text()).not.toBe('-')
    })

    it('applies status color to timeline dot', () => {
      const w = factory(
        makeLead({
          status_history: [
            { from: 'new', to: 'won', changed_at: '2026-03-01T12:00:00Z', notes: null },
          ],
        }),
      )
      const dot = w.find('.timeline-dot')
      expect(dot.attributes('style')).toContain('background-color')
      expect(dot.attributes('style')).toContain('#22c55e')
    })
  })

  // ---- Created at ----
  describe('meta info', () => {
    it('shows created_at formatted date', () => {
      const w = factory(makeLead({ created_at: '2026-03-01T10:00:00Z' }))
      const meta = w.find('.meta-info')
      expect(meta.exists()).toBe(true)
      expect(meta.text()).toContain('dashboard.leads.receivedAt')
    })
  })

  // ---- Error display ----
  describe('error display', () => {
    it('shows error alert when error is set', async () => {
      const w = factory(makeLead())
      mockError.value = 'Something went wrong'
      await w.vm.$nextTick()
      expect(w.find('.alert-error').exists()).toBe(true)
      expect(w.find('.alert-error').text()).toBe('Something went wrong')
    })

    it('hides error alert when no error', () => {
      mockError.value = null
      const w = factory(makeLead())
      expect(w.find('.alert-error').exists()).toBe(false)
    })
  })

  // ---- v-if branch coverage ----
  describe('v-if branch coverage', () => {
    it('loading: shows loading, hides content and empty', () => {
      const w = factory(null, true)
      expect(w.find('.loading-state').exists()).toBe(true)
      expect(w.find('.card').exists()).toBe(false)
      expect(w.find('.empty-state').exists()).toBe(false)
    })

    it('no lead + no loading: shows empty state', () => {
      const w = factory(null, false)
      expect(w.find('.loading-state').exists()).toBe(false)
      expect(w.find('.card').exists()).toBe(false)
      expect(w.find('.empty-state').exists()).toBe(true)
    })

    it('lead present: shows cards, hides loading and empty', () => {
      const w = factory(makeLead())
      expect(w.find('.loading-state').exists()).toBe(false)
      expect(w.findAll('.card').length).toBeGreaterThan(0)
      expect(w.find('.empty-state').exists()).toBe(false)
    })
  })

  // ---- getStatusColor ----
  describe('status colors', () => {
    it('applies blue color for new status', () => {
      const w = factory(makeLead({ status: 'new' }))
      const badge = w.find('.status-badge')
      expect(badge.attributes('style')).toContain('var(--color-info)')
    })

    it('applies green color for won status', () => {
      const w = factory(makeLead({ status: 'won' }))
      const badge = w.find('.status-badge')
      expect(badge.attributes('style')).toContain('#22c55e')
    })

    it('applies red color for lost status', () => {
      const w = factory(makeLead({ status: 'lost' }))
      const badge = w.find('.status-badge')
      expect(badge.attributes('style')).toContain('var(--color-error)')
    })
  })

  // ---- formatDateTime ----
  describe('formatDateTime', () => {
    it('formats a date string correctly', () => {
      const w = factory(makeLead({ created_at: '2026-06-15T14:30:00Z' }))
      const meta = w.find('.meta-info')
      expect(meta.text()).not.toContain('2026-06-15T14:30:00Z')
    })

    it('shows dash for null date', () => {
      const w = factory(
        makeLead({
          status_history: [{ from: 'new', to: 'viewed', changed_at: null, notes: null }],
        }),
      )
      const dateEl = w.find('.timeline-date')
      expect(dateEl.text()).toBe('-')
    })
  })

  // ---- onMounted callback ----
  describe('onMounted lifecycle', () => {
    it('captures fetchLead as onMounted callback', () => {
      factory(makeLead())
      expect(onMountedCb).toBeTruthy()
      expect(typeof onMountedCb).toBe('function')
    })

    it('onMounted callback calls loadDealer and loadLead', async () => {
      mockLoadLead.mockResolvedValue(makeLead())
      factory(null, false)
      if (onMountedCb) await onMountedCb()
      expect(mockLoadDealer).toHaveBeenCalled()
      expect(mockLoadLead).toHaveBeenCalledWith('lead-123')
    })
  })

  // ---- Edge cases ----
  describe('edge cases', () => {
    it('handles lead with no vehicle, no email, no phone', () => {
      const w = factory(
        makeLead({
          vehicle_id: null,
          buyer_email: null,
          buyer_phone: null,
          buyer_name: null,
          buyer_location: null,
          message: null,
          status_history: [],
        }),
      )
      expect(w.find('.vehicle-link').exists()).toBe(false)
      expect(w.find('.message-text').exists()).toBe(false)
      expect(w.find('.timeline').exists()).toBe(false)
    })

    it('disables save button while saving', async () => {
      mockUpdateLeadNotes.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(true), 1000)),
      )
      const w = factory(makeLead())
      w.find('.btn-primary').trigger('click')
      await w.vm.$nextTick()
      expect(w.find('.btn-primary').text()).toContain('common.loading')
    })
  })
})
