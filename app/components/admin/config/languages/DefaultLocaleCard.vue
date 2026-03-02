<script setup lang="ts">
import type { LocaleOption } from '~/composables/admin/useAdminLanguages'

defineProps<{
  defaultLocale: string
  options: LocaleOption[]
}>()

const emit = defineEmits<{
  (e: 'update', value: string): void
}>()

function onChange(event: Event) {
  emit('update', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <div class="config-card">
    <h3 class="card-title">Idioma por Defecto</h3>
    <p class="card-description">
      El idioma principal del sitio. Debe ser uno de los idiomas activos.
    </p>
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

.form-group {
  margin-bottom: 0;
}

.form-select {
  width: 100%;
  max-width: 320px;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.95rem;
  background: var(--bg-primary);
  color: #374151;
  cursor: pointer;
  min-height: 44px;
}

.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

@media (max-width: 767px) {
  .config-card {
    padding: 16px;
  }

  .form-select {
    max-width: 100%;
  }
}
</style>
