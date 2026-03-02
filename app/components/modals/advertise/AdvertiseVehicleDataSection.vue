<script setup lang="ts">
import type { AdvertiseFormData } from '~/composables/modals/useAdvertiseModal'

const form = defineModel<AdvertiseFormData>('form', { required: true })

defineProps<{
  errors: Record<string, string>
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
        :aria-invalid="!!errors.brand || undefined"
        :aria-describedby="errors.brand ? 'err-adv-brand' : undefined"
      >
      <p v-if="errors.brand" id="err-adv-brand" class="field-error" role="alert">
        {{ errors.brand }}
      </p>
    </div>

    <div class="form-group">
      <label for="model" class="required">{{ t('advertise.model') }}</label>
      <input
        id="model"
        v-model="form.model"
        type="text"
        class="form-input"
        :class="{ 'input-error': errors.model }"
        :aria-invalid="!!errors.model || undefined"
        :aria-describedby="errors.model ? 'err-adv-model' : undefined"
      >
      <p v-if="errors.model" id="err-adv-model" class="field-error" role="alert">
        {{ errors.model }}
      </p>
    </div>

    <div class="form-group">
      <label for="year" class="required">{{ t('advertise.year') }}</label>
      <input
        id="year"
        v-model.number="form.year"
        type="number"
        class="form-input"
        :class="{ 'input-error': errors.year }"
        :aria-invalid="!!errors.year || undefined"
        :aria-describedby="errors.year ? 'err-adv-year' : undefined"
        min="1980"
        :max="new Date().getFullYear() + 1"
      >
      <p v-if="errors.year" id="err-adv-year" class="field-error" role="alert">{{ errors.year }}</p>
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
        :aria-invalid="!!errors.price || undefined"
        :aria-describedby="errors.price ? 'err-adv-price' : undefined"
        min="0"
        step="100"
      >
      <p v-if="errors.price" id="err-adv-price" class="field-error" role="alert">
        {{ errors.price }}
      </p>
    </div>

    <div class="form-group">
      <label for="location" class="required">{{ t('advertise.location') }}</label>
      <input
        id="location"
        v-model="form.location"
        type="text"
        class="form-input"
        :class="{ 'input-error': errors.location }"
        :aria-invalid="!!errors.location || undefined"
        :aria-describedby="errors.location ? 'err-adv-location' : undefined"
      >
      <p v-if="errors.location" id="err-adv-location" class="field-error" role="alert">
        {{ errors.location }}
      </p>
    </div>

    <div class="form-group full-width">
      <label for="description" class="required">{{ t('advertise.description') }}</label>
      <textarea
        id="description"
        v-model="form.description"
        class="form-input"
        :class="{ 'input-error': errors.description }"
        :aria-invalid="!!errors.description || undefined"
        :aria-describedby="errors.description ? 'err-adv-desc' : undefined"
        rows="3"
        :placeholder="t('advertise.descriptionPlaceholder')"
      />
      <p v-if="errors.description" id="err-adv-desc" class="field-error" role="alert">
        {{ errors.description }}
      </p>
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
  color: var(--color-error);
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
  background: var(--bg-primary);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
}

.field-error {
  font-size: 0.75rem;
  color: var(--color-error);
  margin-top: 2px;
}

.input-error {
  border-color: var(--color-error) !important;
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
