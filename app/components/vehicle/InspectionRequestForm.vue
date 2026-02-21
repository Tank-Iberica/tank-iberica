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
const error = ref<string | null>(null)

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

  // Basic validation
  if (!formData.value.name || !formData.value.email || !formData.value.phone) {
    error.value = t('inspection.requiredFields')
    return
  }

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
  error.value = null
}
</script>

<template>
  <div class="inspection-form">
    <div v-if="submitted" class="success-message">
      <div class="success-icon">✓</div>
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
          required
          :placeholder="$t('inspection.namePlaceholder')"
        >
      </div>

      <div class="form-group">
        <label for="email">{{ $t('inspection.email') }} *</label>
        <input
          id="email"
          v-model="formData.email"
          type="email"
          required
          :placeholder="$t('inspection.emailPlaceholder')"
        >
      </div>

      <div class="form-group">
        <label for="phone">{{ $t('inspection.phone') }} *</label>
        <input
          id="phone"
          v-model="formData.phone"
          type="tel"
          required
          :placeholder="$t('inspection.phonePlaceholder')"
        >
      </div>

      <div class="form-group">
        <label for="preferredDate">{{ $t('inspection.preferredDate') }}</label>
        <input
          id="preferredDate"
          v-model="formData.preferredDate"
          type="date"
          :min="new Date().toISOString().split('T')[0]"
        >
      </div>

      <div class="form-group">
        <label for="notes">{{ $t('inspection.notes') }}</label>
        <textarea
          id="notes"
          v-model="formData.notes"
          rows="4"
          :placeholder="$t('inspection.notesPlaceholder')"
        />
      </div>

      <div v-if="error" class="error-message">
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
  padding: 24px;
  background: var(--color-bg-secondary, #fff);
  border-radius: 8px;
  max-width: 600px;
  margin: 0 auto;
}

.inspection-form h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--color-text-primary, #1a1a1a);
}

.description {
  color: var(--color-text-secondary, #666);
  margin-bottom: 24px;
  font-size: 0.9375rem;
  line-height: 1.5;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--color-text-primary, #1a1a1a);
  font-size: 0.9375rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
  min-height: 44px; /* Touch target minimum */
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

.btn-primary,
.btn-secondary {
  width: 100%;
  padding: 14px 24px;
  min-height: 48px; /* Touch target minimum */
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark, #1a323a);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  color: var(--color-primary, #23424a);
  border: 2px solid var(--color-primary, #23424a);
}

.btn-secondary:hover {
  background: var(--color-primary, #23424a);
  color: white;
}

.error-message {
  background: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 0.9375rem;
}

.success-message {
  text-align: center;
  padding: 32px 16px;
}

.success-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: #10b981;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
}

.success-message h3 {
  color: #10b981;
  margin-bottom: 12px;
}

.success-message p {
  color: var(--color-text-secondary, #666);
  margin-bottom: 16px;
  line-height: 1.5;
}

.price-info {
  font-weight: 600;
  color: var(--color-primary, #23424a);
}

/* Tablet and up */
@media (min-width: 768px) {
  .inspection-form {
    padding: 32px;
  }

  .btn-primary,
  .btn-secondary {
    width: auto;
    min-width: 200px;
  }
}
</style>
