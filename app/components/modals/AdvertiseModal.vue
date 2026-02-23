<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSupabaseUser } from '#imports'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'open-auth': []
}>()

const { t, locale } = useI18n()
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

const isSubmitting = ref(false)
const isSuccess = ref(false)
const validationErrors = ref<Record<string, boolean>>({})

const photos = ref<File[]>([])
const photoPreviews = ref<string[]>([])
const MAX_PHOTOS = 6
const MIN_PHOTOS = 3

const techSheet = ref<File | null>(null)
const techSheetPreview = ref('')

const formData = ref({
  brand: '',
  model: '',
  year: null as number | null,
  kilometers: null as number | null,
  price: null as number | null,
  location: '',
  description: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  contactPreference: 'email',
  termsAccepted: false,
})

const contactPreferences = [
  { value: 'email', label: 'advertise.prefEmail' },
  { value: 'phone', label: 'advertise.prefPhone' },
  { value: 'whatsapp', label: 'advertise.prefWhatsApp' },
]

const isAuthenticated = computed(() => !!user.value)

const hasValidationErrors = computed(() => Object.keys(validationErrors.value).length > 0)

function catName(item: { name_es: string; name_en: string | null }) {
  return locale.value === 'en' && item.name_en ? item.name_en : item.name_es
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

const validateForm = (): boolean => {
  validationErrors.value = {}

  if (!formData.value.brand.trim()) validationErrors.value.brand = true
  if (!formData.value.model.trim()) validationErrors.value.model = true
  if (!formData.value.year) validationErrors.value.year = true
  if (!formData.value.price) validationErrors.value.price = true
  if (!formData.value.location.trim()) validationErrors.value.location = true
  if (!formData.value.description.trim()) validationErrors.value.description = true
  if (!formData.value.contactName.trim()) validationErrors.value.contactName = true
  if (!formData.value.contactEmail.trim()) validationErrors.value.contactEmail = true
  if (!formData.value.contactPhone.trim()) validationErrors.value.contactPhone = true
  if (photos.value.length < MIN_PHOTOS) validationErrors.value.photos = true
  if (!techSheet.value) validationErrors.value.techSheet = true
  if (!formData.value.termsAccepted) validationErrors.value.termsAccepted = true

  return Object.keys(validationErrors.value).length === 0
}

function handlePhotoSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  const files = Array.from(input.files).slice(0, MAX_PHOTOS - photos.value.length)
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) continue
    photos.value.push(file)
    photoPreviews.value.push(URL.createObjectURL(file))
  }
  input.value = ''
  if (validationErrors.value.photos && photos.value.length >= MIN_PHOTOS) {
    delete validationErrors.value.photos
  }
}

function removePhoto(index: number) {
  URL.revokeObjectURL(photoPreviews.value[index]!)
  photos.value.splice(index, 1)
  photoPreviews.value.splice(index, 1)
}

function handleTechSheetSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || !input.files[0]) return
  const file = input.files[0]
  if (file.size > 10 * 1024 * 1024) return
  if (techSheetPreview.value) URL.revokeObjectURL(techSheetPreview.value)
  techSheet.value = file
  techSheetPreview.value = URL.createObjectURL(file)
  input.value = ''
  if (validationErrors.value.techSheet) {
    delete validationErrors.value.techSheet
  }
}

function removeTechSheet() {
  if (techSheetPreview.value) URL.revokeObjectURL(techSheetPreview.value)
  techSheet.value = null
  techSheetPreview.value = ''
}

const resetForm = () => {
  formData.value = {
    brand: '',
    model: '',
    year: null,
    kilometers: null,
    price: null,
    location: '',
    description: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactPreference: 'email',
    termsAccepted: false,
  }
  photoPreviews.value.forEach((url) => URL.revokeObjectURL(url))
  photos.value = []
  photoPreviews.value = []
  removeTechSheet()
  validationErrors.value = {}
  resetSelector()
}

