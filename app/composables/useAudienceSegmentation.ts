interface UserAdProfile {
  session_id: string
  user_id: string | null
  segments: string[]
  categories_viewed: string[]
  brands_searched: string[]
  price_range_min: number | null
  price_range_max: number | null
  geo_country: string | null
  geo_region: string | null
  page_views: number
}

export function useAudienceSegmentation() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Session ID — persistent across page loads
  const sessionId = ref('')
  const profile = ref<UserAdProfile | null>(null)
  let syncTimeout: ReturnType<typeof setTimeout> | null = null

  function getOrCreateSessionId(): string {
    if (import.meta.server) return ''
    const key = 'tracciona_ad_session'
    let id = localStorage.getItem(key)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(key, id)
    }
    return id
  }

  function ensureProfile() {
    if (!profile.value) {
      profile.value = {
        session_id: sessionId.value,
        user_id: user.value?.id || null,
        segments: [],
        categories_viewed: [],
        brands_searched: [],
        price_range_min: null,
        price_range_max: null,
        geo_country: null,
        geo_region: null,
        page_views: 0,
      }
    }
  }

  function trackCategoryView(categorySlug: string) {
    ensureProfile()
    if (!profile.value) return
    if (!profile.value.categories_viewed.includes(categorySlug)) {
      profile.value.categories_viewed.push(categorySlug)
    }
    profile.value.page_views++
    debouncedSync()
  }

  function trackBrandSearch(brand: string) {
    ensureProfile()
    if (!profile.value) return
    const normalized = brand.toLowerCase().trim()
    if (normalized && !profile.value.brands_searched.includes(normalized)) {
      profile.value.brands_searched.push(normalized)
    }
    debouncedSync()
  }

  function trackPriceRange(min: number, max: number) {
    ensureProfile()
    if (!profile.value) return
    profile.value.price_range_min = min
    profile.value.price_range_max = max
    debouncedSync()
  }

  function trackPageView() {
    ensureProfile()
    if (!profile.value) return
    profile.value.page_views++
    debouncedSync()
  }

  // Compute segments from accumulated data
  function computeSegments(): string[] {
    if (!profile.value) return []
    const segments: string[] = []

    // Category affinity — top 5 unique categories viewed
    for (const cat of profile.value.categories_viewed.slice(0, 5)) {
      segments.push(`cat:${cat}`)
    }

    // Price tier
    const maxPrice = profile.value.price_range_max
    if (maxPrice !== null) {
      if (maxPrice <= 30000) segments.push('price:budget')
      else if (maxPrice <= 100000) segments.push('price:mid')
      else segments.push('price:premium')
    }

    // Intent based on page views
    if (profile.value.page_views >= 10) segments.push('intent:buyer')
    else if (profile.value.page_views >= 3) segments.push('intent:researcher')
    else segments.push('intent:browser')

    // Geo segment
    if (profile.value.geo_country) {
      segments.push(`geo:${profile.value.geo_country}`)
    }

    // Brand interest
    if (profile.value.brands_searched.length >= 3) {
      segments.push('brand:multi_interest')
    } else if (profile.value.brands_searched.length === 1) {
      segments.push(`brand:${profile.value.brands_searched[0]}`)
    }

    // Frequency
    if (profile.value.page_views >= 20) segments.push('freq:heavy')
    else if (profile.value.page_views >= 5) segments.push('freq:regular')

    return segments
  }

  // Get segments for Prebid.js ORTB2 first-party data
  function getSegmentsForPrebid(): Record<string, unknown> {
    const segs = computeSegments()
    return {
      user: {
        data: [
          {
            name: 'tracciona',
            segment: segs.map((s) => ({ id: s })),
          },
        ],
      },
    }
  }

  const segments = computed(() => computeSegments())

  // Debounced sync to Supabase
  function debouncedSync() {
    if (syncTimeout) clearTimeout(syncTimeout)
    syncTimeout = setTimeout(() => {
      syncProfile()
    }, 5000) // 5 second debounce
  }

  async function syncProfile() {
    if (!profile.value || !sessionId.value || import.meta.server) return

    // Update segments before sync
    profile.value.segments = computeSegments()
    profile.value.user_id = user.value?.id || null

    try {
      await supabase.from('user_ad_profiles').upsert(
        {
          session_id: profile.value.session_id,
          user_id: profile.value.user_id,
          segments: profile.value.segments,
          categories_viewed: profile.value.categories_viewed,
          brands_searched: profile.value.brands_searched,
          price_range_min: profile.value.price_range_min,
          price_range_max: profile.value.price_range_max,
          geo_country: profile.value.geo_country,
          geo_region: profile.value.geo_region,
          page_views: profile.value.page_views,
          last_active_at: new Date().toISOString(),
        },
        { onConflict: 'session_id' },
      )
    } catch {
      // Fire and forget
    }
  }

  // Initialize on client
  onMounted(() => {
    sessionId.value = getOrCreateSessionId()
    ensureProfile()
  })

  onUnmounted(() => {
    if (syncTimeout) clearTimeout(syncTimeout)
    // Final sync on unmount
    syncProfile()
  })

  return {
    trackCategoryView,
    trackBrandSearch,
    trackPriceRange,
    trackPageView,
    getSegmentsForPrebid,
    segments,
    sessionId,
  }
}
