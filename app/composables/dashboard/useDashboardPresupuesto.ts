/**
 * useDashboardPresupuesto
 *
 * All reactive state, computed properties and helpers for the
 * Quote/Budget Generator page (/dashboard/herramientas/presupuesto).
 *
 * The composable does NOT call onMounted — lifecycle management stays in the page.
 */
import { formatPrice } from '~/composables/shared/useListingUtils'

// ────────────────────────────────────────────
// Types (module-scoped — only used by this feature)
// ────────────────────────────────────────────

export interface DealerVehicleOption {
  id: string
  brand: string
  model: string
  year: number | null
  price: number | null
  slug: string | null
  vehicle_images: { url: string; position: number }[]
}

export interface OptionalService {
  key: string
  labelKey: string
  enabled: boolean
  amount: number
  isQuoteOnly: boolean
}

// ────────────────────────────────────────────
// Composable
// ────────────────────────────────────────────

export function useDashboardPresupuesto() {
  const { t } = useI18n()
  const supabase = useSupabaseClient()
  const { dealerProfile, loadDealer } = useDealerDashboard()

  // ── Reactive state ──────────────────────────
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

  // ── Computed ─────────────────────────────────
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

  // ── Functions ────────────────────────────────

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

  function selectVehicle(vehicle: DealerVehicleOption): void {
    selectedVehicle.value = vehicle
    searchQuery.value = `${vehicle.brand} ${vehicle.model}`
    showDropdown.value = false
  }

  function clearVehicle(): void {
    selectedVehicle.value = null
    searchQuery.value = ''
  }

  function formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
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

  function toggleService(key: string, enabled: boolean): void {
    const svc = optionalServices.value.find((s) => s.key === key)
    if (svc) svc.enabled = enabled
  }

  function updateServiceAmount(key: string, amount: number): void {
    const svc = optionalServices.value.find((s) => s.key === key)
    if (svc) svc.amount = amount
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

  // ── Return ───────────────────────────────────
  return {
    // State
    loading,
    saving,
    generatingPdf,
    error,
    successMessage,
    vehicles,
    searchQuery,
    showDropdown,
    selectedVehicle,
    clientName,
    paymentConditions,
    validityDays,
    quoteNumber,
    optionalServices,

    // Computed
    vehiclePrice,
    selectedServicesTotal,
    totalAmount,
    filteredVehicles,
    vehicleThumbnail,
    vehicleTitle,

    // Functions
    init,
    selectVehicle,
    clearVehicle,
    generatePdf,
    saveQuote,
    handleSearchFocus,
    handleSearchBlur,
    toggleService,
    updateServiceAmount,
  }
}
