<script setup lang="ts">
import { type AdvertiseFormData, CONTACT_PREFERENCES } from '~/composables/modals/useAdvertiseModal'

const form = defineModel<AdvertiseFormData>('form', { required: true })

defineProps<{
  errors: Record<string, string>
}>()

const { t } = useI18n()
</script>

<template>
  <div class="section-fields">
    <div class="form-group">
      <label for="contactName" class="required">{{ t('advertise.contactName') }}</label>
      <input
        id="contactName"
        v-model="form.contactName"
        type="text"
        class="form-input"
        autocomplete="name"
        :class="{ 'input-error': errors.contactName }"
        :aria-invalid="!!errors.contactName || undefined"
        :aria-describedby="errors.contactName ? 'err-advc-name' : undefined"
      >
      <p v-if="errors.contactName" id="err-advc-name" class="field-error" role="alert">
        {{ errors.contactName }}
      </p>
    </div>

    <div class="form-group">
      <label for="contactEmail" class="required">{{ t('advertise.contactEmail') }}</label>
      <input
        id="contactEmail"
        v-model="form.contactEmail"
        type="email"
        class="form-input"
        autocomplete="email"
        :class="{ 'input-error': errors.contactEmail }"
        :aria-invalid="!!errors.contactEmail || undefined"
        :aria-describedby="errors.contactEmail ? 'err-advc-email' : undefined"
      >
      <p v-if="errors.contactEmail" id="err-advc-email" class="field-error" role="alert">
        {{ errors.contactEmail }}
      </p>
    </div>

    <div class="form-group">
      <label for="contactPhone" class="required">{{ t('advertise.contactPhone') }}</label>
      <input
        id="contactPhone"
        v-model="form.contactPhone"
        type="tel"
        class="form-input"
        autocomplete="tel"
        :class="{ 'input-error': errors.contactPhone }"
        :aria-invalid="!!errors.contactPhone || undefined"
        :aria-describedby="errors.contactPhone ? 'err-advc-phone' : undefined"
      >
      <p v-if="errors.contactPhone" id="err-advc-phone" class="field-error" role="alert">
        {{ errors.contactPhone }}
      </p>
    </div>

    <div class="form-group">
      <label for="contactPreference">{{ t('advertise.contactPreference') }}</label>
      <select id="contactPreference" v-model="form.contactPreference" class="form-input">
        <option v-for="pref in CONTACT_PREFERENCES" :key="pref.value" :value="pref.value">
          {{ t(pref.label) }}
        </option>
      </select>
    </div>

    <div class="form-group full-width">
      <label class="checkbox-label" :class="{ 'input-error-text': errors.termsAccepted }">
        <input
          v-model="form.termsAccepted"
          type="checkbox"
          class="checkbox-input"
          :aria-invalid="!!errors.termsAccepted || undefined"
          :aria-describedby="errors.termsAccepted ? 'err-advc-terms' : undefined"
        >
        <span>{{ t('advertise.acceptTermsFull') }}</span>
      </label>
      <p v-if="errors.termsAccepted" id="err-advc-terms" class="field-error" role="alert">
        {{ errors.termsAccepted }}
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

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-2, 8px);
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

.input-error-text {
  color: var(--color-error);
}

@media (min-width: 768px) {
  .section-fields {
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-3, 12px);
  }
}
</style>
