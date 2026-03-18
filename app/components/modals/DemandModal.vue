<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { localizedField } from '~/composables/useLocalized'
import { advertisementContactSchema } from '~/utils/schemas'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'open-auth': []
}>()

const { t: _t, locale } = useI18n()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const {
  categories,
  linkedSubcategories,
  attributes,
  selectedCategoryId,
  selectedSubcategoryId,
  filterValues,
  loading: selectorLoading,
  filtersLoading,
  fetchInitialData,
  selectCategory,
  selectSubcategory,
  setFilterValue,
  getAttributesJson,
  getFilterLabel,
  getFilterOptions,
  getVehicleSubcategoryLabel,
  reset: resetSelector,
} = useVehicleTypeSelector()

const dialogRef = ref<HTMLElement | null>(null)
const { activate: activateTrap, deactivate: deactivateTrap } = useFocusTrap()

const isSuccess = ref(false)

const formData = ref({
  brandPreference: '',
  yearMin: null as number | null,
  yearMax: null as number | null,
  priceMin: null as number | null,
  priceMax: null as number | null,
  specifications: '',
})

const {
  defineField: defineContactField,
  translatedErrors: contactErrors,
  isSubmitting,
  onSubmit: onContactSubmit,
  resetForm: resetContactForm,
} = useFormValidation(advertisementContactSchema, {
  initialValues: {
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactPreference: 'email' as const,
    termsAccepted: false as unknown as true,
  },
  onSubmit: async (contactValues) => {
    if (!isAuthenticated.value) return

    try {
      const specs = {
        brandPreference: formData.value.brandPreference,
        yearMin: formData.value.yearMin,
        yearMax: formData.value.yearMax,
        priceMin: formData.value.priceMin,
        priceMax: formData.value.priceMax,
        specifications: formData.value.specifications,
      }

      const { error } = await supabase.from('demands').insert({
        user_id: user.value!.id,
        vehicle_type: getVehicleSubcategoryLabel(locale.value),
        category_id: selectedCategoryId.value,
        subcategory_id: selectedSubcategoryId.value,
        attributes_json: getAttributesJson() as never,
        year_min: formData.value.yearMin,
        year_max: formData.value.yearMax,
        price_min: formData.value.priceMin,
        price_max: formData.value.priceMax,
        specs,
        contact_name: contactValues.contactName,
        contact_email: contactValues.contactEmail,
        contact_phone: contactValues.contactPhone,
        contact_preference: contactValues.contactPreference,
        status: 'pending',
      })

      if (error) throw error

      isSuccess.value = true
      resetForm()

      setTimeout(() => {
        isSuccess.value = false
        close()
      }, 3000)
    } catch (err) {
      if (import.meta.dev) console.error('Error submitting demand:', err)
    }
  },
})

const [contactName] = defineContactField('contactName')
const [contactEmail] = defineContactField('contactEmail')
const [contactPhone] = defineContactField('contactPhone')
const [contactPreference] = defineContactField('contactPreference')
const [termsAccepted] = defineContactField('termsAccepted')

const contactPreferences = [
  { value: 'email', label: 'demand.prefEmail' },
  { value: 'phone', label: 'demand.prefPhone' },
  { value: 'whatsapp', label: 'demand.prefWhatsApp' },
]

const currentYear = new Date().getFullYear() + 1
const isAuthenticated = computed(() => !!user.value)

function catName(item: {
  name_es: string
  name_en: string | null
  name?: Record<string, string> | null
}) {
  return (
    localizedField(item.name, locale.value) ||
    (locale.value === 'en' && item.name_en ? item.name_en : item.name_es)
  )
}

function formatPrice(n: number): string {
  if (n >= 1000) return `${Math.round(n / 1000)}k`
  return String(n)
}

const close = () => {
  emit('update:modelValue', false)
}

const handleBackdropClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    close()
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    close()
  }
}

const resetForm = () => {
  formData.value = {
    brandPreference: '',
    yearMin: null,
    yearMax: null,
    priceMin: null,
    priceMax: null,
    specifications: '',
  }
  resetContactForm()
  resetSelector()
}

const handleLoginClick = () => {
  emit('open-auth')
  close()
}

function handleCategoryChange(e: Event) {
  const value = (e.target as HTMLSelectElement).value
  selectCategory(value || null)
}

