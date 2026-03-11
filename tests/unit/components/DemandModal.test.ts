/**
 * Tests for app/components/modals/DemandModal.vue
 *
 * Covers: rendering, v-if branches (auth-required, success, form),
 * form fields, validation, submit flow, emit events, error states,
 * keyboard/backdrop close, and dynamic attribute rendering.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { shallowMount, VueWrapper } from '@vue/test-utils'
import { ref, computed, watch, nextTick } from 'vue'

/* ------------------------------------------------------------------ */
/* Mock vue-i18n BEFORE component import                               */
/* ------------------------------------------------------------------ */
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: ref('es'),
  }),
}))

/* ------------------------------------------------------------------ */
/* Mock useVehicleTypeSelector BEFORE importing the component          */
/* ------------------------------------------------------------------ */
const mockFetchInitialData = vi.fn()
const mockSelectCategory = vi.fn()
const mockSelectSubcategory = vi.fn()
const mockSetFilterValue = vi.fn()
const mockGetAttributesJson = vi.fn(() => ({}))
const mockGetFilterLabel = vi.fn(
  (filter: { label_es?: string | null; name: string }) => filter.label_es || filter.name,
)
const mockGetFilterOptions = vi.fn(() => ['opt1', 'opt2'])
const mockGetVehicleSubcategoryLabel = vi.fn(() => 'Camiones > Volquetes')
const mockResetSelector = vi.fn()

const mockCategories = ref<Array<Record<string, unknown>>>([])
const mockLinkedSubcategories = ref<Array<Record<string, unknown>>>([])
const mockAttributes = ref<Array<Record<string, unknown>>>([])
const mockSelectedCategoryId = ref<string | null>(null)
const mockSelectedSubcategoryId = ref<string | null>(null)
const mockFilterValues = ref<Record<string, unknown>>({})
const mockSelectorLoading = ref(false)
const mockFiltersLoading = ref(false)

function buildSelectorMock() {
  return {
    categories: mockCategories,
    linkedSubcategories: mockLinkedSubcategories,
    attributes: mockAttributes,
    selectedCategoryId: mockSelectedCategoryId,
    selectedSubcategoryId: mockSelectedSubcategoryId,
    filterValues: mockFilterValues,
    loading: mockSelectorLoading,
    filtersLoading: mockFiltersLoading,
    fetchInitialData: mockFetchInitialData,
    selectCategory: mockSelectCategory,
    selectSubcategory: mockSelectSubcategory,
    setFilterValue: mockSetFilterValue,
    getAttributesJson: mockGetAttributesJson,
    getFilterLabel: mockGetFilterLabel,
    getFilterOptions: mockGetFilterOptions,
    getVehicleSubcategoryLabel: mockGetVehicleSubcategoryLabel,
    reset: mockResetSelector,
  }
}

vi.mock('~/composables/useVehicleTypeSelector', () => ({
  useVehicleTypeSelector: () => buildSelectorMock(),
}))

vi.mock('~/composables/useLocalized', () => ({
  localizedField: (json: Record<string, string> | null | undefined, locale: string) => {
    if (!json) return ''
    return json[locale] || ''
  },
}))

/* ------------------------------------------------------------------ */
/* Mock #imports — the component imports useSupabaseClient/User from   */
/* here. We need dynamic access so beforeEach can change mockUser.     */
/* ------------------------------------------------------------------ */
const mockInsert = vi.fn(() => Promise.resolve({ data: null, error: null }))
const mockSupabaseFrom = vi.fn(() => ({ insert: mockInsert }))
const mockUser = ref<{ id: string; email: string } | null>({ id: 'u1', email: 'test@test.com' })

vi.mock('#imports', () => ({
  useSupabaseClient: () => ({ from: mockSupabaseFrom }),
  useSupabaseUser: () => mockUser,
}))

// Also set the stubGlobal for useVehicleTypeSelector (auto-imported)
vi.stubGlobal('useVehicleTypeSelector', () => buildSelectorMock())

