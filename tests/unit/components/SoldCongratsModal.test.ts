/**
 * Tests for app/components/vehicle/SoldCongratsModal.vue
 *
 * Covers: rendering, props, v-if step branches, emits, methods (markAsSold,
 * requestService, close, copyLink, finish), computed (services, shareUrl),
 * backdrop close, error handling, and Supabase interactions.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

// Restore Vue's real reactivity primitives so the SFC's internal refs work
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)
vi.stubGlobal('onMounted', onMounted)
vi.stubGlobal('onUnmounted', onUnmounted)
vi.stubGlobal('nextTick', nextTick)

import { shallowMount, type VueWrapper } from '@vue/test-utils'
import SoldCongratsModal from '../../../app/components/vehicle/SoldCongratsModal.vue'

// ---------------------------------------------------------------------------
// Supabase mock helpers
// ---------------------------------------------------------------------------

let updateEqResult: () => Promise<{ data: null; error: null | { message: string } }>
let insertResult: () => Promise<{ data: null; error: null | { message: string } }>

const mockUpdatePayload = vi.fn()
const mockInsertPayload = vi.fn()

function resetSupabaseMock(options?: {
  updateError?: string | null
  insertError?: string | null
  updateHang?: boolean
}) {
  const updateError = options?.updateError ?? null
  const insertError = options?.insertError ?? null
  const updateHang = options?.updateHang ?? false

  updateEqResult = updateHang
    ? () => new Promise(() => {}) // never resolves
    : () => Promise.resolve({
        data: null,
        error: updateError ? { message: updateError } : null,
      })

  insertResult = () =>
    Promise.resolve({
      data: null,
      error: insertError ? { message: insertError } : null,
    })

  vi.stubGlobal('useSupabaseClient', () => ({
    from: (table: string) => {
      if (table === 'vehicles') {
        return {
          update: (payload: unknown) => {
            mockUpdatePayload(payload)
            return { eq: () => updateEqResult() }
          },
        }
      }
      if (table === 'service_requests') {
        return {
          insert: (payload: unknown) => {
            mockInsertPayload(payload)
            return insertResult()
          },
        }
      }
      return {
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        insert: () => Promise.resolve({ data: null, error: null }),
      }
    },
  }))
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

const defaultVehicle = { id: 'v-123', title: 'Test Truck', slug: 'test-truck' }

function factory(props: Record<string, unknown> = {}): VueWrapper {
  return shallowMount(SoldCongratsModal, {
    props: {
      modelValue: true,
      vehicle: defaultVehicle,
      ...props,
    },
    global: {
      mocks: { $t: (key: string) => key },
      stubs: { Teleport: true },
    },
  })
}

// Helper: navigate to step N starting from step 1
async function goToStep(w: VueWrapper, target: 2 | 3 | 4) {
  // Step 1 -> 2: click primary ("yes platform")
  await w.find('.btn-primary').trigger('click')
  await vi.waitFor(() => {
    expect(w.find('.sold-step-services').exists()).toBe(true)
  })
  if (target === 2) return

  // Step 2 -> 3: click "continue without" link
  await w.find('.btn-link').trigger('click')
  await w.vm.$nextTick()
  expect(w.find('.sold-step-new').exists()).toBe(true)
  if (target === 3) return

  // Step 3 -> 4: click secondary ("finish" / "no, just close")
  await w.find('.btn-secondary').trigger('click')
  await w.vm.$nextTick()
  expect(w.find('.sold-step-share').exists()).toBe(true)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SoldCongratsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('navigateTo', vi.fn())
    resetSupabaseMock()
  })

  // ---- Rendering & visibility ----

  it('renders the modal container when modelValue is true', () => {
    const w = factory()
    expect(w.find('.sold-backdrop').exists()).toBe(true)
    expect(w.find('.sold-container').exists()).toBe(true)
  })

  it('does not render the backdrop when modelValue is false', () => {
    const w = factory({ modelValue: false })
    expect(w.find('.sold-backdrop').exists()).toBe(false)
  })

  it('renders the close button with aria-label', () => {
    const w = factory()
    const closeBtn = w.find('.sold-close')
    expect(closeBtn.exists()).toBe(true)
    expect(closeBtn.attributes('aria-label')).toBe('common.close')
  })

  // ---- Step 1: Congratulations ----

  it('shows step 1 (congrats) by default', () => {
    const w = factory()
    expect(w.find('.sold-step-congrats').exists()).toBe(true)
    expect(w.find('.sold-step-services').exists()).toBe(false)
    expect(w.find('.sold-step-new').exists()).toBe(false)
    expect(w.find('.sold-step-share').exists()).toBe(false)
  })

  it('renders congrats heading with correct i18n key', () => {
    const w = factory()
    expect(w.find('.sold-heading').text()).toBe('postSale.congrats')
  })

  it('renders congrats question text', () => {
    const w = factory()
    expect(w.find('.sold-question').text()).toBe('postSale.soldViaPlatform')
  })

  it('renders two action buttons in step 1', () => {
    const w = factory()
    const buttons = w.findAll('.sold-actions button')
    expect(buttons.length).toBe(2)
    expect(buttons[0]!.text()).toBe('postSale.yesPlatform')
    expect(buttons[1]!.text()).toBe('postSale.noOtherChannel')
  })

  it('renders congrats icon', () => {
    const w = factory()
    expect(w.find('.congrats-icon').exists()).toBe(true)
  })

  it('does not display error message initially', () => {
    const w = factory()
    expect(w.find('.sold-error').exists()).toBe(false)
  })

  // ---- close() ----

  it('emits update:modelValue=false on close button click', async () => {
    const w = factory()
    await w.find('.sold-close').trigger('click')
    expect(w.emitted('update:modelValue')).toBeTruthy()
    expect(w.emitted('update:modelValue')![0]).toEqual([false])
  })

  // ---- handleBackdrop ----

  it('emits close when clicking the backdrop itself', async () => {
    const w = factory()
    await w.find('.sold-backdrop').trigger('click')
    expect(w.emitted('update:modelValue')).toBeTruthy()
  })

  // ---- markAsSold() ----

  it('calls supabase update with sold_via_tracciona=true and advances to step 2', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    await vi.waitFor(() => {
      expect(mockUpdatePayload).toHaveBeenCalledWith(
        expect.objectContaining({
          sold_via_tracciona: true,
          status: 'sold',
        }),
      )
      expect(w.find('.sold-step-services').exists()).toBe(true)
    })
  })

  it('calls supabase update with sold_via_tracciona=false on secondary button', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    await vi.waitFor(() => {
      expect(mockUpdatePayload).toHaveBeenCalledWith(
        expect.objectContaining({
          sold_via_tracciona: false,
          status: 'sold',
        }),
      )
    })
  })

  it('update payload includes sold_at ISO string', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    await vi.waitFor(() => {
      const call = mockUpdatePayload.mock.calls[0]![0]
      expect(call.sold_at).toBeTruthy()
      expect(typeof call.sold_at).toBe('string')
    })
  })

  it('shows error message when markAsSold fails', async () => {
    resetSupabaseMock({ updateError: 'DB error' })
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    await vi.waitFor(() => {
      expect(w.find('.sold-error').exists()).toBe(true)
    })
  })

  it('stays on step 1 when markAsSold fails', async () => {
    resetSupabaseMock({ updateError: 'DB error' })
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    await vi.waitFor(() => {
      expect(w.find('.sold-step-congrats').exists()).toBe(true)
      expect(w.find('.sold-step-services').exists()).toBe(false)
    })
  })

  it('disables buttons while isUpdating', async () => {
    resetSupabaseMock({ updateHang: true })
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    await w.vm.$nextTick()

    const buttons = w.findAll('.sold-actions button')
    buttons.forEach((btn) => {
      expect(btn.attributes('disabled')).toBeDefined()
    })
  })

  // ---- Step 2: Cross-sell services ----

  it('renders 4 service cards in step 2', async () => {
    const w = factory()
    await goToStep(w, 2)
    expect(w.findAll('.service-card').length).toBe(4)
  })

  it('renders service icons, titles, and descriptions', async () => {
    const w = factory()
    await goToStep(w, 2)
    expect(w.findAll('.service-icon').length).toBe(4)
    expect(w.findAll('.service-title').length).toBe(4)
    expect(w.findAll('.service-desc').length).toBe(4)
  })

  it('shows service price only when price is set (2 of 4 have price)', async () => {
    const w = factory()
    await goToStep(w, 2)
    // transfer and contract have price, transport and insurance do not
    expect(w.findAll('.service-price').length).toBe(2)
  })

  it('renders services heading', async () => {
    const w = factory()
    await goToStep(w, 2)
    expect(w.find('.sold-heading').text()).toBe('postSale.servicesTitle')
  })

  // ---- requestService() ----

  it('calls supabase insert with correct vehicle_id and type', async () => {
    const w = factory()
    await goToStep(w, 2)

    await w.findAll('.btn-service')[0]!.trigger('click')
    await vi.waitFor(() => {
      expect(mockInsertPayload).toHaveBeenCalledWith({
        vehicle_id: 'v-123',
        type: 'transport',
      })
    })
  })

  it('marks service button as done after successful request', async () => {
    const w = factory()
    await goToStep(w, 2)

    const btn = w.findAll('.btn-service')[0]!
    await btn.trigger('click')
    await vi.waitFor(() => {
      expect(btn.classes()).toContain('btn-service--done')
      expect(btn.text()).toBe('postSale.requested')
    })
  })

  it('disables service button after requested', async () => {
    const w = factory()
    await goToStep(w, 2)

    const btn = w.findAll('.btn-service')[0]!
    await btn.trigger('click')
    await vi.waitFor(() => {
      expect(btn.attributes('disabled')).toBeDefined()
    })
  })

  it('prevents requesting the same service twice', async () => {
    const w = factory()
    await goToStep(w, 2)

    const btn = w.findAll('.btn-service')[0]!
    await btn.trigger('click')
    await vi.waitFor(() => expect(btn.classes()).toContain('btn-service--done'))

    mockInsertPayload.mockClear()
    await btn.trigger('click')
    await w.vm.$nextTick()
    expect(mockInsertPayload).not.toHaveBeenCalled()
  })

  it('shows error when requestService fails', async () => {
    resetSupabaseMock({ insertError: 'Service error' })
    const w = factory()
    await goToStep(w, 2)

    await w.findAll('.btn-service')[0]!.trigger('click')
    await vi.waitFor(() => {
      expect(w.find('.sold-error').exists()).toBe(true)
    })
  })

  it('can request multiple different services', async () => {
    const w = factory()
    await goToStep(w, 2)

    await w.findAll('.btn-service')[0]!.trigger('click')
    await vi.waitFor(() => expect(w.findAll('.btn-service')[0]!.classes()).toContain('btn-service--done'))

    await w.findAll('.btn-service')[1]!.trigger('click')
    await vi.waitFor(() => expect(w.findAll('.btn-service')[1]!.classes()).toContain('btn-service--done'))

    expect(mockInsertPayload).toHaveBeenCalledTimes(2)
  })

  // ---- goToStep3 (skip services) ----

  it('advances to step 3 when clicking "continueWithout" link', async () => {
    const w = factory()
    await goToStep(w, 2)

    await w.find('.btn-link').trigger('click')
    expect(w.find('.sold-step-new').exists()).toBe(true)
  })

  // ---- Step 3: New listing suggestion ----

  it('renders step 3 with new vehicle heading', async () => {
    const w = factory()
    await goToStep(w, 3)
    expect(w.find('.sold-heading').text()).toBe('postSale.newVehicle')
  })

  it('renders new-icon in step 3', async () => {
    const w = factory()
    await goToStep(w, 3)
    expect(w.find('.new-icon').exists()).toBe(true)
  })

  it('renders two action buttons in step 3', async () => {
    const w = factory()
    await goToStep(w, 3)
    expect(w.findAll('.sold-actions button').length).toBe(2)
  })

  it('navigates to new listing page on primary button in step 3', async () => {
    const navigateToMock = vi.fn()
    vi.stubGlobal('navigateTo', navigateToMock)

    const w = factory()
    await goToStep(w, 3)

    await w.find('.btn-primary').trigger('click')
    expect(navigateToMock).toHaveBeenCalledWith('/admin/productos/nuevo')
    expect(w.emitted('update:modelValue')).toBeTruthy()
  })

  it('advances to step 4 on secondary button in step 3', async () => {
    const w = factory()
    await goToStep(w, 3)

    await w.find('.btn-secondary').trigger('click')
    expect(w.find('.sold-step-share').exists()).toBe(true)
  })

  // ---- Step 4: Share link ----

  it('renders share URL input with readonly attribute', async () => {
    const w = factory()
    await goToStep(w, 4)

    const input = w.find('.share-url-input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('readonly')).toBeDefined()
  })

  it('renders share heading and subtitle', async () => {
    const w = factory()
    await goToStep(w, 4)

    expect(w.find('.sold-heading').text()).toBe('postSale.shareTitle')
    expect(w.find('.sold-subtitle').text()).toBe('postSale.shareSubtitle')
  })

  it('share URL contains the vehicle slug', async () => {
    const w = factory()
    await goToStep(w, 4)

    const input = w.find('.share-url-input')
    expect(input.attributes('value')).toContain('test-truck')
  })

  it('share URL handles missing slug gracefully', async () => {
    const w = factory({ vehicle: { id: 'v-999', title: 'No Slug' } })
    await goToStep(w, 4)

    const input = w.find('.share-url-input')
    expect(input.attributes('value')).toContain('servicios-postventa?v=')
  })

  // ---- copyLink() ----

  it('renders copy button with correct initial text', async () => {
    const w = factory()
    await goToStep(w, 4)
    expect(w.find('.btn-copy').text()).toBe('postSale.copyLink')
  })

  it('changes copy button text after successful copy', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    })

    const w = factory()
    await goToStep(w, 4)

    await w.find('.btn-copy').trigger('click')
    await w.vm.$nextTick()

    expect(w.find('.btn-copy').text()).toBe('postSale.linkCopied')
  })

  it('copy button reverts text (linkCopied resets)', async () => {
    vi.useFakeTimers()
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    })

    const w = factory()
    await goToStep(w, 4)

    await w.find('.btn-copy').trigger('click')
    await w.vm.$nextTick()
    expect(w.find('.btn-copy').text()).toBe('postSale.linkCopied')

    vi.advanceTimersByTime(3000)
    await w.vm.$nextTick()
    expect(w.find('.btn-copy').text()).toBe('postSale.copyLink')

    vi.useRealTimers()
  })

  // ---- finish() ----

  it('emits "completed" and closes modal on finish button', async () => {
    const w = factory()
    await goToStep(w, 4)

    await w.find('.btn-finish').trigger('click')
    expect(w.emitted('completed')).toHaveLength(1)
    const closeEmits = w.emitted('update:modelValue')!
    expect(closeEmits[closeEmits.length - 1]).toEqual([false])
  })

  // ---- Watch: modelValue resets state ----

  it('resets step and state when modal is reopened', async () => {
    const w = factory()
    await goToStep(w, 2)

    // Close and reopen
    await w.setProps({ modelValue: false })
    await w.setProps({ modelValue: true })
    await w.vm.$nextTick()

    expect(w.find('.sold-step-congrats').exists()).toBe(true)
  })

  // ---- Error edge cases ----

  it('handles non-Error thrown in markAsSold with fallback message', async () => {
    // Force a real throw (not from supabase error field)
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        update: () => ({
          eq: () => Promise.reject('raw string'),
        }),
        insert: () => Promise.resolve({ data: null, error: null }),
      }),
    }))

    const w = shallowMount(SoldCongratsModal, {
      props: { modelValue: true, vehicle: defaultVehicle },
      global: {
        mocks: { $t: (key: string) => key },
        stubs: { Teleport: true },
      },
    })

    await w.find('.btn-primary').trigger('click')
    await vi.waitFor(() => {
      expect(w.find('.sold-error').text()).toBe('Error')
    })
  })

  it('handles Error instance in requestService showing its message', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'vehicles') {
          return {
            update: () => ({
              eq: () => Promise.resolve({ data: null, error: null }),
            }),
          }
        }
        return {
          insert: () => Promise.reject(new Error('Insert failed')),
        }
      },
    }))

    const w = shallowMount(SoldCongratsModal, {
      props: { modelValue: true, vehicle: defaultVehicle },
      global: {
        mocks: { $t: (key: string) => key },
        stubs: { Teleport: true },
      },
    })

    await goToStep(w, 2)
    await w.findAll('.btn-service')[0]!.trigger('click')
    await vi.waitFor(() => {
      expect(w.find('.sold-error').text()).toBe('Insert failed')
    })
  })
})
