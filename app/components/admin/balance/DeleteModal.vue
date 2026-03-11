<template>
  <Teleport to="body">
    <div v-if="show" class="modal-bg" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal-head">
          <span>{{ $t('admin.balance.deleteTransaction') }}</span>
          <button @click="$emit('close')">&times;</button>
        </div>
        <div class="modal-body">
          <p>{{ $t('admin.balance.deleteTransactionConfirm') }}</p>
          <p class="delete-info">
            <strong>{{ BALANCE_REASONS[deleteTarget?.razon || 'otros'] }}</strong> &mdash;
            {{ fmt(deleteTarget?.importe) }}
          </p>
          <div class="field">
            <label for="delete-confirm-input" v-html="$t('admin.balance.typeDeleteConfirm', { word: '<strong>Borrar</strong>' })" />
            <input
              id="delete-confirm-input"
              :value="deleteConfirm"
              type="text"
              :placeholder="$t('common.delete')"
              @input="$emit('update:deleteConfirm', ($event.target as HTMLInputElement).value)"
            >
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn" @click="$emit('close')">{{ $t('common.cancel') }}</button>
          <button
            class="btn btn-danger"
            :disabled="!canDelete || saving"
            @click="$emit('confirmDelete')"
          >
            {{ $t('common.delete') }}
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
