<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSupabaseClient, useSupabaseUser } from '#imports'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'open-auth': []
}>()

const { t: _t } = useI18n()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const isSubmitting = ref(false)
const isSuccess = ref(false)
const validationErrors = ref<Record<string, boolean>>({})

const photos = ref<File[]>([])
const photoPreviews = ref<string[]>([])
const MAX_PHOTOS = 6

const formData = ref({
  vehicleType: '',
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
  termsAccepted: false
})

const vehicleTypes = [
  { value: 'camion', label: 'advertise.types.truck' },
  { value: 'semirremolque', label: 'advertise.types.semitrailer' },
  { value: 'cabeza-tractora', label: 'advertise.types.tractor' },
  { value: 'furgoneta', label: 'advertise.types.van' },
  { value: 'otro', label: 'advertise.types.other' }
]

const contactPreferences = [
  { value: 'email', label: 'advertise.contact.email' },
  { value: 'phone', label: 'advertise.contact.phone' },
  { value: 'whatsapp', label: 'advertise.contact.whatsapp' }
]

const isAuthenticated = computed(() => !!user.value)

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

  if (!formData.value.contactName.trim()) {
    validationErrors.value.contactName = true
  }

  if (!formData.value.contactEmail.trim()) {
    validationErrors.value.contactEmail = true
  }

  if (!formData.value.termsAccepted) {
    validationErrors.value.termsAccepted = true
  }

  return Object.keys(validationErrors.value).length === 0
}

function handlePhotoSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  const files = Array.from(input.files).slice(0, MAX_PHOTOS - photos.value.length)
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) continue // max 10MB per file
    photos.value.push(file)
    photoPreviews.value.push(URL.createObjectURL(file))
  }
  input.value = ''
}

function removePhoto(index: number) {
  URL.revokeObjectURL(photoPreviews.value[index]!)
  photos.value.splice(index, 1)
  photoPreviews.value.splice(index, 1)
}

const resetForm = () => {
  formData.value = {
    vehicleType: '',
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
    termsAccepted: false
  }
  photoPreviews.value.forEach(url => URL.revokeObjectURL(url))
  photos.value = []
  photoPreviews.value = []
  validationErrors.value = {}
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  if (!isAuthenticated.value) {
    return
  }

  isSubmitting.value = true

  try {
    const photoNames = photos.value.map(f => f.name)

    const { error } = await supabase.from('advertisements').insert({
      user_id: user.value!.id,
      vehicle_type: formData.value.vehicleType,
      brand: formData.value.brand,
      model: formData.value.model,
      year: formData.value.year,
      kilometers: formData.value.kilometers,
      price: formData.value.price,
      location: formData.value.location,
      description: formData.value.description,
      photos: photoNames,
      contact_name: formData.value.contactName,
      contact_email: formData.value.contactEmail,
      contact_phone: formData.value.contactPhone,
      contact_preference: formData.value.contactPreference,
      status: 'pending'
    })

    if (error) throw error

    isSuccess.value = true
    resetForm()

    setTimeout(() => {
      isSuccess.value = false
      close()
    }, 3000)
  } catch (error) {
    console.error('Error submitting advertisement:', error)
  } finally {
    isSubmitting.value = false
  }
}

