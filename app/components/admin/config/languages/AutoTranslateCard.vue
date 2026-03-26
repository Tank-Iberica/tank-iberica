<script setup lang="ts">
const { t } = useI18n()

defineProps<{
  enabled: boolean
}>()

const emit = defineEmits<{
  update: [value: boolean]
}>()

function onChange(event: Event) {
  emit('update', (event.target as HTMLInputElement).checked)
}
</script>

<template>
  <div class="config-card">
    <h3 class="card-title">{{ t('admin.configLanguages.autoTranslateTitle') }}</h3>
    <p class="card-description">{{ t('admin.configLanguages.autoTranslateDesc') }}</p>
    <label class="toggle-label">
      <input type="checkbox" class="toggle-input" :checked="enabled" @change="onChange" >
      <span class="toggle-switch" />
      <span class="toggle-text">
        {{ enabled ? t('common.enabled') : t('common.disabled') }}
      </span>
    </label>
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

.toggle-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  cursor: pointer;
  min-height: 2.75rem;
}

.toggle-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch {
  position: relative;
  width: 3rem;
  height: 1.625rem;
  background: var(--color-gray-300);
  border-radius: var(--border-radius-md);
  transition: background 0.2s;
  flex-shrink: 0;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 0.1875rem;
  left: 0.1875rem;
  width: 1.25rem;
  height: 1.25rem;
  background: var(--bg-primary);
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle-input:checked + .toggle-switch {
  background: var(--color-primary);
}

.toggle-input:checked + .toggle-switch::after {
  transform: translateX(22px);
}

.toggle-text {
  font-size: 0.95rem;
  color: var(--color-gray-700);
}

@media (max-width: 47.9375em) {
  .config-card {
    padding: var(--spacing-4);
  }
}
</style>
