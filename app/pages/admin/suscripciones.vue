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
        <span class="total-badge">{{ total }} {{ $t('common.records', 'registros') }}</span>
      </div>
      <button class="btn-export" @click="handleExport">{{ $t('common.exportCsv') }}</button>
    </div>

    <div class="filters-bar">
      <input
        v-model="filters.search"
        type="text"
        :placeholder="$t('admin.suscripciones.searchPlaceholder', 'Buscar por email...')"
        class="filter-search"
      >
    </div>

    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <div v-if="loading" class="loading-state" aria-busy="true">
      <UiSkeletonTable :rows="5" :cols="4" />
    </div>

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
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-5);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.total-badge {
  background: var(--bg-secondary);
  color: var(--color-gray-500);
  padding: 0.375rem var(--spacing-3);
  border-radius: var(--border-radius-lg);
  font-size: 0.85rem;
}

.btn-export {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
}

.btn-export:hover {
  opacity: 0.9;
}

.filters-bar {
  display: flex;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-5);
  padding: var(--spacing-4);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-card);
}

.filter-search {
  flex: 1;
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
}

.filter-search:focus {
  outline: none;
  border-color: var(--color-primary);
}

.error-banner {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
}

.loading-state {
  text-align: center;
  padding: var(--spacing-10);
  color: var(--color-gray-500);
}

@media (max-width: 48em) {
  .section-header {
    flex-direction: column;
    gap: var(--spacing-3);
    align-items: stretch;
  }

  .header-left {
    justify-content: space-between;
  }
}
</style>
