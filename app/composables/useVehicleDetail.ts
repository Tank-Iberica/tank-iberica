/**
 * Composable for the vehicle detail page.
 * Encapsulates all data fetching, computed properties, and handlers
 * for the [slug].vue page.
 *
 * Does NOT call onMounted — the page is responsible for lifecycle hooks.
 */
import { generateVehiclePdf } from '~/utils/generatePdf'
import { fetchTranslation } from '~/composables/useLocalized'
import { useToast } from '~/composables/useToast'
import { useVehicleComparator } from '~/composables/useVehicleComparator'
import { formatPrice } from '~/composables/shared/useListingUtils'
import type { Vehicle } from '~/composables/useVehicles'

// ---------------------------------------------------------------------------
// Types used only by this module
// ---------------------------------------------------------------------------

export interface SellerInfo {
  company_name: string | null
  location: string | null
  cif: string | null
}

/**
 * Extended vehicle type for the detail page.
 * The DB query returns fields not present in the base Vehicle interface.
 */
export interface VehicleDetail extends Vehicle {
  dealer_id?: string | null
  dealer_slug?: string | null
  ai_generated?: boolean
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export async function useVehicleDetail(slug: Ref<string>, options?: { cacheKey?: string }) {
  const route = useRoute()
  const { locale, t } = useI18n()
  const { fetchBySlug } = useVehicles()
  const { toggle, isFavorite } = useFavorites()
  const { location: userLocation } = useUserLocation()
  const openDemandModal = inject<() => void>('openDemandModal', () => {})
  const supabase = useSupabaseClient()
  const toast = useToast()

  const { isInComparison, addToComparison, removeFromComparison } = useVehicleComparator()
  const { trackFichaView, trackContactClick, trackFavorite: trackFav } = useLeadTracking()

  const showReport = ref(false)

  // SSR-compatible data fetching -- runs on server AND client
  const asyncKey = options?.cacheKey ?? `vehicle-${route.params.slug}`
  const { data: vehicle, status } = await useAsyncData(asyncKey, () => fetchBySlug(slug.value))

  const loading = computed(() => status.value === 'pending')

  // Cast vehicle to VehicleDetail for extended fields
  const vehicleDetail = computed<VehicleDetail | null>(() => vehicle.value as VehicleDetail | null)

  // ------------------------------------------------------------------
  // Description (with locale-aware translation fetching)
  // ------------------------------------------------------------------

  function getColumnDescription(): string | null {
    if (!vehicle.value) return null
    if (locale.value === 'en' && vehicle.value.description_en) return vehicle.value.description_en
    return vehicle.value.description_es
  }

  // Description ref -- initialized with column data for SSR compatibility
  const description = ref<string | null>(getColumnDescription())

  // Watch locale changes to fetch translations for non-primary locales
  watch(
    [locale, () => vehicle.value?.id],
    async ([newLocale, vehicleId]) => {
      if (!vehicle.value) {
        description.value = null
        return
      }
      // Primary languages: read directly from columns
      if (newLocale === 'es' || newLocale === 'en') {
        description.value = getColumnDescription()
        return
      }
      // Other locales: try content_translations, fall back to columns
      const translated = await fetchTranslation(
        'vehicle',
        String(vehicleId),
        'description',
        newLocale,
      )
      description.value = translated || getColumnDescription()
    },
    { immediate: true },
  )

  // ------------------------------------------------------------------
  // Computed properties
  // ------------------------------------------------------------------

  const hasSpecs = computed(() => {
    if (!vehicle.value?.attributes_json) return false
    return Object.keys(vehicle.value.attributes_json).length > 0
  })

  const vehicleLocation = computed(() => {
    if (!vehicle.value) return null
    const loc =
      locale.value === 'en' && vehicle.value.location_en
        ? vehicle.value.location_en
        : vehicle.value.location
    if (!loc) return null

    const vehicleCountry = vehicle.value.location_country
    const bothInSpain = userLocation.value.country === 'ES' && vehicleCountry === 'ES'

    if (bothInSpain) {
      return loc.replace(/,?\s*(Espa[nñ]a|Spain)\s*$/i, '').trim()
    }
    return loc
  })

  const vehicleFlagCode = computed(() => {
    if (!vehicle.value) return null
    const vehicleCountry = vehicle.value.location_country
    if (!vehicleCountry) return null
    if (userLocation.value.country === 'ES' && vehicleCountry === 'ES') return null
    return vehicleCountry.toLowerCase()
  })

  const priceText = computed(() => {
    if (!vehicle.value) return ''
    const v = vehicle.value
    if (v.category === 'terceros') return t('vehicle.consultar')
    if (v.price) return formatPrice(v.price)
    return t('vehicle.consultar')
  })

  const isFav = computed(() => (vehicle.value ? isFavorite(vehicle.value.id) : false))
  const inComparison = computed(() => (vehicle.value ? isInComparison(vehicle.value.id) : false))

  const breadcrumbItems = computed(() => {
    if (!vehicle.value) return []
    return [
      { label: t('nav.home'), to: '/' },
      { label: buildProductName(vehicle.value, locale.value, true) },
    ]
  })

  const shareText = computed(() => {
    if (!vehicle.value) return ''
    const v = vehicle.value
    const parts = [buildProductName(v, locale.value, true)]
    if (v.price) parts.push(`- ${formatPrice(v.price)}`)
    if (import.meta.client) parts.push(`- ${window.location.href}`)
    parts.push('- Tracciona')
    return parts.join(' ')
  })

  const emailSubject = computed(() => {
    if (!vehicle.value) return ''
    return `${buildProductName(vehicle.value, locale.value, true)} - Tracciona`
  })

  const emailBody = computed(() => {
    if (!vehicle.value) return ''
    const v = vehicle.value
    const parts = [t('vehicle.emailInterest')]
    parts.push(buildProductName(v, locale.value, true))
    if (v.year) parts.push(`${t('vehicle.year')}: ${v.year}`)
    if (v.price) parts.push(`${t('vehicle.price')}: ${formatPrice(v.price)}`)
    if (import.meta.client) parts.push(`URL: ${window.location.href}`)
    return parts.join('\n')
  })

  // ------------------------------------------------------------------
  // DSA: Seller info
  // ------------------------------------------------------------------

  const sellerInfo = ref<SellerInfo | null>(null)
  const sellerUserId = ref<string | null>(null)

  async function loadSellerInfo() {
    const detail = vehicleDetail.value
    if (!detail?.dealer_id) return
    const { data } = await supabase
      .from('dealers')
      .select('company_name, location, cif, user_id')
      .eq('id', detail.dealer_id)
      .single()
    if (data) {
      sellerInfo.value = data as unknown as SellerInfo
      sellerUserId.value = (data as unknown as { user_id: string | null }).user_id ?? null
    }
  }

  if (import.meta.client && vehicleDetail.value?.dealer_id) {
    loadSellerInfo()
  }

  // ------------------------------------------------------------------
  // Helper functions for specs
  // ------------------------------------------------------------------

  function resolveFilterLabel(key: string): string {
    return key.charAt(0).toUpperCase() + key.slice(1)
  }

  function resolveFilterValue(value: unknown): string {
    if (!value) return ''
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, string>
      return locale.value === 'en' && obj.en ? obj.en : obj.es || String(value)
    }
    return String(value)
  }

