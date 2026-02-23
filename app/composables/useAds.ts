export type AdPosition =
  | 'pro_teaser'
  | 'catalog_inline'
  | 'sidebar'
  | 'search_top'
  | 'vehicle_services'
  | 'dealer_portal'
  | 'landing_sidebar'
  | 'article_inline'
  | 'email_footer'
  | 'pdf_footer'

export type AdFormat = 'card' | 'banner' | 'text' | 'logo_strip'

export interface Ad {
  id: string
  advertiser_id: string
  vertical: string
  title: string | null
  description: string | null
  image_url: string | null
  logo_url: string | null
  link_url: string
  phone: string | null
  email: string | null
  cta_text: Record<string, string> | null
  format: string
  positions: string[]
  countries: string[]
  regions: string[]
  provinces: string[]
  category_slugs: string[]
  action_slugs: string[]
  include_in_pdf: boolean
  include_in_email: boolean
}

interface UserGeo {
  country: string
  region: string
  province: string
}

export function useAds(
  position: AdPosition,
  options?: {
    category?: string
    action?: string
    vehicleLocation?: string
    maxAds?: number
  },
) {
  const supabase = useSupabaseClient()
  const ads = ref<Ad[]>([])
  const loading = ref(false)

  // Detect user geo (cascade of priority):
  // 1. Vehicle location (if viewing a vehicle page)
  // 2. Cloudflare headers (CF-IPCountry)
  // 3. Fallback: ES, empty region/province
  function detectGeo(): UserGeo {
    const nuxtApp = useNuxtApp()
    let country = 'ES'
    const region = ''
    const province = ''

    // Try Cloudflare headers from SSR context
    if (import.meta.server && nuxtApp.ssrContext?.event) {
      const headers = nuxtApp.ssrContext.event.node.req.headers
      country = (headers['cf-ipcountry'] as string) || 'ES'
    }

    return { country, region, province }
  }

  async function fetchAds() {
    loading.value = true
    const geo = detectGeo()
    const max = options?.maxAds || 1

    try {
      // Build query: active ads matching position, geo, and category
      let query = supabase
        .from('ads')
        .select('*')
        .eq('status', 'active')
        .contains('positions', [position])
        .lte('starts_at', new Date().toISOString())

      // Geo filtering: ads with matching country OR 'all' countries
      // The actual filtering for region/province is done client-side for simplicity

      if (options?.category) {
        // Match ads that target this category or have empty category_slugs (= all)
        query = query.or(`category_slugs.cs.{${options.category}},category_slugs.eq.{}`)
      }

      if (options?.action) {
        query = query.or(`action_slugs.cs.{${options.action}},action_slugs.eq.{}`)
      }

      const { data, error: err } = await query.limit(max * 3) // Fetch extra for client filtering

      if (err) throw err

      // Client-side geo filtering
      let filtered = (data as unknown as Ad[]) || []
      filtered = filtered.filter((ad) => {
        const matchCountry =
          ad.countries.length === 0 ||
          ad.countries.includes('all') ||
          ad.countries.includes(geo.country)
        const matchRegion =
          ad.regions.length === 0 || (geo.region && ad.regions.includes(geo.region))
        const matchProvince =
          ad.provinces.length === 0 || (geo.province && ad.provinces.includes(geo.province))

        return (
          matchCountry &&
          (matchRegion || ad.regions.length === 0) &&
          (matchProvince || ad.provinces.length === 0)
        )
      })

      // Randomize and limit
      filtered.sort(() => Math.random() - 0.5)
      ads.value = filtered.slice(0, max)

      // Register impressions
      for (const ad of ads.value) {
        registerEvent(ad.id, 'impression', geo)
      }
    } catch {
      ads.value = []
    } finally {
      loading.value = false
    }
  }

  // Register ad event
  async function registerEvent(adId: string, eventType: string, geo?: UserGeo) {
    const g = geo || detectGeo()
    const route = useRoute()
    await supabase.from('ad_events').insert({
      ad_id: adId,
      event_type: eventType,
      user_country: g.country,
      user_region: g.region,
      user_province: g.province,
      page_path: route.fullPath,
    })
  }

  // Click handlers
  function handleClick(ad: Ad) {
    registerEvent(ad.id, 'click')
    if (ad.link_url) {
      window.open(ad.link_url, '_blank', 'noopener')
    }
  }

  function handlePhoneClick(ad: Ad) {
    registerEvent(ad.id, 'phone_click')
    if (ad.phone) {
      window.location.href = `tel:${ad.phone}`
    }
  }

  function handleEmailClick(ad: Ad) {
    registerEvent(ad.id, 'email_click')
    if (ad.email) {
      window.location.href = `mailto:${ad.email}`
    }
  }

  // Auto-fetch on mount
  onMounted(fetchAds)

  return {
    ads,
    loading,
    fetchAds,
    handleClick,
    handlePhoneClick,
    handleEmailClick,
    registerEvent,
  }
}
