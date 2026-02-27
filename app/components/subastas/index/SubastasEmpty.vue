<template>
  <div class="auctions-empty">
    <div class="empty-icon">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <path d="M12 8v4l3 3" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    </div>
    <p class="empty-title">{{ message }}</p>
    <p class="empty-subtitle">{{ $t('auction.emptySubtitle') }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string
}>()
</script>

<style scoped>
.auctions-empty {
  text-align: center;
  padding: var(--spacing-16) var(--spacing-4);
}

.empty-icon {
  color: var(--text-disabled);
  margin-bottom: var(--spacing-4);
}

.empty-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}

.empty-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}
</style>
