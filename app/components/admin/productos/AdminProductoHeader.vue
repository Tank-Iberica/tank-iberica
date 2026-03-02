<script setup lang="ts">
/* eslint-disable @typescript-eslint/unified-signatures */
import type { FileNamingData } from '~/utils/fileNaming'

interface Props {
  vehicle: {
    brand: string
    model: string
  } | null
  featured: boolean
  saving: boolean
  isValid: boolean
  driveConnected: boolean
  driveLoading: boolean
  fileNamingData: FileNamingData
  driveSection: 'Vehiculos' | 'Intermediacion'
}

interface Emits {
  (e: 'back'): void
  (e: 'drive-connect'): void
  (e: 'drive-open'): void
  (e: 'sell'): void
  (e: 'delete'): void
  (e: 'cancel'): void
  (e: 'save'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <header class="pf-header">
    <div class="pf-left">
      <button class="btn-icon" @click="emit('back')">←</button>
      <h1>{{ vehicle?.brand }} {{ vehicle?.model }}</h1>
      <span v-if="featured" class="star">★</span>
    </div>
    <div class="pf-right">
      <button
        class="btn"
        :class="{ 'btn-drive-on': driveConnected }"
        :disabled="driveLoading"
        @click="driveConnected ? emit('drive-open') : emit('drive-connect')"
      >
        {{ driveConnected ? '📁 Drive' : '🔗 Drive' }}
      </button>
      <button class="btn btn-sell" @click="emit('sell')">€ Vender</button>
      <button class="btn btn-danger-outline" @click="emit('delete')">🗑️</button>
      <button class="btn" @click="emit('cancel')">Cancelar</button>
      <button class="btn btn-primary" :disabled="saving || !isValid" @click="emit('save')">
        {{ saving ? 'Guardando...' : '💾 Guardar' }}
      </button>
    </div>
  </header>
</template>

<style scoped>
.pf-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 16px;
  position: sticky;
  top: 0;
  background: #f9fafb;
  z-index: 50;
}
.pf-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pf-left h1 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}
.pf-left .star {
  color: var(--color-warning);
  font-size: 1.2rem;
}
.pf-right {
  display: flex;
  gap: 8px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: 6px;
  cursor: pointer;
}
.btn {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
}
.btn-primary {
  background: var(--color-primary);
  color: #fff;
  border: none;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-sell {
  background: var(--color-success);
  color: #fff;
  border: none;
}
.btn-danger-outline {
  border-color: var(--color-error);
  color: var(--color-error);
}
.btn-drive-on {
  background: var(--color-success-bg, #dcfce7);
  border-color: var(--color-success);
  color: var(--color-success);
}

@media (max-width: 768px) {
  .pf-right {
    flex-wrap: wrap;
  }
}
</style>
