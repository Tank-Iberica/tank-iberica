<script setup lang="ts">
import { useAdminAuctionList, STATUS_TABS } from '~/composables/admin/useAdminAuctionList'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { t } = useI18n()

const {
  // State
  activeFilter,
  auctions,
  loading,
  saving,
  error,
  auctionModal,
  registrationsPanel,
  vehicles,
  vehiclesLoading,

  // Functions
  fetchAuctions,
  openNewAuction,
  openEditAuction,
  closeAuctionModal,
  saveAuction,
  cancelAuction,
  adjudicateAuction,
  openRegistrationsPanel,
  closeRegistrationsPanel,
  approveRegistration,
  rejectRegistration,

  // Helpers
  formatDate,
  getStatusColor,
  getVehicleTitle,
  canEdit,
  canCancel,
  canAdjudicate,
} = useAdminAuctionList()

onMounted(() => {
  fetchAuctions()
})

function handleFormUpdate(form: typeof auctionModal.value.form) {
  auctionModal.value.form = form
}
</script>

<template>
  <div class="admin-subastas">
    <!-- Header -->
    <div class="section-header">
      <div class="header-left">
        <h2>{{ t('admin.subastas.title') }}</h2>
        <span v-if="!loading" class="total-badge">{{ auctions.length }} total</span>
      </div>
      <button class="btn-primary" @click="openNewAuction">
        + {{ t('admin.subastas.create') }}
      </button>
    </div>

    <!-- Filter tabs -->
    <div class="filters-bar">
      <div class="filter-group status-filter">
        <button
          v-for="f in STATUS_TABS"
          :key="f.value"
          class="filter-btn"
          :class="{ active: activeFilter === f.value }"
          @click="activeFilter = f.value"
        >
          {{ t(f.labelKey) }}
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state" aria-busy="true">
      <UiSkeletonCard v-for="n in 3" :key="n" :lines="3" />
    </div>

    <!-- Auctions list -->
    <div v-else-if="auctions.length" class="auctions-list">
      <AdminAuctionCard
        v-for="auction in auctions"
        :key="auction.id"
        :auction="auction"
        :saving="saving"
        :format-date="formatDate"
        :get-status-color="getStatusColor"
        :get-vehicle-title="getVehicleTitle"
        :can-edit="canEdit"
        :can-cancel="canCancel"
        :can-adjudicate="canAdjudicate"
        @edit="openEditAuction"
        @view-registrations="openRegistrationsPanel"
        @adjudicate="adjudicateAuction"
        @cancel="cancelAuction"
      />
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state-container">
      <div class="empty-icon">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-gray-400)"
          stroke-width="1.5"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      </div>
      <h3 class="empty-title">{{ t('admin.subastas.empty') }}</h3>
    </div>

    <!-- Modal: Create/Edit Auction -->
    <AdminAuctionFormModal
      :show="auctionModal.show"
      :editing="auctionModal.editing"
      :form="auctionModal.form"
      :vehicles="vehicles"
      :vehicles-loading="vehiclesLoading"
      :saving="saving"
      @save="saveAuction"
      @close="closeAuctionModal"
      @update:form="handleFormUpdate"
    />

    <!-- Modal: Registrations -->
    <AdminRegistrationsModal
      :show="registrationsPanel.show"
      :auction-title="registrationsPanel.auctionTitle"
      :registrations="registrationsPanel.registrations"
      :loading="registrationsPanel.loading"
      @close="closeRegistrationsPanel"
      @approve="approveRegistration"
      @reject="rejectRegistration"
    />
  </div>
</template>

<style scoped>
.admin-subastas {
  padding: 0;
}

/* ============================================
   HEADER
   ============================================ */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-5);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  flex-wrap: wrap;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-gray-900);
}

.total-badge {
  background: var(--bg-secondary);
  color: var(--color-gray-500);
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius-lg);
  font-size: 0.85rem;
  font-weight: 500;
}

/* ============================================
   FILTERS
   ============================================ */
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-5);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-card);
  align-items: center;
}

.filter-group {
  display: flex;
  gap: 0;
}

.status-filter {
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  overflow: hidden;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.filter-btn {
  padding: var(--spacing-2) 0.875rem;
  border: none;
  background: var(--bg-primary);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-gray-500);
  transition:
    background 0.2s,
    color 0.2s;
  min-height: 2.75rem;
  white-space: nowrap;
}

.filter-btn:not(:last-child) {
  border-right: 1px solid var(--color-gray-200);
}

.filter-btn.active {
  background: var(--color-primary);
  color: white;
}

.filter-btn:hover:not(.active) {
  background: var(--bg-secondary);
}

/* ============================================
   ERROR / LOADING
   ============================================ */
.error-banner {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  padding: 3.75rem var(--spacing-5);
  color: var(--text-auxiliary);
}

.spinner {
  width: 1.5rem;
  height: 1.5rem;
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

/* ============================================
   AUCTIONS LIST
   ============================================ */
.auctions-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

/* ============================================
   EMPTY STATE
   ============================================ */
.empty-state-container {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  padding: 3.75rem var(--spacing-6);
  text-align: center;
  box-shadow: var(--shadow-card);
}

.empty-icon {
  margin-bottom: var(--spacing-4);
}

.empty-title {
  margin: 0;
  font-size: 1.1rem;
  color: var(--color-gray-700);
}

/* ============================================
   BUTTONS
   ============================================ */
.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.625rem var(--spacing-5);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  min-height: 2.75rem;
  font-size: 0.9rem;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================
   RESPONSIVE — Mobile-first
   ============================================ */
@media (max-width: 48em) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
