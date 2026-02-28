<script setup lang="ts">
import {
  useAdminSubscriptions,
  type AdminSubscription,
  type SubscriptionFilters,
} from '~/composables/admin/useAdminSubscriptions'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { subscriptions, loading, error, total, fetchSubscriptions, deleteSubscription, exportCSV } =
  useAdminSubscriptions()

const filters = ref<SubscriptionFilters>({
  search: '',
})

const deleteModal = ref({
  show: false,
  subscription: null as AdminSubscription | null,
  confirmText: '',
})

const canDelete = computed(() => deleteModal.value.confirmText.toLowerCase() === 'borrar')

onMounted(async () => {
  await fetchSubscriptions()
})

watch(
  filters,
  () => {
    fetchSubscriptions(filters.value)
  },
  { deep: true },
)

function confirmDelete(sub: AdminSubscription) {
  deleteModal.value = { show: true, subscription: sub, confirmText: '' }
}

function closeDeleteModal() {
  deleteModal.value = { show: false, subscription: null, confirmText: '' }
}

async function executeDelete() {
  if (!deleteModal.value.subscription || !canDelete.value) return
  const success = await deleteSubscription(deleteModal.value.subscription.id)
  if (success) {
    closeDeleteModal()
  }
}

function handleExport() {
  exportCSV([...subscriptions.value])
}
</script>

<template>
  <div class="admin-suscripciones">
    <div class="section-header">
      <div class="header-left">
        <h2>{{ $t('admin.suscripciones.title') }}</h2>
        <span class="total-badge">{{ total }} registros</span>
      </div>
      <button class="btn-export" @click="handleExport">Exportar CSV</button>
    </div>

    <div class="filters-bar">
      <input
        v-model="filters.search"
        type="text"
        placeholder="Buscar por email..."
        class="filter-search"
      >
    </div>

    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <div v-if="loading" class="loading-state">Cargando suscripciones...</div>

    <AdminSubscriptionsTable
      v-else
      :subscriptions="subscriptions"
      @confirm-delete="confirmDelete"
    />

    <AdminSubscriptionsDeleteModal
      :show="deleteModal.show"
      :subscription="deleteModal.subscription"
      :confirm-text="deleteModal.confirmText"
      :can-delete="canDelete"
      @close="closeDeleteModal"
      @confirm="executeDelete"
      @update:confirm-text="deleteModal.confirmText = $event"
    />
  </div>
</template>

<style scoped>
.admin-suscripciones {
  padding: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.total-badge {
  background: #f3f4f6;
  color: #6b7280;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
}

.btn-export {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
}

.btn-export:hover {
  opacity: 0.9;
}

.filters-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-search {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
}

.filter-search:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
}

.error-banner {
  background: #fef2f2;
  color: #dc2626;
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
    gap: 12px;
    align-items: stretch;
  }

  .header-left {
    justify-content: space-between;
  }
}
</style>