  // ------------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------------

  function handleFavorite() {
    if (!vehicle.value) return
    toggle(vehicle.value.id)
    trackFav(vehicle.value.id)
  }

  async function handleShare() {
    if (!vehicle.value || !import.meta.client) return
    const title = buildProductName(vehicle.value, locale.value, true)
    const text = description.value || ''
    const url = window.location.href

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('toast.shareCopied')
    }
  }

  async function handlePdf() {
    if (!vehicle.value) return
    await generateVehiclePdf({
      vehicle: vehicle.value,
      locale: locale.value,
      productName: buildProductName(vehicle.value, locale.value, true),
      priceText: priceText.value,
    })
  }

  function handleOpenDemand() {
    openDemandModal()
  }

  function handleCompare() {
    if (!vehicle.value) return
    if (inComparison.value) {
      removeFromComparison(vehicle.value.id)
    } else {
      addToComparison(vehicle.value.id)
    }
  }

  return {
    // Data
    vehicle,
    vehicleDetail,
    loading,
    description,
    sellerInfo,
    sellerUserId,
    showReport,

    // Computed
    hasSpecs,
    vehicleLocation,
    vehicleFlagCode,
    priceText,
    isFav,
    inComparison,
    breadcrumbItems,
    shareText,
    emailSubject,
    emailBody,

    // Functions
    resolveFilterLabel,
    resolveFilterValue,

    // Handlers
    handleFavorite,
    handleShare,
    handlePdf,
    handleOpenDemand,
    handleCompare,

    // Tracking (exposed for onMounted in the page)
    trackFichaView,
    trackContactClick,
  }
}
