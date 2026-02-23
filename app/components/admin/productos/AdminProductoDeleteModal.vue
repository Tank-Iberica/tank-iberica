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
          <span>🗑️ Eliminar vehículo</span>
          <button @click="emit('update:show', false)">×</button>
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
          <button class="btn" @click="emit('update:show', false)">Cancelar</button>
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
  padding: 16px;
}
.modal {
  background: #fff;
  border-radius: 10px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}
.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
}
.modal-head button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #9ca3af;
}
.modal-body {
  padding: 16px;
}
.modal-body .warn {
  color: #f59e0b;
  font-size: 0.85rem;
  margin-top: 8px;
}
.modal-body .field {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.modal-body .field label {
  font-size: 0.85rem;
}
.modal-body .field input {
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  font-size: 0.85rem;
}
.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 10px 10px;
}
.btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
}
.btn-danger {
  background: #dc2626;
  color: #fff;
  border: none;
}
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
