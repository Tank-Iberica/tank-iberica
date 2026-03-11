/**
 * Tests for app/components/admin/dealers/SuscripcionModals.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/shared/useListingUtils', () => ({
  formatPriceCents: (v: number) => `${(v / 100).toFixed(2)} EUR`,
}))

import SuscripcionModals from '../../../app/components/admin/dealers/SuscripcionModals.vue'

const baseSub = {
  id: 'sub1',
  dealer_id: 'd1',
  plan: 'basic' as const,
  vertical: 'tracciona',
  status: 'active',
  price_cents: 2900,
  expires_at: '2026-06-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  dealers: { company_name: 'Test Dealer' },
}

const baseProps = {
  cancelModal: { show: false, subscription: null, confirmText: '' },
  newModal: {
    show: false,
    selectedDealerId: '',
    selectedVertical: 'tracciona',
    selectedPlan: 'basic' as const,
    priceCents: 2900,
  },
  extendModal: { show: false, subscription: null },
  changePlanModal: { show: false, subscription: null, newPlan: 'basic' as const },
  saving: false,
  canCancel: false,
  availableDealersForNew: [
    { id: 'd1', company_name: 'Dealer A', user_id: 'u1' },
    { id: 'd2', company_name: 'Dealer B', user_id: 'u2' },
  ],
  uniqueVerticals: ['tracciona'],
  foundingCountByVertical: { tracciona: 2 },
  plans: [
    { value: 'basic', label: 'Basico', color: '#3b82f6' },
    { value: 'premium', label: 'Premium', color: '#f59e0b' },
    { value: 'founding', label: 'Fundador', color: '#10b981' },
  ],
  foundingMaxPerVertical: 10,
  formatDate: (d: string | null) => (d ? new Date(d).toLocaleDateString('es-ES') : '-'),
  getDealerName: (sub: Record<string, unknown>) =>
    (sub as typeof baseSub).dealers?.company_name || '-',
  getDealerLabel: (d: Record<string, unknown>) =>
    (d as { company_name: string }).company_name || '-',
}

describe('SuscripcionModals', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(SuscripcionModals, {
      props: { ...baseProps, ...overrides },
      global: {
        stubs: { Teleport: true },
      },
    })

  // === Change Plan Modal ===
  it('hides all modals when show=false', () => {
    const w = factory()
    expect(w.findAll('.modal-overlay')).toHaveLength(0)
  })

  it('shows change plan modal when show=true', () => {
    const w = factory({
      changePlanModal: { show: true, subscription: { ...baseSub }, newPlan: 'basic' },
    })
    expect(w.find('.modal-overlay').exists()).toBe(true)
    expect(w.find('.modal-header h3').text()).toContain(
      'admin.dealerSubscriptions.changePlanTitle',
    )
  })

  it('emits close-change-plan on close', async () => {
    const w = factory({
      changePlanModal: { show: true, subscription: { ...baseSub }, newPlan: 'basic' },
    })
    await w.find('.modal-close').trigger('click')
    expect(w.emitted('close-change-plan')).toBeTruthy()
  })

  it('disables save when same plan', () => {
    const w = factory({
      changePlanModal: { show: true, subscription: { ...baseSub }, newPlan: 'basic' },
    })
    expect(w.find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('enables save when plan changed', () => {
    const w = factory({
      changePlanModal: { show: true, subscription: { ...baseSub }, newPlan: 'premium' },
    })
    expect(w.find('.btn-primary').attributes('disabled')).toBeUndefined()
  })

  it('emits change-plan on save click', async () => {
    const w = factory({
      changePlanModal: { show: true, subscription: { ...baseSub }, newPlan: 'premium' },
    })
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('change-plan')).toBeTruthy()
  })

  it('shows founding warning when founding selected', () => {
    const w = factory({
      changePlanModal: { show: true, subscription: { ...baseSub }, newPlan: 'founding' },
    })
    expect(w.find('.founding-warning').exists()).toBe(true)
    expect(w.find('.founding-warning').text()).toContain('2')
    expect(w.find('.founding-warning').text()).toContain('10')
  })

  // === Extend Modal ===
  it('shows extend modal when show=true', () => {
    const w = factory({
      extendModal: { show: true, subscription: { ...baseSub } },
    })
    const overlays = w.findAll('.modal-overlay')
    expect(overlays.length).toBeGreaterThan(0)
  })

  it('emits extend-expiry on confirm', async () => {
    const w = factory({
      extendModal: { show: true, subscription: { ...baseSub } },
    })
    const overlays = w.findAll('.modal-overlay')
    const extendOverlay = overlays.find((o) =>
      o.text().includes('admin.dealerSubscriptions.extendTitle'),
    )
    expect(extendOverlay).toBeTruthy()
    await extendOverlay!.find('.btn-primary').trigger('click')
    expect(w.emitted('extend-expiry')).toBeTruthy()
  })

  // === Cancel Modal ===
  it('shows cancel modal when show=true', () => {
    const w = factory({
      cancelModal: { show: true, subscription: { ...baseSub }, confirmText: '' },
    })
    const overlays = w.findAll('.modal-overlay')
    const cancelOverlay = overlays.find((o) =>
      o.text().includes('admin.dealerSubscriptions.confirmCancel'),
    )
    expect(cancelOverlay).toBeTruthy()
  })

  it('disables cancel button when canCancel=false', () => {
    const w = factory({
      cancelModal: { show: true, subscription: { ...baseSub }, confirmText: '' },
      canCancel: false,
    })
    const overlays = w.findAll('.modal-overlay')
    const cancelOverlay = overlays.find((o) =>
      o.text().includes('admin.dealerSubscriptions.confirmCancel'),
    )
    expect(cancelOverlay!.find('.btn-danger').attributes('disabled')).toBeDefined()
  })

  it('enables cancel button when canCancel=true', () => {
    const w = factory({
      cancelModal: {
        show: true,
        subscription: { ...baseSub },
        confirmText: 'cancelar',
      },
      canCancel: true,
    })
    const overlays = w.findAll('.modal-overlay')
    const cancelOverlay = overlays.find((o) =>
      o.text().includes('admin.dealerSubscriptions.confirmCancel'),
    )
    expect(cancelOverlay!.find('.btn-danger').attributes('disabled')).toBeUndefined()
  })

  it('emits cancel-subscription on confirm', async () => {
    const w = factory({
      cancelModal: {
        show: true,
        subscription: { ...baseSub },
        confirmText: 'cancelar',
      },
      canCancel: true,
    })
    const overlays = w.findAll('.modal-overlay')
    const cancelOverlay = overlays.find((o) =>
      o.text().includes('admin.dealerSubscriptions.confirmCancel'),
    )
    await cancelOverlay!.find('.btn-danger').trigger('click')
    expect(w.emitted('cancel-subscription')).toBeTruthy()
  })

  // === New Modal ===
  it('shows new subscription modal when show=true', () => {
    const w = factory({
      newModal: {
        show: true,
        selectedDealerId: '',
        selectedVertical: 'tracciona',
        selectedPlan: 'basic',
        priceCents: 2900,
      },
    })
    const overlays = w.findAll('.modal-overlay')
    const newOverlay = overlays.find((o) =>
      o.text().includes('admin.dealerSubscriptions.modalNewTitle'),
    )
    expect(newOverlay).toBeTruthy()
  })

  it('shows available dealers in select', () => {
    const w = factory({
      newModal: {
        show: true,
        selectedDealerId: '',
        selectedVertical: 'tracciona',
        selectedPlan: 'basic',
        priceCents: 2900,
      },
    })
    const overlays = w.findAll('.modal-overlay')
    const newOverlay = overlays.find((o) =>
      o.text().includes('admin.dealerSubscriptions.modalNewTitle'),
    )
    const dealerOptions = newOverlay!.findAll('#new-dealer option')
    // disabled placeholder + 2 dealers
    expect(dealerOptions).toHaveLength(3)
  })

  it('disables create button when no dealer selected', () => {
    const w = factory({
      newModal: {
        show: true,
        selectedDealerId: '',
        selectedVertical: 'tracciona',
        selectedPlan: 'basic',
        priceCents: 2900,
      },
    })
    const overlays = w.findAll('.modal-overlay')
    const newOverlay = overlays.find((o) =>
      o.text().includes('admin.dealerSubscriptions.modalNewTitle'),
    )
    expect(newOverlay!.find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('enables create button when dealer selected', () => {
    const w = factory({
      newModal: {
        show: true,
        selectedDealerId: 'd1',
        selectedVertical: 'tracciona',
        selectedPlan: 'basic',
        priceCents: 2900,
      },
    })
    const overlays = w.findAll('.modal-overlay')
    const newOverlay = overlays.find((o) =>
      o.text().includes('admin.dealerSubscriptions.modalNewTitle'),
    )
    expect(newOverlay!.find('.btn-primary').attributes('disabled')).toBeUndefined()
  })

  it('emits create-subscription on click', async () => {
    const w = factory({
      newModal: {
        show: true,
        selectedDealerId: 'd1',
        selectedVertical: 'tracciona',
        selectedPlan: 'basic',
        priceCents: 2900,
      },
    })
    const overlays = w.findAll('.modal-overlay')
    const newOverlay = overlays.find((o) =>
      o.text().includes('admin.dealerSubscriptions.modalNewTitle'),
    )
    await newOverlay!.find('.btn-primary').trigger('click')
    expect(w.emitted('create-subscription')).toBeTruthy()
  })

  it('shows price preview', () => {
    const w = factory({
      newModal: {
        show: true,
        selectedDealerId: 'd1',
        selectedVertical: 'tracciona',
        selectedPlan: 'basic',
        priceCents: 2900,
      },
    })
    expect(w.find('.price-preview').text()).toBe('= 29.00 EUR')
  })

  it('shows founding warning in new modal', () => {
    const w = factory({
      newModal: {
        show: true,
        selectedDealerId: 'd1',
        selectedVertical: 'tracciona',
        selectedPlan: 'founding',
        priceCents: 0,
      },
    })
    expect(w.find('.founding-warning').exists()).toBe(true)
  })
})
