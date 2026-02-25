<template>
  <Teleport to="body">
    <div v-if="show" class="modal-bg" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal-head">
          <span>&#x1F5D1;&#xFE0F; Eliminar transaccion</span>
          <button @click="$emit('close')">&times;</button>
        </div>
        <div class="modal-body">
          <p>Eliminar esta transaccion?</p>
          <p class="delete-info">
            <strong>{{ BALANCE_REASONS[deleteTarget?.razon || 'otros'] }}</strong> &mdash;
            {{ fmt(deleteTarget?.importe) }}
          </p>
          <div class="field">
            <label for="delete-confirm-input"
              >Escribe <strong>Borrar</strong> para confirmar:</label
            >
            <input
              id="delete-confirm-input"
              :value="deleteConfirm"
              type="text"
              placeholder="Borrar"
              @input="$emit('update:deleteConfirm', ($event.target as HTMLInputElement).value)"
            >
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn" @click="$emit('close')">Cancelar</button>
          <button
            class="btn btn-danger"
            :disabled="!canDelete || saving"
            @click="$emit('confirmDelete')"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { type BalanceEntry, BALANCE_REASONS } from '~/composables/admin/useAdminBalance'
import { fmt } from '~/composables/admin/useAdminBalanceUI'

defineProps<{
  show: boolean
  deleteTarget: BalanceEntry | null
  deleteConfirm: string
  canDelete: boolean
  saving: boolean
}>()

defineEmits<{
  close: []
  confirmDelete: []
  'update:deleteConfirm': [value: string]
}>()
</script>

<style scoped>
@import './balance-shared.css';
</style>
