<script setup lang="ts">
/**
 * Quote/Budget Generator (Free plan)
 * Generates professional PDF quotes with dealer branding, vehicle info,
 * optional services, and saves to dealer_quotes table.
 */
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const supabase = useSupabaseClient()
const { dealerProfile, loadDealer } = useDealerDashboard()

interface DealerVehicleOption {
  id: string
  brand: string
  model: string
  year: number | null
  price: number | null
  slug: string | null
  vehicle_images: { url: string; position: number }[]
}

interface OptionalService {
  key: string
  labelKey: string
  enabled: boolean
  amount: number
  isQuoteOnly: boolean
}

const loading = ref(false)
const saving = ref(false)
const generatingPdf = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const vehicles = ref<DealerVehicleOption[]>([])
const searchQuery = ref('')
const showDropdown = ref(false)

// Form state
const selectedVehicle = ref<DealerVehicleOption | null>(null)
const clientName = ref('')
const paymentConditions = ref(t('dashboard.quote.paymentConditionsDefault'))
const validityDays = ref(15)
const quoteNumber = ref('')

const optionalServices = ref<OptionalService[]>([
  {
    key: 'transport',
    labelKey: 'dashboard.quote.transport',
    enabled: false,
    amount: 600,
    isQuoteOnly: false,
  },
  {
    key: 'transfer',
    labelKey: 'dashboard.quote.transfer',
    enabled: false,
    amount: 250,
    isQuoteOnly: false,
  },
  {
    key: 'inspection',
    labelKey: 'dashboard.quote.inspection',
    enabled: false,
    amount: 300,
    isQuoteOnly: false,
  },
  {
    key: 'insurance',
    labelKey: 'dashboard.quote.insurance',
    enabled: false,
    amount: 0,
    isQuoteOnly: true,
  },
])

// Computed
const vehiclePrice = computed(() => selectedVehicle.value?.price ?? 0)

const selectedServicesTotal = computed(() =>
  optionalServices.value
    .filter((s) => s.enabled && !s.isQuoteOnly)
    .reduce((sum, s) => sum + s.amount, 0),
)

const totalAmount = computed(() => vehiclePrice.value + selectedServicesTotal.value)

const filteredVehicles = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return vehicles.value
  return vehicles.value.filter(
    (v) =>
      v.brand.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      `${v.brand} ${v.model}`.toLowerCase().includes(q),
  )
})

const vehicleThumbnail = computed(() => {
  if (!selectedVehicle.value?.vehicle_images?.length) return null
  const sorted = [...selectedVehicle.value.vehicle_images].sort((a, b) => a.position - b.position)
  return sorted[0]?.url ?? null
})

const vehicleTitle = computed(() => {
  if (!selectedVehicle.value) return ''
  const v = selectedVehicle.value
  const parts = [v.brand, v.model]
  if (v.year) parts.push(`(${v.year})`)
  return parts.join(' ')
})

// Load vehicles and generate quote number
async function init(): Promise<void> {
  loading.value = true
  error.value = null

  try {
    const dealer = dealerProfile.value || (await loadDealer())
    if (!dealer) {
      error.value = 'Dealer profile not found'
      return
    }

    // Load published vehicles
    const { data, error: err } = (await supabase
      .from('vehicles')
      .select('id, brand, model, year, price, slug, vehicle_images(url, position)')
      .eq('dealer_id', dealer.id)
      .eq('status', 'published')
      .order('brand', { ascending: true })) as never

    if (err) throw err
    vehicles.value = (data || []) as DealerVehicleOption[]

    // Generate quote number: P-YYYY-NNN
    const year = new Date().getFullYear()
    const { count } = (await supabase
      .from('dealer_quotes')
      .select('id', { count: 'exact', head: true })
      .eq('dealer_id', dealer.id)) as never

    const seq = ((count as number | null) || 0) + 1
    quoteNumber.value = `P-${year}-${String(seq).padStart(3, '0')}`
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Error loading data'
  } finally {
    loading.value = false
  }
}

onMounted(init)

