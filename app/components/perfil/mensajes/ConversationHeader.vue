<script setup lang="ts">
const { t } = useI18n()

const props = defineProps<{
  vehicleTitle: string
  otherPartyName: string
  statusLabel: string
  statusClass: string
  isClosed: boolean
  sellerAvgResponseMinutes?: number | null
  isBuyer?: boolean
}>()

const emit = defineEmits<{
  back: []
  close: []
}>()

const sellerResponseLabel = computed<string>(() => {
  if (!props.isBuyer || props.sellerAvgResponseMinutes == null) return ''
  const m = props.sellerAvgResponseMinutes
  let timeStr: string
  if (m < 60) {
    timeStr = `~${m} min`
  } else if (m < 1440) {
    timeStr = `~${Math.round(m / 60)}h`
  } else {
    const days = Math.round(m / 1440)
    timeStr = `~${days} ${days === 1 ? t('messages.sellerResponseDay') : t('messages.sellerResponseDays')}`
  }
  return `${t('messages.sellerResponseHint')} ${timeStr}`
})
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
      <span v-if="sellerResponseLabel" class="conv-header__response-time">
        {{ sellerResponseLabel }}
      </span>
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
  width: 0.0625rem;
  height: 0.0625rem;
  padding: 0;
  margin: -0.0625rem;
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
  min-height: 3.5rem;
}

.conv-header__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
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
  gap: 0.0625rem;
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

.conv-header__response-time {
  font-size: 0.625rem;
  color: var(--color-primary);
  opacity: 0.75;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-header__status {
  flex-shrink: 0;
  padding: 2px var(--spacing-2);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.conv-status--active {
  background: var(--color-emerald-100);
  color: var(--color-success-text);
}

.conv-status--shared {
  background: var(--color-info-bg, var(--color-info-bg));
  color: var(--badge-info-bg);
}

.conv-status--closed {
  background: var(--bg-tertiary);
  color: var(--text-auxiliary);
}

.conv-status--reported {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}

.conv-header__close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
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

@media (min-width: 48em) {
  .conv-header__back {
    display: none;
  }
}
</style>