async function handleSubcategoryChange(e: Event) {
  const value = (e.target as HTMLSelectElement).value
  await selectSubcategory(value || null)
}

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleKeyDown)
      fetchInitialData()
      nextTick(() => activateTrap(dialogRef.value))
    } else {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
      deactivateTrap()
      if (!isSuccess.value) {
        resetForm()
      }
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click="handleBackdropClick">
        <div ref="dialogRef" class="modal-container">
          <div class="modal-header">
            <h2 class="modal-title">{{ $t('demand.title') }}</h2>
            <button
              type="button"
              class="close-button"
              :aria-label="$t('common.close')"
              @click="close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <div v-if="!isAuthenticated" class="auth-required">
            <p>{{ $t('demand.loginRequired') }}</p>
            <button type="button" class="btn btn-primary" @click="handleLoginClick">
              {{ $t('auth.login') }}
            </button>
          </div>

          <div v-else-if="isSuccess" class="success-message">
            <div class="success-icon">✓</div>
            <h3>{{ $t('demand.successTitle') }}</h3>
            <p>{{ $t('demand.successMessage') }}</p>
          </div>

          <form v-else class="modal-body" @submit="onContactSubmit">
            <div class="form-grid">
              <!-- Category selector -->
              <div class="form-group full-width">
                <label for="dem-category">{{ $t('demand.vehicleType') }}</label>
                <select
                  id="dem-category"
                  class="form-input"
                  :value="selectedCategoryId || ''"
                  :disabled="selectorLoading"
                  @change="handleCategoryChange"
                >
                  <option value="">{{ $t('demand.selectCategory') }}</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                    {{ catName(cat) }}
                  </option>
                </select>
              </div>

              <!-- Subcategory selector -->
              <div
                v-if="selectedCategoryId && linkedSubcategories.length"
                class="form-group full-width"
              >
                <label for="dem-subcategory">{{ $t('demand.selectSubcategory') }}</label>
                <select
                  id="dem-subcategory"
                  class="form-input"
                  :value="selectedSubcategoryId || ''"
                  @change="handleSubcategoryChange"
                >
                  <option value="">{{ $t('demand.selectSubcategory') }}</option>
                  <option v-for="sub in linkedSubcategories" :key="sub.id" :value="sub.id">
                    {{ catName(sub) }}
                  </option>
                </select>
              </div>

              <!-- Dynamic attributes (demand mode: slider/calc = range) -->
              <template v-if="selectedSubcategoryId && attributes.length">
                <div class="form-group full-width section-label">
                  <span class="section-title">{{ $t('demand.characteristics') }}</span>
                </div>
                <template v-for="filter in attributes" :key="filter.id">
                  <!-- Desplegable / Desplegable tick → select -->
                  <div
                    v-if="filter.type === 'desplegable' || filter.type === 'desplegable_tick'"
                    class="form-group"
                  >
                    <label :for="`f-${filter.name}`">
                      {{ getFilterLabel(filter, locale) }}
                      <span v-if="filter.unit" class="unit-label">({{ filter.unit }})</span>
                    </label>
                    <select
                      :id="`f-${filter.name}`"
                      class="form-input"
                      :value="filterValues[filter.name] || ''"
                      @change="
                        setFilterValue(filter.name, ($event.target as HTMLSelectElement).value)
                      "
                    >
                      <option value="">-</option>
                      <option v-for="opt in getFilterOptions(filter)" :key="opt" :value="opt">
                        {{ opt }}
                      </option>
                    </select>
                  </div>

                  <!-- Caja → text input -->
                  <div v-else-if="filter.type === 'caja'" class="form-group">
                    <label :for="`f-${filter.name}`">
                      {{ getFilterLabel(filter, locale) }}
                      <span v-if="filter.unit" class="unit-label">({{ filter.unit }})</span>
                    </label>
                    <input
                      :id="`f-${filter.name}`"
                      type="text"
                      class="form-input"
                      :value="filterValues[filter.name] || ''"
                      @input="
                        setFilterValue(filter.name, ($event.target as HTMLInputElement).value)
                      "
                    >
                  </div>

                  <!-- Slider / Calc → text input (demand: single value preference) -->
                  <div
                    v-else-if="filter.type === 'slider' || filter.type === 'calc'"
                    class="form-group"
                  >
                    <label :for="`f-${filter.name}`">
                      {{ getFilterLabel(filter, locale) }}
                      <span v-if="filter.unit" class="unit-label">({{ filter.unit }})</span>
                    </label>
                    <input
                      :id="`f-${filter.name}`"
                      type="text"
                      class="form-input"
                      :placeholder="$t('demand.specifications')"
                      :value="filterValues[filter.name] || ''"
                      @input="
                        setFilterValue(filter.name, ($event.target as HTMLInputElement).value)
                      "
                    >
                  </div>

                  <!-- Tick → checkbox -->
                  <div v-else-if="filter.type === 'tick'" class="form-group">
                    <label class="checkbox-label">
                      <input
                        type="checkbox"
                        class="checkbox-input"
                        :checked="!!filterValues[filter.name]"
                        @change="
                          setFilterValue(filter.name, ($event.target as HTMLInputElement).checked)
                        "
                      >
                      <span>{{ getFilterLabel(filter, locale) }}</span>
                    </label>
                  </div>
                </template>
              </template>

              <div v-if="filtersLoading" class="form-group full-width">
                <p class="loading-text">{{ $t('common.loading') }}...</p>
              </div>

              <!-- Brand preference -->
              <div class="form-group full-width">
                <label for="brandPreference">{{ $t('demand.brandPreference') }}</label>
                <input
                  id="brandPreference"
                  v-model="formData.brandPreference"
                  type="text"
                  class="form-input"
                  :placeholder="$t('demand.brandPlaceholder')"
                >
              </div>

              <!-- Year range -->
              <div class="form-group full-width">
                <label>{{ $t('demand.yearRange') }}</label>
                <UiRangeSlider
                  :min="2000"
                  :max="currentYear"
                  :step="1"
                  :model-min="formData.yearMin"
                  :model-max="formData.yearMax"
                  @update:model-min="formData.yearMin = $event"
                  @update:model-max="formData.yearMax = $event"
                />
              </div>

              <!-- Price range -->
              <div class="form-group full-width">
                <label>{{ $t('demand.priceRange') }}</label>
                <UiRangeSlider
                  :min="0"
                  :max="200000"
                  :step="500"
                  :model-min="formData.priceMin"
                  :model-max="formData.priceMax"
                  :format-label="formatPrice"
                  @update:model-min="formData.priceMin = $event"
                  @update:model-max="formData.priceMax = $event"
                />
              </div>

              <!-- Specifications -->
              <div class="form-group full-width">
                <label for="specifications">{{ $t('demand.specifications') }}</label>
                <textarea
                  id="specifications"
                  v-model="formData.specifications"
                  class="form-input"
                  rows="4"
                  :placeholder="$t('demand.specificationsPlaceholder')"
                />
              </div>

              <!-- Contact info -->
              <div class="form-group">
                <label for="contactName"> {{ $t('demand.contactName') }} * </label>
                <input
                  id="contactName"
                  v-model="contactName"
                  type="text"
                  class="form-input"
                  :class="{ 'input-error': contactErrors.contactName }"
                  :aria-invalid="!!contactErrors.contactName || undefined"
                  :aria-describedby="contactErrors.contactName ? 'err-demand-name' : undefined"
                  autocomplete="name"
                >
                <p
                  v-if="contactErrors.contactName"
                  id="err-demand-name"
                  class="field-error"
                  role="alert"
                >
                  {{ contactErrors.contactName }}
                </p>
              </div>

              <div class="form-group">
                <label for="contactEmail"> {{ $t('demand.contactEmail') }} * </label>
                <input
                  id="contactEmail"
                  v-model="contactEmail"
                  type="email"
                  class="form-input"
                  :class="{ 'input-error': contactErrors.contactEmail }"
                  :aria-invalid="!!contactErrors.contactEmail || undefined"
                  :aria-describedby="contactErrors.contactEmail ? 'err-demand-email' : undefined"
                  autocomplete="email"
                >
                <p
                  v-if="contactErrors.contactEmail"
                  id="err-demand-email"
                  class="field-error"
                  role="alert"
                >
                  {{ contactErrors.contactEmail }}
                </p>
              </div>

              <div class="form-group">
                <label for="contactPhone">{{ $t('demand.contactPhone') }} *</label>
                <input
                  id="contactPhone"
                  v-model="contactPhone"
                  type="tel"
                  class="form-input"
                  :class="{ 'input-error': contactErrors.contactPhone }"
                  :aria-invalid="!!contactErrors.contactPhone || undefined"
                  :aria-describedby="contactErrors.contactPhone ? 'err-demand-phone' : undefined"
                  autocomplete="tel"
                >
                <p
                  v-if="contactErrors.contactPhone"
                  id="err-demand-phone"
                  class="field-error"
                  role="alert"
                >
                  {{ contactErrors.contactPhone }}
                </p>
              </div>

              <div class="form-group">
                <label for="contactPreference">{{ $t('demand.contactPreference') }}</label>
                <select
                  id="contactPreference"
                  v-model="contactPreference"
                  class="form-input"
                >
                  <option v-for="pref in contactPreferences" :key="pref.value" :value="pref.value">
                    {{ $t(pref.label) }}
                  </option>
                </select>
              </div>

              <div class="form-group full-width">
                <label class="checkbox-label">
                  <input
                    v-model="termsAccepted"
                    type="checkbox"
                    class="checkbox-input"
                    :class="{ 'input-error': contactErrors.termsAccepted }"
                    :aria-invalid="!!contactErrors.termsAccepted || undefined"
                    :aria-describedby="
                      contactErrors.termsAccepted ? 'err-demand-terms' : undefined
                    "
                  >
                  <span>{{ $t('demand.acceptTerms') }}</span>
                </label>
                <p
                  v-if="contactErrors.termsAccepted"
                  id="err-demand-terms"
                  class="field-error"
                  role="alert"
                >
                  {{ contactErrors.termsAccepted }}
                </p>
              </div>
            </div>

            <div class="modal-footer">
              <button type="submit" class="btn btn-primary btn-submit" :disabled="isSubmitting">
                {{ isSubmitting ? $t('demand.sending') : $t('demand.submit') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 9999;
  overflow-y: auto;
}

.modal-container {
  background: var(--bg-primary);
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-16);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  background: var(--bg-primary);
  z-index: 1;
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 2rem;
  line-height: 1;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0;
  min-width: 2.75rem;
  min-height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-button:hover {
  color: var(--color-text);
}

.modal-body {
  padding: var(--spacing-16);
  flex: 1;
}

.auth-required {
  padding: var(--spacing-32);
  text-align: center;
}

.auth-required p {
  margin-bottom: var(--spacing-16);
  color: var(--color-text-secondary);
}

.success-message {
  padding: var(--spacing-48) var(--spacing-24);
  text-align: center;
}

.success-icon {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background-color: var(--color-success);
  color: white;
  font-size: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-16);
}

.success-message h3 {
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-8);
  color: var(--color-text);
}

