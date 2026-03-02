<script setup lang="ts">
const props = defineProps<{
  show: boolean
  form: {
    company_name: string
    phone: string
    email: string
    location: string
    active_listings: number
    vehicle_types: string
    source_url: string
  }
  saving: boolean
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  save: []
  reset: []
}>()

const { t } = useI18n()

// Local proxy to allow v-model on form fields without mutating parent prop directly
// We emit changes back through the form object reference (which is a ref from parent)
const localForm = computed(() => props.form)
</script>

<template>
  <div v-if="show" class="manual-form-card">
    <div class="form-grid">
      <div class="form-field">
        <label>{{ t('admin.captacion.companyName') }} *</label>
        <input
          v-model="localForm.company_name"
          type="text"
          autocomplete="organization"
          :placeholder="t('admin.captacion.companyName')"
        >
      </div>
      <div class="form-field">
        <label>{{ t('admin.captacion.phone') }}</label>
        <input
          v-model="localForm.phone"
          type="tel"
          autocomplete="tel"
          :placeholder="t('admin.captacion.phone')"
        >
      </div>
      <div class="form-field">
        <label>{{ t('admin.captacion.email') }}</label>
        <input
          v-model="localForm.email"
          type="email"
          autocomplete="email"
          :placeholder="t('admin.captacion.email')"
        >
      </div>
      <div class="form-field">
        <label>{{ t('admin.captacion.location') }}</label>
        <input
          v-model="localForm.location"
          type="text"
          :placeholder="t('admin.captacion.location')"
        >
      </div>
      <div class="form-field">
        <label>{{ t('admin.captacion.formListings') }}</label>
        <input v-model.number="localForm.active_listings" type="number" min="0" >
      </div>
      <div class="form-field">
        <label>{{ t('admin.captacion.formVehicleTypes') }}</label>
        <input
          v-model="localForm.vehicle_types"
          type="text"
          :placeholder="t('admin.captacion.formVehicleTypes')"
        >
      </div>
      <div class="form-field form-field-wide">
        <label>{{ t('admin.captacion.formSourceUrl') }}</label>
        <input
          v-model="localForm.source_url"
          type="url"
          :placeholder="t('admin.captacion.formSourceUrl')"
        >
      </div>
    </div>
    <div class="form-actions">
      <button class="btn-cancel" :disabled="saving" @click="emit('reset')">
        {{ t('admin.captacion.cancel') }}
      </button>
      <button
        class="btn-save"
        :disabled="saving || !localForm.company_name.trim()"
        @click="emit('save')"
      >
        {{ saving ? t('admin.captacion.formSaving') : t('admin.captacion.save') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.manual-form-card {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 20px;
  border: 2px solid #dbeafe;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-field label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.form-field input {
  padding: 10px 12px;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  min-height: 44px;
  background: var(--bg-primary);
}

.form-field input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  justify-content: flex-end;
}

.btn-cancel {
  padding: 10px 18px;
  background: var(--bg-primary);
  color: var(--text-auxiliary);
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
}

@media (hover: hover) {
  .btn-cancel:hover {
    background: var(--bg-secondary);
    border-color: var(--color-gray-300);
  }
}

.btn-save {
  padding: 10px 18px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 44px;
}

@media (hover: hover) {
  .btn-save:hover {
    background: var(--color-primary-dark);
  }
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (min-width: 480px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
  }

  .form-field-wide {
    grid-column: 1 / -1;
  }
}

@media (min-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
}
</style>