function selectVehicle(vehicle: DealerVehicleOption): void {
  selectedVehicle.value = vehicle
  searchQuery.value = `${vehicle.brand} ${vehicle.model}`
  showDropdown.value = false
}

function clearVehicle(): void {
  selectedVehicle.value = null
  searchQuery.value = ''
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(price)
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Generate PDF using printHTML approach
async function generatePdf(): Promise<void> {
  if (!selectedVehicle.value) {
    error.value = t('dashboard.quote.requiredVehicle')
    return
  }
  if (!clientName.value.trim()) {
    error.value = t('dashboard.quote.requiredClient')
    return
  }

  generatingPdf.value = true
  error.value = null

  try {
    const dealer = dealerProfile.value
    if (!dealer) return

    const today = new Date()
    const slug = selectedVehicle.value.slug || selectedVehicle.value.id

    // Build services rows
    const servicesHtml = optionalServices.value
      .map((s) => {
        const checked = s.enabled ? '&#9745;' : '&#9744;'
        const amountText = s.isQuoteOnly
          ? t('dashboard.quote.insuranceQuote')
          : formatPrice(s.amount)
        return `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${checked} ${t(s.labelKey)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">${amountText}</td>
          </tr>
        `
      })
      .join('')

    const logoHtml = dealer.logo_url
      ? `<img src="${dealer.logo_url}" alt="${dealer.company_name || ''}" style="max-height:60px;max-width:200px;object-fit:contain;" />`
      : ''

    const vehicleImgHtml = vehicleThumbnail.value
      ? `<img src="${vehicleThumbnail.value}" alt="${vehicleTitle.value}" style="width:100%;max-width:400px;border-radius:8px;object-fit:cover;aspect-ratio:16/10;" />`
      : ''

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${t('dashboard.quote.pdfTitle')} ${quoteNumber.value}</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family:'Inter','Segoe UI',Arial,sans-serif; color:#1e293b; line-height:1.5; padding:40px; }
          .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; border-bottom:3px solid #23424a; padding-bottom:20px; }
          .header-left h1 { font-size:24px; color:#23424a; margin-bottom:4px; }
          .header-left p { font-size:13px; color:#64748b; }
          .header-right { text-align:right; }
          .header-right p { font-size:13px; color:#64748b; }
          .quote-meta { display:flex; gap:32px; margin-bottom:24px; flex-wrap:wrap; }
          .quote-meta-item { }
          .quote-meta-item .label { font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#94a3b8; font-weight:600; }
          .quote-meta-item .value { font-size:14px; font-weight:600; color:#1e293b; }
          .section { margin-bottom:24px; }
          .section-title { font-size:14px; font-weight:700; color:#23424a; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:12px; border-bottom:1px solid #e2e8f0; padding-bottom:6px; }
          .vehicle-card { display:flex; gap:20px; align-items:flex-start; flex-wrap:wrap; }
          .vehicle-img { flex:0 0 auto; }
          .vehicle-info { flex:1; min-width:200px; }
          .vehicle-info h3 { font-size:18px; color:#1e293b; margin-bottom:4px; }
          .vehicle-price { font-size:22px; font-weight:700; color:#23424a; }
          table { width:100%; border-collapse:collapse; }
          th { text-align:left; padding:8px 12px; background:#f8fafc; border-bottom:2px solid #e2e8f0; font-size:12px; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; }
          .total-row { background:#f0f9ff; }
          .total-row td { font-weight:700; font-size:16px; color:#23424a; padding:12px; }
          .conditions-box { background:#f8fafc; border-radius:8px; padding:16px; margin-bottom:16px; }
          .conditions-box p { font-size:13px; color:#334155; }
          .footer { margin-top:32px; padding-top:16px; border-top:1px solid #e2e8f0; font-size:12px; color:#94a3b8; text-align:center; }
          .qr-placeholder { display:inline-block; padding:8px 16px; background:#f1f5f9; border-radius:6px; font-size:12px; color:#64748b; margin-top:8px; }
          @media print { body { padding:20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            ${logoHtml}
            <h1>${dealer.company_name || ''}</h1>
            <p>${dealer.phone || ''} ${dealer.email ? '| ' + dealer.email : ''}</p>
            ${dealer.website ? `<p>${dealer.website}</p>` : ''}
          </div>
          <div class="header-right">
            <p style="font-size:20px;font-weight:700;color:#23424a;">${t('dashboard.quote.pdfTitle')}</p>
            <p><strong>${quoteNumber.value}</strong></p>
            <p>${t('dashboard.quote.pdfDate')}: ${formatDate(today)}</p>
          </div>
        </div>

        <div class="quote-meta">
          <div class="quote-meta-item">
            <div class="label">${t('dashboard.quote.clientName')}</div>
            <div class="value">${clientName.value}</div>
          </div>
          <div class="quote-meta-item">
            <div class="label">${t('dashboard.quote.validityDays')}</div>
            <div class="value">${validityDays.value} ${t('dashboard.calculator.months').replace('meses', 'dias')}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">${t('dashboard.quote.pdfVehicle')}</div>
          <div class="vehicle-card">
            <div class="vehicle-img">${vehicleImgHtml}</div>
            <div class="vehicle-info">
              <h3>${vehicleTitle.value}</h3>
              <div class="vehicle-price">${formatPrice(vehiclePrice.value)}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">${t('dashboard.quote.optionalServices')}</div>
          <table>
            <thead>
              <tr>
                <th>${t('dashboard.quote.pdfService')}</th>
                <th style="text-align:right;">${t('dashboard.quote.pdfAmount')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;">${t('dashboard.quote.pdfVehicle')}: ${vehicleTitle.value}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">${formatPrice(vehiclePrice.value)}</td>
              </tr>
              ${servicesHtml}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td>${t('dashboard.quote.totalAmount')}</td>
                <td style="text-align:right;">${formatPrice(totalAmount.value)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="section">
          <div class="section-title">${t('dashboard.quote.pdfPayment')}</div>
          <div class="conditions-box">
            <p>${paymentConditions.value}</p>
          </div>
        </div>

        <div class="footer">
          <p>${t('dashboard.quote.pdfValidity', { days: String(validityDays.value) })}</p>
          <div class="qr-placeholder">
            ${t('dashboard.quote.pdfFullListing', { slug })}
          </div>
        </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      // Give time for images to load
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Error generating PDF'
  } finally {
    generatingPdf.value = false
  }
}

// Save quote to dealer_quotes table
async function saveQuote(): Promise<void> {
  if (!selectedVehicle.value) {
    error.value = t('dashboard.quote.requiredVehicle')
    return
  }
  if (!clientName.value.trim()) {
    error.value = t('dashboard.quote.requiredClient')
    return
  }

  saving.value = true
  error.value = null
  successMessage.value = null

  try {
    const dealer = dealerProfile.value
    if (!dealer) return

    const servicesData = optionalServices.value.map((s) => ({
      key: s.key,
      enabled: s.enabled,
      amount: s.amount,
      isQuoteOnly: s.isQuoteOnly,
    }))

    const { error: insertError } = await supabase.from('dealer_quotes').insert({
      dealer_id: dealer.id,
      quote_number: quoteNumber.value,
      quote_date: new Date().toISOString().split('T')[0],
      valid_days: validityDays.value,
      client_name: clientName.value.trim(),
      vehicle_id: selectedVehicle.value.id,
      vehicle_price: vehiclePrice.value,
      optional_services: servicesData,
      payment_conditions: paymentConditions.value,
      status: 'draft',
    } as never)

    if (insertError) throw insertError

    successMessage.value = t('dashboard.quote.saved')

    // Regenerate quote number for next quote
    const year = new Date().getFullYear()
    const { count } = (await supabase
      .from('dealer_quotes')
      .select('id', { count: 'exact', head: true })
      .eq('dealer_id', dealer.id)) as never

    const seq = ((count as number | null) || 0) + 1
    quoteNumber.value = `P-${year}-${String(seq).padStart(3, '0')}`
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Error saving quote'
  } finally {
    saving.value = false
  }
}

function handleSearchFocus(): void {
  showDropdown.value = true
}

function handleSearchBlur(): void {
  // Delay to allow click on dropdown item
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}
</script>

<template>
  <div class="quote-page">
    <header class="page-header">
      <NuxtLink to="/dashboard" class="back-link">
        {{ t('dashboard.quote.backToDashboard') }}
      </NuxtLink>
      <h1>{{ t('dashboard.quote.title') }}</h1>
      <p class="subtitle">{{ t('dashboard.quote.subtitle') }}</p>
    </header>

    <!-- Error / Success -->
    <div v-if="error" class="alert-error">{{ error }}</div>
    <div v-if="successMessage" class="alert-success">{{ successMessage }}</div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
    </div>

    <template v-else>
      <!-- Quote number -->
      <div class="quote-number-bar">
        <span class="quote-number-label">{{ t('dashboard.quote.quoteNumber') }}:</span>
        <span class="quote-number-value">{{ quoteNumber }}</span>
      </div>

      <!-- Vehicle selector -->
      <section class="form-section">
        <h2>{{ t('dashboard.quote.selectVehicle') }}</h2>

        <div class="vehicle-search-wrapper">
          <input
            v-model="searchQuery"
            type="text"
            class="input-field"
            :placeholder="t('dashboard.quote.selectVehiclePlaceholder')"
            @focus="handleSearchFocus"
            @blur="handleSearchBlur"
          >
          <button v-if="selectedVehicle" type="button" class="clear-btn" @click="clearVehicle">
            &#10005;
          </button>

          <div v-if="showDropdown && filteredVehicles.length > 0" class="vehicle-dropdown">
            <button
              v-for="v in filteredVehicles"
              :key="v.id"
              type="button"
              class="vehicle-dropdown-item"
              @mousedown.prevent="selectVehicle(v)"
            >
              <span class="vd-name">{{ v.brand }} {{ v.model }}</span>
              <span v-if="v.year" class="vd-year">({{ v.year }})</span>
              <span v-if="v.price" class="vd-price">{{ formatPrice(v.price) }}</span>
            </button>
          </div>
          <div v-if="showDropdown && filteredVehicles.length === 0" class="vehicle-dropdown">
            <div class="vd-empty">{{ t('dashboard.quote.noVehicles') }}</div>
          </div>
        </div>

        <!-- Selected vehicle card -->
        <div v-if="selectedVehicle" class="selected-vehicle-card">
          <img
            v-if="vehicleThumbnail"
            :src="vehicleThumbnail"
            :alt="vehicleTitle"
            class="selected-vehicle-img"
          >
          <div class="selected-vehicle-info">
            <span class="sv-title">{{ vehicleTitle }}</span>
            <span class="sv-price">{{ formatPrice(vehiclePrice) }}</span>
          </div>
        </div>
      </section>

      <!-- Client name -->
      <section class="form-section">
        <h2>{{ t('dashboard.quote.clientName') }}</h2>
        <input
          v-model="clientName"
          type="text"
          class="input-field"
          :placeholder="t('dashboard.quote.clientNamePlaceholder')"
        >
      </section>

      <!-- Optional services -->
      <section class="form-section">
        <h2>{{ t('dashboard.quote.optionalServices') }}</h2>
        <div class="services-list">
          <div v-for="service in optionalServices" :key="service.key" class="service-row">
            <label class="service-checkbox">
              <input v-model="service.enabled" type="checkbox" >
              <span class="service-label">{{ t(service.labelKey) }}</span>
            </label>
            <div v-if="service.isQuoteOnly" class="service-amount-text">
              {{ t('dashboard.quote.insuranceQuote') }}
            </div>
            <div v-else class="service-amount-input">
              <input
                v-model.number="service.amount"
                type="number"
                min="0"
                step="50"
                class="input-small"
              >
              <span class="currency-symbol">&euro;</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Payment conditions -->
      <section class="form-section">
        <h2>{{ t('dashboard.quote.paymentConditions') }}</h2>
        <textarea v-model="paymentConditions" class="input-field textarea-field" rows="3" />
      </section>

      <!-- Validity -->
      <section class="form-section">
        <h2>{{ t('dashboard.quote.validityDays') }}</h2>
        <input
          v-model.number="validityDays"
          type="number"
          min="1"
          max="90"
          class="input-field input-narrow"
        >
      </section>

      <!-- Total -->
      <div class="total-card">
        <span class="total-label">{{ t('dashboard.quote.totalAmount') }}</span>
        <span class="total-value">{{ formatPrice(totalAmount) }}</span>
      </div>

      <!-- Actions -->
      <div class="actions-bar">
        <button type="button" class="btn-primary" :disabled="generatingPdf" @click="generatePdf">
          {{ generatingPdf ? t('dashboard.quote.generating') : t('dashboard.quote.generatePdf') }}
        </button>
        <button type="button" class="btn-secondary" :disabled="saving" @click="saveQuote">
          {{ saving ? t('dashboard.quote.saving') : t('dashboard.quote.saveQuote') }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.quote-page {
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
  gap: 4px;
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

.subtitle {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

/* Alerts */
.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.9rem;
}

.alert-success {
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  color: #16a34a;
  font-size: 0.9rem;
}

/* Loading */
.loading-state {
  display: flex;
  justify-content: center;
  padding: 60px;
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

/* Quote number bar */
.quote-number-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.quote-number-label {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}

.quote-number-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
  font-variant-numeric: tabular-nums;
}

/* Form sections */
.form-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.form-section h2 {
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.input-field {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #1e293b;
  background: white;
  min-height: 44px;
  transition: border-color 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.textarea-field {
  resize: vertical;
  min-height: 80px;
}

.input-narrow {
  max-width: 120px;
}

/* Vehicle search */
.vehicle-search-wrapper {
  position: relative;
}

.clear-btn {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  font-size: 1rem;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vehicle-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 240px;
  overflow-y: auto;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 50;
}

.vehicle-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  font-size: 0.9rem;
  min-height: 44px;
  transition: background 0.15s;
}

.vehicle-dropdown-item:hover {
  background: #f8fafc;
}

.vd-name {
  font-weight: 500;
  color: #1e293b;
}

.vd-year {
  color: #94a3b8;
  font-size: 0.85rem;
}

.vd-price {
  margin-left: auto;
  font-weight: 600;
  color: var(--color-primary, #23424a);
  font-size: 0.85rem;
}

.vd-empty {
  padding: 16px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.9rem;
}

/* Selected vehicle card */
.selected-vehicle-card {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-top: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.selected-vehicle-img {
  width: 120px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.selected-vehicle-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sv-title {
  font-weight: 600;
  color: #1e293b;
  font-size: 1rem;
}

.sv-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

/* Services */
.services-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.service-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  flex-wrap: wrap;
}

.service-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  min-height: 44px;
  flex: 1;
  min-width: 0;
}

.service-checkbox input[type='checkbox'] {
  width: 20px;
  height: 20px;
  accent-color: var(--color-primary, #23424a);
  cursor: pointer;
  flex-shrink: 0;
}

.service-label {
  font-size: 0.95rem;
  color: #1e293b;
}

.service-amount-input {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.input-small {
  width: 90px;
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
  text-align: right;
  min-height: 44px;
  color: #1e293b;
}

.input-small:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
}

.currency-symbol {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
}

.service-amount-text {
  font-size: 0.85rem;
  color: #3b82f6;
  font-weight: 500;
  font-style: italic;
  flex-shrink: 0;
}

/* Total card */
.total-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f0f9ff, #eff6ff);
  border: 2px solid #bfdbfe;
  border-radius: 12px;
}

.total-label {
  font-size: 1rem;
  font-weight: 600;
  color: #1e40af;
}

.total-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

/* Actions */
.actions-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 12px 24px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #1a3238;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 12px 24px;
  background: white;
  color: var(--color-primary, #23424a);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: #f8fafc;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive */
@media (min-width: 768px) {
  .quote-page {
    padding: 24px;
  }

  .actions-bar {
    flex-direction: row;
  }

  .actions-bar .btn-primary,
  .actions-bar .btn-secondary {
    flex: 1;
  }

  .selected-vehicle-img {
    width: 160px;
    height: 100px;
  }
}
</style>
