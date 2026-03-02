<script setup lang="ts">
/**
 * Admin page: Dealer Subscriptions Management
 *
 * Refactored — all logic lives in useAdminDealerSuscripciones composable.
 * Template sections delegated to subcomponents under components/admin/dealers/.
 *
 * i18n keys under "admin.dealerSubscriptions":
 *   title, totalRecords, addSubscription, search, filterAll, filterPlan, filterStatus,
 *   loading, errorLoad, noResults,
 *   colDealer, colPlan, colStatus, colStarted, colExpires, colPrice, colActions,
 *   planFree, planBasic, planPremium, planFounding,
 *   statusActive, statusCanceled, statusPastDue, statusTrialing,
 *   foundingCount, foundingMax, perVertical,
 *   changePlan, cancelSubscription, extendExpiry, extend30Days,
 *   confirmCancel, confirmCancelText, confirmCancelWarning, typeCancel,
 *   cancelBtn, confirmBtn, closeBtn, saveBtn, saving,
 *   modalNewTitle, selectDealer, selectPlan, selectVertical, priceCents,
 *   createBtn, creating,
 *   extendTitle, extendText, extending,
 *   changePlanTitle, changePlanText,
 *   successCreated, successPlanChanged, successCanceled, successExtended,
 *   errorCreate, errorUpdate, errorCancel, errorExtend,
 *   noDealerSelected, vertical
 */

import {
  PLANS,
  STATUSES,
  FOUNDING_MAX_PER_VERTICAL,
  useAdminDealerSuscripciones,
} from '~/composables/admin/useAdminDealerSuscripciones'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { t } = useI18n()

const {
  // State
  loading,
  saving,
  error,
  successMessage,
  searchQuery,
  filterPlan,
  filterStatus,
  cancelModal,
  newModal,
  extendModal,
  changePlanModal,

  // Computed
  canCancel,
  filteredSubscriptions,
  total,
  foundingCountByVertical,
  uniqueVerticals,
  availableDealersForNew,

  // Async actions
  fetchSubscriptions,
  changePlan,
  cancelSubscription,
  createSubscription,
  extendExpiry,

  // Modal controls
  openCancelModal,
  closeCancelModal,
  openNewModal,
  closeNewModal,
  openExtendModal,
  closeExtendModal,
  openChangePlanModal,
  closeChangePlanModal,

  // Helpers
  getPlanConfig,
  getStatusConfig,
  getDealerName,
  getDealerLabel,
  formatDate,
  isExpired,
} = useAdminDealerSuscripciones()

// ---------- Lifecycle ----------
onMounted(async () => {
  await fetchSubscriptions()
})
</script>

