<script setup lang="ts">
import { useAdminAuctionDetail } from '~/composables/admin/useAdminAuctionDetail'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const auctionId = computed(() => route.params.id as string)

const {
  auction,
  bids,
  registrations,
  loading,
  error,
  actionLoading,
  activeModal,
  cancelReason,
  rejectReason,
  reserveMet,
  highestBid,
  loadAuctionData,
  formatCents,
  formatDate,
  formatDateShort,
  getStatusClass,
  getStatusLabel,
  getRegStatusClass,
  getRegStatusLabel,
  getDepositStatusClass,
  getDepositStatusLabel,
  getVehicleLabel,
  getVehicleThumbnail,
  startAuction,
  endAuction,
  openCancelModal,
  confirmCancel,
  openAdjudicateModal,
  confirmAdjudicate,
  markNoSale,
  approveRegistration,
  openRejectModal,
  confirmReject,
  closeModal,
} = useAdminAuctionDetail(auctionId)

onMounted(async () => {
  await loadAuctionData()
})

function goBack() {
  router.push('/admin/subastas')
}
</script>

<template>
  <div class="admin-page">
    <!-- Loading -->
    <div v-if="loading && !auction" class="loading-state">
      <div class="spinner" />
      <span>{{ t('admin.subastas.loading') }}</span>
    </div>

    <template v-else-if="auction">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <button class="btn-back" @click="goBack">&larr;</button>
          <div class="header-info">
            <h1>{{ auction.title || getVehicleLabel() }}</h1>
            <span class="status-badge" :class="getStatusClass(auction.status)">
              {{ getStatusLabel(auction.status) }}
            </span>
          </div>
        </div>
        <NuxtLink to="/admin/subastas" class="btn-secondary btn-sm-link">
          {{ t('admin.subastas.backToList') }}
        </NuxtLink>
      </div>

      <!-- Error -->
      <div v-if="error" class="alert-error">
        {{ error }}
      </div>

      <div class="page-content">
        <AdminAuctionInfo
          :auction="auction"
          :bids="bids"
          :registrations="registrations"
          :format-cents="formatCents"
          :format-date="formatDate"
          :get-vehicle-label="getVehicleLabel"
          :get-vehicle-thumbnail="getVehicleThumbnail"
        />

        <AdminAuctionActions
          :auction="auction"
          :bids-exist="bids.length > 0"
          :action-loading="actionLoading"
          @start="startAuction"
          @end="endAuction"
          @adjudicate="openAdjudicateModal"
          @cancel="openCancelModal"
          @refresh="loadAuctionData"
        />

        <AdminBiddersTable
          :registrations="registrations"
          :action-loading="actionLoading"
          :format-date-short="formatDateShort"
          :get-reg-status-class="getRegStatusClass"
          :get-reg-status-label="getRegStatusLabel"
          :get-deposit-status-class="getDepositStatusClass"
          :get-deposit-status-label="getDepositStatusLabel"
          @approve="approveRegistration"
          @reject="openRejectModal"
        />

        <AdminBidHistory
          :bids="bids"
          :format-cents="formatCents"
          :format-date-short="formatDateShort"
        />
      </div>
    </template>

    <!-- Auction not found -->
    <div v-else-if="!loading" class="empty-state-full">
      <p>{{ t('admin.subastas.notFound') }}</p>
      <NuxtLink to="/admin/subastas" class="btn-primary">{{
        t('admin.subastas.backToList')
      }}</NuxtLink>
    </div>

    <AdminAuctionModals
      :active-modal="activeModal"
      :auction="auction"
      :highest-bid="highestBid"
      :reserve-met="reserveMet"
      :action-loading="actionLoading"
      :cancel-reason="cancelReason"
      :reject-reason="rejectReason"
      :format-cents="formatCents"
      @update:cancel-reason="cancelReason = $event"
      @update:reject-reason="rejectReason = $event"
      @confirm-cancel="confirmCancel"
      @confirm-adjudicate="confirmAdjudicate"
      @mark-no-sale="markNoSale"
      @confirm-reject="confirmReject"
      @close="closeModal"
    />
  </div>
</template>

<style scoped>
.admin-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  flex-direction: column;
  align-items: stretch;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-back {
  width: 44px;
  height: 44px;
  border: 1px solid var(--color-gray-200);
  background: var(--bg-primary);
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn-back:hover {
  background: var(--bg-secondary);
  border-color: var(--color-gray-300);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}

.header-info h1 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-draft {
  background: var(--bg-secondary);
  color: var(--text-auxiliary);
}
.status-scheduled {
  background: var(--color-info-bg, #dbeafe);
  color: var(--color-info);
}
.status-active {
  background: var(--color-success-bg, #dcfce7);
  color: var(--color-success);
}
.status-ended {
  background: var(--color-warning-bg, #fef3c7);
  color: var(--color-warning-text);
}
.status-adjudicated {
  background: #ede9fe;
  color: #7c3aed;
}
.status-cancelled {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
}
.status-no-sale {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.btn-secondary {
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--color-gray-200);
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.btn-secondary:hover {
  background: var(--bg-secondary);
  border-color: var(--color-gray-300);
}

.btn-sm-link {
  font-size: 0.875rem;
  padding: 8px 16px;
}

.page-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.alert-error {
  padding: 12px 16px;
  background: var(--color-error-bg, #fef2f2);
  border: 1px solid var(--color-error-border);
  border-radius: 8px;
  color: var(--color-error);
}

.empty-state-full {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-auxiliary);
}

.empty-state-full p {
  margin: 0 0 16px;
  font-size: 1.1rem;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    align-items: center;
  }

  .header-info {
    flex-direction: row;
    align-items: center;
  }

  .header-info h1 {
    font-size: 1.3rem;
  }
}
</style>
