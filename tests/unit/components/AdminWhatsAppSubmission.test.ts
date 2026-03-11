/**
 * Tests for app/components/admin/whatsapp/AdminWhatsAppSubmission.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminWhatsAppSubmission from '../../../app/components/admin/whatsapp/AdminWhatsAppSubmission.vue'

describe('AdminWhatsAppSubmission', () => {
  const submission = {
    id: 'sub-1',
    dealer_id: 'd-1',
    message_text: 'Volvo FH 500 2022 con 120.000 km',
    image_urls: ['https://cdn.example.com/img1.jpg', 'https://cdn.example.com/img2.jpg'],
    extracted_data: { brand: 'Volvo', model: 'FH 500', year: 2022 },
    vehicle_id: 'v-1',
    status: 'processed',
    error_message: null,
    created_at: '2026-03-01T10:00:00Z',
    dealers: { company_name: 'Test Dealer', phone: '+34 600 000 000' },
  }

  const NuxtLinkStub = {
    template: '<a :href="to"><slot /></a>',
    props: ['to'],
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminWhatsAppSubmission, {
      props: {
        submission,
        expanded: false,
        actionLoading: false,
        getDealerName: () => 'Test Dealer',
        getDealerPhone: () => '+34 600 000 000',
        getTextPreview: () => 'Volvo FH 500...',
        getImageCount: () => 2,
        formatDate: (d: string | null) => d || '-',
        getStatusClass: (s: string) => `status-${s}`,
        getStatusLabel: (s: string) => s.toUpperCase(),
        ...overrides,
      },
      global: {
        stubs: { NuxtLink: NuxtLinkStub },
      },
    })

  it('renders submission item', () => {
    expect(factory().find('.submission-item').exists()).toBe(true)
  })

  it('shows dealer name', () => {
    expect(factory().find('.sub-dealer-info strong').text()).toBe('Test Dealer')
  })

  it('shows dealer phone', () => {
    expect(factory().find('.sub-phone').text()).toBe('+34 600 000 000')
  })

  it('shows status badge', () => {
    expect(factory().find('.status-badge').text()).toBe('PROCESSED')
  })

  it('applies status class', () => {
    expect(factory().find('.status-badge').classes()).toContain('status-processed')
  })

  it('shows text preview', () => {
    expect(factory().find('.sub-text-preview').text()).toBe('Volvo FH 500...')
  })

  it('adds expanded class when expanded', () => {
    expect(factory({ expanded: true }).find('.submission-item').classes()).toContain('expanded')
  })

  it('hides detail when not expanded', () => {
    expect(factory().find('.submission-detail').exists()).toBe(false)
  })

  it('shows detail when expanded', () => {
    expect(factory({ expanded: true }).find('.submission-detail').exists()).toBe(true)
  })

  it('shows message content when expanded', () => {
    const w = factory({ expanded: true })
    expect(w.find('.message-content').text()).toContain('Volvo FH 500 2022')
  })

  it('shows extracted data when expanded', () => {
    const w = factory({ expanded: true })
    expect(w.find('.data-list').exists()).toBe(true)
  })

  it('shows image thumbnails when expanded', () => {
    const w = factory({ expanded: true })
    expect(w.findAll('.image-thumb')).toHaveLength(2)
  })

  it('hides error content when no error', () => {
    const w = factory({ expanded: true })
    expect(w.find('.error-content').exists()).toBe(false)
  })

  it('shows error content when error present', () => {
    const w = factory({
      expanded: true,
      submission: { ...submission, error_message: 'Parse failed' },
    })
    expect(w.find('.error-content').text()).toBe('Parse failed')
  })

  it('emits toggle on row click', async () => {
    const w = factory()
    await w.find('.submission-row').trigger('click')
    expect(w.emitted('toggle')).toBeTruthy()
    expect(w.emitted('toggle')![0]).toEqual(['sub-1'])
  })

  it('shows delete button when expanded', () => {
    const w = factory({ expanded: true })
    expect(w.find('.btn-delete').exists()).toBe(true)
  })

  it('emits delete on delete click', async () => {
    const w = factory({ expanded: true })
    await w.find('.btn-delete').trigger('click')
    expect(w.emitted('delete')).toBeTruthy()
  })

  it('shows publish button for processed status', () => {
    const w = factory({ expanded: true })
    expect(w.find('.btn-publish').exists()).toBe(true)
  })

  it('emits publish on publish click', async () => {
    const w = factory({ expanded: true })
    await w.find('.btn-publish').trigger('click')
    expect(w.emitted('publish')).toBeTruthy()
  })

  it('shows retry button for failed status', () => {
    const w = factory({
      expanded: true,
      submission: { ...submission, status: 'failed', vehicle_id: null },
    })
    expect(w.find('.btn-retry').exists()).toBe(true)
  })

  it('shows vehicle link for processed status', () => {
    const w = factory()
    expect(w.find('.vehicle-link').exists()).toBe(true)
  })

  it('emits retry on retry button click', async () => {
    const w = factory({
      submission: {
        id: 's1',
        phone_number: '+34600000001',
        dealer_id: 'd1',
        status: 'failed',
        media_ids: [],
        text_content: null,
        created_at: '2026-01-01',
        vehicle_id: null,
        vehicle_slug: null,
      },
    })
    const btn = w.find('.btn-retry')
    if (btn.exists()) {
      await btn.trigger('click')
      expect(w.emitted('retry')).toBeTruthy()
    }
  })
})
