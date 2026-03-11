<script setup lang="ts">
import { availableLocales } from '~/composables/admin/useAdminLanguages'

const props = defineProps<{
  activeLocales: string[]
}>()

const emit = defineEmits<{
  update: [value: string[]]
}>()

function onCheckboxChange(localeValue: string, event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  const current = [...props.activeLocales]
  if (checked && !current.includes(localeValue)) {
    current.push(localeValue)
  } else if (!checked) {
    const idx = current.indexOf(localeValue)
    if (idx !== -1) current.splice(idx, 1)
  }
  emit('update', current)
}
</script>

<template>
  <div class="config-card">
    <h3 class="card-title">Idiomas Activos</h3>
    <p class="card-description">Selecciona los idiomas en los que estara disponible el sitio.</p>
    <div class="checkbox-grid">
      <label v-for="locale in availableLocales" :key="locale.value" class="checkbox-label">
        <input
          type="checkbox"
          :value="locale.value"
          :checked="activeLocales.includes(locale.value)"
          @change="onCheckboxChange(locale.value, $event)"
        />
        <span>{{ locale.label }}</span>
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

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  background: var(--color-gray-50);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
  font-size: 0.95rem;
  color: var(--color-gray-700);
  min-height: 2.75rem;
}

.checkbox-label input {
  width: 1.125rem;
  height: 1.125rem;
  cursor: pointer;
  accent-color: var(--color-primary);
}

(@media ()max-width: 47.9375em())) {
  .config-card {
    padding: var(--spacing-4);
  }

  .checkbox-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-2);
    padding: var(--spacing-3);
  }
}
</style>
