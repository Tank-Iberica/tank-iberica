<script setup lang="ts">
import { useAdminAuctionList } from '~/composables/admin/useAdminAuctionList'
import type { AuctionWithVehicle, AuctionForm } from '~/composables/admin/useAdminAuctionList'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  activeFilter,
  filteredAuctions,
  loading,
  saving,
  error,
  auctionModal,
  cancelModal,
  vehicles,
  vehiclesLoading,
  fetchAuctions,
  fetchVehicles,
  openNewAuction,
  openEditAuction,
  closeAuctionModal,
  saveAuction,
  openCancelModal,
  closeCancelModal,
  confirmCancelAuction,
  adjudicateAuction,
  formatDate,
  formatPriceCents,
  getStatusClass,
  getStatusLabel,
  getVehicleTitle,
  canEdit,
  canCancel,
  canAdjudicate,
} = useAdminAuctionList()

onMounted(async () => {
  await Promise.all([fetchAuctions(), fetchVehicles()])
})

function handleUpdateForm(form: AuctionForm) {
  auctionModal.value.form = form
}

function handleUpdateCancelReason(value: string) {
  cancelModal.value.reason = value
}

function handleEdit(auction: AuctionWithVehicle) {
  openEditAuction(auction)
}
</script>

<template>
  <div class="admin-page">
    <AdminAuctionListHeader :count="filteredAuctions.length" @create="openNewAuction" />

    <div class="page-content">
      <AdminAuctionStatusTabs
        :active-tab="activeFilter"
        @update:active-tab="activeFilter = $event"
      />

      <AdminAuctionListTable
        :auctions="filteredAuctions"
        :loading="loading"
        :error="error"
        :format-date="formatDate"
        :format-price-cents="formatPriceCents"
        :get-status-class="getStatusClass"
        :get-status-label="getStatusLabel"
        :get-vehicle-title="getVehicleTitle"
        :can-edit="canEdit"
        :can-cancel="canCancel"
        :can-adjudicate="canAdjudicate"
        @edit="handleEdit"
        @adjudicate="adjudicateAuction"
        @cancel="openCancelModal"
      />
    </div>

    <AdminAuctionFormModal
      :show="auctionModal.show"
      :editing="auctionModal.editing"
      :form="auctionModal.form"
      :vehicles="vehicles"
      :vehicles-loading="vehiclesLoading"
      :saving="saving"
      @save="saveAuction"
      @close="closeAuctionModal"
      @update:form="handleUpdateForm"
    />

    <AdminAuctionCancelModal
      :show="cancelModal.show"
      :reason="cancelModal.reason"
      @update:reason="handleUpdateCancelReason"
      @confirm="confirmCancelAuction"
      @close="closeCancelModal"
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

.page-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