const handleSubmit = async () => {
  if (!validateForm()) return
  if (!isAuthenticated.value) return

  isSubmitting.value = true

  try {
    await $fetch('/api/advertisements', {
      method: 'POST',
      body: {
        vehicle_type: getVehicleSubcategoryLabel(locale.value),
        category_id: selectedCategoryId.value,
        subcategory_id: selectedSubcategoryId.value,
        attributes_json: getAttributesJson(),
        brand: formData.value.brand,
        model: formData.value.model,
        year: formData.value.year,
        kilometers: formData.value.kilometers,
        price: formData.value.price,
        location: formData.value.location,
        description: formData.value.description,
        photos: photos.value.map((f) => f.name),
        tech_sheet: techSheet.value?.name || null,
        contact_name: formData.value.contactName,
        contact_email: formData.value.contactEmail,
        contact_phone: formData.value.contactPhone,
        contact_preference: formData.value.contactPreference,
      },
    })

    isSuccess.value = true
    resetForm()

    setTimeout(() => {
      isSuccess.value = false
      close()
    }, 3000)
  } catch (err) {
    if (import.meta.dev) console.error('Error submitting advertisement:', err)
  } finally {
    isSubmitting.value = false
  }
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
    } else {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
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
        <div class="modal-container">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">{{ t('advertise.title') }}</h2>
              <p class="modal-subtitle">{{ t('advertise.subtitle') }}</p>
            </div>
            <button
              type="button"
              class="close-button"
              :aria-label="t('common.close')"
              @click="close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <div v-if="!isAuthenticated" class="auth-required">
            <p>{{ t('advertise.loginRequired') }}</p>
            <button type="button" class="btn btn-primary" @click="handleLoginClick">
              {{ t('auth.login') }}
            </button>
          </div>

          <div v-else-if="isSuccess" class="success-message">
            <div class="success-icon">&#x2713;</div>
            <h3>{{ t('advertise.successTitle') }}</h3>
            <p>{{ t('advertise.successMessage') }}</p>
          </div>

          <form v-else class="modal-body" @submit.prevent="handleSubmit">
            <!-- ═══ Section 1: Vehicle Type ═══ -->
            <div class="form-section">
              <h3 class="form-section-title">{{ t('advertise.sectionVehicleType') }}</h3>
              <div class="section-fields">
                <div class="form-group full-width">
                  <label for="adv-category" class="required">{{
                    t('advertise.vehicleType')
                  }}</label>
                  <select
                    id="adv-category"
                    class="form-input"
                    :value="selectedCategoryId || ''"
                    :disabled="selectorLoading"
                    @change="handleCategoryChange"
                  >
                    <option value="">{{ t('advertise.selectCategory') }}</option>
                    <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                      {{ catName(cat) }}
                    </option>
                  </select>
                </div>

                <div
                  v-if="selectedCategoryId && linkedSubcategories.length"
                  class="form-group full-width"
                >
                  <label for="adv-subcategory">{{ t('advertise.selectSubcategory') }}</label>
                  <select
                    id="adv-subcategory"
                    class="form-input"
                    :value="selectedSubcategoryId || ''"
                    @change="handleSubcategoryChange"
                  >
                    <option value="">{{ t('advertise.selectSubcategory') }}</option>
                    <option v-for="sub in linkedSubcategories" :key="sub.id" :value="sub.id">
                      {{ catName(sub) }}
                    </option>
                  </select>
                </div>

                <!-- Dynamic attributes -->
                <template v-if="selectedSubcategoryId && attributes.length">
                  <div class="form-group full-width filter-section-label">
                    <span class="filter-title">{{ t('advertise.characteristics') }}</span>
                  </div>
                  <template v-for="filter in attributes" :key="filter.id">
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
                        type="number"
                        class="form-input"
                        :min="(filter.options as Record<string, number>).min"
                        :max="(filter.options as Record<string, number>).max"
                        :step="(filter.options as Record<string, number>).step || 1"
                        :value="filterValues[filter.name] ?? ''"
                        @input="
                          setFilterValue(filter.name, ($event.target as HTMLInputElement).value)
                        "
                      >
                    </div>

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
                  <p class="loading-text">{{ t('common.loading') }}...</p>
                </div>
              </div>
            </div>

            <!-- ═══ Section 2: Vehicle Data ═══ -->
            <div class="form-section">
              <h3 class="form-section-title">{{ t('advertise.sectionVehicleData') }}</h3>
              <div class="section-fields">
                <div class="form-group">
                  <label for="brand" class="required">{{ t('advertise.brand') }}</label>
                  <input
                    id="brand"
                    v-model="formData.brand"
                    type="text"
                    class="form-input"
                    :class="{ 'input-error': validationErrors.brand }"
                  >
                </div>

                <div class="form-group">
                  <label for="model" class="required">{{ t('advertise.model') }}</label>
                  <input
                    id="model"
                    v-model="formData.model"
                    type="text"
                    class="form-input"
                    :class="{ 'input-error': validationErrors.model }"
                  >
                </div>

                <div class="form-group">
                  <label for="year" class="required">{{ t('advertise.year') }}</label>
                  <input
                    id="year"
                    v-model.number="formData.year"
                    type="number"
                    class="form-input"
                    :class="{ 'input-error': validationErrors.year }"
                    min="1980"
                    :max="new Date().getFullYear() + 1"
                  >
                </div>

                <div class="form-group">
                  <label for="kilometers">{{ t('advertise.kilometers') }}</label>
                  <input
                    id="kilometers"
                    v-model.number="formData.kilometers"
                    type="number"
                    class="form-input"
                    min="0"
                  >
                </div>

                <div class="form-group">
                  <label for="price" class="required">{{ t('advertise.price') }}</label>
                  <input
                    id="price"
                    v-model.number="formData.price"
                    type="number"
                    class="form-input"
                    :class="{ 'input-error': validationErrors.price }"
                    min="0"
                    step="100"
                  >
                </div>

                <div class="form-group">
                  <label for="location" class="required">{{ t('advertise.location') }}</label>
                  <input
                    id="location"
                    v-model="formData.location"
                    type="text"
                    class="form-input"
                    :class="{ 'input-error': validationErrors.location }"
                  >
                </div>

                <div class="form-group full-width">
                  <label for="description" class="required">{{ t('advertise.description') }}</label>
                  <textarea
                    id="description"
                    v-model="formData.description"
                    class="form-input"
                    :class="{ 'input-error': validationErrors.description }"
                    rows="3"
                    :placeholder="t('advertise.descriptionPlaceholder')"
                  />
                </div>
              </div>
            </div>

            <!-- ═══ Section 3: Images ═══ -->
            <div class="form-section">
              <h3 class="form-section-title">{{ t('advertise.sectionImages') }}</h3>
              <div class="section-fields section-fields--stacked">
                <!-- Vehicle photos -->
                <div class="upload-block">
                  <label class="required">
                    {{ t('advertise.photos') }}
                    <span class="photos-count">({{ photos.length }}/{{ MAX_PHOTOS }})</span>
                  </label>

                  <label
                    v-if="photos.length < MAX_PHOTOS"
                    class="upload-area"
                    :class="{ 'upload-error': validationErrors.photos }"
                  >
                    <svg
                      class="upload-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                      />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span class="upload-main-text">{{ t('advertise.dragOrClick') }}</span>
                    <strong class="upload-required-text">{{
                      t('advertise.photosRequired')
                    }}</strong>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      class="sr-only"
                      @change="handlePhotoSelect"
                    >
                  </label>

                  <div class="photo-recommendations">
                    <strong>{{ t('advertise.photoRecommendations') }}</strong>
                    <ul>
                      <li>{{ t('advertise.photoRec1') }}</li>
                      <li>{{ t('advertise.photoRec2') }}</li>
                      <li>{{ t('advertise.photoRec3') }}</li>
                      <li>{{ t('advertise.photoRec4') }}</li>
                      <li>{{ t('advertise.photoRec5') }}</li>
                    </ul>
                  </div>

                  <div v-if="photoPreviews.length" class="photo-grid">
                    <div v-for="(preview, i) in photoPreviews" :key="i" class="photo-thumb">
                      <img :src="preview" :alt="t('advertise.photos') + ' ' + (i + 1)" >
                      <button type="button" class="photo-remove" @click="removePhoto(i)">
                        &times;
                      </button>
                    </div>
                  </div>

                  <p v-if="validationErrors.photos" class="field-error">
                    {{ t('advertise.minPhotosError') }}
                  </p>
                </div>

                <!-- Technical sheet -->
                <div class="upload-block">
                  <label class="required">{{ t('advertise.techSheet') }}</label>

                  <label
                    v-if="!techSheet"
                    class="upload-area upload-area--compact"
                    :class="{ 'upload-error': validationErrors.techSheet }"
                  >
                    <svg
                      class="upload-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <span class="upload-main-text">{{ t('advertise.dragOrClickSingle') }}</span>
                    <strong class="upload-required-text">{{ t('advertise.techSheetHint') }}</strong>
                    <input
                      type="file"
                      accept="image/*"
                      class="sr-only"
                      @change="handleTechSheetSelect"
                    >
                  </label>

                  <div v-if="techSheetPreview" class="tech-sheet-preview">
                    <img :src="techSheetPreview" :alt="t('advertise.techSheet')" >
                    <button type="button" class="photo-remove" @click="removeTechSheet">
                      &times;
                    </button>
                  </div>

                  <p class="privacy-note">{{ t('advertise.techSheetPrivacy') }}</p>
                  <p v-if="validationErrors.techSheet" class="field-error">
                    {{ t('advertise.techSheetError') }}
                  </p>
                </div>
              </div>
            </div>

            <!-- ═══ Section 4: Contact ═══ -->
            <div class="form-section">
              <h3 class="form-section-title">{{ t('advertise.sectionContact') }}</h3>
              <div class="section-fields">
                <div class="form-group">
                  <label for="contactName" class="required">{{ t('advertise.contactName') }}</label>
                  <input
                    id="contactName"
                    v-model="formData.contactName"
                    type="text"
                    class="form-input"
                    :class="{ 'input-error': validationErrors.contactName }"
                  >
                </div>

                <div class="form-group">
                  <label for="contactEmail" class="required">{{
                    t('advertise.contactEmail')
                  }}</label>
                  <input
                    id="contactEmail"
                    v-model="formData.contactEmail"
                    type="email"
                    class="form-input"
                    :class="{ 'input-error': validationErrors.contactEmail }"
                  >
                </div>

                <div class="form-group">
                  <label for="contactPhone" class="required">{{
                    t('advertise.contactPhone')
                  }}</label>
                  <input
                    id="contactPhone"
                    v-model="formData.contactPhone"
                    type="tel"
                    class="form-input"
                    :class="{ 'input-error': validationErrors.contactPhone }"
                  >
                </div>

                <div class="form-group">
                  <label for="contactPreference">{{ t('advertise.contactPreference') }}</label>
                  <select
                    id="contactPreference"
                    v-model="formData.contactPreference"
                    class="form-input"
                  >
                    <option
                      v-for="pref in contactPreferences"
                      :key="pref.value"
                      :value="pref.value"
                    >
                      {{ t(pref.label) }}
                    </option>
                  </select>
                </div>

                <div class="form-group full-width">
                  <label
                    class="checkbox-label"
                    :class="{ 'input-error-text': validationErrors.termsAccepted }"
                  >
                    <input
                      v-model="formData.termsAccepted"
                      type="checkbox"
                      class="checkbox-input"
                    >
                    <span>{{ t('advertise.acceptTermsFull') }}</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Validation summary -->
            <p v-if="hasValidationErrors" class="validation-summary">
              {{ t('advertise.requiredField') }}
            </p>

            <div class="modal-footer">
              <button type="submit" class="btn btn-primary btn-submit" :disabled="isSubmitting">
                {{ isSubmitting ? t('advertise.sending') : t('advertise.submit') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/*
  Spacing token reference (Tailwind multiplier naming):
  --spacing-1 = 4px   --spacing-2 = 8px   --spacing-3 = 12px
  --spacing-4 = 16px  --spacing-5 = 20px  --spacing-6 = 24px
  --spacing-8 = 32px  --spacing-10 = 40px --spacing-12 = 48px
*/

/* ═══ Modal layout (mobile-first) ═══ */
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
  background: white;
  width: 100%;
  max-height: 92vh;
  overflow-y: auto;
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--spacing-3) var(--spacing-4); /* 12px 16px */
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.modal-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: var(--spacing-1) 0 0; /* 4px */
}

.close-button {
  background: none;
  border: none;
  font-size: 28px;
  line-height: 1;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 0.2s;
}

.close-button:hover {
  color: var(--color-text);
}

/* ═══ Auth / Success states ═══ */
.auth-required {
  padding: var(--spacing-8); /* 32px */
  text-align: center;
}

.auth-required p {
  margin-bottom: var(--spacing-4); /* 16px */
  color: var(--color-text-secondary);
}

.success-message {
  padding: var(--spacing-12) var(--spacing-6); /* 48px 24px */
  text-align: center;
}

.success-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #10b981;
  color: white;
  font-size: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-4); /* 16px */
}

