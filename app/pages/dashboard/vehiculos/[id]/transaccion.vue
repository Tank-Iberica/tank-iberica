<script setup lang="ts">
/**
 * Rent / Sell Transaction Page
 * Critical business flow for fleet dealers.
 * Two tabs: Rent (register a rental) and Sell (archive vehicle with sale).
 */
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const { userId } = useAuth()
const { dealerProfile, loadDealer } = useDealerDashboard()

const vehicleId = route.params.id as string

// --------------- State ---------------
type TabKey = 'rent' | 'sell'
const activeTab = ref<TabKey>('rent')

const loading = ref(true)
const submitting = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Vehicle data loaded from DB
interface VehicleData {
  id: string
  brand: string
  model: string
  year: number | null
  price: number | null
  acquisition_cost: number | null
  status: string | null
  dealer_id: string | null
  maintenance_records: unknown
  rental_records: unknown
}

const vehicle = ref<VehicleData | null>(null)

// Rent form
const rentForm = ref({
  from_date: '',
  to_date: '',
  client_name: '',
  client_contact: '',
  amount: 0,
  invoice_url: '',
  notes: '',
})

// Sell form
const sellForm = ref({
  sale_date: '',
  buyer_name: '',
  buyer_contact: '',
  sale_price: 0,
  invoice_url: '',
  exportacion: false,
})

// --------------- Computed ---------------
const vehicleTitle = computed(() => {
  if (!vehicle.value) return ''
  return `${vehicle.value.brand} ${vehicle.value.model}`
})

// Calculate total costs for benefit computation
const totalCost = computed(() => {
  if (!vehicle.value) return 0

  const acquisitionCost = vehicle.value.acquisition_cost || 0

  // Sum maintenance costs from JSON if available
  let maintenanceCost = 0
  if (vehicle.value.maintenance_records && Array.isArray(vehicle.value.maintenance_records)) {
    maintenanceCost = (vehicle.value.maintenance_records as Array<{ cost?: number }>).reduce(
      (sum: number, r: { cost?: number }) => sum + (r.cost || 0),
      0,
    )
  }

  // Sum rental income from JSON if available
  let rentalIncome = 0
  if (vehicle.value.rental_records && Array.isArray(vehicle.value.rental_records)) {
    rentalIncome = (vehicle.value.rental_records as Array<{ amount?: number }>).reduce(
      (sum: number, r: { amount?: number }) => sum + (r.amount || 0),
      0,
    )
  }

  return acquisitionCost + maintenanceCost - rentalIncome
})

const estimatedBenefit = computed(() => {
  return sellForm.value.sale_price - totalCost.value
})

// --------------- Load data ---------------
async function loadVehicle(): Promise<void> {
  loading.value = true
  error.value = null

  try {
    const dealer = dealerProfile.value || (await loadDealer())
    if (!dealer) {
      error.value = t('dashboard.vehicles.notFound')
      return
    }

    const { data, error: err } = await supabase
      .from('vehicles')
      .select(
        'id, brand, model, year, price, acquisition_cost, status, dealer_id, maintenance_records, rental_records',
      )
      .eq('id', vehicleId)
      .eq('dealer_id', dealer.id)
      .single()

    if (err || !data) {
      error.value = t('dashboard.vehicles.notFound')
      return
    }

    vehicle.value = data as never as VehicleData
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : t('common.error')
  } finally {
    loading.value = false
  }
}

onMounted(loadVehicle)

