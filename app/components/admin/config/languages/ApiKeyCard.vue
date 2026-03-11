<script setup lang="ts">
defineProps<{
  apiKey: string
}>()

const emit = defineEmits<{
  update: [value: string]
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
      >
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

.form-input {
  width: 100%;
  max-width: 30em;
  padding: 0.625rem var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  color: var(--color-gray-700);
  min-height: 2.75rem;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

(@media ()max-width: 47.9375em())) {
  .config-card {
    padding: var(--spacing-4);
  }

  .form-input {
    max-width: 100%;
  }
}
</style>
