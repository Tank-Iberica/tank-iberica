<template>
  <div class="auctions-page">
    <div class="auctions-container">
      <UiBreadcrumbNav
        :items="[{ label: $t('nav.home'), to: '/' }, { label: $t('nav.subastas') }]"
      />
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
      <TransitionGroup v-else name="list" tag="div" class="auctions-grid">
        <SubastasAuctionCard
          v-for="item in auctions"
          :key="item.id"
          :auction="item"
          :first-image="getFirstImage(item)"
          :vehicle-title="getVehicleTitle(item)"
          :status-label="getStatusLabel(item.status)"
          :countdown="getCardCountdown(item)"
        />
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSubastasIndex } from '~/composables/useSubastasIndex'

definePageMeta({ layout: 'default' })

const { t } = useI18n()
usePageSeo({
  title: t('auction.seoTitle'),
  description: t('auction.seoDescription'),
  path: '/subastas',
})

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

// SSR: fetch initial auctions server-side for SEO + faster paint
await useAsyncData('subastas-list', () => loadTab(), { server: true })

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
@media (min-width: 30em) {
  .auctions-title {
    font-size: var(--font-size-3xl);
  }
}

/* Breakpoint: 768px (tablet) */
@media (min-width: 48em) {
  .auctions-container {
    padding: 0 var(--spacing-6);
  }

  .auctions-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-5);
  }
}

/* Breakpoint: 1024px (desktop) */
@media (min-width: 64em) {
  .auctions-container {
    padding: 0 var(--spacing-8);
  }

  .auctions-grid {
    gap: var(--spacing-6);
  }
}

/* Breakpoint: 1280px (large desktop) */
@media (min-width: 80em) {
  .auctions-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* ── List transitions ── */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(1rem);
}

.list-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.list-move {
  transition: transform 0.3s ease;
}
</style>