// --------------- Rent submission ---------------
async function submitRental(): Promise<void> {
  if (!vehicle.value) return

  if (!rentForm.value.from_date || !rentForm.value.to_date) {
    error.value = t('dashboard.transaction.rent.dateRequired')
    return
  }
  if (!rentForm.value.client_name) {
    error.value = t('dashboard.transaction.rent.clientRequired')
    return
  }
  if (rentForm.value.amount <= 0) {
    error.value = t('dashboard.transaction.rent.amountRequired')
    return
  }

  submitting.value = true
  error.value = null
  successMessage.value = null

  try {
    // 1. Build updated rental_records JSON array
    const existingRecords = Array.isArray(vehicle.value.rental_records)
      ? (vehicle.value.rental_records as Array<Record<string, unknown>>)
      : []

    const newRecord = {
      from_date: rentForm.value.from_date,
      to_date: rentForm.value.to_date,
      client_name: rentForm.value.client_name,
      client_contact: rentForm.value.client_contact,
      amount: rentForm.value.amount,
      invoice_url: rentForm.value.invoice_url || null,
      notes: rentForm.value.notes || null,
      created_at: new Date().toISOString(),
    }

    const updatedRecords = [...existingRecords, newRecord]

    // 2. Insert into balance table
    const { error: balanceErr } = await supabase.from('balance').insert({
      vehicle_id: vehicle.value.id,
      tipo: 'ingreso' as never,
      razon: 'alquiler' as never,
      importe: rentForm.value.amount,
      fecha: rentForm.value.from_date,
      detalle: `${t('dashboard.transaction.rent.title')}: ${rentForm.value.client_name}`,
      created_by: userId.value,
    } as never)

    if (balanceErr) throw balanceErr

    // 3. Update vehicle: status + rental_records JSON
    const { error: vehicleErr } = await supabase
      .from('vehicles')
      .update({
        status: 'rented' as never,
        rental_records: updatedRecords as never,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', vehicle.value.id)

    if (vehicleErr) throw vehicleErr

    // 4. Success
    successMessage.value = t('dashboard.transaction.rent.success')
    rentForm.value = {
      from_date: '',
      to_date: '',
      client_name: '',
      client_contact: '',
      amount: 0,
      invoice_url: '',
      notes: '',
    }

    // Reload vehicle to reflect changes
    await loadVehicle()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : t('common.error')
  } finally {
    submitting.value = false
  }
}

// --------------- Sell submission ---------------
async function submitSale(): Promise<void> {
  if (!vehicle.value) return

  if (!sellForm.value.sale_date) {
    error.value = t('dashboard.transaction.sell.dateRequired')
    return
  }
  if (!sellForm.value.buyer_name) {
    error.value = t('dashboard.transaction.sell.buyerRequired')
    return
  }
  if (sellForm.value.sale_price <= 0) {
    error.value = t('dashboard.transaction.sell.priceRequired')
    return
  }

  submitting.value = true
  error.value = null
  successMessage.value = null

  try {
    // 1. Insert into balance table
    const { error: balanceErr } = await supabase.from('balance').insert({
      vehicle_id: vehicle.value.id,
      tipo: 'ingreso' as never,
      razon: (sellForm.value.exportacion ? 'exportacion' : 'venta') as never,
      importe: sellForm.value.sale_price,
      fecha: sellForm.value.sale_date,
      detalle: `${t('dashboard.transaction.sell.title')}: ${sellForm.value.buyer_name}`,
      created_by: userId.value,
    } as never)

    if (balanceErr) throw balanceErr

    // 2. Update vehicle: status='sold', sold_at=NOW(), sold_price_cents
    const { error: vehicleErr } = await supabase
      .from('vehicles')
      .update({
        status: 'sold' as never,
        sold_at: new Date().toISOString(),
        sold_price_cents: Math.round(sellForm.value.sale_price * 100),
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', vehicle.value.id)

    if (vehicleErr) throw vehicleErr

    // 3. Success + redirect
    successMessage.value = t('dashboard.transaction.sell.success')
    setTimeout(() => {
      router.push('/dashboard/vehiculos')
    }, 2000)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : t('common.error')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="transaction-page">
    <!-- Header -->
    <header class="page-header">
      <NuxtLink :to="`/dashboard/vehiculos/${vehicleId}`" class="back-link">
        {{ t('common.back') }}
      </NuxtLink>
      <h1>{{ t('dashboard.transaction.title') }}</h1>
      <p v-if="vehicleTitle" class="vehicle-name">{{ vehicleTitle }}</p>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>{{ t('common.loading') }}...</span>
    </div>

    <!-- Error when vehicle not found -->
    <div v-else-if="!vehicle" class="alert-error">
      {{ error || t('dashboard.vehicles.notFound') }}
    </div>

    <!-- Main content -->
    <div v-else class="transaction-content">
      <!-- Alerts -->
      <div v-if="error" class="alert-error">{{ error }}</div>
      <div v-if="successMessage" class="alert-success">{{ successMessage }}</div>

      <!-- Tab switcher -->
      <div class="tab-switcher">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'rent' }"
          @click="activeTab = 'rent'"
        >
          {{ t('dashboard.transaction.tabs.rent') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'sell' }"
          @click="activeTab = 'sell'"
        >
          {{ t('dashboard.transaction.tabs.sell') }}
        </button>
      </div>

      <!-- Rent Tab -->
      <form v-if="activeTab === 'rent'" class="transaction-form" @submit.prevent="submitRental">
        <section class="form-section">
          <h2>{{ t('dashboard.transaction.rent.title') }}</h2>

          <div class="form-grid">
            <div class="form-group">
              <label for="rent-from">{{ t('dashboard.transaction.rent.fromDate') }} *</label>
              <input id="rent-from" v-model="rentForm.from_date" type="date" required >
            </div>
            <div class="form-group">
              <label for="rent-to">{{ t('dashboard.transaction.rent.toDate') }} *</label>
              <input id="rent-to" v-model="rentForm.to_date" type="date" required >
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label for="rent-client">{{ t('dashboard.transaction.rent.clientName') }} *</label>
              <input id="rent-client" v-model="rentForm.client_name" type="text" required >
            </div>
            <div class="form-group">
              <label for="rent-contact">{{ t('dashboard.transaction.rent.clientContact') }}</label>
              <input id="rent-contact" v-model="rentForm.client_contact" type="text" >
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label for="rent-amount">{{ t('dashboard.transaction.rent.amount') }} *</label>
              <div class="input-with-suffix">
                <input
                  id="rent-amount"
                  v-model.number="rentForm.amount"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                >
                <span class="input-suffix">EUR</span>
              </div>
            </div>
            <div class="form-group">
              <label for="rent-invoice">{{ t('dashboard.transaction.invoiceUrl') }}</label>
              <input
                id="rent-invoice"
                v-model="rentForm.invoice_url"
                type="url"
                :placeholder="t('dashboard.transaction.invoiceUrlPlaceholder')"
              >
            </div>
          </div>

          <div class="form-group">
            <label for="rent-notes">{{ t('dashboard.transaction.notes') }}</label>
            <textarea
              id="rent-notes"
              v-model="rentForm.notes"
              rows="3"
              :placeholder="t('dashboard.transaction.notesPlaceholder')"
            />
          </div>
        </section>

        <div class="form-actions">
          <NuxtLink :to="`/dashboard/vehiculos/${vehicleId}`" class="btn-secondary">
            {{ t('common.cancel') }}
          </NuxtLink>
          <button type="submit" class="btn-primary" :disabled="submitting">
            {{ submitting ? t('common.loading') : t('dashboard.transaction.rent.submit') }}
          </button>
        </div>
      </form>

      <!-- Sell Tab -->
      <form v-if="activeTab === 'sell'" class="transaction-form" @submit.prevent="submitSale">
        <section class="form-section">
          <h2>{{ t('dashboard.transaction.sell.title') }}</h2>

          <!-- Warning banner -->
          <div class="warning-banner">
            {{ t('dashboard.transaction.sell.warning') }}
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label for="sell-date">{{ t('dashboard.transaction.sell.saleDate') }} *</label>
              <input id="sell-date" v-model="sellForm.sale_date" type="date" required >
            </div>
            <div class="form-group">
              <label for="sell-price">{{ t('dashboard.transaction.sell.salePrice') }} *</label>
              <div class="input-with-suffix">
                <input
                  id="sell-price"
                  v-model.number="sellForm.sale_price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                >
                <span class="input-suffix">EUR</span>
              </div>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label for="sell-buyer">{{ t('dashboard.transaction.sell.buyerName') }} *</label>
              <input id="sell-buyer" v-model="sellForm.buyer_name" type="text" required >
            </div>
            <div class="form-group">
              <label for="sell-contact">{{ t('dashboard.transaction.sell.buyerContact') }}</label>
              <input id="sell-contact" v-model="sellForm.buyer_contact" type="text" >
            </div>
          </div>

          <div class="form-group">
            <label for="sell-invoice">{{ t('dashboard.transaction.invoiceUrl') }}</label>
            <input
              id="sell-invoice"
              v-model="sellForm.invoice_url"
              type="url"
              :placeholder="t('dashboard.transaction.invoiceUrlPlaceholder')"
            >
          </div>

          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input v-model="sellForm.exportacion" type="checkbox" >
              <span>{{ t('dashboard.transaction.sell.exportSale') }}</span>
            </label>
          </div>

          <!-- Benefit estimate -->
          <div v-if="sellForm.sale_price > 0" class="benefit-summary">
            <div class="benefit-row">
              <span>{{ t('dashboard.transaction.sell.salePrice') }}</span>
              <span class="benefit-value positive"
                >{{ sellForm.sale_price.toLocaleString() }} EUR</span
              >
            </div>
            <div class="benefit-row">
              <span>{{ t('dashboard.transaction.sell.totalCost') }}</span>
              <span class="benefit-value">{{ totalCost.toLocaleString() }} EUR</span>
            </div>
            <div class="benefit-row benefit-total">
              <span>{{ t('dashboard.transaction.sell.estimatedBenefit') }}</span>
              <span class="benefit-value" :class="estimatedBenefit >= 0 ? 'positive' : 'negative'">
                {{ estimatedBenefit.toLocaleString() }} EUR
              </span>
            </div>
          </div>
        </section>

        <div class="form-actions">
          <NuxtLink :to="`/dashboard/vehiculos/${vehicleId}`" class="btn-secondary">
            {{ t('common.cancel') }}
          </NuxtLink>
          <button type="submit" class="btn-danger" :disabled="submitting">
            {{ submitting ? t('common.loading') : t('dashboard.transaction.sell.submit') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.transaction-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.back-link {
  color: var(--color-primary, #23424a);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.vehicle-name {
  margin: 0;
  font-size: 1rem;
  color: #64748b;
  font-weight: 500;
}

/* Loading */
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

/* Alerts */
.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
}

.alert-success {
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  color: #16a34a;
}

/* Tab switcher */
.tab-switcher {
  display: flex;
  gap: 0;
  background: #f1f5f9;
  border-radius: 10px;
  padding: 4px;
}

.tab-btn {
  flex: 1;
  min-height: 44px;
  padding: 10px 16px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: white;
  color: var(--color-primary, #23424a);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Form */
.transaction-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.transaction-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  min-height: 44px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

/* Input with suffix (EUR) */
.input-with-suffix {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-suffix input {
  padding-right: 52px;
}

.input-suffix {
  position: absolute;
  right: 14px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #94a3b8;
  pointer-events: none;
}

/* Checkbox */
.checkbox-group {
  flex-direction: row;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  min-height: 44px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #1e293b;
}

.checkbox-label input[type='checkbox'] {
  width: 20px;
  height: 20px;
  min-height: auto;
  accent-color: var(--color-primary, #23424a);
  cursor: pointer;
}

/* Warning banner */
.warning-banner {
  padding: 14px 16px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  color: #92400e;
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.5;
}

/* Benefit summary */
.benefit-summary {
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.benefit-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #475569;
}

.benefit-total {
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
  font-weight: 700;
  font-size: 1rem;
  color: #1e293b;
}

.benefit-value {
  font-weight: 600;
}

.benefit-value.positive {
  color: #16a34a;
}

.benefit-value.negative {
  color: #dc2626;
}

/* Actions */
.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.95rem;
}

.btn-primary:hover {
  background: #1a3238;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.95rem;
}

.btn-danger:hover {
  background: #b91c1c;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  font-size: 0.95rem;
}

/* Responsive */
@media (min-width: 480px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .transaction-page {
    padding: 24px;
  }
}
</style>