.success-message h3 {
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-2); /* 8px */
  color: var(--color-text);
}

.success-message p {
  color: var(--color-text-secondary);
}

/* ═══ Form body ═══ */
.modal-body {
  padding: var(--spacing-3); /* 12px */
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3); /* 12px */
}

/* ═══ Section cards ═══ */
.form-section {
  background: #f9fafb;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: var(--spacing-3); /* 12px */
}

.form-section-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-primary);
  margin: 0 0 var(--spacing-3); /* 12px */
  padding-bottom: var(--spacing-2); /* 8px */
  border-bottom: 2px solid rgba(35, 66, 74, 0.2);
}

.section-fields {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-2); /* 8px */
}

.section-fields--stacked {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3); /* 12px */
}

/* ═══ Form groups ═══ */
.form-group {
  display: flex;
  flex-direction: column;
}

.full-width {
  grid-column: 1 / -1;
}

.form-group label,
.upload-block > label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 2px;
}

.required::after {
  content: ' *';
  color: #ef4444;
}

.unit-label {
  font-weight: 400;
  color: var(--color-text-secondary);
}

/* ═══ Filter section label ═══ */
.filter-section-label {
  margin-top: var(--spacing-1); /* 4px */
}

.filter-title {
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

/* ═══ Inputs ═══ */
.form-input {
  width: 100%;
  padding: 0.4rem 0.5rem; /* ~6px 8px — compact inputs */
  border: 1.5px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: inherit;
  transition: border-color 0.2s;
  min-height: 36px;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-error {
  border-color: #ef4444 !important;
}

textarea.form-input {
  resize: vertical;
  min-height: 60px;
}

/* ═══ Upload areas ═══ */
.upload-block {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2); /* 8px */
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4); /* 16px */
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius);
  background: white;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background 0.2s;
  text-align: center;
  gap: 2px;
}

