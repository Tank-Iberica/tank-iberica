<script setup lang="ts">
interface Props {
  show: boolean
  vehicleBrand: string
  vehicleModel: string
  deleteConfirm: string
  canDelete: boolean
}

interface Emits {
  (e: 'update:show', value: boolean): void
  (e: 'update:deleteConfirm', value: string): void
  (e: 'delete'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-bg" @click.self="emit('update:show', false)">
      <div class="modal">
        <div class="modal-head">
          <span>🗑️ Eliminar {{ $t('vertical.itemNameCapitalized') }}</span>
          <button :aria-label="$t('common.close')" @click="emit('update:show', false)">×</button>
        </div>
        <div class="modal-body">
          <p>
            ¿Eliminar <strong>{{ vehicleBrand }} {{ vehicleModel }}</strong
            >?
          </p>
          <p class="warn">Se eliminarán las imágenes y documentos. No se puede deshacer.</p>
          <div class="field">
            <label>Escribe <strong>Borrar</strong> para confirmar:</label>
            <input
              :value="deleteConfirm"
              type="text"
              placeholder="Borrar"
              @input="emit('update:deleteConfirm', ($event.target as HTMLInputElement).value)"
            >
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn" @click="emit('update:show', false)">{{ $t('common.cancel') }}</button>
          <button class="btn btn-danger" :disabled="!canDelete" @click="emit('delete')">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-bg {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-4);
}
.modal {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  width: 100%;
  max-width: 25rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}
.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem var(--spacing-4);
  border-bottom: 1px solid var(--color-gray-200);
  font-weight: 600;
}
.modal-head button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--text-disabled);
}
.modal-body {
  padding: var(--spacing-4);
}
.modal-body .warn {
  color: var(--color-warning);
  font-size: 0.85rem;
  margin-top: var(--spacing-2);
}
.modal-body .field {
  margin-top: var(--spacing-3);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}
.modal-body .field label {
  font-size: 0.85rem;
}
.modal-body .field input {
  padding: var(--spacing-2) 0.625rem;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-sm);
  font-size: 0.85rem;
}
.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  border-top: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
  border-radius: 0 0 10px 10px;
}
.btn {
  padding: var(--spacing-2) var(--spacing-4);
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  cursor: pointer;
}
.btn-danger {
  background: var(--color-error);
  color: var(--color-white);
  border: none;
}
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
