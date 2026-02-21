<script setup lang="ts">
/**
 * Dealer Vehicles List
 * Grid of dealer's vehicles with actions: edit, pause, mark sold, delete.
 */
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

interface DealerVehicle {
  id: string
  brand: string
  model: string
  year: number | null
  price: number | null
  status: string
  views: number
  slug: string | null
  created_at: string | null
  vehicle_images: { url: string; position: number }[]
}

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
        'id, brand, model, year, price, status, views, slug, created_at, vehicle_images(url, position)',
      )
      .eq('dealer_id', dealer.id)
      .order('created_at', { ascending: false })

    if (err) throw err
    vehicles.value = (data || []) as DealerVehicle[]
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

function getThumbnail(vehicle: DealerVehicle): string | null {
  if (!vehicle.vehicle_images?.length) return null
  return [...vehicle.vehicle_images].sort((a, b) => a.position - b.position)[0]?.url || null
}

function formatPrice(price: number | null): string {
  if (!price) return '-'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(price)
}

function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    published: 'status-published',
    draft: 'status-draft',
    paused: 'status-paused',
    sold: 'status-sold',
  }
  return map[status] || 'status-draft'
}

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
      <div v-for="v in vehicles" :key="v.id" class="vehicle-card">
        <div class="card-image">
          <img v-if="getThumbnail(v)" :src="getThumbnail(v)!" :alt="`${v.brand} ${v.model}`" >
          <div v-else class="image-placeholder">
            <span>{{ t('dashboard.vehicles.noImage') }}</span>
          </div>
          <span class="status-pill" :class="getStatusClass(v.status)">
            {{ t(`dashboard.vehicleStatus.${v.status}`) }}
          </span>
        </div>
        <div class="card-body">
          <h3>{{ v.brand }} {{ v.model }}</h3>
          <div class="card-meta">
            <span v-if="v.year" class="meta-item">{{ v.year }}</span>
            <span class="meta-price">{{ formatPrice(v.price) }}</span>
          </div>
          <div class="card-stats">
            <span>{{ v.views || 0 }} {{ t('dashboard.views') }}</span>
          </div>
        </div>
        <div class="card-actions">
          <NuxtLink :to="`/dashboard/vehiculos/${v.id}`" class="action-btn">
            {{ t('common.edit') }}
          </NuxtLink>
          <button v-if="v.status !== 'sold'" class="action-btn" @click="toggleStatus(v)">
            {{
              v.status === 'published'
                ? t('dashboard.vehicles.pause')
                : t('dashboard.vehicles.activate')
            }}
          </button>
          <button v-if="v.status !== 'sold'" class="action-btn" @click="openSoldModal(v)">
            {{ t('dashboard.vehicles.markSold') }}
          </button>
          <button
            v-if="deleteConfirmId !== v.id"
            class="action-btn action-delete"
            @click="deleteConfirmId = v.id"
          >
            {{ t('common.delete') }}
          </button>
          <button v-else class="action-btn action-delete-confirm" @click="deleteVehicle(v.id)">
            {{ t('dashboard.vehicles.confirmDelete') }}
          </button>
        </div>
      </div>
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
  color: var(--color-primary, #23424a);
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
  color: #64748b;
  font-weight: 500;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.btn-primary:hover {
  background: #1a3238;
}

.btn-upgrade {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
}

.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: #64748b;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
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
  color: #64748b;
}

.empty-state p {
  margin: 0 0 16px 0;
}

/* Vehicles Grid */
.vehicles-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.vehicle-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.card-image {
  position: relative;
  height: 180px;
  background: #f1f5f9;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 0.85rem;
}

.status-pill {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-published {
  background: #dcfce7;
  color: #16a34a;
}
.status-draft {
  background: #f1f5f9;
  color: #64748b;
}
.status-paused {
  background: #fef3c7;
  color: #92400e;
}
.status-sold {
  background: #e2e8f0;
  color: #475569;
}

.card-body {
  padding: 16px;
}

.card-body h3 {
  margin: 0 0 8px 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #1e293b;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.meta-item {
  font-size: 0.85rem;
  color: #64748b;
}

.meta-price {
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.card-stats {
  font-size: 0.8rem;
  color: #94a3b8;
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #f1f5f9;
}

.action-btn {
  min-height: 44px;
  padding: 8px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  font-size: 0.85rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.action-btn:hover {
  background: #f8fafc;
}

.action-delete {
  color: #dc2626;
  border-color: #fecaca;
}
.action-delete:hover {
  background: #fef2f2;
}

.action-delete-confirm {
  color: white;
  background: #dc2626;
  border-color: #dc2626;
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
