<script setup lang="ts">
import { useAdminPublicidad } from '~/composables/admin/useAdminPublicidad'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { t } = useI18n()

const {
  // State
  activeTab,
  loading,
  saving,
  error,
  advertisers,
  advertiserModal,
  ads,
  adModal,
  deleteModal,
  floorPrices,
  savingFloors,
  // Computed
  canDelete,
  // Dashboard
  dashDateRange,
  dashCustomFrom,
  dashCustomTo,
  dashSummary,
  dashRevenueBySource,
  dashPerformance,
  dashCtrByFormat,
  dashTopAds,
  dashAudience,
  fetchEnhancedDashboard,
  // Advertisers CRUD
  fetchAdvertisers,
  openNewAdvertiser,
  openEditAdvertiser,
  closeAdvertiserModal,
  saveAdvertiser,
  confirmDeleteAdvertiser,
  // Ads CRUD
  openNewAd,
  openEditAd,
  closeAdModal,
  saveAd,
  confirmDeleteAd,
  togglePosition,
  // Delete
  closeDeleteModal,
  executeDelete,
  // Floor prices
  saveFloorPrices,
  // Tab
  switchTab,
  // Helpers
  getAdvertiserName,
} = useAdminPublicidad()

onMounted(() => {
  fetchAdvertisers()
})
</script>

<template>
  <div class="admin-publicidad">
    <!-- Header -->
    <div class="section-header">
      <h2>{{ t('admin.publicidad.title') }}</h2>
    </div>

    <!-- Tabs -->
    <div class="tabs-bar">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'advertisers' }"
        @click="switchTab('advertisers')"
      >
        {{ t('admin.publicidad.advertisersTab') }}
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'ads' }" @click="switchTab('ads')">
        {{ t('admin.publicidad.adsTab') }}
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'dashboard' }"
        @click="switchTab('dashboard')"
      >
        {{ t('admin.publicidad.dashboardTab') }}
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'floor_prices' }"
        @click="switchTab('floor_prices')"
      >
        {{ t('admin.publicidad.floorPricesTab') }}
      </button>
    </div>

    <!-- Error -->
    <div v-if="error" class="error-banner">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">{{ t('admin.publicidad.loading') }}</div>

    <!-- Tab content -->
    <AdminPublicidadAdvertisersTab
      v-if="!loading && activeTab === 'advertisers'"
      :advertisers="advertisers"
      @new-advertiser="openNewAdvertiser"
      @edit-advertiser="openEditAdvertiser"
      @delete-advertiser="confirmDeleteAdvertiser"
    />

    <AdminPublicidadAdsTab
      v-if="!loading && activeTab === 'ads'"
      :ads="ads"
      :get-advertiser-name="getAdvertiserName"
      @new-ad="openNewAd"
      @edit-ad="openEditAd"
      @delete-ad="confirmDeleteAd"
    />

    <AdminPublicidadDashboardTab
      v-if="!loading && activeTab === 'dashboard'"
      :date-range="dashDateRange"
      :custom-from="dashCustomFrom"
      :custom-to="dashCustomTo"
      :summary="dashSummary"
      :revenue-by-source="dashRevenueBySource"
      :performance="dashPerformance"
      :ctr-by-format="dashCtrByFormat"
      :top-ads="dashTopAds"
      :audience="dashAudience"
      @update:date-range="dashDateRange = $event"
      @update:custom-from="dashCustomFrom = $event"
      @update:custom-to="dashCustomTo = $event"
      @refresh="fetchEnhancedDashboard"
    />

    <AdminPublicidadFloorPricesTab
      v-if="!loading && activeTab === 'floor_prices'"
      :floor-prices="floorPrices"
      :saving-floors="savingFloors"
      @save="saveFloorPrices"
    />

    <!-- Modals -->
    <AdminPublicidadAdvertiserModal
      v-model:modal="advertiserModal"
      :saving="saving"
      @close="closeAdvertiserModal"
      @save="saveAdvertiser"
    />

    <AdminPublicidadAdModal
      v-model:modal="adModal"
      :advertisers="advertisers"
      :saving="saving"
      @close="closeAdModal"
      @save="saveAd"
      @toggle-position="togglePosition"
    />

    <AdminPublicidadDeleteModal
      v-model:modal="deleteModal"
      :can-delete="canDelete"
      :saving="saving"
      @close="closeDeleteModal"
      @delete="executeDelete"
    />
  </div>
</template>

<style scoped>
.admin-publicidad {
  padding: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.tabs-bar {
  display: flex;
  gap: 0;
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
  background: var(--bg-primary);
}

.tab-btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: var(--bg-primary);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s;
  min-height: 44px;
}

.tab-btn:not(:last-child) {
  border-right: 1px solid #e5e7eb;
}

.tab-btn.active {
  background: var(--color-primary);
  color: white;
}

.tab-btn:hover:not(.active) {
  background: var(--bg-secondary);
}

.error-banner {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .tabs-bar {
    flex-direction: column;
  }

  .tab-btn:not(:last-child) {
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }
}
</style>
