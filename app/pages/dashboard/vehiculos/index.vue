<script setup lang="ts">
/**
 * Dealer Vehicles List
 * Grid of dealer's vehicles with actions: edit, pause, mark sold, delete.
 */
import type { DealerVehicle } from '~/components/dashboard/vehiculos/DealerVehicleCard.vue'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const supabase = useSupabaseClient()
const { userId } = useAuth()
const { dealerProfile, loadDealer } = useDealerDashboard()
const { currentPlan, planLimits, canPublish, fetchSubscription } = useSubscriptionPlan(
  userId.value || undefined,
)

const vehicles = ref<DealerVehicle[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

async function loadVehicles(): Promise<void> {
  const dealer = dealerProfile.value || (await loadDealer())
  if (!dealer) return

  loading.value = true
  error.value = null

  try {
    const { data, error: err } = await supabase
      .from('vehicles')
      .select(
        'id, brand, model, year, price, status, slug, created_at, vehicle_images(url, position)',
      )
      .eq('dealer_id', dealer.id)
      .order('created_at', { ascending: false })

    if (err) throw err
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vehicles.value = (data || []) as any as DealerVehicle[]
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Error loading vehicles'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadVehicles(), fetchSubscription()])
})

const activeCount = computed(() => vehicles.value.filter((v) => v.status === 'published').length)
const maxListings = computed(() => planLimits.value.maxActiveListings)
const canPublishNew = computed(() => canPublish(activeCount.value))

async function toggleStatus(vehicle: DealerVehicle): Promise<void> {
  const newStatus = vehicle.status === 'published' ? 'draft' : 'published'

  if (newStatus === 'published' && !canPublish(activeCount.value)) {
    error.value = t('dashboard.vehicles.limitReached')
    return
  }

  const { error: err } = await supabase
    .from('vehicles')
    .update({ status: newStatus })
    .eq('id', vehicle.id)

  if (!err) {
    vehicle.status = newStatus
  }
}

const soldModalOpen = ref(false)
const selectedVehicleForSale = ref<DealerVehicle | null>(null)

function openSoldModal(vehicle: DealerVehicle) {
  selectedVehicleForSale.value = vehicle
  soldModalOpen.value = true
}

function handleVehicleSold() {
  if (selectedVehicleForSale.value) {
    selectedVehicleForSale.value.status = 'sold'
  }
  soldModalOpen.value = false
  selectedVehicleForSale.value = null
}

const deleteConfirmId = ref<string | null>(null)

async function deleteVehicle(vehicleId: string): Promise<void> {
  const { error: err } = await supabase.from('vehicles').delete().eq('id', vehicleId)

  if (!err) {
    vehicles.value = vehicles.value.filter((v) => v.id !== vehicleId)
    deleteConfirmId.value = null
  }
}
</script>

<template>
  <div class="vehicles-page">
    <header class="page-header">
      <div>
        <h1>{{ t('dashboard.vehicles.title') }}</h1>
        <span class="plan-indicator">
          {{ activeCount }}/{{ maxListings === Infinity ? '&infin;' : maxListings }}
          {{ t(`dashboard.plans.${currentPlan}`) }}
        </span>
      </div>
      <div class="header-actions">
        <NuxtLink to="/dashboard/vehiculos/importar" class="btn-secondary">
          {{ t('dashboard.import.title') }}
        </NuxtLink>
        <NuxtLink v-if="canPublishNew" to="/dashboard/vehiculos/nuevo" class="btn-primary">
          {{ t('dashboard.vehicles.publishNew') }}
        </NuxtLink>
        <NuxtLink v-else to="/dashboard/suscripcion" class="btn-upgrade">
          {{ t('dashboard.vehicles.upgradeToPub') }}
        </NuxtLink>
      </div>
    </header>

    <div v-if="error" class="alert-error">{{ error }}</div>

    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>{{ t('common.loading') }}...</span>
    </div>

    <div v-else-if="vehicles.length === 0" class="empty-state">
      <p>{{ t('dashboard.vehicles.empty') }}</p>
      <NuxtLink to="/dashboard/vehiculos/nuevo" class="btn-primary">
        {{ t('dashboard.vehicles.publishFirst') }}
      </NuxtLink>
    </div>

    <div v-else class="vehicles-grid">
      <DealerVehicleCard
        v-for="v in vehicles"
        :key="v.id"
        :vehicle="v"
        :delete-confirm-id="deleteConfirmId"
        @toggle-status="toggleStatus"
        @open-sold-modal="openSoldModal"
        @set-delete-confirm="deleteConfirmId = $event"
        @delete-vehicle="deleteVehicle"
      />
    </div>

    <!-- Sold Modal -->
    <SoldModal
      v-if="selectedVehicleForSale"
      v-model="soldModalOpen"
      :vehicle-id="selectedVehicleForSale.id"
      :vehicle-title="`${selectedVehicleForSale.brand} ${selectedVehicleForSale.model}`"
      @sold="handleVehicleSold"
    />
  </div>
</template>

<style scoped>
.vehicles-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.header-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (min-width: 480px) {
  .header-actions {
    flex-direction: row;
  }
}

.plan-indicator {
  font-size: 0.85rem;
  color: var(--text-auxiliary);
  font-weight: 500;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-upgrade {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  background: var(--color-warning);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
}

.alert-error {
  padding: 12px 16px;
  background: var(--color-error-bg, #fef2f2);
  border: 1px solid var(--color-error-border);
  border-radius: 8px;
  color: var(--color-error);
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

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-auxiliary);
}

.empty-state p {
  margin: 0 0 16px 0;
}

.vehicles-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 480px) {
  .vehicles-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .vehicles-page {
    padding: 24px;
  }

  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

@media (min-width: 1024px) {
  .vehicles-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
