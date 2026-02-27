/**
 * useDashboardExportarAnuncio
 *
 * All reactive state, computed properties, and ad-generation logic for the
 * Ad Export page (/dashboard/herramientas/exportar-anuncio).
 *
 * The composable does NOT call onMounted — exposes an init() function instead.
 */
import { formatPrice } from '~/composables/shared/useListingUtils'

// ────────────────────────────────────────────
// Types (module-scoped — only used by this feature)
// ────────────────────────────────────────────

export type PlatformKey = 'milanuncios' | 'wallapop' | 'facebook' | 'linkedin' | 'instagram'

export interface PlatformConfig {
  key: PlatformKey
  label: string
  maxChars: number
}

export interface DealerVehicleForExport {
  id: string
  brand: string
  model: string
  year: number | null
  price: number | null
  slug: string
  location: string | null
  description_es: string | null
  description_en: string | null
  category: string
  status: string
  vehicle_images: { url: string; position: number | null }[]
}

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

export const PLATFORMS: PlatformConfig[] = [
  { key: 'milanuncios', label: 'Milanuncios', maxChars: 4000 },
  { key: 'wallapop', label: 'Wallapop', maxChars: 640 },
  { key: 'facebook', label: 'Facebook Marketplace', maxChars: 2000 },
  { key: 'linkedin', label: 'LinkedIn', maxChars: 2000 },
  { key: 'instagram', label: 'Instagram', maxChars: 2200 },
]

// ────────────────────────────────────────────
// Composable
// ────────────────────────────────────────────