<template>
  <div class="admin-dealer-subs">
    <!-- Header -->
    <div class="section-header">
      <div class="header-left">
        <h2>{{ t('admin.dealerSubscriptions.title') }}</h2>
        <span class="total-badge"
          >{{ total }} {{ t('admin.dealerSubscriptions.totalRecords') }}</span
        >
      </div>
      <button class="btn-primary" @click="openNewModal">
        + {{ t('admin.dealerSubscriptions.addSubscription') }}
      </button>
    </div>

    <!-- Founding Counters -->
    <AdminDealersSuscripcionFoundingCounters
      :founding-count-by-vertical="foundingCountByVertical"
      :unique-verticals="uniqueVerticals"
      :founding-max-per-vertical="FOUNDING_MAX_PER_VERTICAL"
    />

    <!-- Filters -->
    <AdminDealersSuscripcionFilters
      :filter-plan="filterPlan"
      :filter-status="filterStatus"
      :search-query="searchQuery"
      :plans="PLANS"
      :statuses="STATUSES"
      @update:filter-plan="filterPlan = $event"
      @update:filter-status="filterStatus = $event"
      @update:search-query="searchQuery = $event"
    />

    <!-- Success Message -->
    <div v-if="successMessage" class="success-banner">
      {{ successMessage }}
    </div>

    <!-- Error -->
    <div v-if="error" class="error-banner">
      {{ error }}
      <button class="error-dismiss" @click="error = null">x</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      {{ t('admin.dealerSubscriptions.loading') }}
    </div>

    <!-- Table -->
    <AdminDealersSuscripcionTable
      v-else
      :filtered-subscriptions="filteredSubscriptions"
      :saving="saving"
      :get-plan-config="getPlanConfig"
      :get-status-config="getStatusConfig"
      :get-dealer-name="getDealerName"
      :format-date="formatDate"
      :is-expired="isExpired"
      @change-plan="openChangePlanModal($event)"
      @extend="openExtendModal($event)"
      @cancel="openCancelModal($event)"
    />

    <!-- All Modals -->
    <AdminDealersSuscripcionModals
      :cancel-modal="cancelModal"
      :new-modal="newModal"
      :extend-modal="extendModal"
      :change-plan-modal="changePlanModal"
      :saving="saving"
      :can-cancel="canCancel"
      :available-dealers-for-new="availableDealersForNew"
      :unique-verticals="uniqueVerticals"
      :founding-count-by-vertical="foundingCountByVertical"
      :plans="PLANS"
      :founding-max-per-vertical="FOUNDING_MAX_PER_VERTICAL"
      :format-date="formatDate"
      :get-dealer-name="getDealerName"
      :get-dealer-label="getDealerLabel"
      @change-plan="changePlan"
      @extend-expiry="extendExpiry"
      @cancel-subscription="cancelSubscription"
      @create-subscription="createSubscription"
      @close-cancel="closeCancelModal"
      @close-new="closeNewModal"
      @close-extend="closeExtendModal"
      @close-change-plan="closeChangePlanModal"
      @update:cancel-modal="cancelModal = $event"
      @update:new-modal="newModal = $event"
      @update:change-plan-modal="changePlanModal = $event"
    />
  </div>
</template>

<style scoped>
.admin-dealer-subs {
  padding: 0;
}

/* ---- Header ---- */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-3, 12px);
  margin-bottom: var(--spacing-5, 20px);
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg-secondary, #f3f4f6);
  padding: var(--spacing-4, 16px) 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-3, 12px);
}

.section-header h2 {
  margin: 0;
  font-size: var(--font-size-2xl, 1.5rem);
  color: var(--text-primary, #1f2a2a);
}

.total-badge {
  background: var(--color-gray-100, #f3f4f6);
  color: var(--color-gray-500, #6b7280);
  padding: 6px 12px;
  border-radius: var(--border-radius-lg, 16px);
  font-size: var(--font-size-sm, 0.85rem);
}

/* ---- Banners ---- */
.success-banner {
  background: #ecfdf5;
  color: var(--color-success);
  padding: var(--spacing-3, 12px) var(--spacing-4, 16px);
  border-radius: var(--border-radius, 8px);
  margin-bottom: var(--spacing-4, 16px);
  font-weight: var(--font-weight-medium, 500);
}

.error-banner {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error, var(--color-error));
  padding: var(--spacing-3, 12px) var(--spacing-4, 16px);
  border-radius: var(--border-radius, 8px);
  margin-bottom: var(--spacing-4, 16px);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-dismiss {
  background: none;
  border: none;
  color: var(--color-error, var(--color-error));
  font-size: var(--font-size-lg, 1.125rem);
  cursor: pointer;
  padding: 4px 8px;
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-state {
  text-align: center;
  padding: var(--spacing-10, 40px);
  color: var(--color-gray-500, #6b7280);
}

/* ---- Buttons ---- */
.btn-primary {
  background: var(--color-primary);
  color: var(--color-white, white);
  border: none;
  padding: 10px 20px;
  border-radius: var(--border-radius-sm, 6px);
  cursor: pointer;
  font-weight: var(--font-weight-medium, 500);
  min-height: 44px;
  font-size: var(--font-size-sm, 0.875rem);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

/* ---- Mobile Responsive ---- */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: var(--spacing-3, 12px);
    align-items: stretch;
    position: static;
    padding: 0;
    margin-bottom: var(--spacing-4, 16px);
  }

  .header-left {
    justify-content: space-between;
  }

  .btn-primary {
    text-align: center;
  }
}

@media (max-width: 480px) {
  .section-header h2 {
    font-size: var(--font-size-xl, 1.25rem);
  }
}
</style>
