<script setup lang="ts">
defineProps<{
  hasAcceptedShare: boolean
}>()

const emit = defineEmits<{
  (e: 'accept-share'): void
}>()
</script>

<template>
  <div class="data-share-banner">
    <div class="data-share-banner__content">
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        width="20"
        height="20"
        class="data-share-banner__icon"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
          clip-rule="evenodd"
        />
      </svg>
      <span class="data-share-banner__text">
        {{
          hasAcceptedShare ? $t('messages.waitingOtherPartyShare') : $t('messages.dataShareNotice')
        }}
      </span>
    </div>
    <button v-if="!hasAcceptedShare" class="data-share-banner__btn" @click="emit('accept-share')">
      {{ $t('messages.shareData') }}
    </button>
  </div>
</template>

<style scoped>
.data-share-banner {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  background: #eff6ff;
  border-bottom: 1px solid #bfdbfe;
}

.data-share-banner__content {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-2);
}

.data-share-banner__icon {
  flex-shrink: 0;
  color: var(--color-info);
  margin-top: 1px;
}

.data-share-banner__text {
  font-size: var(--font-size-sm);
  color: #1e40af;
  line-height: var(--line-height-normal);
}

.data-share-banner__btn {
  align-self: flex-start;
  padding: var(--spacing-2) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  background: var(--color-info);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background var(--transition-fast);
  min-height: 44px;
}

.data-share-banner__btn:hover {
  background: #2563eb;
}

@media (min-width: 768px) {
  .data-share-banner {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
