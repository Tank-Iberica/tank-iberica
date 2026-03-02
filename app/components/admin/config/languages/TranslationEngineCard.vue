<script setup lang="ts">
import { translationEngines } from '~/composables/admin/useAdminLanguages'

defineProps<{
  engine: string
}>()

const emit = defineEmits<{
  (e: 'update', value: string): void
}>()

function onChange(event: Event) {
  emit('update', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="config-card">
    <h3 class="card-title">Motor de Traduccion</h3>
    <p class="card-description">
      Selecciona el servicio que se utilizara para las traducciones automaticas.
    </p>
    <div class="radio-group">
      <label v-for="eng in translationEngines" :key="eng.value" class="radio-label">
        <input
          type="radio"
          :value="eng.value"
          :checked="engine === eng.value"
          name="translationEngine"
          @change="onChange"
        />
        <span>{{ eng.label }}</span>
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

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
  background: #f9fafb;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 0.95rem;
  color: #374151;
  min-height: 44px;
}

.radio-label input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

@media (max-width: 767px) {
  .config-card {
    padding: 16px;
  }
}
</style>
