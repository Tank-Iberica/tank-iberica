<script setup lang="ts">
/**
 * InspectionRequestForm Component
 *
 * Physical inspection request form for vehicles.
 * Inserts a service_request with type='inspection' and contact metadata.
 * Mobile-first design with touch targets >= 44px.
 */

interface Props {
  vehicleId: string
  vehicleTitle: string
}

const props = defineProps<Props>()

const { t } = useI18n()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

// Form state
const formData = ref({
  name: '',
  email: '',
  phone: '',
  preferredDate: '',
  notes: '',
})

const loading = ref(false)
const submitted = ref(false)
const showCheckmark = ref(false)
const error = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})

// Pre-fill user data if authenticated
watchEffect(() => {
  if (user.value) {
    const metadata = user.value.user_metadata
    if (metadata?.full_name && !formData.value.name) {
      formData.value.name = metadata.full_name
    }
    if (user.value.email && !formData.value.email) {
      formData.value.email = user.value.email
    }
    if (metadata?.phone && !formData.value.phone) {
      formData.value.phone = metadata.phone
    }
  }
})

async function submitRequest() {
  error.value = null
  fieldErrors.value = {}

  if (!formData.value.name.trim()) {
    fieldErrors.value.name = t('validation.required')
  }
  if (!formData.value.email.trim()) {
    fieldErrors.value.email = t('validation.required')
  } else if (!/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(formData.value.email)) {
    fieldErrors.value.email = t('validation.invalidEmail')
  }
  if (!formData.value.phone.trim()) {
    fieldErrors.value.phone = t('validation.required')
  }

  if (Object.keys(fieldErrors.value).length > 0) return

  loading.value = true

  try {
    const { error: insertError } = await supabase.from('service_requests').insert({
      type: 'inspection',
      vehicle_id: props.vehicleId,
      user_id: user.value?.id || null,
      status: 'requested',
      details: {
        vehicle_title: props.vehicleTitle,
        contact: {
          name: formData.value.name,
          email: formData.value.email,
          phone: formData.value.phone,
        },
        preferred_date: formData.value.preferredDate || null,
        notes: formData.value.notes || null,
        requested_at: new Date().toISOString(),
      },
    })

    if (insertError) throw insertError

    submitted.value = true
    await nextTick()
    requestAnimationFrame(() => {
      showCheckmark.value = true
    })

    // Reset form
    formData.value = {
      name: '',
      email: '',
      phone: '',
      preferredDate: '',
      notes: '',
    }
  } catch (err: unknown) {
    const supabaseError = err as { message?: string }
    error.value = supabaseError?.message || t('inspection.errorSubmitting')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  submitted.value = false
  showCheckmark.value = false
  error.value = null
}
</script>

<template>
  <div class="inspection-form">
    <div v-if="submitted" class="success-message">
      <UiSuccessCheckmark :show="showCheckmark" />
      <h3>{{ $t('inspection.success') }}</h3>
      <p>{{ $t('inspection.successDesc') }}</p>
      <p class="price-info">{{ $t('inspection.price') }}</p>
      <button type="button" class="btn-secondary" @click="resetForm">
        {{ $t('common.close') }}
      </button>
    </div>

    <form v-else @submit.prevent="submitRequest">
      <h3>{{ $t('inspection.title') }}</h3>
      <p class="description">{{ $t('inspection.description') }}</p>

      <div class="form-group">
        <label for="name">{{ $t('inspection.name') }} *</label>
        <input
          id="name"
          v-model="formData.name"
          type="text"
          autocomplete="name"
          :aria-invalid="!!fieldErrors.name || undefined"
          :aria-describedby="fieldErrors.name ? 'err-insp-name' : undefined"
          :placeholder="$t('inspection.namePlaceholder')"
        />
        <p v-if="fieldErrors.name" id="err-insp-name" class="field-error" role="alert">
          {{ fieldErrors.name }}
        </p>
      </div>

      <div class="form-group">
        <label for="email">{{ $t('inspection.email') }} *</label>
        <input
          id="email"
          v-model="formData.email"
          type="email"
          autocomplete="email"
          :aria-invalid="!!fieldErrors.email || undefined"
          :aria-describedby="fieldErrors.email ? 'err-insp-email' : undefined"
          :placeholder="$t('inspection.emailPlaceholder')"
        />
        <p v-if="fieldErrors.email" id="err-insp-email" class="field-error" role="alert">
          {{ fieldErrors.email }}
        </p>
      </div>

      <div class="form-group">
        <label for="phone">{{ $t('inspection.phone') }} *</label>
        <input
          id="phone"
          v-model="formData.phone"
          type="tel"
          autocomplete="tel"
          :aria-invalid="!!fieldErrors.phone || undefined"
          :aria-describedby="fieldErrors.phone ? 'err-insp-phone' : undefined"
          :placeholder="$t('inspection.phonePlaceholder')"
        />
        <p v-if="fieldErrors.phone" id="err-insp-phone" class="field-error" role="alert">
          {{ fieldErrors.phone }}
        </p>
      </div>

      <div class="form-group">
        <label for="preferredDate">{{ $t('inspection.preferredDate') }}</label>
        <input
          id="preferredDate"
          v-model="formData.preferredDate"
          type="date"
          autocomplete="off"
          :min="new Date().toISOString().split('T')[0]"
        />
      </div>

      <div class="form-group">
        <label for="notes">{{ $t('inspection.notes') }}</label>
        <textarea
          id="notes"
          v-model="formData.notes"
          rows="4"
          autocomplete="off"
          :placeholder="$t('inspection.notesPlaceholder')"
        />
      </div>

      <div v-if="error" class="error-message" role="alert">
        {{ error }}
      </div>

      <button type="submit" class="btn-primary" :disabled="loading">
        {{ loading ? $t('inspection.submitting') : $t('inspection.submit') }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.inspection-form {
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  max-width: 37.5em;
  margin: 0 auto;
}

.inspection-form h3 {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.description {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

.form-group {
  margin-bottom: 1.25rem;
}

.field-error {
  font-size: var(--font-size-xs);
  color: var(--color-error);
  margin-top: 0.25rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-base);
  transition: border-color 0.2s;
  min-height: 2.75rem;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha-10, rgba(35, 66, 74, 0.1));
}

.form-group textarea {
  resize: vertical;
  min-height: 6.25rem;
  font-family: inherit;
}

.btn-primary,
.btn-secondary {
  width: 100%;
  padding: 0.875rem 1.5rem;
  min-height: 3rem;
  font-size: var(--font-size-base);
  font-weight: 600;
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
}

.btn-secondary:hover {
  background: var(--color-primary);
  color: var(--color-white);
}

.error-message {
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-border, rgba(220, 38, 38, 0.3));
  color: var(--color-error);
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius-sm);
  margin-bottom: 1rem;
  font-size: var(--font-size-sm);
}

.success-message {
  text-align: center;
  padding: 2rem 1rem;
}

.success-message h3 {
  color: var(--color-success);
  margin-bottom: 0.75rem;
}

.success-message p {
  color: var(--text-secondary);
  margin-bottom: 1rem;
  line-height: 1.5;
}

.price-info {
  font-weight: 600;
  color: var(--color-primary);
}

/* Tablet and up */
@media (min-width: 48em) {
  .inspection-form {
    padding: 2rem;
  }

  .btn-primary,
  .btn-secondary {
    width: auto;
    min-width: 12.5rem;
  }
}
</style>