const handleLoginClick = () => {
  emit('open-auth')
  close()
}

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
  } else {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', handleKeyDown)
    if (!isSuccess.value) {
      resetForm()
    }
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="modal-backdrop"
        @click="handleBackdropClick"
      >
        <div class="modal-container">
          <div class="modal-header">
            <h2 class="modal-title">{{ $t('advertise.title') }}</h2>
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
            <p>{{ $t('advertise.loginRequired') }}</p>
            <button
              type="button"
              class="btn btn-primary"
              @click="handleLoginClick"
            >
              {{ $t('auth.login') }}
            </button>
          </div>

          <div v-else-if="isSuccess" class="success-message">
            <div class="success-icon">✓</div>
            <h3>{{ $t('advertise.successTitle') }}</h3>
            <p>{{ $t('advertise.successMessage') }}</p>
          </div>

          <form v-else class="modal-body" @submit.prevent="handleSubmit">
            <div class="form-grid">
              <div class="form-group full-width">
                <label for="vehicleType">{{ $t('advertise.vehicleType') }}</label>
                <select
                  id="vehicleType"
                  v-model="formData.vehicleType"
                  class="form-input"
                >
                  <option value="">{{ $t('advertise.selectType') }}</option>
                  <option
                    v-for="type in vehicleTypes"
                    :key="type.value"
                    :value="type.value"
                  >
                    {{ $t(type.label) }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="brand">{{ $t('advertise.brand') }}</label>
                <input
                  id="brand"
                  v-model="formData.brand"
                  type="text"
                  class="form-input"
                >
              </div>

              <div class="form-group">
                <label for="model">{{ $t('advertise.model') }}</label>
                <input
                  id="model"
                  v-model="formData.model"
                  type="text"
                  class="form-input"
                >
              </div>

              <div class="form-group">
                <label for="year">{{ $t('advertise.year') }}</label>
                <input
                  id="year"
                  v-model.number="formData.year"
                  type="number"
                  class="form-input"
                  min="1980"
                  :max="new Date().getFullYear() + 1"
                >
              </div>

              <div class="form-group">
                <label for="kilometers">{{ $t('advertise.kilometers') }}</label>
                <input
                  id="kilometers"
                  v-model.number="formData.kilometers"
                  type="number"
                  class="form-input"
                  min="0"
                >
              </div>

              <div class="form-group">
                <label for="price">{{ $t('advertise.price') }}</label>
                <input
                  id="price"
                  v-model.number="formData.price"
                  type="number"
                  class="form-input"
                  min="0"
                  step="100"
                >
              </div>

              <div class="form-group">
                <label for="location">{{ $t('advertise.location') }}</label>
                <input
                  id="location"
                  v-model="formData.location"
                  type="text"
                  class="form-input"
                >
              </div>

              <div class="form-group full-width">
                <label for="description">{{ $t('advertise.description') }}</label>
                <textarea
                  id="description"
                  v-model="formData.description"
                  class="form-input"
                  rows="4"
                />
              </div>

              <!-- Photo upload -->
              <div class="form-group full-width">
                <label>{{ $t('advertise.photos') }} ({{ photos.length }}/{{ MAX_PHOTOS }})</label>
                <div v-if="photoPreviews.length" class="photo-grid">
                  <div v-for="(preview, i) in photoPreviews" :key="i" class="photo-thumb">
                    <img :src="preview" alt="">
                    <button type="button" class="photo-remove" @click="removePhoto(i)">&times;</button>
                  </div>
                </div>
                <label v-if="photos.length < MAX_PHOTOS" class="photo-upload-btn">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    class="photo-input"
                    @change="handlePhotoSelect"
                  >
                  <span>{{ $t('advertise.addPhotos') }}</span>
                </label>
              </div>

              <div class="form-group">
                <label for="contactName">
                  {{ $t('advertise.contactName') }} *
                </label>
                <input
                  id="contactName"
                  v-model="formData.contactName"
                  type="text"
                  class="form-input"
                  :class="{ 'input-error': validationErrors.contactName }"
                  required
                >
              </div>

              <div class="form-group">
                <label for="contactEmail">
                  {{ $t('advertise.contactEmail') }} *
                </label>
                <input
                  id="contactEmail"
                  v-model="formData.contactEmail"
                  type="email"
                  class="form-input"
                  :class="{ 'input-error': validationErrors.contactEmail }"
                  required
                >
              </div>

              <div class="form-group">
                <label for="contactPhone">{{ $t('advertise.contactPhone') }}</label>
                <input
                  id="contactPhone"
                  v-model="formData.contactPhone"
                  type="tel"
                  class="form-input"
                >
              </div>

              <div class="form-group">
                <label for="contactPreference">{{ $t('advertise.contactPreference') }}</label>
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
                    {{ $t(pref.label) }}
                  </option>
                </select>
              </div>

              <div class="form-group full-width">
                <label class="checkbox-label">
                  <input
                    v-model="formData.termsAccepted"
                    type="checkbox"
                    class="checkbox-input"
                    :class="{ 'input-error': validationErrors.termsAccepted }"
                  >
                  <span>{{ $t('advertise.termsAcceptance') }}</span>
                </label>
              </div>
            </div>

            <div class="modal-footer">
              <button
                type="submit"
                class="btn btn-primary btn-submit"
                :disabled="isSubmitting"
              >
                {{ isSubmitting ? $t('common.submitting') : $t('advertise.submit') }}
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
  background: white;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 16px 16px 0 0;
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
  background: white;
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
  font-size: 32px;
  line-height: 1;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0;
  min-width: 44px;
  min-height: 44px;
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
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #10b981;
  color: white;
  font-size: 40px;
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

.form-input {
  width: 100%;
  padding: var(--spacing-12);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-family: inherit;
  transition: border-color 0.2s;
  min-height: 44px;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.input-error {
  border-color: #ef4444;
}

textarea.form-input {
  resize: vertical;
  min-height: 100px;
}

/* Photo upload */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.photo-thumb {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
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
}

.photo-upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border: 2px dashed var(--border-color, #e5e7eb);
  border-radius: 8px;
  cursor: pointer;
  color: var(--color-primary);
  font-weight: 500;
  font-size: 0.9rem;
  min-height: 44px;
  transition: border-color 0.2s;
}

.photo-upload-btn:hover {
  border-color: var(--color-primary);
}

.photo-input {
  display: none;
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
  min-width: 20px;
  min-height: 20px;
  margin-top: 2px;
  cursor: pointer;
}

.modal-footer {
  padding: var(--spacing-16);
  border-top: 1px solid var(--border-color);
  background: white;
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
  min-height: 44px;
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

@media (min-width: 768px) {
  .modal-backdrop {
    align-items: center;
    padding: var(--spacing-24);
  }

  .modal-container {
    max-width: 600px;
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
    min-width: 200px;
  }

  .modal-enter-from .modal-container,
  .modal-leave-to .modal-container {
    transform: scale(0.9);
  }
}
</style>
