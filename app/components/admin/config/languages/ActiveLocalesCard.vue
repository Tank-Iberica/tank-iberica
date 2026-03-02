<script setup lang="ts">
import { availableLocales } from '~/composables/admin/useAdminLanguages'

const props = defineProps<{
  activeLocales: string[]
}>()

const emit = defineEmits<{
  (e: 'update', value: string[]): void
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
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.card-title {
  margin: 0 0 8px;
  font-size: 1.125rem;
  color: #1f2937;
}

.card-description {
  margin: 0 0 16px;
  color: #6b7280;
  font-size: 0.875rem;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
  background: #f9fafb;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  color: #374151;
  min-height: 44px;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

@media (max-width: 767px) {
  .config-card {
    padding: 16px;
  }

  .checkbox-grid {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 12px;
  }
}
</style>
