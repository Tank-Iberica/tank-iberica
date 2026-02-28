<template>
  <div class="admin-vehicles">
    <div class="page-header">
      <h1 class="page-title">{{ $t('vehicles.vehicles') }}</h1>
      <NuxtLink to="/admin/vehiculos/new" class="btn-primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        {{ $t('admin.vehiculosIndex.newVehicle') }}
      </NuxtLink>
    </div>

    <AdminVehiclesFilters
      v-model:status="filters.status"
      v-model:category="filters.category"
      v-model:search="filters.search"
      @search-debounced="loadVehicles"
    />

    <div class="results-info">
      <span>{{ total }} vehículos</span>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>{{ $t('admin.vehiculosIndex.loadingVehicles') }}</span>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-secondary" @click="loadVehicles">Reintentar</button>
    </div>

    <div v-else-if="vehicles.length === 0" class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <path d="M16 8h5l3 3v9a2 2 0 01-2 2h-6" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
      <p>{{ $t('admin.vehiculosIndex.empty') }}</p>
      <NuxtLink to="/admin/vehiculos/new" class="btn-primary">Crear vehículo</NuxtLink>
    </div>

    <AdminVehiclesTable v-else :vehicles="vehicles" @confirm-delete="confirmDelete" />

    <AdminVehicleDeleteModal
      :show="deleteModal.show"
      :vehicle="deleteModal.vehicle"
      :saving="saving"
      @close="deleteModal.show = false"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { useAdminVehicles } from '~/composables/admin/useAdminVehicles'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { vehicles, loading, saving, error, total, fetchVehicles, deleteVehicle } = useAdminVehicles()

const filters = ref({
  status: null as string | null,
  category: null as string | null,
  search: '',
})

const deleteModal = ref<{
  show: boolean
  vehicle: { id: string; brand: string; model: string } | null
}>({
  show: false,
  vehicle: null,
})

async function loadVehicles() {
  await fetchVehicles({
    status: filters.value.status,
    category: filters.value.category,
    search: filters.value.search || undefined,
  })
}

watch([() => filters.value.status, () => filters.value.category], () => {
  loadVehicles()
})

function confirmDelete(vehicle: { id: string; brand: string; model: string }) {
  deleteModal.value = { show: true, vehicle }
}

async function handleDelete() {
  if (!deleteModal.value.vehicle) return
  const success = await deleteVehicle(deleteModal.value.vehicle.id)
  if (success) {
    deleteModal.value = { show: false, vehicle: null }
  }
}

onMounted(() => {
  loadVehicles()
})
</script>

<style scoped>
.admin-vehicles {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-primary);
  color: var(--color-white);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border-radius: var(--border-radius);
  text-decoration: none;
  min-height: 44px;
  transition: background var(--transition-fast);
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary svg {
  width: 18px;
  height: 18px;
}

.results-info {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  margin-bottom: var(--spacing-4);
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-12);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  text-align: center;
  gap: var(--spacing-4);
}

.loading-state .spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state svg {
  width: 64px;
  height: 64px;
  color: var(--text-auxiliary);
}

.error-state {
  color: var(--color-error);
}

.btn-secondary {
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  min-height: 40px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
}
</style>
