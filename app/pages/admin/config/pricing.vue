<script setup lang="ts">
import {
  planDefinitions,
  commissionDefinitions,
  useAdminConfigPricing,
} from '~/composables/admin/useAdminConfigPricing'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { t } = useI18n()

const {
  loading,
  savingPrices,
  savingCommissions,
  savingAuctionDefaults,
  error,
  successPrices,
  successCommissions,
  successAuctionDefaults,
  subscriptionPrices,
  commissionRates,
  auctionDefaults,
  loadConfig,
  savePrices,
  saveCommissions,
  saveAuctionDefaults,
  updatePrice,
  updateRate,
  updateAuctionDefault,
  dismissError,
} = useAdminConfigPricing()

onMounted(() => {
  loadConfig()
})
</script>

<template>
  <div class="config-pricing-page">
    <div class="section-header">
      <h1>{{ t('admin.configPricing.title') }}</h1>
      <p class="section-subtitle">{{ t('admin.configPricing.subtitle') }}</p>
    </div>

    <div class="info-banner">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      <span>{{ t('admin.configPricing.stripeSyncNote') }}</span>
    </div>

    <div v-if="loading" class="loading-state" aria-busy="true">
      <UiSkeletonCard :lines="5" />
    </div>

    <template v-else>
      <div v-if="error" class="alert-error">
        {{ error }}
        <button class="dismiss-btn" @click="dismissError">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <PricingSubscriptionCard
        :plan-definitions="planDefinitions"
        :subscription-prices="subscriptionPrices"
        :saving-prices="savingPrices"
        :success-prices="successPrices"
        @save="savePrices"
        @update-price="updatePrice($event.planKey, $event.field, $event.value)"
      />

      <PricingCommissionsCard
        :commission-definitions="commissionDefinitions"
        :commission-rates="commissionRates"
        :saving-commissions="savingCommissions"
        :success-commissions="successCommissions"
        @save="saveCommissions"
        @update-rate="updateRate($event.rateKey, $event.value)"
      />

      <PricingAuctionDefaultsCard
        :auction-defaults="auctionDefaults"
        :saving-auction-defaults="savingAuctionDefaults"
        :success-auction-defaults="successAuctionDefaults"
        @save="saveAuctionDefaults"
        @update="updateAuctionDefault($event.key, $event.value)"
      />
    </template>
  </div>
</template>

<style scoped>
.config-pricing-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  max-width: 50rem;
}

.section-header {
  margin-bottom: var(--spacing-2);
}

.section-header h1 {
  margin: 0 0 var(--spacing-2);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.section-subtitle {
  margin: 0;
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

.info-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-info-bg);
  border: 1px solid var(--color-info-border);
  border-radius: var(--border-radius);
  color: var(--color-info-text);
  font-size: var(--font-size-sm);
}

.info-banner svg {
  flex-shrink: 0;
}

.alert-error {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  color: var(--color-error);
  font-size: var(--font-size-sm);
}

.dismiss-btn {
  background: none;
  border: none;
  color: var(--color-error);
  cursor: pointer;
  padding: var(--spacing-1);
  display: flex;
  align-items: center;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-16) var(--spacing-5);
  color: var(--text-auxiliary);
}

@media (max-width: 48em) {
  .section-header h1 {
    font-size: 1.35rem;
  }
}
</style>
