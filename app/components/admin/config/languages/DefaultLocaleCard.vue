<script setup lang="ts">
import type { LocaleOption } from '~/composables/admin/useAdminLanguages'
const { t } = useI18n()

defineProps<{
  defaultLocale: string
  options: LocaleOption[]
}>()

const emit = defineEmits<{
  update: [value: string]
}>()

function onChange(event: Event) {
  emit('update', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <div class="config-card">
    <h3 class="card-title">{{ t('admin.configLanguages.defaultLocaleTitle') }}</h3>
    <p class="card-description">{{ t('admin.configLanguages.defaultLocaleDesc') }}</p>
    <div class="form-group">
      <select class="form-select" :value="defaultLocale" @change="onChange">
        <option v-for="loc in options" :key="loc.value" :value="loc.value">
          {{ loc.label }}
        </option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.config-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-card);
  margin-bottom: var(--spacing-5);
}

.card-title {
  margin: 0 0 var(--spacing-2);
  font-size: 1.125rem;
  color: var(--color-gray-800);
}

.card-description {
  margin: 0 0 var(--spacing-4);
  color: var(--color-gray-500);
  font-size: 0.875rem;
}

.form-group {
  margin-bottom: 0;
}

.form-select {
  width: 100%;
  max-width: 20rem;
  padding: 0.625rem var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  background: var(--bg-primary);
  color: var(--color-gray-700);
  cursor: pointer;
  min-height: 2.75rem;
}

.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

@media (max-width: 47.9375em) {
  .config-card {
    padding: var(--spacing-4);
  }

  .form-select {
    max-width: 100%;
  }
}
</style>
