<script setup lang="ts">
import type { AdvertiseFormData } from '~/composables/modals/useAdvertiseModal'

const form = defineModel<AdvertiseFormData>('form', { required: true })

defineProps<{
  errors: Record<string, boolean>
}>()

const { t } = useI18n()
</script>

<template>
  <div class="section-fields">
    <div class="form-group">
      <label for="brand" class="required">{{ t('advertise.brand') }}</label>
      <input
        id="brand"
        v-model="form.brand"
        type="text"
        class="form-input"
        :class="{ 'input-error': errors.brand }"
      >
    </div>

    <div class="form-group">
      <label for="model" class="required">{{ t('advertise.model') }}</label>
      <input
        id="model"
        v-model="form.model"
        type="text"
        class="form-input"
        :class="{ 'input-error': errors.model }"
      >
    </div>

    <div class="form-group">
      <label for="year" class="required">{{ t('advertise.year') }}</label>
      <input
        id="year"
        v-model.number="form.year"
        type="number"
        class="form-input"
        :class="{ 'input-error': errors.year }"
        min="1980"
        :max="new Date().getFullYear() + 1"
      >
    </div>

    <div class="form-group">
      <label for="kilometers">{{ t('advertise.kilometers') }}</label>
      <input
        id="kilometers"
        v-model.number="form.kilometers"
        type="number"
        class="form-input"
        min="0"
      >
    </div>

    <div class="form-group">
      <label for="price" class="required">{{ t('advertise.price') }}</label>
      <input
        id="price"
        v-model.number="form.price"
        type="number"
        class="form-input"
        :class="{ 'input-error': errors.price }"
        min="0"
        step="100"
      >
    </div>

    <div class="form-group">
      <label for="location" class="required">{{ t('advertise.location') }}</label>
      <input
        id="location"
        v-model="form.location"
        type="text"
        class="form-input"
        :class="{ 'input-error': errors.location }"
      >
    </div>

    <div class="form-group full-width">
      <label for="description" class="required">{{ t('advertise.description') }}</label>
      <textarea
        id="description"
        v-model="form.description"
        class="form-input"
        :class="{ 'input-error': errors.description }"
        rows="3"
        :placeholder="t('advertise.descriptionPlaceholder')"
      />
    </div>
  </div>
</template>

<style scoped>
.section-fields {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-2, 8px);
}

.form-group {
  display: flex;
  flex-direction: column;
}

.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 2px;
}

.required::after {
  content: ' *';
  color: #ef4444;
}

.form-input {
  width: 100%;
  padding: 0.4rem 0.5rem;
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

.input-error {
  border-color: #ef4444 !important;
}

textarea.form-input {
  resize: vertical;
  min-height: 60px;
}

@media (min-width: 768px) {
  .section-fields {
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-3, 12px);
  }
}
</style>
