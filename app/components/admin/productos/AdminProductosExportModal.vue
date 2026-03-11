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
    <div v-if="show" class="modal-overlay" role="dialog" aria-modal="true" @click.self="emit('close')">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h3>{{ $t('admin.productos.exportTitle') }}</h3>
          <button class="modal-close" :aria-label="$t('common.close')" @click="emit('close')">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>{{ $t('common.format') }}</label>
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
            <label>{{ $t('admin.productos.allProducts') }}</label>
            <div class="option-buttons vertical">
              <button
                :class="{ active: localScope === 'filtered' }"
                @click="localScope = 'filtered'"
              >
                {{ $t('admin.productos.filtered') }} ({{ filteredCount }})
              </button>
              <button
                v-if="selectedCount > 0"
                :class="{ active: localScope === 'selected' }"
                @click="localScope = 'selected'"
              >
                {{ $t('admin.productos.selected') }} ({{ selectedCount }})
              </button>
              <button :class="{ active: localScope === 'all' }" @click="localScope = 'all'">
                {{ $t('common.all') }} ({{ totalCount }})
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close')">{{ $t('common.cancel') }}</button>
          <button class="btn-primary" @click="emit('confirm')">{{ $t('common.export') }}</button>
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
  padding: var(--spacing-5);
}

.modal {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
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
  max-width: 30em;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-5) var(--spacing-6);
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
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
  color: var(--text-disabled);
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius);
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-secondary);
}

.modal-body {
  padding: var(--spacing-6);
}

.form-group {
  margin-bottom: var(--spacing-5);
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-3);
  font-weight: 600;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.option-buttons {
  display: flex;
  gap: var(--spacing-3);
}

.option-buttons.vertical {
  flex-direction: column;
}

.option-buttons button {
  flex: 1;
  padding: var(--spacing-3) var(--spacing-4);
  border: 2px solid var(--color-gray-200);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  border-radius: var(--border-radius);
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
  gap: var(--spacing-3);
  padding: var(--spacing-4) var(--spacing-6);
  border-top: 1px solid var(--color-gray-200);
}

.btn-secondary {
  background: var(--bg-primary);
  border: 1px solid var(--color-gray-200);
  color: var(--text-secondary);
  padding: 0.625rem 1.125rem;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
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
  padding: 0.625rem 1.125rem;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}
</style>