.success-message p {
  color: var(--color-text-secondary);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-16);
}

.form-group {
  display: flex;
  flex-direction: column;
}

.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: var(--spacing-8);
}

.unit-label {
  font-weight: 400;
  color: var(--color-text-secondary);
}

.section-label {
  margin-top: var(--spacing-8);
  margin-bottom: calc(-1 * var(--spacing-8));
}

.section-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.loading-text {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin: 0;
}

.form-input {
  width: 100%;
  padding: var(--spacing-12);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-family: inherit;
  transition: border-color 0.2s;
  min-height: 2.75rem;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-error {
  border-color: var(--color-error);
}

.field-error {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-error, var(--color-error));
  margin-top: var(--spacing-1);
}

textarea.form-input {
  resize: vertical;
  min-height: 6.25rem;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-8);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.checkbox-input {
  min-width: 1.25rem;
  min-height: 1.25rem;
  margin-top: 0.125rem;
  cursor: pointer;
}

.modal-footer {
  padding: var(--spacing-16);
  border-top: 1px solid var(--border-color);
  background: var(--bg-primary);
  position: sticky;
  bottom: 0;
}

.btn {
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 2.75rem;
  padding: var(--spacing-12) var(--spacing-24);
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-submit {
  width: 100%;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: translateY(100%);
}

@media (min-width: 48em) {
  .modal-backdrop {
    align-items: center;
    padding: var(--spacing-24);
  }

  .modal-container {
    max-width: 37.5em;
    max-height: 85vh;
    border-radius: var(--border-radius);
  }

  .modal-header {
    padding: var(--spacing-24);
  }

  .modal-body {
    padding: var(--spacing-24);
  }

  .form-grid {
    grid-template-columns: 1fr 1fr;
  }

  .modal-footer {
    padding: var(--spacing-24);
  }

  .btn-submit {
    width: auto;
    min-width: 12.5rem;
  }

  .modal-enter-from .modal-container,
  .modal-leave-to .modal-container {
    transform: scale(0.9);
  }
}
</style>
