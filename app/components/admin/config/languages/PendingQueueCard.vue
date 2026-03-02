<script setup lang="ts">
defineProps<{
  pendingVehicles: number
  pendingArticles: number
  translating: boolean
  translateSuccess: boolean
  translateDisabled: boolean
  showApiKeyHint: boolean
}>()

const emit = defineEmits<{
  (e: 'translate-all'): void
}>()
</script>

<template>
  <div class="config-card">
    <h3 class="card-title">Cola de Traducciones Pendientes</h3>
    <p class="card-description">Contenido marcado como pendiente de traduccion.</p>

    <div v-if="translateSuccess" class="success-banner">
      Traducciones procesadas correctamente. Los flags pendientes han sido limpiados.
    </div>

    <div class="pending-list">
      <div class="pending-row">
        <span class="pending-label">Vehiculos pendientes:</span>
        <span class="pending-count">{{ pendingVehicles }}</span>
      </div>
      <div class="pending-row">
        <span class="pending-label">Articulos pendientes:</span>
        <span class="pending-count">{{ pendingArticles }}</span>
      </div>
    </div>

    <button
      class="btn-translate"
      :disabled="translateDisabled || translating"
      @click="emit('translate-all')"
    >
      {{ translating ? 'Traduciendo...' : 'Traducir todo ahora' }}
    </button>

    <p v-if="showApiKeyHint" class="hint-text">
      Configura una API key para habilitar la traduccion.
    </p>
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

.success-banner {
  background: var(--color-success-bg, #dcfce7);
  color: var(--color-success);
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.pending-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
  background: #f9fafb;
  margin-bottom: 16px;
}

.pending-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 44px;
}

.pending-label {
  font-size: 0.95rem;
  color: #374151;
}

.pending-count {
  font-weight: 600;
  font-size: 1rem;
  color: #1f2937;
}

.btn-translate {
  background: var(--color-success);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background 0.2s;
}

.btn-translate:hover {
  background: #059669;
}

.btn-translate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.hint-text {
  margin: 8px 0 0;
  font-size: 0.8rem;
  color: var(--text-disabled);
}

@media (max-width: 767px) {
  .config-card {
    padding: 16px;
  }

  .btn-translate {
    width: 100%;
    text-align: center;
  }
}
</style>
