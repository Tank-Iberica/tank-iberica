<script setup lang="ts">
const { t } = useI18n()

defineProps<{
  visitsEnabled: boolean
}>()

const emit = defineEmits<{
  'toggle-visits': [value: boolean]
}>()

function onToggle(event: Event) {
  const target = event.target as HTMLInputElement
  emit('toggle-visits', target.checked)
}
</script>

<template>
  <header class="page-header">
    <div>
      <h1>{{ t('visits.title') }}</h1>
      <p class="subtitle">{{ t('visits.subtitle') }}</p>
    </div>
    <div class="header-actions">
      <label class="toggle-switch">
        <input type="checkbox" :checked="visitsEnabled" @change="onToggle" >
        <span class="toggle-slider" />
        <span class="toggle-label">{{ t('visits.enableVisits') }}</span>
      </label>
    </div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.page-header h1 {
  margin: 0;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

/* Toggle switch */
.toggle-switch {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  cursor: pointer;
  min-height: 2.75rem;
}

.toggle-switch input {
  display: none;
}

.toggle-slider {
  width: 3rem;
  height: 1.625rem;
  background: var(--color-gray-300);
  border-radius: var(--border-radius-full);
  position: relative;
  transition: background var(--transition-fast);
  flex-shrink: 0;
}

.toggle-slider::after {
  content: '';
  position: absolute;
  top: 0.1875rem;
  left: 0.1875rem;
  width: 1.25rem;
  height: 1.25rem;
  background: var(--color-white);
  border-radius: var(--border-radius-full);
  transition: transform var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.toggle-switch input:checked + .toggle-slider {
  background: var(--color-success);
}

.toggle-switch input:checked + .toggle-slider::after {
  transform: translateX(1.375rem);
}

.toggle-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

@media (min-width: 48em) {
  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
