<script setup lang="ts">
defineProps<{
  vehicleTitle: string
  otherPartyName: string
  statusLabel: string
  statusClass: string
  isClosed: boolean
}>()

const emit = defineEmits<{
  (e: 'back' | 'close'): void
}>()
</script>

<template>
  <header class="conv-header">
    <button class="conv-header__back" @click="emit('back')">
      <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
        <path
          fill-rule="evenodd"
          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
          clip-rule="evenodd"
        />
      </svg>
      <span class="sr-only">{{ $t('common.back') }}</span>
    </button>

    <div class="conv-header__info">
      <span class="conv-header__vehicle">
        {{ vehicleTitle || $t('messages.unknownVehicle') }}
      </span>
      <span class="conv-header__party">{{ otherPartyName }}</span>
    </div>

    <span class="conv-header__status" :class="statusClass">
      {{ statusLabel }}
    </span>

    <button
      v-if="!isClosed"
      class="conv-header__close-btn"
      :title="$t('messages.closeConversation')"
      @click="emit('close')"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" aria-hidden="true">
        <path
          fill-rule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </button>
  </header>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.conv-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  border-bottom: 1px solid var(--border-color-light);
  background: var(--bg-primary);
  min-height: 56px;
}

.conv-header__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-primary);
  flex-shrink: 0;
}

.conv-header__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.conv-header__vehicle {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-header__party {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.conv-header__status {
  flex-shrink: 0;
  padding: 2px var(--spacing-2);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.conv-status--active {
  background: #d1fae5;
  color: #065f46;
}

.conv-status--shared {
  background: #dbeafe;
  color: #1e40af;
}

.conv-status--closed {
  background: var(--bg-tertiary);
  color: var(--text-auxiliary);
}

.conv-status--reported {
  background: #fee2e2;
  color: #991b1b;
}

.conv-header__close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-auxiliary);
  flex-shrink: 0;
  transition: color var(--transition-fast);
}

.conv-header__close-btn:hover {
  color: var(--color-error);
}

@media (min-width: 768px) {
  .conv-header__back {
    display: none;
  }
}
</style>
