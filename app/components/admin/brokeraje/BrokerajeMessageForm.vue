<script setup lang="ts">
import type { AddMessagePayload, SenderEntity, RecipientEntity } from '~/composables/admin/useAdminBrokerageDeal'

defineProps<{
  saving: boolean
}>()

const emit = defineEmits<{
  submit: [payload: AddMessagePayload]
}>()

const content = ref('')
const direction = ref<'outbound' | 'inbound'>('outbound')
const channel = ref<'whatsapp' | 'email' | 'platform' | 'phone'>('whatsapp')
const senderEntity = ref<SenderEntity>('tank_human')
const recipientEntity = ref<RecipientEntity>('seller')

function handleSubmit() {
  if (!content.value.trim()) return
  emit('submit', {
    content: content.value.trim(),
    direction: direction.value,
    channel: channel.value,
    sender_entity: senderEntity.value,
    recipient_entity: recipientEntity.value,
  })
  content.value = ''
}
</script>

<template>
  <form class="message-form" @submit.prevent="handleSubmit">
    <textarea
      v-model="content"
      class="message-input"
      rows="3"
      placeholder="Escribir mensaje o nota..."
    />
    <div class="form-controls">
      <select v-model="direction" class="form-select">
        <option value="outbound">Saliente</option>
        <option value="inbound">Entrante</option>
      </select>
      <select v-model="channel" class="form-select">
        <option value="whatsapp">WhatsApp</option>
        <option value="email">Email</option>
        <option value="phone">Telefono</option>
        <option value="platform">Plataforma</option>
      </select>
      <select v-model="senderEntity" class="form-select">
        <option value="tank_human">Tank Humano</option>
        <option value="tracciona_ai_broker">Tracciona Broker</option>
        <option value="buyer">Comprador</option>
        <option value="seller">Vendedor</option>
        <option value="system">Sistema</option>
      </select>
      <select v-model="recipientEntity" class="form-select">
        <option value="seller">Vendedor</option>
        <option value="buyer">Comprador</option>
        <option value="tank_human">Tank Humano</option>
        <option value="system">Sistema</option>
      </select>
      <button type="submit" class="btn-send" :disabled="saving || !content.trim()">
        {{ saving ? '...' : 'Enviar' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.message-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding-top: var(--spacing-3);
  border-top: 1px solid var(--border-color);
}

.message-input {
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-family: inherit;
  resize: vertical;
}

.message-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-controls {
  display: flex;
  gap: var(--spacing-2);
  flex-wrap: wrap;
  align-items: center;
}

.form-select {
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-xs);
  min-height: 2rem;
}

.btn-send {
  padding: var(--spacing-1) var(--spacing-3);
  background: var(--color-primary);
  color: var(--text-on-dark-primary);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  min-height: 2rem;
  margin-left: auto;
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