export function useDashboardExportarAnuncio() {
  const { t } = useI18n()
  const supabase = useSupabaseClient()
  const { userId } = useAuth()
  const { dealerProfile, loadDealer } = useDealerDashboard()
  const { canExport, fetchSubscription } = useSubscriptionPlan(userId.value || undefined)

  // ---------- State ----------

  const vehicles = ref<DealerVehicleForExport[]>([])
  const selectedVehicleId = ref<string | null>(null)
  const selectedPlatform = ref<PlatformKey>('milanuncios')
  const generatedText = ref('')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const copySuccess = ref(false)

  // ---------- Computed ----------

  const selectedVehicle = computed<DealerVehicleForExport | null>(() => {
    if (!selectedVehicleId.value) return null
    return vehicles.value.find((v) => v.id === selectedVehicleId.value) || null
  })

  const currentPlatformConfig = computed<PlatformConfig>(() => {
    return PLATFORMS.find((p) => p.key === selectedPlatform.value) || PLATFORMS[0]
  })

  const charCount = computed<number>(() => generatedText.value.length)

  const charCountClass = computed<string>(() => {
    const max = currentPlatformConfig.value.maxChars
    const current = charCount.value
    if (current > max) return 'count-over'
    if (current > max * 0.9) return 'count-warning'
    return 'count-ok'
  })

  const thumbnail = computed<string | null>(() => {
    if (!selectedVehicle.value?.vehicle_images?.length) return null
    const sorted = [...selectedVehicle.value.vehicle_images].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0),
    )
    return sorted[0]?.url || null
  })

  // ---------- Data loading ----------

  async function loadVehicles(): Promise<void> {
    const dealer = dealerProfile.value || (await loadDealer())
    if (!dealer) return

    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('vehicles')
        .select(
          'id, brand, model, year, price, slug, location, description_es, description_en, category, status, vehicle_images(url, position)',
        )
        .eq('dealer_id', dealer.id as never)
        .eq('status', 'published' as never)
        .order('created_at', { ascending: false })

      if (err) throw err
      vehicles.value = (data || []) as DealerVehicleForExport[]
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : t('dashboard.adExport.errorLoading')
    } finally {
      loading.value = false
    }
  }

  // ---------- Text generation helpers ----------

  function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + '...'
  }

  function generateAdText(vehicle: DealerVehicleForExport, platform: PlatformKey): string {
    const brand = vehicle.brand
    const model = vehicle.model
    const year = vehicle.year ? String(vehicle.year) : ''
    const price = vehicle.price ? formatPrice(vehicle.price) : ''
    const location = vehicle.location || ''
    const description = vehicle.description_es || ''
    const slug = vehicle.slug
    const backlink = `tracciona.com/vehiculo/${slug}`
    const maxChars = PLATFORMS.find((p) => p.key === platform)?.maxChars || 2000

    let text = ''

    switch (platform) {
      case 'milanuncios': {
        const header = `\u{1F69B} ${brand} ${model}${year ? ` ${year}` : ''}`
        const specs = [
          location ? `\u{1F4CD} Ubicacion: ${location}` : '',
          year ? `\u{1F4C6} Ano: ${year}` : '',
          price ? `\u{1F4B0} Precio: ${price}\u20AC` : '',
        ]
          .filter(Boolean)
          .join('\n')

        const descBlock = description ? `\n${description}` : ''
        const footer = `\n\n\u2705 Mas fotos y ficha completa: ${backlink}`

        text = `${header}\n\n${specs}${descBlock}${footer}`
        break
      }

      case 'wallapop': {
        const shortDesc = description
          ? description.substring(0, 200).replace(/\n/g, ' ').trim()
          : ''
        const parts = [`${brand} ${model}`, year ? year : '', price ? `${price}\u20AC` : '']
          .filter(Boolean)
          .join(' | ')

        text = shortDesc
          ? `${parts} \u2014 ${shortDesc} \u{1F449} ${backlink}`
          : `${parts} \u{1F449} ${backlink}`
        break
      }

      case 'facebook':
      case 'linkedin': {
        const header = `\u{1F525} ${brand} ${model}${year ? ` ${year}` : ''} en venta`
        const specs = [
          year ? `Ano: ${year}` : '',
          vehicle.category ? `Categoria: ${vehicle.category}` : '',
        ]
          .filter(Boolean)
          .join(' | ')

        const priceBlock = price ? `\n\n\u{1F4B0} ${price}\u20AC` : ''
        const locationBlock = location ? `\n\u{1F4CD} ${location}` : ''
        const descBlock = description ? `\n\n${description.substring(0, 500)}` : ''
        const footer = `\n\n\u{1F449} Ver ficha completa: ${backlink}`

        text = `${header}\n\n${specs}${priceBlock}${locationBlock}${descBlock}${footer}`
        break
      }

      case 'instagram': {
        const header = `${brand} ${model}${year ? ` ${year}` : ''} \u2728`
        const priceBlock = price ? `\n\n\u{1F4B0} ${price}\u20AC` : ''
        const locationBlock = location ? `\n\u{1F4CD} ${location}` : ''
        const linkLine = '\n\u{1F517} Link en bio'
        const brandTag = brand.toLowerCase().replace(/[^a-z0-9]/g, '')
        const tags = `\n\n#vehiculoindustrial #${brandTag} #tracciona #maquinariaindustrial`

        text = `${header}${priceBlock}${locationBlock}${linkLine}${tags}`
        break
      }
    }

    return truncateText(text, maxChars)
  }

  // ---------- Actions ----------

  function handleGenerate(): void {
    if (!selectedVehicle.value) return
    generatedText.value = generateAdText(selectedVehicle.value, selectedPlatform.value)
  }

  async function handleCopy(): Promise<void> {
    if (!generatedText.value) return

    try {
      await navigator.clipboard.writeText(generatedText.value)
      copySuccess.value = true
      setTimeout(() => {
        copySuccess.value = false
      }, 2500)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = generatedText.value
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      copySuccess.value = true
      setTimeout(() => {
        copySuccess.value = false
      }, 2500)
    }
  }

  function setSelectedVehicleId(id: string | null): void {
    selectedVehicleId.value = id
  }

  function setSelectedPlatform(key: PlatformKey): void {
    selectedPlatform.value = key
  }

  function setGeneratedText(text: string): void {
    generatedText.value = text
  }

  // ---------- Watchers ----------

  watch(selectedVehicleId, () => {
    generatedText.value = ''
  })

  watch(selectedPlatform, () => {
    if (selectedVehicle.value) {
      handleGenerate()
    }
  })

  // ---------- Init (no onMounted) ----------

  async function init(): Promise<void> {
    await Promise.all([loadVehicles(), fetchSubscription()])
  }

  return {
    // State
    vehicles,
    selectedVehicleId,
    selectedPlatform,
    generatedText,
    loading,
    error,
    copySuccess,

    // Computed
    selectedVehicle,
    currentPlatformConfig,
    charCount,
    charCountClass,
    thumbnail,

    // Dependencies
    canExport,

    // Functions
    handleGenerate,
    handleCopy,
    setSelectedVehicleId,
    setSelectedPlatform,
    setGeneratedText,
    init,
  }
}
