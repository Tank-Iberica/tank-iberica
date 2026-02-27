<template>
  <div class="auctions-error">
    <p>{{ message }}</p>
    <button class="btn-retry" @click="$emit('retry')">
      {{ $t('auction.retry') }}
    </button>
  </div>
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
.auctions-error {
  text-align: center;
  padding: var(--spacing-12) 0;
  color: var(--color-error);
}

.auctions-error p {
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-4);
}

.btn-retry {
  padding: var(--spacing-3) var(--spacing-6);
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  min-height: 44px;
  transition: background var(--transition-fast);
}

.btn-retry:hover {
  background: var(--color-primary-dark);
}
</style>
