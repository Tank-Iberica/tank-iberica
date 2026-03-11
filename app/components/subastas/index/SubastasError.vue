<template>
  <UiErrorState
    type="network"
    :title="$t('auction.errorTitle')"
    :description="message"
    :hint="$t('common.errorHintNetwork')"
  >
    <template #actions>
      <button class="btn-retry" @click="$emit('retry')">
        {{ $t('auction.retry') }}
      </button>
    </template>
  </UiErrorState>
</template>

<script setup lang="ts">
defineProps<{
  message: string
}>()

defineEmits<{
  retry: []
}>()
</script>

<style scoped>
.btn-retry {
  padding: var(--spacing-3) var(--spacing-6);
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  min-height: 2.75rem;
  transition: background var(--transition-fast);
}

.btn-retry:hover {
  background: var(--color-primary-dark);
}
</style>