.upload-area:hover {
  border-color: var(--color-primary);
  background: #f0f4f5;
}

.upload-area--compact {
  padding: var(--spacing-3); /* 12px */
}

.upload-error {
  border-color: #ef4444;
}

.upload-icon {
  width: 28px;
  height: 28px;
  color: var(--color-primary);
  margin-bottom: 2px;
}

.upload-main-text {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.upload-required-text {
  font-size: 0.8rem;
  color: var(--color-primary);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Photo recommendations */
.photo-recommendations {
  background: white;
  border-radius: 6px;
  padding: var(--spacing-2) var(--spacing-3); /* 8px 12px */
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.photo-recommendations strong {
  color: var(--color-text);
  display: block;
  margin-bottom: 2px;
  font-size: 0.8rem;
}

.photo-recommendations ul {
  margin: 0;
  padding-left: var(--spacing-4); /* 16px */
}

.photo-recommendations li {
  margin-bottom: 1px;
}

/* Photo previews */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-2); /* 8px */
}

.photo-thumb {
  position: relative;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.photo-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  min-height: 24px;
  transition: background 0.2s;
}

.photo-remove:hover {
  background: rgba(239, 68, 68, 0.9);
}

.photos-count {
  font-weight: 400;
  color: var(--color-text-secondary);
}

/* Tech sheet preview */
.tech-sheet-preview {
  position: relative;
  max-width: 160px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.tech-sheet-preview img {
  width: 100%;
  display: block;
}

.privacy-note {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-style: italic;
  margin: 0;
}

/* ═══ Validation ═══ */
.field-error {
  font-size: 0.75rem;
  color: #ef4444;
  margin: 2px 0 0;
}

.input-error-text {
  color: #ef4444;
}

.validation-summary {
  font-size: 0.8rem;
  color: #ef4444;
  text-align: center;
  margin: 0;
  padding: var(--spacing-2); /* 8px */
  background: #fef2f2;
  border-radius: 6px;
}

/* ═══ Checkbox ═══ */
.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-2); /* 8px */
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.checkbox-input {
  min-width: 18px;
  min-height: 18px;
  margin-top: 2px;
  cursor: pointer;
}

/* ═══ Footer ═══ */
.modal-footer {
  padding: var(--spacing-3) var(--spacing-4); /* 12px 16px */
  border-top: 1px solid var(--border-color);
  background: white;
  position: sticky;
  bottom: 0;
}

.btn {
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
  padding: var(--spacing-2) var(--spacing-6); /* 8px 24px */
}

.btn-primary {
  background: linear-gradient(135deg, var(--color-primary) 0%, #2d5560 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(35, 66, 74, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-submit {
  width: 100%;
}

/* ═══ Transitions ═══ */
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

/* ═══ Desktop (768px+) ═══ */
@media (min-width: 768px) {
  .modal-backdrop {
    align-items: center;
    padding: var(--spacing-6); /* 24px */
  }

  .modal-container {
    max-width: 700px;
    max-height: 88vh;
    border-radius: var(--border-radius);
  }

  .modal-header {
    padding: var(--spacing-4) var(--spacing-5); /* 16px 20px */
  }

  .modal-body {
    padding: var(--spacing-4) var(--spacing-5); /* 16px 20px */
    gap: var(--spacing-4); /* 16px */
  }

  .form-section {
    padding: var(--spacing-4); /* 16px */
  }

  .section-fields {
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-3); /* 12px */
  }

  .photo-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .modal-footer {
    padding: var(--spacing-4) var(--spacing-5); /* 16px 20px */
  }

  .btn-submit {
    width: auto;
    min-width: 200px;
  }

  .modal-enter-from .modal-container,
  .modal-leave-to .modal-container {
    transform: scale(0.95);
  }
}
</style>
