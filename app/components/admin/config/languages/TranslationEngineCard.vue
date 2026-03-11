<script setup lang="ts">
import { translationEngines } from '~/composables/admin/useAdminLanguages'
const { t } = useI18n()

defineProps<{
  engine: string
}>()

const emit = defineEmits<{
  update: [value: string]
}>()

function onChange(event: Event) {
  emit('update', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="config-card">
    <h3 class="card-title">{{ t('admin.configLanguages.engineTitle') }}</h3>
    <p class="card-description">{{ t('admin.configLanguages.engineDesc') }}</p>
    <div class="radio-group">
      <label v-for="eng in translationEngines" :key="eng.value" class="radio-label">
        <input
          type="radio"
          :value="eng.value"
          :checked="engine === eng.value"
          name="translationEngine"
          @change="onChange"
        >
        <span>{{ eng.label }}</span>
      </label>
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

.radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  background: var(--color-gray-50);
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  cursor: pointer;
  font-size: 0.95rem;
  color: var(--color-gray-700);
  min-height: 2.75rem;
}

.radio-label input {
  width: 1.125rem;
  height: 1.125rem;
  cursor: pointer;
  accent-color: var(--color-primary);
}

(@media ()max-width: 47.9375em())) {
  .config-card {
    padding: var(--spacing-4);
  }
}
</style>
