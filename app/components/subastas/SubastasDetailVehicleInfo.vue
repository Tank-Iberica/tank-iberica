<template>
  <div class="vehicle-info-section">
    <h1 class="vehicle-title">{{ title }}</h1>

    <div class="vehicle-meta">
      <span v-if="year" class="vehicle-meta-item">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        {{ year }}
      </span>
      <span v-if="location" class="vehicle-meta-item">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        {{ location }}
      </span>
      <span v-if="price" class="vehicle-meta-item">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
        {{ $t('auction.refPrice') }}: {{ formattedPrice }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  year: number | null
  location: string | null
  price: number | null
  formattedPrice: string
}>()
</script>

<style scoped>
.vehicle-info-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.vehicle-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  line-height: var(--line-height-tight);
}

.vehicle-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-4);
}

.vehicle-meta-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.vehicle-meta-item svg {
  flex-shrink: 0;
  color: var(--text-auxiliary);
}

@media (min-width: 480px) {
  .vehicle-title {
    font-size: var(--font-size-2xl);
  }
}

@media (min-width: 768px) {
  .vehicle-title {
    font-size: var(--font-size-2xl);
  }
}

@media (min-width: 1024px) {
  .vehicle-title {
    font-size: var(--font-size-3xl);
  }
}
</style>
