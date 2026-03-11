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
    <div v-if="loading" class="loading-state" aria-busy="true">
      <UiSkeletonTable :rows="6" :cols="4" />
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
  gap: var(--spacing-4);
  height: 100%;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.btn-refresh {
  align-self: flex-start;
  padding: 0.625rem 1.125rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 2.75rem;
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
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-error-bg, var(--color-error-bg));
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  color: var(--color-error);
  font-size: 0.9rem;
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
  padding: var(--spacing-6);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3.75rem var(--spacing-5);
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

@media (min-width: 48em) {
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