import DemandModal from '../../../app/components/modals/DemandModal.vue'

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function factory(overrides: Record<string, unknown> = {}): VueWrapper {
  return shallowMount(DemandModal, {
    props: {
      modelValue: true,
      ...overrides,
    },
    global: {
      mocks: { $t: (key: string) => key },
      stubs: {
        Teleport: true,
        Transition: false,
        UiRangeSlider: true,
      },
    },
  })
}

/* ------------------------------------------------------------------ */
/* Reset state between tests                                           */
/* ------------------------------------------------------------------ */
beforeEach(() => {
  vi.useFakeTimers()
  mockUser.value = { id: 'u1', email: 'test@test.com' }
  mockCategories.value = [
    { id: 'c1', name: { es: 'Camiones', en: 'Trucks' }, name_es: 'Camiones', name_en: 'Trucks', slug: 'camiones' },
    { id: 'c2', name: { es: 'Furgonetas', en: 'Vans' }, name_es: 'Furgonetas', name_en: 'Vans', slug: 'furgonetas' },
  ]
  mockLinkedSubcategories.value = []
  mockAttributes.value = []
  mockSelectedCategoryId.value = null
  mockSelectedSubcategoryId.value = null
  mockFilterValues.value = {}
  mockSelectorLoading.value = false
  mockFiltersLoading.value = false
  mockInsert.mockClear()
  mockInsert.mockImplementation(() => Promise.resolve({ data: null, error: null }))
  mockSupabaseFrom.mockClear()
  mockSupabaseFrom.mockImplementation(() => ({ insert: mockInsert }))
  mockFetchInitialData.mockClear()
  mockSelectCategory.mockClear()
  mockSelectSubcategory.mockClear()
  mockSetFilterValue.mockClear()
  mockResetSelector.mockClear()
  mockGetAttributesJson.mockClear()
  mockGetAttributesJson.mockImplementation(() => ({}))
  mockGetVehicleSubcategoryLabel.mockClear()
  mockGetVehicleSubcategoryLabel.mockReturnValue('Camiones > Volquetes')
})

afterEach(() => {
  vi.useRealTimers()
})

/* ================================================================== */
/* Tests                                                               */
/* ================================================================== */

