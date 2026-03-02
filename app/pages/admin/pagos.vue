<script setup lang="ts">
import { useAdminPagos } from '~/composables/admin/useAdminPagos'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { t } = useI18n()

const {
  stripeAccounts,
  loading,
  error,
  activeTab,
  dateRange,
  expandedId,
  filteredPayments,
  revenueStats,
  tabCounts,
  fetchPayments,
  fetchStripeAccounts,
  toggleExpand,
  clearError,
  setActiveTab,
  setDateRange,
} = useAdminPagos()

onMounted(() => {
  fetchPayments()
  fetchStripeAccounts()
})
</script>

<template>
  <div class="pagos-page">
    <!-- Header -->
    <header class="page-header">
      <h1>{{ t('admin.pagos.title') }}</h1>
      <button class="btn-refresh" :disabled="loading" @click="fetchPayments">
        {{ t('admin.pagos.refresh') }}
      </button>
    </header>

    <PagosStatsRow :revenue-stats="revenueStats" />
    <PagosDateFilter :date-range="dateRange" @change="setDateRange" />
    <PagosStatusTabs :active-tab="activeTab" :tab-counts="tabCounts" @change="setActiveTab" />

    <!-- Error -->
    <div v-if="error" class="alert-error">
      {{ error }}
      <button class="dismiss-btn" @click="clearError">
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

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>{{ t('common.loading') }}</span>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredPayments.length === 0" class="empty-state">
      <p>{{ t('admin.pagos.noPayments') }}</p>
    </div>

    <!-- Desktop table -->
    <template v-else>
      <div class="desktop-only">
        <PagosPaymentTable
          :payments="filteredPayments"
          :expanded-id="expandedId"
          @toggle-expand="toggleExpand"
        />
      </div>
    </template>

    <!-- Mobile card list -->
    <div v-if="!loading && filteredPayments.length > 0" class="mobile-only">
      <PagosPaymentCardList
        :payments="filteredPayments"
        :expanded-id="expandedId"
        @toggle-expand="toggleExpand"
      />
    </div>

    <!-- Stripe Connect Section -->
    <PagosStripeConnect v-if="stripeAccounts.length > 0" :accounts="stripeAccounts" />
  </div>
</template>

<style scoped>
.pagos-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.btn-refresh {
  align-self: flex-start;
  padding: 10px 18px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 44px;
}

.btn-refresh:hover {
  background: var(--color-primary-dark);
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Alerts & states */
.alert-error {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--color-error-bg, #fef2f2);
  border: 1px solid var(--color-error-border);
  border-radius: 8px;
  color: var(--color-error);
  font-size: 0.9rem;
}

.dismiss-btn {
  background: none;
  border: none;
  color: var(--color-error);
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
  color: var(--text-auxiliary);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-gray-200);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  color: var(--text-auxiliary);
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
}

/* Responsive layout toggles */
.desktop-only {
  display: none;
}

.mobile-only {
  display: block;
}

@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .btn-refresh {
    align-self: auto;
  }

  .desktop-only {
    display: block;
  }

  .mobile-only {
    display: none;
  }
}
</style>
