<script setup lang="ts">
defineProps<{
  apiKey: string
}>()

const emit = defineEmits<{
  (e: 'update', value: string): void
}>()

function onInput(event: Event) {
  emit('update', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="config-card">
    <h3 class="card-title">API Key</h3>
    <p class="card-description">Clave de acceso para el motor de traduccion seleccionado.</p>
    <div class="form-group">
      <input
        type="password"
        class="form-input"
        placeholder="Introduce la API key..."
        autocomplete="off"
        :value="apiKey"
        @input="onInput"
      />
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

.form-input {
  width: 100%;
  max-width: 480px;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.95rem;
  color: #374151;
  min-height: 44px;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

@media (max-width: 767px) {
  .config-card {
    padding: 16px;
  }

  .form-input {
    max-width: 100%;
  }
}
</style>
