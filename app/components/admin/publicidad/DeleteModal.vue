<template>
  <Teleport to="body">
    <div v-if="modal.show" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h3>{{ t('admin.publicidad.confirmDelete') }}</h3>
          <button class="modal-close" @click="$emit('close')">&times;</button>
        </div>
        <div class="modal-body">
          <p>
            {{ t('admin.publicidad.deleteText') }}
            <strong>{{ modal.name }}</strong
            >?
          </p>
          <div class="form-group delete-confirm-group">
            <label for="delete-confirm">
              {{ t('admin.publicidad.typeBorrar') }}
            </label>
            <input
              id="delete-confirm"
              v-model="modal.confirmText"
              type="text"
              placeholder="Borrar"
              autocomplete="off"
            >
            <p v-if="modal.confirmText && !canDelete" class="text-error">
              {{ t('admin.publicidad.typeBorrarError') }}
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="$emit('close')">
            {{ t('admin.publicidad.cancel') }}
          </button>
          <button class="btn-danger" :disabled="!canDelete || saving" @click="$emit('delete')">
            {{ t('admin.publicidad.delete') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const { t } = useI18n()

const modal = defineModel<{
  show: boolean
  type: string
  id: string
  name: string
  confirmText: string
}>('modal', { required: true })

defineProps<{
  canDelete: boolean
  saving: boolean
}>()

defineEmits<{
  close: []
  delete: []
}>()
</script>

<style scoped>
@import './publicidad-shared.css';
</style>
