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
  error,
  successPrices,
  successCommissions,
  subscriptionPrices,
  commissionRates,
  loadConfig,
  savePrices,
  saveCommissions,
  updatePrice,
  updateRate,
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

    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>{{ t('common.loading') }}</span>
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
    </template>
  </div>
</template>

<style scoped>
.config-pricing-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 800px;
}

.section-header {
  margin-bottom: 8px;
}

.section-header h1 {
  margin: 0 0 8px;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.section-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
}

.info-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  color: #1e40af;
  font-size: 0.875rem;
}

.info-banner svg {
  flex-shrink: 0;
}

.alert-error {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.9rem;
}

.dismiss-btn {
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: #64748b;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .section-header h1 {
    font-size: 1.35rem;
  }
}
</style>
