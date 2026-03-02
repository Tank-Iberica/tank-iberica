<script setup lang="ts">
const props = defineProps<{
  show: boolean
  exportFormat: 'pdf' | 'excel'
  exportScope: 'all' | 'filtered' | 'selected'
  filteredCount: number
  selectedCount: number
  totalCount: number
}>()

const emit = defineEmits<{
  'update:exportFormat': [format: 'pdf' | 'excel']
  'update:exportScope': [scope: 'all' | 'filtered' | 'selected']
  close: []
  confirm: []
}>()

const localFormat = computed({
  get: () => props.exportFormat,
  set: (val) => emit('update:exportFormat', val),
})

const localScope = computed({
  get: () => props.exportScope,
  set: (val) => emit('update:exportScope', val),
})
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="emit('close')">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h3>Exportar productos</h3>
          <button class="modal-close" @click="emit('close')">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Formato</label>
            <div class="option-buttons">
              <button :class="{ active: localFormat === 'pdf' }" @click="localFormat = 'pdf'">
                📄 PDF
              </button>
              <button :class="{ active: localFormat === 'excel' }" @click="localFormat = 'excel'">
                📊 Excel
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>Productos</label>
            <div class="option-buttons vertical">
              <button
                :class="{ active: localScope === 'filtered' }"
                @click="localScope = 'filtered'"
              >
                Filtrados ({{ filteredCount }})
              </button>
              <button
                v-if="selectedCount > 0"
                :class="{ active: localScope === 'selected' }"
                @click="localScope = 'selected'"
              >
                Seleccionados ({{ selectedCount }})
              </button>
              <button :class="{ active: localScope === 'all' }" @click="localScope = 'all'">
                Todos ({{ totalCount }})
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close')">Cancelar</button>
          <button class="btn-primary" @click="emit('confirm')">Exportar</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  overflow: auto;
  animation: modalSlide 0.2s ease-out;
}

@keyframes modalSlide {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-sm {
  width: 100%;
  max-width: 480px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-gray-200);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  color: var(--text-disabled);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-secondary);
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 12px;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

.option-buttons {
  display: flex;
  gap: 12px;
}

.option-buttons.vertical {
  flex-direction: column;
}

.option-buttons button {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid var(--color-gray-200);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  text-align: left;
}

.option-buttons button:hover {
  border-color: var(--color-gray-300);
  background: var(--bg-secondary);
}

.option-buttons button.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--color-gray-200);
}

.btn-secondary {
  background: var(--bg-primary);
  border: 1px solid var(--color-gray-200);
  color: var(--text-secondary);
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--bg-secondary);
  border-color: var(--color-gray-300);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}
</style>