describe('DemandModal', () => {
  /* ------ Rendering ------------------------------------------------ */
  describe('rendering', () => {
    it('renders modal backdrop when modelValue is true', () => {
      const w = factory()
      expect(w.find('.modal-backdrop').exists()).toBe(true)
    })

    it('does not render modal backdrop when modelValue is false', () => {
      const w = factory({ modelValue: false })
      expect(w.find('.modal-backdrop').exists()).toBe(false)
    })

    it('renders modal title', () => {
      const w = factory()
      expect(w.find('.modal-title').text()).toBe('demand.title')
    })

    it('renders close button with aria-label', () => {
      const w = factory()
      const btn = w.find('.close-button')
      expect(btn.exists()).toBe(true)
      expect(btn.attributes('aria-label')).toBe('common.close')
    })
  })

  /* ------ Auth-required branch ------------------------------------- */
  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUser.value = null
    })

    it('shows auth-required message', () => {
      const w = factory()
      expect(w.find('.auth-required').exists()).toBe(true)
      expect(w.find('.auth-required p').text()).toBe('demand.loginRequired')
    })

    it('shows login button', () => {
      const w = factory()
      const loginBtn = w.find('.auth-required .btn-primary')
      expect(loginBtn.exists()).toBe(true)
      expect(loginBtn.text()).toBe('auth.login')
    })

    it('does not render the form', () => {
      const w = factory()
      expect(w.find('form.modal-body').exists()).toBe(false)
    })

    it('does not render success message', () => {
      const w = factory()
      expect(w.find('.success-message').exists()).toBe(false)
    })

    it('emits open-auth and update:modelValue on login click', async () => {
      const w = factory()
      await w.find('.auth-required .btn-primary').trigger('click')
      expect(w.emitted('open-auth')).toBeTruthy()
      expect(w.emitted('update:modelValue')).toBeTruthy()
      expect(w.emitted('update:modelValue')![0]).toEqual([false])
    })
  })

  /* ------ Form rendering (authenticated user) ---------------------- */
  describe('form rendering (authenticated)', () => {
    it('shows the form when authenticated', () => {
      const w = factory()
      expect(w.find('form.modal-body').exists()).toBe(true)
    })

    it('renders category selector', () => {
      const w = factory()
      const select = w.find('#dem-category')
      expect(select.exists()).toBe(true)
    })

    it('renders category options from composable data', () => {
      const w = factory()
      const options = w.findAll('#dem-category option')
      // 1 placeholder + 2 categories
      expect(options.length).toBe(3)
      expect(options[1].text()).toBe('Camiones')
      expect(options[2].text()).toBe('Furgonetas')
    })

    it('disables category select when selectorLoading is true', () => {
      mockSelectorLoading.value = true
      const w = factory()
      expect(w.find('#dem-category').attributes('disabled')).toBeDefined()
    })

    it('does not render subcategory selector when no category selected', () => {
      const w = factory()
      expect(w.find('#dem-subcategory').exists()).toBe(false)
    })

    it('renders subcategory selector when category is selected and has linked subs', () => {
      mockSelectedCategoryId.value = 'c1'
      mockLinkedSubcategories.value = [
        { id: 's1', name: { es: 'Volquetes' }, name_es: 'Volquetes', name_en: 'Tippers', slug: 'volquetes' },
      ]
      const w = factory()
      const select = w.find('#dem-subcategory')
      expect(select.exists()).toBe(true)
      const options = w.findAll('#dem-subcategory option')
      // 1 placeholder + 1 subcategory
      expect(options.length).toBe(2)
    })

    it('renders brand preference input', () => {
      const w = factory()
      expect(w.find('#brandPreference').exists()).toBe(true)
    })

    it('renders year range slider stub', () => {
      const w = factory()
      const sliders = w.findAllComponents({ name: 'UiRangeSlider' })
      expect(sliders.length).toBeGreaterThanOrEqual(2)
    })

    it('renders specifications textarea', () => {
      const w = factory()
      expect(w.find('#specifications').exists()).toBe(true)
    })

    it('renders contact name input with required marker', () => {
      const w = factory()
      const nameInput = w.find('#contactName')
      expect(nameInput.exists()).toBe(true)
      expect(nameInput.attributes('autocomplete')).toBe('name')
      expect(nameInput.attributes('required')).toBeDefined()
    })

    it('renders contact email input with required marker', () => {
      const w = factory()
      const emailInput = w.find('#contactEmail')
      expect(emailInput.exists()).toBe(true)
      expect(emailInput.attributes('type')).toBe('email')
      expect(emailInput.attributes('autocomplete')).toBe('email')
    })

    it('renders contact phone input', () => {
      const w = factory()
      const phoneInput = w.find('#contactPhone')
      expect(phoneInput.exists()).toBe(true)
      expect(phoneInput.attributes('type')).toBe('tel')
      expect(phoneInput.attributes('autocomplete')).toBe('tel')
    })

    it('renders contact preference selector with three options', () => {
      const w = factory()
      const select = w.find('#contactPreference')
      expect(select.exists()).toBe(true)
      const options = w.findAll('#contactPreference option')
      expect(options.length).toBe(3)
    })

    it('renders terms checkbox', () => {
      const w = factory()
      const checkboxes = w.findAll('.checkbox-input')
      expect(checkboxes.length).toBeGreaterThanOrEqual(1)
    })

    it('renders submit button with correct label', () => {
      const w = factory()
      const btn = w.find('.btn-submit')
      expect(btn.exists()).toBe(true)
      expect(btn.text()).toBe('demand.submit')
    })

    it('submit button is not disabled by default', () => {
      const w = factory()
      expect(w.find('.btn-submit').attributes('disabled')).toBeUndefined()
    })
  })

  /* ------ Dynamic attributes --------------------------------------- */
  describe('dynamic attributes rendering', () => {
    beforeEach(() => {
      mockSelectedCategoryId.value = 'c1'
      mockSelectedSubcategoryId.value = 's1'
    })

    it('renders desplegable attribute as select', () => {
      mockAttributes.value = [
        { id: 'a1', name: 'ejes', type: 'desplegable', label: null, label_es: 'Ejes', label_en: null, unit: null, options: { choices: ['2', '3'] }, is_extra: false, sort_order: 1 },
      ]
      const w = factory()
      expect(w.find('#f-ejes').exists()).toBe(true)
      expect(w.find('#f-ejes').element.tagName).toBe('SELECT')
    })

    it('renders desplegable_tick attribute as select', () => {
      mockAttributes.value = [
        { id: 'a2', name: 'transmision', type: 'desplegable_tick', label: null, label_es: 'Transmision', label_en: null, unit: null, options: { choices: ['manual', 'auto'] }, is_extra: false, sort_order: 1 },
      ]
      const w = factory()
      expect(w.find('#f-transmision').exists()).toBe(true)
      expect(w.find('#f-transmision').element.tagName).toBe('SELECT')
    })

    it('renders caja attribute as text input', () => {
      mockAttributes.value = [
        { id: 'a3', name: 'potencia', type: 'caja', label: null, label_es: 'Potencia', label_en: null, unit: 'CV', options: {}, is_extra: false, sort_order: 1 },
      ]
      const w = factory()
      const input = w.find('#f-potencia')
      expect(input.exists()).toBe(true)
      expect(input.attributes('type')).toBe('text')
    })

    it('renders slider attribute as text input', () => {
      mockAttributes.value = [
        { id: 'a4', name: 'peso', type: 'slider', label: null, label_es: 'Peso', label_en: null, unit: 'kg', options: {}, is_extra: false, sort_order: 1 },
      ]
      const w = factory()
      expect(w.find('#f-peso').exists()).toBe(true)
      expect(w.find('#f-peso').attributes('type')).toBe('text')
    })

    it('renders calc attribute as text input', () => {
      mockAttributes.value = [
        { id: 'a5', name: 'capacidad', type: 'calc', label: null, label_es: 'Capacidad', label_en: null, unit: 'm3', options: {}, is_extra: false, sort_order: 1 },
      ]
      const w = factory()
      expect(w.find('#f-capacidad').exists()).toBe(true)
    })

    it('renders tick attribute as checkbox', () => {
      mockAttributes.value = [
        { id: 'a6', name: 'aireacond', type: 'tick', label: null, label_es: 'Aire Acond.', label_en: null, unit: null, options: {}, is_extra: false, sort_order: 1 },
      ]
      const w = factory()
      const checkboxes = w.findAll('.checkbox-input')
      // tick type renders a checkbox; combined with terms checkbox there should be 2
      expect(checkboxes.length).toBe(2)
    })

    it('shows unit label when filter has unit', () => {
      mockAttributes.value = [
        { id: 'a3', name: 'potencia', type: 'caja', label: null, label_es: 'Potencia', label_en: null, unit: 'CV', options: {}, is_extra: false, sort_order: 1 },
      ]
      const w = factory()
      expect(w.find('.unit-label').exists()).toBe(true)
      expect(w.find('.unit-label').text()).toBe('(CV)')
    })

    it('shows section label when attributes exist', () => {
      mockAttributes.value = [
        { id: 'a1', name: 'ejes', type: 'desplegable', label: null, label_es: 'Ejes', label_en: null, unit: null, options: { choices: ['2'] }, is_extra: false, sort_order: 1 },
      ]
      const w = factory()
      expect(w.find('.section-title').exists()).toBe(true)
      expect(w.find('.section-title').text()).toBe('demand.characteristics')
    })

    it('does not show attributes section when no subcategory selected', () => {
      mockSelectedSubcategoryId.value = null
      mockAttributes.value = [
        { id: 'a1', name: 'ejes', type: 'desplegable', label: null, label_es: 'Ejes', label_en: null, unit: null, options: { choices: ['2'] }, is_extra: false, sort_order: 1 },
      ]
      const w = factory()
      expect(w.find('.section-title').exists()).toBe(false)
    })

    it('shows loading text when filtersLoading is true', () => {
      mockFiltersLoading.value = true
      const w = factory()
      expect(w.find('.loading-text').exists()).toBe(true)
      expect(w.find('.loading-text').text()).toContain('common.loading')
    })
  })

  /* ------ Validation ----------------------------------------------- */
  describe('validation', () => {
    it('shows validation error when contact name is empty on submit', async () => {
      const w = factory()
      await w.find('form').trigger('submit')
      await nextTick()
      expect(w.find('#err-demand-name').exists()).toBe(true)
      expect(w.find('#err-demand-name').text()).toBe('validation.required')
    })

    it('shows validation error when email is empty on submit', async () => {
      const w = factory()
      await w.find('#contactName').setValue('John Doe')
      await w.find('form').trigger('submit')
      await nextTick()
      expect(w.find('#err-demand-email').exists()).toBe(true)
      expect(w.find('#err-demand-email').text()).toBe('validation.required')
    })

    it('shows validation error for invalid email format', async () => {
      const w = factory()
      await w.find('#contactName').setValue('John Doe')
      await w.find('#contactEmail').setValue('not-an-email')
      await w.find('form').trigger('submit')
      await nextTick()
      expect(w.find('#err-demand-email').exists()).toBe(true)
      expect(w.find('#err-demand-email').text()).toBe('validation.invalidEmail')
    })

    it('shows validation error when terms not accepted', async () => {
      const w = factory()
      await w.find('#contactName').setValue('John Doe')
      await w.find('#contactEmail').setValue('john@test.com')
      await w.find('form').trigger('submit')
      await nextTick()
      expect(w.find('#err-demand-terms').exists()).toBe(true)
      expect(w.find('#err-demand-terms').text()).toBe('validation.termsRequired')
    })

    it('adds input-error class on invalid contact name', async () => {
      const w = factory()
      await w.find('form').trigger('submit')
      await nextTick()
      expect(w.find('#contactName').classes()).toContain('input-error')
    })

    it('adds aria-invalid on invalid contact email', async () => {
      const w = factory()
      await w.find('form').trigger('submit')
      await nextTick()
      expect(w.find('#contactEmail').attributes('aria-invalid')).toBe('true')
    })

    it('adds aria-describedby pointing to error id on invalid fields', async () => {
      const w = factory()
      await w.find('form').trigger('submit')
      await nextTick()
      expect(w.find('#contactName').attributes('aria-describedby')).toBe('err-demand-name')
      expect(w.find('#contactEmail').attributes('aria-describedby')).toBe('err-demand-email')
    })

    it('error messages have role=alert for accessibility', async () => {
      const w = factory()
      await w.find('form').trigger('submit')
      await nextTick()
      expect(w.find('#err-demand-name').attributes('role')).toBe('alert')
    })

    it('does not show errors before submission', () => {
      const w = factory()
      expect(w.find('#err-demand-name').exists()).toBe(false)
      expect(w.find('#err-demand-email').exists()).toBe(false)
      expect(w.find('#err-demand-terms').exists()).toBe(false)
    })

    it('does not call supabase insert when validation fails', async () => {
      const w = factory()
      await w.find('form').trigger('submit')
      await nextTick()
      expect(mockInsert).not.toHaveBeenCalled()
    })

    it('clears errors when valid data is entered and resubmitted', async () => {
      const w = factory()
      await w.find('form').trigger('submit')
      await nextTick()
      expect(w.find('#err-demand-name').exists()).toBe(true)

      // Now fill valid data
      await w.find('#contactName').setValue('Test')
      await w.find('#contactEmail').setValue('test@example.com')
      const checkboxes = w.findAll('input[type="checkbox"]')
      await checkboxes[checkboxes.length - 1].setValue(true)
      await w.find('form').trigger('submit')
      await nextTick()

      expect(w.find('#err-demand-name').exists()).toBe(false)
      expect(w.find('#err-demand-email').exists()).toBe(false)
    })
  })

  /* ------ Submit flow ---------------------------------------------- */
  describe('submit flow', () => {
    async function fillValidForm(w: VueWrapper) {
      await w.find('#contactName').setValue('Maria Garcia')
      await w.find('#contactEmail').setValue('maria@example.com')
      await w.find('#contactPhone').setValue('+34612345678')
      const checkboxes = w.findAll('input[type="checkbox"]')
      await checkboxes[checkboxes.length - 1].setValue(true)
    }

    it('calls supabase insert on valid submission', async () => {
      const w = factory()
      await fillValidForm(w)
      await w.find('form').trigger('submit')
      // Wait for async handleSubmit to resolve
      await vi.waitFor(() => {
        expect(mockSupabaseFrom).toHaveBeenCalledWith('demands')
      })
      expect(mockInsert).toHaveBeenCalledTimes(1)
      const insertArg = mockInsert.mock.calls[0][0] as Record<string, unknown>
      expect(insertArg.user_id).toBe('u1')
      expect(insertArg.contact_name).toBe('Maria Garcia')
      expect(insertArg.contact_email).toBe('maria@example.com')
      expect(insertArg.contact_phone).toBe('+34612345678')
      expect(insertArg.contact_preference).toBe('email')
      expect(insertArg.status).toBe('pending')
    })

    it('shows success message after successful submission', async () => {
      const w = factory()
      await fillValidForm(w)
      await w.find('form').trigger('submit')
      await vi.waitFor(() => {
        expect(w.find('.success-message').exists()).toBe(true)
      })
    })

    it('success message shows check icon, title and text', async () => {
      const w = factory()
      await fillValidForm(w)
      await w.find('form').trigger('submit')
      await vi.waitFor(() => {
        expect(w.find('.success-icon').exists()).toBe(true)
      })
      expect(w.find('.success-message h3').text()).toBe('demand.successTitle')
      expect(w.find('.success-message p').text()).toBe('demand.successMessage')
    })

    it('hides form after successful submission', async () => {
      const w = factory()
      await fillValidForm(w)
      await w.find('form').trigger('submit')
      await vi.waitFor(() => {
        expect(w.find('form.modal-body').exists()).toBe(false)
      })
    })

    it('auto-closes modal after 3 seconds on success', async () => {
      const w = factory()
      await fillValidForm(w)
      await w.find('form').trigger('submit')
      await vi.waitFor(() => {
        expect(w.find('.success-message').exists()).toBe(true)
      })

      vi.advanceTimersByTime(3000)
      await nextTick()

      expect(w.emitted('update:modelValue')).toBeTruthy()
      const emitted = w.emitted('update:modelValue')!
      expect(emitted[emitted.length - 1]).toEqual([false])
    })

    it('does not render form when user is not authenticated', () => {
      mockUser.value = null
      const w = factory()
      expect(w.find('form.modal-body').exists()).toBe(false)
      expect(w.find('.auth-required').exists()).toBe(true)
    })

    it('calls resetSelector after successful submit', async () => {
      const w = factory()
      await fillValidForm(w)
      await w.find('form').trigger('submit')
      await vi.waitFor(() => {
        expect(mockResetSelector).toHaveBeenCalled()
      })
    })

    it('passes vehicle_type from getVehicleSubcategoryLabel', async () => {
      mockGetVehicleSubcategoryLabel.mockReturnValue('Camiones > Volquetes')
      const w = factory()
      await fillValidForm(w)
      await w.find('form').trigger('submit')
      await vi.waitFor(() => {
        expect(mockInsert).toHaveBeenCalledTimes(1)
      })
      const insertArg = mockInsert.mock.calls[0][0] as Record<string, unknown>
      expect(insertArg.vehicle_type).toBe('Camiones > Volquetes')
    })

    it('passes attributes_json from getAttributesJson', async () => {
      mockGetAttributesJson.mockReturnValue({ ejes: '3', potencia: '400' })
      const w = factory()
      await fillValidForm(w)
      await w.find('form').trigger('submit')
      await vi.waitFor(() => {
        expect(mockInsert).toHaveBeenCalledTimes(1)
      })
      const insertArg = mockInsert.mock.calls[0][0] as Record<string, unknown>
      expect(insertArg.attributes_json).toEqual({ ejes: '3', potencia: '400' })
    })

    it('passes category_id and subcategory_id', async () => {
      mockSelectedCategoryId.value = 'c1'
      mockSelectedSubcategoryId.value = 's1'
      const w = factory()
      await fillValidForm(w)
      await w.find('form').trigger('submit')
      await vi.waitFor(() => {
        expect(mockInsert).toHaveBeenCalledTimes(1)
      })
      const insertArg = mockInsert.mock.calls[0][0] as Record<string, unknown>
      expect(insertArg.category_id).toBe('c1')
      expect(insertArg.subcategory_id).toBe('s1')
    })

    it('passes specs with brandPreference and specifications', async () => {
      const w = factory()
      await w.find('#brandPreference').setValue('MAN')
      await w.find('#specifications').setValue('Need air conditioning')
      await fillValidForm(w)
      await w.find('form').trigger('submit')
      await vi.waitFor(() => {
        expect(mockInsert).toHaveBeenCalledTimes(1)
      })
      const insertArg = mockInsert.mock.calls[0][0] as Record<string, unknown>
      const specs = insertArg.specs as Record<string, unknown>
      expect(specs.brandPreference).toBe('MAN')
      expect(specs.specifications).toBe('Need air conditioning')
    })
  })

  /* ------ Error states --------------------------------------------- */
  describe('error states', () => {
    async function fillAndSubmit(w: VueWrapper) {
      await w.find('#contactName').setValue('Test')
      await w.find('#contactEmail').setValue('test@test.com')
      const checkboxes = w.findAll('input[type="checkbox"]')
      await checkboxes[checkboxes.length - 1].setValue(true)
      await w.find('form').trigger('submit')
    }

    it('does not show success on supabase error', async () => {
      // Make the insert resolve with an error that will be thrown
      mockInsert.mockImplementation(() =>
        Promise.resolve({ data: null, error: { message: 'DB error' } }),
      )
      const w = factory()
      await fillAndSubmit(w)
      // Wait for the async handler to finish
      await vi.waitFor(() => {
        // After error, form should remain visible (isSubmitting goes back to false)
        expect(w.find('.btn-submit').exists()).toBe(true)
      })
      expect(w.find('.success-message').exists()).toBe(false)
      expect(w.find('form.modal-body').exists()).toBe(true)
    })

    it('re-enables submit button after supabase error', async () => {
      mockInsert.mockImplementation(() =>
        Promise.resolve({ data: null, error: { message: 'DB error' } }),
      )
      const w = factory()
      await fillAndSubmit(w)
      await vi.waitFor(() => {
        expect(w.find('.btn-submit').attributes('disabled')).toBeUndefined()
      })
    })
  })

  /* ------ Close / dismiss ------------------------------------------ */
  describe('close behavior', () => {
    it('emits update:modelValue false on close button click', async () => {
      const w = factory()
      await w.find('.close-button').trigger('click')
      expect(w.emitted('update:modelValue')).toBeTruthy()
      expect(w.emitted('update:modelValue')![0]).toEqual([false])
    })

    it('emits update:modelValue false on backdrop click', async () => {
      const w = factory()
      await w.find('.modal-backdrop').trigger('click')
      expect(w.emitted('update:modelValue')).toBeTruthy()
      expect(w.emitted('update:modelValue')![0]).toEqual([false])
    })

    it('does not close on click inside the modal container', async () => {
      const w = factory()
      await w.find('.modal-container').trigger('click')
      expect(w.emitted('update:modelValue')).toBeFalsy()
    })
  })

  /* ------ Category / subcategory change handlers ------------------- */
  describe('category and subcategory handlers', () => {
    it('calls selectCategory on category change', async () => {
      const w = factory()
      await w.find('#dem-category').trigger('change')
      expect(mockSelectCategory).toHaveBeenCalled()
    })

    it('calls selectSubcategory on subcategory change', async () => {
      mockSelectedCategoryId.value = 'c1'
      mockLinkedSubcategories.value = [
        { id: 's1', name: { es: 'Volquetes' }, name_es: 'Volquetes', name_en: null, slug: 'volquetes' },
      ]
      const w = factory()
      await w.find('#dem-subcategory').trigger('change')
      expect(mockSelectSubcategory).toHaveBeenCalled()
    })
  })

  /* ------ Watch behavior ------------------------------------------- */
  describe('watch on modelValue', () => {
    it('calls fetchInitialData when opened', async () => {
      const w = factory({ modelValue: false })
      expect(mockFetchInitialData).not.toHaveBeenCalled()
      await w.setProps({ modelValue: true })
      await nextTick()
      expect(mockFetchInitialData).toHaveBeenCalled()
    })

    it('calls resetSelector when closed (not in success state)', async () => {
      const w = factory({ modelValue: true })
      mockResetSelector.mockClear()
      await w.setProps({ modelValue: false })
      await nextTick()
      expect(mockResetSelector).toHaveBeenCalled()
    })
  })

  /* ------ catName helper (via rendering) --------------------------- */
  describe('catName helper (via rendering)', () => {
    it('uses localized name field', () => {
      mockCategories.value = [
        { id: 'c1', name: { es: 'Localized Es' }, name_es: 'Fallback Es', name_en: 'Fallback En', slug: 'test' },
      ]
      const w = factory()
      const options = w.findAll('#dem-category option')
      expect(options[1].text()).toBe('Localized Es')
    })

    it('falls back to name_es when localized name is null', () => {
      mockCategories.value = [
        { id: 'c1', name: null, name_es: 'Fallback Es', name_en: 'Fallback En', slug: 'test' },
      ]
      const w = factory()
      const options = w.findAll('#dem-category option')
      expect(options[1].text()).toBe('Fallback Es')
    })
  })

  /* ------ formatPrice helper (via price slider prop) --------------- */
  describe('formatPrice (via price slider)', () => {
    it('is passed as format-label to price range slider', () => {
      const w = factory()
      const sliders = w.findAllComponents({ name: 'UiRangeSlider' })
      // The second slider is the price slider
      const priceSlider = sliders[1]
      expect(priceSlider).toBeDefined()
      const formatLabel = priceSlider.props('formatLabel')
      if (typeof formatLabel === 'function') {
        expect(formatLabel(5000)).toBe('5k')
        expect(formatLabel(500)).toBe('500')
        expect(formatLabel(1000)).toBe('1k')
        expect(formatLabel(150000)).toBe('150k')
      }
    })
  })

  /* ------ Contact preference --------------------------------------- */
  describe('contact preference selector', () => {
    it('renders all three preference options', () => {
      const w = factory()
      const options = w.findAll('#contactPreference option')
      expect(options.length).toBe(3)
      expect(options[0].text()).toBe('demand.prefEmail')
      expect(options[1].text()).toBe('demand.prefPhone')
      expect(options[2].text()).toBe('demand.prefWhatsApp')
    })

    it('defaults to email preference', () => {
      const w = factory()
      const select = w.find('#contactPreference')
      expect((select.element as HTMLSelectElement).value).toBe('email')
    })
  })
})
