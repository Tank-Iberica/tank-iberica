<script setup lang="ts">
import { useAdminBrokerage, type BrokerageDeal, type DealFilters } from '~/composables/admin/useAdminBrokerage'
import { useAdminBrokerageDeal } from '~/composables/admin/useAdminBrokerageDeal'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  deals,
  loading,
  saving,
  error,
  total,
  fetchDeals,
  createDeal,
} = useAdminBrokerage()

// Filters
const activeTab = ref('all')
const searchQuery = ref('')

const filters = computed<DealFilters>(() => ({
  statusGroup: activeTab.value as DealFilters['statusGroup'],
  search: searchQuery.value || undefined,
}))

watch(filters, () => fetchDeals(filters.value), { deep: true })

// Detail modal
const selectedDealId = ref<string | null>(null)
const showDetail = ref(false)

const {
  deal: selectedDeal,
  messages,
  auditLog,
  loading: detailLoading,
  saving: detailSaving,
  error: detailError,
  validNextStatuses,
  dealPhase,
  transitionStatus,
  addMessage,
  updateDealFields,
  assignHuman,
} = useAdminBrokerageDeal(selectedDealId)

function onSelectDeal(deal: BrokerageDeal) {
  selectedDealId.value = deal.id
  showDetail.value = true
}

function closeDetail() {
  showDetail.value = false
  selectedDealId.value = null
  // Refresh list after potential changes
  fetchDeals(filters.value)
}

// Create modal
const showCreate = ref(false)

async function onCreateDeal(payload: Record<string, unknown>) {
  const id = await createDeal(payload)
  if (id) {
    showCreate.value = false
    await fetchDeals(filters.value)
  }
}

onMounted(() => {
  fetchDeals(filters.value)
})
</script>

<template>
  <div class="admin-page">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">Brokeraje</h1>
        <span class="deal-count">{{ total }} deals</span>
      </div>
      <button class="btn-primary" @click="showCreate = true">
        + Nuevo Deal
      </button>
    </div>

    <div class="page-content">
      <div class="filters-row">
        <AdminBrokerajeBrokerajeStatusTabs
          :active-tab="activeTab"
          @update:active-tab="activeTab = $event"
        />
        <input
          v-model="searchQuery"
          type="search"
          class="search-input"
          placeholder="Buscar por telefono, asignado..."
        >
      </div>

      <AdminBrokerajeBrokerajeTable
        :deals="deals"
        :loading="loading"
        :error="error"
        @select="onSelectDeal"
      />
    </div>

    <!-- Create modal -->
    <AdminBrokerajeBrokerajeCreateModal
      :show="showCreate"
      :saving="saving"
      :error="error"
      @close="showCreate = false"
      @create="onCreateDeal"
    />

    <!-- Detail modal -->
    <AdminBrokerajeBrokerajeDetailModal
      :show="showDetail"
      :deal="selectedDeal"
      :messages="messages"
      :audit-log="auditLog"
      :loading="detailLoading"
      :saving="detailSaving"
      :error="detailError"
      :valid-next-statuses="validNextStatuses"
      :deal-phase="dealPhase"
      @close="closeDetail"
      @transition="transitionStatus"
      @add-message="addMessage"
      @update-fields="updateDealFields"
      @assign-human="assignHuman"
    />
  </div>
</template>

<style scoped>
.admin-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  height: 100%;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-3);
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-3);
}

.page-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  margin: 0;
}

.deal-count {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.btn-primary {
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--color-primary);
  color: var(--text-on-dark-primary);
  border-radius: var(--border-radius);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  min-height: 2.75rem;
  transition: opacity var(--transition-fast);
}

.btn-primary:hover {
  opacity: 0.9;
}

.page-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.filters-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  flex-wrap: wrap;
}

.search-input {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  min-height: 2.75rem;
  min-width: 12.5rem;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent);
}

@media (max-width: 47.9375em) {
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    min-width: 100%;
  }
}
</style>
