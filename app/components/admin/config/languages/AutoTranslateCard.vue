<script setup lang="ts">
defineProps<{
  enabled: boolean
}>()

const emit = defineEmits<{
  (e: 'update', value: boolean): void
}>()

function onChange(event: Event) {
  emit('update', (event.target as HTMLInputElement).checked)
}
</script>

<template>
  <div class="config-card">
    <h3 class="card-title">Traduccion Automatica</h3>
    <p class="card-description">
      Si se activa, el contenido se traducira automaticamente al publicar.
    </p>
    <label class="toggle-label">
      <input type="checkbox" class="toggle-input" :checked="enabled" @change="onChange" >
      <span class="toggle-switch" />
      <span class="toggle-text">
        {{ enabled ? 'Activado' : 'Desactivado' }}
      </span>
    </label>
  </div>
</template>

<style scoped>
.config-card {
  background: white;
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

.toggle-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  min-height: 44px;
}

.toggle-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch {
  position: relative;
  width: 48px;
  height: 26px;
  background: #d1d5db;
  border-radius: 13px;
  transition: background 0.2s;
  flex-shrink: 0;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle-input:checked + .toggle-switch {
  background: var(--color-primary, #23424a);
}

.toggle-input:checked + .toggle-switch::after {
  transform: translateX(22px);
}

.toggle-text {
  font-size: 0.95rem;
  color: #374151;
}

@media (max-width: 767px) {
  .config-card {
    padding: 16px;
  }
}
</style>
