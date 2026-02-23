<script setup lang="ts">
/**
 * Dealer Contract Generator Page
 * Adapted from admin/utilidades.vue contract generator.
 * Supports arrendamiento (rental) and compraventa (sale) contracts.
 * Plan gate: basic+ required. Free users see upgrade prompt.
 */
import {
  generateRentalContract,
  generateSaleContract,
  printHTML,
  type RentalContractData,
  type SaleContractData,
} from '~/utils/contractGenerator'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const supabase = useSupabaseClient()
const { userId } = useAuth()
const { dealerProfile, loadDealer } = useDealerDashboard()
const { currentPlan, fetchSubscription } = useSubscriptionPlan(userId.value || undefined)

// ---------------------------------------------------------------------------
// Plan Gate
// ---------------------------------------------------------------------------

const hasAccess = computed(() => {
  return (
    currentPlan.value === 'basic' ||
    currentPlan.value === 'premium' ||
    currentPlan.value === 'founding'
  )
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ContractType = 'arrendamiento' | 'compraventa'
type ClientType = 'persona' | 'empresa'
type ContractStatus = 'draft' | 'signed' | 'active' | 'expired' | 'cancelled'
type ActiveTab = 'nuevo' | 'historial'

interface VehicleOption {
  id: string
  label: string
  plate: string
  vehicleType: string
}

interface ContractRow {
  id: string
  dealer_id: string
  contract_type: string
  contract_date: string
  vehicle_id: string | null
  vehicle_plate: string | null
  vehicle_type: string | null
  client_name: string
  client_doc_number: string | null
  client_address: string | null
  terms: Record<string, unknown>
  pdf_url: string | null
  status: string
  created_at: string | null
  updated_at: string | null
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const activeTab = ref<ActiveTab>('nuevo')
function showHistory() {
  activeTab.value = 'historial'
  loadContractHistory()
}
const loading = ref(true)
const saving = ref(false)
const saveError = ref<string | null>(null)
const saveSuccess = ref(false)

// Contract type
const contractType = ref<ContractType>('arrendamiento')
const contractDate = ref(new Date().toISOString().split('T')[0])
const contractLocation = ref('')

// Lessor / Seller data (pre-filled from dealer profile)
const lessorRepresentative = ref('')
const lessorRepresentativeNIF = ref('')
const lessorCompany = ref('')
const lessorCIF = ref('')
const lessorAddress = ref('')

// Lessee / Buyer data
const clientType = ref<ClientType>('persona')
const clientName = ref('')
const clientNIF = ref('')
const clientCompany = ref('')
const clientCIF = ref('')
const clientRepresentative = ref('')
const clientRepresentativeNIF = ref('')
const clientAddress = ref('')

// Vehicle
const contractVehicle = ref('')
const contractVehicleType = ref('vehiculo')
const contractVehiclePlate = ref('')
const contractVehicleResidualValue = ref(13000)

// Rental terms
const contractMonthlyRent = ref(1200)
const contractDeposit = ref(2400)
const contractDuration = ref(8)
const contractDurationUnit = ref<'meses' | 'anos'>('meses')
const contractPaymentDays = ref(10)

// Purchase option
const contractHasPurchaseOption = ref(true)
const contractPurchasePrice = ref(10000)
const contractPurchaseNotice = ref(14)
const contractRentMonthsToDiscount = ref(3)

// Sale terms
const contractSalePrice = ref(0)
const contractSalePaymentMethod = ref('Transferencia bancaria')
const contractSaleDeliveryConditions = ref('')
const contractSaleWarranty = ref('')

// Jurisdiction
const contractJurisdiction = ref('')

// Vehicle options
const vehicleOptions = ref<VehicleOption[]>([])
const loadingVehicles = ref(false)

// History
const contracts = ref<ContractRow[]>([])
const loadingHistory = ref(false)
const historyError = ref<string | null>(null)

// ---------------------------------------------------------------------------
// Vehicle loading
// ---------------------------------------------------------------------------

async function loadVehicleOptions(): Promise<void> {
  const dealer = dealerProfile.value
  if (!dealer) return

  loadingVehicles.value = true
  try {
    const { data } = (await supabase
      .from('vehicles')
      .select('id, brand, model, plate, year, subcategory_id')
      .eq('dealer_id', dealer.id)
      .order('brand')) as never as {
      data:
        | {
            id: string
            brand: string
            model: string
            plate: string
            year: number
            subcategory_id: string
          }[]
        | null
    }

    if (data) {
      vehicleOptions.value = data.map((v) => {
        const labelLower = `${v.brand || ''} ${v.model || ''}`.toLowerCase()
        let detectedType = 'vehiculo'
        if (labelLower.includes('cisterna')) detectedType = 'semirremolque cisterna'
        else if (labelLower.includes('semirremolque') || labelLower.includes('semi'))
          detectedType = 'semirremolque'
        else if (labelLower.includes('trailer')) detectedType = 'trailer'
        else if (labelLower.includes('tractora') || labelLower.includes('cabeza'))
          detectedType = 'cabeza tractora'
        else if (labelLower.includes('camion') || labelLower.includes('camión'))
          detectedType = 'camion'
        else if (labelLower.includes('furgon') || labelLower.includes('furgón'))
          detectedType = 'furgon'

        return {
          id: v.id,
          label: `${v.brand || ''} ${v.model || ''} (${v.plate || ''}) - ${v.year || ''}`.trim(),
          plate: v.plate || '',
          vehicleType: detectedType,
        }
      })
    }
  } finally {
    loadingVehicles.value = false
  }
}

function onContractVehicleSelected(): void {
  const vehicleId = contractVehicle.value
  if (!vehicleId) return

  const vehicle = vehicleOptions.value.find((v) => v.id === vehicleId)
  if (vehicle) {
    contractVehiclePlate.value = vehicle.plate
    contractVehicleType.value = vehicle.vehicleType
  }
}

// ---------------------------------------------------------------------------
// Pre-fill from dealer profile
// ---------------------------------------------------------------------------

function prefillFromDealer(): void {
  const dealer = dealerProfile.value
  if (!dealer) return

  // The raw data from select('*') contains all columns
  const raw = dealer as Record<string, unknown>

  lessorCompany.value =
    typeof raw.legal_name === 'string' && raw.legal_name
      ? raw.legal_name
      : typeof raw.company_name === 'string'
        ? raw.company_name
        : raw.company_name &&
            typeof raw.company_name === 'object' &&
            'es' in (raw.company_name as Record<string, string>)
          ? (raw.company_name as Record<string, string>).es
          : ''

  lessorCIF.value = typeof raw.cif_nif === 'string' ? raw.cif_nif : ''

  // Location data
  if (raw.location_data && typeof raw.location_data === 'object') {
    const loc = raw.location_data as Record<string, string>
    lessorAddress.value = loc.es || loc.en || ''
    if (!contractLocation.value) {
      contractLocation.value = loc.es || loc.en || ''
    }
    if (!contractJurisdiction.value) {
      contractJurisdiction.value = loc.es || loc.en || ''
    }
  } else if (typeof raw.location === 'string') {
    lessorAddress.value = raw.location
    if (!contractLocation.value) contractLocation.value = raw.location
    if (!contractJurisdiction.value) contractJurisdiction.value = raw.location
  }
}

// ---------------------------------------------------------------------------
// Generate contract and save to DB
// ---------------------------------------------------------------------------

async function generateContract(): Promise<void> {
  let html = ''

  if (contractType.value === 'arrendamiento') {
    const rentalData: RentalContractData = {
      contractDate: contractDate.value,
      contractLocation: contractLocation.value,
      contractVehicleType: contractVehicleType.value,
      contractVehiclePlate: contractVehiclePlate.value,
      lessorRepresentative: lessorRepresentative.value,
      lessorRepresentativeNIF: lessorRepresentativeNIF.value,
      lessorCompany: lessorCompany.value,
      lessorCIF: lessorCIF.value,
      lessorAddress: lessorAddress.value,
      clientType: clientType.value,
      clientName: clientName.value,
      clientNIF: clientNIF.value,
      clientCompany: clientCompany.value,
      clientCIF: clientCIF.value,
      clientRepresentative: clientRepresentative.value,
      clientRepresentativeNIF: clientRepresentativeNIF.value,
      clientAddress: clientAddress.value,
      contractMonthlyRent: contractMonthlyRent.value,
      contractDeposit: contractDeposit.value,
      contractDuration: contractDuration.value,
      contractDurationUnit: contractDurationUnit.value,
      contractPaymentDays: contractPaymentDays.value,
      contractVehicleResidualValue: contractVehicleResidualValue.value,
      contractJurisdiction: contractJurisdiction.value,
      contractHasPurchaseOption: contractHasPurchaseOption.value,
      contractPurchasePrice: contractPurchasePrice.value,
      contractPurchaseNotice: contractPurchaseNotice.value,
      contractRentMonthsToDiscount: contractRentMonthsToDiscount.value,
    }
    html = generateRentalContract(rentalData)
  } else {
    const saleData: SaleContractData = {
      contractDate: contractDate.value,
      contractLocation: contractLocation.value,
      contractVehicleType: contractVehicleType.value,
      contractVehiclePlate: contractVehiclePlate.value,
      lessorRepresentative: lessorRepresentative.value,
      lessorRepresentativeNIF: lessorRepresentativeNIF.value,
      lessorCompany: lessorCompany.value,
      lessorCIF: lessorCIF.value,
      lessorAddress: lessorAddress.value,
      clientType: clientType.value,
      clientName: clientName.value,
      clientNIF: clientNIF.value,
      clientCompany: clientCompany.value,
      clientCIF: clientCIF.value,
      clientRepresentative: clientRepresentative.value,
      clientRepresentativeNIF: clientRepresentativeNIF.value,
      clientAddress: clientAddress.value,
      contractSalePrice: contractSalePrice.value,
      contractSalePaymentMethod: contractSalePaymentMethod.value,
      contractSaleDeliveryConditions: contractSaleDeliveryConditions.value,
      contractSaleWarranty: contractSaleWarranty.value,
      contractJurisdiction: contractJurisdiction.value,
    }
    html = generateSaleContract(saleData)
  }

  // Print
  printHTML(html)

  // Save to DB
  const dealer = dealerProfile.value
  if (!dealer) return

  saving.value = true
  saveError.value = null
  saveSuccess.value = false

  try {
    const clientDisplayName =
      clientType.value === 'persona' ? clientName.value : clientCompany.value

    const clientDocNum = clientType.value === 'persona' ? clientNIF.value : clientCIF.value

    const terms: Record<string, unknown> = {
      clientType: clientType.value,
      lessorRepresentative: lessorRepresentative.value,
      lessorCompany: lessorCompany.value,
      lessorCIF: lessorCIF.value,
      lessorAddress: lessorAddress.value,
      jurisdiction: contractJurisdiction.value,
      location: contractLocation.value,
    }

    if (contractType.value === 'arrendamiento') {
      terms.monthlyRent = contractMonthlyRent.value
      terms.deposit = contractDeposit.value
      terms.duration = contractDuration.value
      terms.durationUnit = contractDurationUnit.value
      terms.paymentDays = contractPaymentDays.value
      terms.residualValue = contractVehicleResidualValue.value
      terms.hasPurchaseOption = contractHasPurchaseOption.value
      if (contractHasPurchaseOption.value) {
        terms.purchasePrice = contractPurchasePrice.value
        terms.purchaseNotice = contractPurchaseNotice.value
        terms.rentMonthsToDiscount = contractRentMonthsToDiscount.value
      }
    } else {
      terms.salePrice = contractSalePrice.value
      terms.paymentMethod = contractSalePaymentMethod.value
      terms.deliveryConditions = contractSaleDeliveryConditions.value
      terms.warranty = contractSaleWarranty.value
    }

    if (clientType.value === 'empresa') {
      terms.clientRepresentative = clientRepresentative.value
      terms.clientRepresentativeNIF = clientRepresentativeNIF.value
      terms.clientCompany = clientCompany.value
      terms.clientCIF = clientCIF.value
    }

    const insertData = {
      dealer_id: dealer.id,
      contract_type: contractType.value,
      contract_date: contractDate.value,
      vehicle_id: contractVehicle.value || null,
      vehicle_plate: contractVehiclePlate.value || null,
      vehicle_type: contractVehicleType.value || null,
      client_name: clientDisplayName,
      client_doc_number: clientDocNum || null,
      client_address: clientAddress.value || null,
      terms,
      status: 'draft' as const,
    }

    const { error: err } = (await supabase
      .from('dealer_contracts')
      .insert(insertData)) as never as { error: { message: string } | null }

    if (err) throw new Error(err.message)

    saveSuccess.value = true
    setTimeout(() => {
      saveSuccess.value = false
    }, 4000)

    // Refresh history
    await loadContractHistory()
  } catch (err: unknown) {
    saveError.value = err instanceof Error ? err.message : t('dashboard.tools.contract.saveError')
  } finally {
    saving.value = false
  }
}

// ---------------------------------------------------------------------------
// Contract History
// ---------------------------------------------------------------------------

async function loadContractHistory(): Promise<void> {
  const dealer = dealerProfile.value
  if (!dealer) return

  loadingHistory.value = true
  historyError.value = null

  try {
    const { data, error: err } = (await supabase
      .from('dealer_contracts')
      .select('*')
      .eq('dealer_id', dealer.id)
      .order('created_at', { ascending: false })) as never as {
      data: ContractRow[] | null
      error: { message: string } | null
    }

    if (err) throw new Error(err.message)
    contracts.value = data ?? []
  } catch (err: unknown) {
    historyError.value =
      err instanceof Error ? err.message : t('dashboard.tools.contract.historyError')
  } finally {
    loadingHistory.value = false
  }
}

async function updateContractStatus(contractId: string, newStatus: ContractStatus): Promise<void> {
  try {
    const { error: err } = (await supabase
      .from('dealer_contracts')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', contractId)) as never as { error: { message: string } | null }

    if (err) throw new Error(err.message)
    await loadContractHistory()
  } catch (err: unknown) {
    historyError.value = err instanceof Error ? err.message : 'Error updating status'
  }
}

// ---------------------------------------------------------------------------
// Reset form
// ---------------------------------------------------------------------------

function resetForm(): void {
  contractType.value = 'arrendamiento'
  contractDate.value = new Date().toISOString().split('T')[0]
  contractVehicle.value = ''
  contractVehiclePlate.value = ''
  contractVehicleType.value = 'vehiculo'
  clientType.value = 'persona'
  clientName.value = ''
  clientNIF.value = ''
  clientCompany.value = ''
  clientCIF.value = ''
  clientRepresentative.value = ''
  clientRepresentativeNIF.value = ''
  clientAddress.value = ''
  contractMonthlyRent.value = 1200
  contractDeposit.value = 2400
  contractDuration.value = 8
  contractDurationUnit.value = 'meses'
  contractPaymentDays.value = 10
  contractHasPurchaseOption.value = true
  contractPurchasePrice.value = 10000
  contractPurchaseNotice.value = 14
  contractRentMonthsToDiscount.value = 3
  contractSalePrice.value = 0
  contractSalePaymentMethod.value = 'Transferencia bancaria'
  contractSaleDeliveryConditions.value = ''
  contractSaleWarranty.value = ''
  contractVehicleResidualValue.value = 13000
  saveError.value = null
  saveSuccess.value = false
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

async function init(): Promise<void> {
  loading.value = true
  const dealer = dealerProfile.value || (await loadDealer())
  await fetchSubscription()

  if (dealer && hasAccess.value) {
    prefillFromDealer()
    await Promise.all([loadVehicleOptions(), loadContractHistory()])
  }
  loading.value = false
}

onMounted(init)
</script>

<template>
  <div class="contract-page">
    <!-- Plan Gate: Upgrade prompt for free users -->
    <template v-if="!loading && !hasAccess">
      <header class="page-header">
        <h1>{{ t('dashboard.tools.contract.title') }}</h1>
        <span class="plan-badge">{{ t(`dashboard.plans.${currentPlan}`) }}</span>
      </header>
      <div class="upgrade-card">
        <div class="upgrade-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <h2>{{ t('dashboard.tools.contract.upgradeTitle') }}</h2>
        <p>{{ t('dashboard.tools.contract.upgradeDesc') }}</p>
        <NuxtLink to="/dashboard/suscripcion" class="btn btn-primary btn-lg">
          {{ t('dashboard.tools.contract.upgradeCTA') }}
        </NuxtLink>
      </div>
    </template>

    <!-- Loading -->
    <template v-else-if="loading">
      <div class="loading-state">
        <div class="spinner" />
        <p>{{ t('dashboard.tools.contract.loading') }}</p>
      </div>
    </template>

    <!-- Main content -->
    <template v-else>
      <header class="page-header">
        <div class="header-left">
          <h1>{{ t('dashboard.tools.contract.title') }}</h1>
          <p class="subtitle">{{ t('dashboard.tools.contract.subtitle') }}</p>
        </div>
      </header>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" :class="{ active: activeTab === 'nuevo' }" @click="activeTab = 'nuevo'">
          {{ t('dashboard.tools.contract.tabNew') }}
        </button>
        <button class="tab" :class="{ active: activeTab === 'historial' }" @click="showHistory()">
          {{ t('dashboard.tools.contract.tabHistory') }}
          <span v-if="contracts.length" class="tab-count">{{ contracts.length }}</span>
        </button>
      </div>

      <!-- ==================== NEW CONTRACT ==================== -->
      <div v-if="activeTab === 'nuevo'" class="tool-content">
        <div class="tool-header">
          <h2>{{ t('dashboard.tools.contract.newContract') }}</h2>
          <button class="btn btn-secondary btn-sm" @click="resetForm">
            {{ t('dashboard.tools.contract.reset') }}
          </button>
        </div>

        <div class="contract-form">
          <!-- Contract Type Selector -->
          <div class="form-row">
            <div class="form-group" style="flex: 2">
              <label>{{ t('dashboard.tools.contract.contractType') }}</label>
              <div class="radio-group-inline">
                <label class="radio-card" :class="{ active: contractType === 'arrendamiento' }">
                  <input v-model="contractType" type="radio" value="arrendamiento" >
                  <span class="radio-icon-svg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="17 1 21 5 17 9" />
                      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                      <polyline points="7 23 3 19 7 15" />
                      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                    </svg>
                  </span>
                  <span class="radio-label">{{ t('dashboard.tools.contract.typeRental') }}</span>
                </label>
                <label class="radio-card" :class="{ active: contractType === 'compraventa' }">
                  <input v-model="contractType" type="radio" value="compraventa" >
                  <span class="radio-icon-svg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </span>
                  <span class="radio-label">{{ t('dashboard.tools.contract.typeSale') }}</span>
                </label>
              </div>
            </div>
            <div class="form-group">
              <label>{{ t('dashboard.tools.contract.date') }}</label>
              <input v-model="contractDate" type="date" >
            </div>
            <div class="form-group">
              <label>{{ t('dashboard.tools.contract.location') }}</label>
              <input v-model="contractLocation" type="text" >
            </div>
          </div>

          <!-- Vehicle Selection -->
          <ContratoVehiculo
            v-model:contract-vehicle="contractVehicle"
            v-model:contract-vehicle-type="contractVehicleType"
            v-model:contract-vehicle-plate="contractVehiclePlate"
            :vehicle-options="vehicleOptions"
            :loading-vehicles="loadingVehicles"
            @vehicle-selected="onContractVehicleSelected"
          />

          <hr class="divider" >

          <!-- Parties (Lessor/Seller and Client/Buyer) -->
          <ContratoPartes
            v-model:lessor-representative="lessorRepresentative"
            v-model:lessor-representative-n-i-f="lessorRepresentativeNIF"
            v-model:lessor-company="lessorCompany"
            v-model:lessor-c-i-f="lessorCIF"
            v-model:lessor-address="lessorAddress"
            v-model:client-type="clientType"
            v-model:client-name="clientName"
            v-model:client-n-i-f="clientNIF"
            v-model:client-company="clientCompany"
            v-model:client-c-i-f="clientCIF"
            v-model:client-representative="clientRepresentative"
            v-model:client-representative-n-i-f="clientRepresentativeNIF"
            v-model:client-address="clientAddress"
            :contract-type="contractType"
          />

          <hr class="divider" >

          <!-- Rental Terms -->
          <ContratoTerminosArrendamiento
            v-if="contractType === 'arrendamiento'"
            v-model:monthly-rent="contractMonthlyRent"
            v-model:deposit="contractDeposit"
            v-model:payment-days="contractPaymentDays"
            v-model:duration="contractDuration"
            v-model:duration-unit="contractDurationUnit"
            v-model:residual-value="contractVehicleResidualValue"
            v-model:has-purchase-option="contractHasPurchaseOption"
            v-model:purchase-price="contractPurchasePrice"
            v-model:purchase-notice="contractPurchaseNotice"
            v-model:rent-months-to-discount="contractRentMonthsToDiscount"
          />

          <!-- Sale Terms -->
          <ContratoTerminosCompraventa
            v-if="contractType === 'compraventa'"
            v-model:sale-price="contractSalePrice"
            v-model:payment-method="contractSalePaymentMethod"
            v-model:delivery-conditions="contractSaleDeliveryConditions"
            v-model:warranty="contractSaleWarranty"
          />

          <hr class="divider" >

          <!-- Jurisdiction -->
          <div class="form-row">
            <div class="form-group" style="max-width: 300px">
              <label>{{ t('dashboard.tools.contract.jurisdiction') }}</label>
              <input v-model="contractJurisdiction" type="text" >
            </div>
          </div>

          <!-- Feedback -->
          <div v-if="saveError" class="alert alert-error">{{ saveError }}</div>
          <div v-if="saveSuccess" class="alert alert-success">
            {{ t('dashboard.tools.contract.saved') }}
          </div>

          <!-- Generate Button -->
          <div class="form-actions">
            <button class="btn btn-primary btn-lg" :disabled="saving" @click="generateContract">
              <svg
                v-if="!saving"
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span v-if="saving" class="spinner-sm" />
              {{
                saving
                  ? t('dashboard.tools.contract.generating')
                  : t('dashboard.tools.contract.generate')
              }}
            </button>
          </div>
        </div>
      </div>

      <!-- ==================== HISTORY ==================== -->
      <ContratoHistorial
        v-if="activeTab === 'historial'"
        :contracts="contracts"
        :loading="loadingHistory"
        :error="historyError"
        @update-status="updateContractStatus"
        @create-new="activeTab = 'nuevo'"
      />
    </template>
  </div>
</template>

<style scoped>
.contract-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 16px;
}

/* Header */
.page-header {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.header-left {
  flex: 1;
}

.page-header h1 {
  margin: 0 0 4px;
  font-size: 1.5rem;
}

.subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.plan-badge {
  background: #e5e7eb;
  color: #374151;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

/* Upgrade Card */
.upgrade-card {
  background: #fff;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 48px 32px;
  text-align: center;
  max-width: 500px;
  margin: 32px auto;
}

.upgrade-icon {
  color: #23424a;
  margin-bottom: 16px;
}

.upgrade-card h2 {
  margin: 0 0 8px;
  font-size: 1.25rem;
}

.upgrade-card p {
  margin: 0 0 24px;
  color: #6b7280;
  font-size: 0.9rem;
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 16px;
  gap: 16px;
}

.loading-state.compact {
  padding: 32px 16px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #23424a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-sm {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0;
  margin-bottom: 24px;
  border-bottom: 2px solid #e5e7eb;
}

.tab {
  padding: 12px 24px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
}

.tab:hover {
  color: #23424a;
}

.tab.active {
  color: #23424a;
  border-bottom-color: #23424a;
}

.tab-count {
  background: #23424a;
  color: #fff;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

/* Tool Content */
.tool-content {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.tool-header {
  padding: 16px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.tool-header h2 {
  margin: 0;
  font-size: 1.1rem;
}

.history-count {
  font-size: 0.85rem;
  color: #6b7280;
}

/* Contract Form */
.contract-form {
  padding: 20px;
}

.form-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 120px;
}

.form-group label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group select {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  min-height: 44px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #23424a;
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
}

.divider {
  border: none;
  border-top: 2px solid #0f2a2e;
  margin: 20px 0;
}

/* Radio cards */
.radio-group-inline {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.radio-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  min-width: 180px;
  min-height: 44px;
}

.radio-card:hover {
  border-color: #23424a;
}

.radio-card.active {
  border-color: #23424a;
  background: #f0f9ff;
}

.radio-card input {
  display: none;
}

.radio-icon-svg {
  flex-shrink: 0;
  color: #23424a;
}

.radio-label {
  font-weight: 500;
  font-size: 0.95rem;
}

/* Alerts */
.alert {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 16px;
}

.alert-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.alert-success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
}

.btn:hover {
  background: #f9fafb;
}

.btn-primary {
  background: #23424a;
  color: #fff;
  border: none;
}

.btn-primary:hover {
  background: #1a3238;
}

.btn-secondary {
  background: #6b7280;
  color: #fff;
  border: none;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-sm {
  padding: 6px 14px;
  font-size: 0.8rem;
  min-height: 36px;
}

.btn-lg {
  padding: 14px 28px;
  font-size: 1rem;
  font-weight: 500;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
}

/* ========================= Mobile-first responsive ========================= */
@media (max-width: 768px) {
  .contract-page {
    padding: 12px;
  }

  .page-header h1 {
    font-size: 1.25rem;
  }

  .form-row {
    flex-direction: column;
    gap: 12px;
  }

  .radio-group-inline {
    flex-direction: column;
  }

  .radio-card {
    min-width: 100%;
  }

  .form-actions {
    justify-content: stretch;
  }

  .form-actions .btn {
    width: 100%;
  }

  .tabs {
    gap: 0;
  }

  .tab {
    flex: 1;
    justify-content: center;
    padding: 12px 16px;
    font-size: 0.85rem;
  }

  .upgrade-card {
    padding: 32px 20px;
  }
}
</style>
