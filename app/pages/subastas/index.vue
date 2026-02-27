<template>
  <div class="auctions-page">
    <div class="auctions-container">
      <h1 class="auctions-title">{{ $t('auction.pageTitle') }}</h1>

      <!-- Tab buttons -->
      <SubastasTabs
        :active-tab="activeTab"
        :loading="loading"
        :auction-count="auctions.length"
        @select-tab="activeTab = $event"
      />

      <!-- Loading skeleton -->
      <SubastasLoadingSkeleton v-if="loading" />

      <!-- Error -->
      <SubastasError v-else-if="error" :message="error" @retry="loadTab" />

      <!-- Empty state -->
      <SubastasEmpty v-else-if="auctions.length === 0" :message="emptyMessage" />

      <!-- Auction grid -->
      <div v-else class="auctions-grid">
        <SubastasAuctionCard
          v-for="item in auctions"
          :key="item.id"
          :auction="item"
          :first-image="getFirstImage(item)"
          :vehicle-title="getVehicleTitle(item)"
          :status-label="getStatusLabel(item.status)"
          :countdown="getCardCountdown(item)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSubastasIndex } from '~/composables/useSubastasIndex'

definePageMeta({ layout: 'default' })

const {
  activeTab,
  auctions,
  loading,
  error,
  emptyMessage,
  init,
  destroy,
  loadTab,
  getFirstImage,
  getVehicleTitle,
  getStatusLabel,
  getCardCountdown,
} = useSubastasIndex()

onMounted(init)
onUnmounted(destroy)
</script>

<style scoped>
.auctions-page {
  min-height: 60vh;
  padding: var(--spacing-6) 0 var(--spacing-12);
}

.auctions-container {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

.auctions-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-4);
}

/* ---- Auction grid ---- */
.auctions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-4);
}

/* Breakpoint: 480px (large mobile / landscape) */
@media (min-width: 480px) {
  .auctions-title {
    font-size: var(--font-size-3xl);
  }
}

/* Breakpoint: 768px (tablet) */
@media (min-width: 768px) {
  .auctions-container {
    padding: 0 var(--spacing-6);
  }

  .auctions-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-5);
  }
}

/* Breakpoint: 1024px (desktop) */
@media (min-width: 1024px) {
  .auctions-container {
    padding: 0 var(--spacing-8);
  }

  .auctions-grid {
    gap: var(--spacing-6);
  }
}

/* Breakpoint: 1280px (large desktop) */
@media (min-width: 1280px) {
  .auctions-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
