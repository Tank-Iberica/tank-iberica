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

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

/** Composable for dashboard exportar anuncio. */
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
    return PLATFORMS.find((p) => p.key === selectedPlatform.value) || PLATFORMS[0]!
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

  interface AdTextContext {
    brand: string
    model: string
    year: string
    price: string
    location: string
    description: string
    backlink: string
    category: string
  }

  function formatMilanuncios(ctx: AdTextContext): string {
    const yearSuffix = ctx.year ? ` ${ctx.year}` : ''
    const header = `\u{1F69B} ${ctx.brand} ${ctx.model}${yearSuffix}`
    const specs = [
      ctx.location ? `\u{1F4CD} Ubicacion: ${ctx.location}` : '',
      ctx.year ? `\u{1F4C6} Ano: ${ctx.year}` : '',
      ctx.price ? `\u{1F4B0} Precio: ${ctx.price}\u20AC` : '',
    ]
      .filter(Boolean)
      .join('\n')
    const descBlock = ctx.description ? `\n${ctx.description}` : ''
    const footer = `\n\n\u2705 Mas fotos y ficha completa: ${ctx.backlink}`
    return `${header}\n\n${specs}${descBlock}${footer}`
  }

  function formatWallapop(ctx: AdTextContext): string {
    const shortDesc = ctx.description
      ? ctx.description.substring(0, 200).replaceAll('\n', ' ').trim()
      : ''
    const parts = [
      `${ctx.brand} ${ctx.model}`,
      ctx.year ? ctx.year : '',
      ctx.price ? `${ctx.price}\u20AC` : '',
    ]
      .filter(Boolean)
      .join(' | ')
    return shortDesc
      ? `${parts} \u2014 ${shortDesc} \u{1F449} ${ctx.backlink}`
      : `${parts} \u{1F449} ${ctx.backlink}`
  }

  function formatSocial(ctx: AdTextContext): string {
    const yearSuffix = ctx.year ? ` ${ctx.year}` : ''
    const header = `\u{1F525} ${ctx.brand} ${ctx.model}${yearSuffix} en venta`
    const specs = [
      ctx.year ? `Ano: ${ctx.year}` : '',
      ctx.category ? `Categoria: ${ctx.category}` : '',
    ]
      .filter(Boolean)
      .join(' | ')
    const priceBlock = ctx.price ? `\n\n\u{1F4B0} ${ctx.price}\u20AC` : ''
    const locationBlock = ctx.location ? `\n\u{1F4CD} ${ctx.location}` : ''
    const descBlock = ctx.description ? `\n\n${ctx.description.substring(0, 500)}` : ''
    const footer = `\n\n\u{1F449} Ver ficha completa: ${ctx.backlink}`
    return `${header}\n\n${specs}${priceBlock}${locationBlock}${descBlock}${footer}`
  }

  function formatInstagram(ctx: AdTextContext): string {
    const yearSuffix = ctx.year ? ` ${ctx.year}` : ''
    const header = `${ctx.brand} ${ctx.model}${yearSuffix} \u2728`
    const priceBlock = ctx.price ? `\n\n\u{1F4B0} ${ctx.price}\u20AC` : ''
    const locationBlock = ctx.location ? `\n\u{1F4CD} ${ctx.location}` : ''
    const linkLine = '\n\u{1F517} Link en bio'
    const brandTag = ctx.brand.toLowerCase().replaceAll(/[^a-z0-9]/g, '')
    const tags = `\n\n#vehiculoindustrial #${brandTag} #tracciona #maquinariaindustrial`
    return `${header}${priceBlock}${locationBlock}${linkLine}${tags}`
  }

  const platformFormatters: Record<PlatformKey, (ctx: AdTextContext) => string> = {
    milanuncios: formatMilanuncios,
    wallapop: formatWallapop,
    facebook: formatSocial,
    linkedin: formatSocial,
    instagram: formatInstagram,
  }

  function generateAdText(vehicle: DealerVehicleForExport, platform: PlatformKey): string {
    const ctx: AdTextContext = {
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year ? String(vehicle.year) : '',
      price: vehicle.price ? formatPrice(vehicle.price) : '',
      location: vehicle.location || '',
      description: vehicle.description_es || '',
      backlink: `${useSiteUrl().replace('https://', '').replace('http://', '')}/vehiculo/${vehicle.slug}`,
      category: vehicle.category || '',
    }
    const maxChars = PLATFORMS.find((p) => p.key === platform)?.maxChars || 2000
    const text = platformFormatters[platform](ctx)
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
      document.execCommand('copy') // NOSONAR typescript:S1874
      textarea.remove()
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
