<template>
  <div class="auction-detail-error">
    <p>{{ errorMessage }}</p>
    <NuxtLink to="/subastas" class="btn-back">
      {{ $t('auction.backToList') }}
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  errorMessage: string
}>()
</script>

<style scoped>
.auction-detail-error {
  text-align: center;
  padding: var(--spacing-12) 0;
  color: var(--color-error);
}

.auction-detail-error p {
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-4);
}

.btn-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3) var(--spacing-6);
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  text-decoration: none;
  min-height: 44px;
  line-height: var(--line-height-normal);
  transition: background var(--transition-fast);
}

.btn-back:hover {
  background: var(--color-primary-dark);
}
</style>
