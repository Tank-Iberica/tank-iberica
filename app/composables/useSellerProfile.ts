/**
 * Composable for fetching public seller/dealer profiles with reviews
 * and reputation data. Used on dealer public pages.
 */

interface SellerProfile {
  id: string
  user_id: string
  slug: string
  company_name: Record<string, string>
  legal_name: string | null
  logo_url: string | null
  cover_image_url: string | null
  location_data: Record<string, string>
  phone: string | null
  email: string | null
  website: string | null
  bio: Record<string, string>
  verified: boolean
  featured: boolean
  badge: string | null
  total_listings: number
  active_listings: number
  total_reviews: number
  avg_response_minutes: number | null
  response_rate_pct: number | null
  rating: number | null
  social_links: Record<string, string>
  created_at: string
}

interface SellerReview {
  id: string
  reviewer_id: string
  rating: number
  title: string | null
  content: string | null
  verified_purchase: boolean
  created_at: string
  reviewer_name?: string
}

type ResponseBadge = 'fast' | 'good' | 'slow' | 'unknown'

interface ActiveVehicle {
  id: string
  slug: string
  brand: string
  model: string
  price: number | null
  images_json: unknown[]
}

export function useSellerProfile(dealerSlug?: string) {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const profile = ref<SellerProfile | null>(null)
  const reviews = ref<SellerReview[]>([])
  const loading = ref(false)
  const reviewsLoading = ref(false)
  const activeVehicles = ref<ActiveVehicle[]>([])

  /** Cached set of seller IDs the current user has already reviewed */
  const reviewedSellerIds = ref<Set<string>>(new Set())

  // --------------- Computed ---------------

  const avgRating = computed<number>(() => {
    if (reviews.value.length > 0) {
      const sum = reviews.value.reduce((acc, r) => acc + r.rating, 0)
      return Math.round((sum / reviews.value.length) * 10) / 10
    }
    return profile.value?.rating ?? 0
  })

  const responseTimeBadge = computed<ResponseBadge>(() => {
    const minutes = profile.value?.avg_response_minutes
    if (minutes === null || minutes === undefined) return 'unknown'
    if (minutes < 60) return 'fast'
    if (minutes < 240) return 'good'
    return 'slow'
  })

  const memberSince = computed<string>(() => {
    if (!profile.value?.created_at) return ''
    const date = new Date(profile.value.created_at)
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
    })
  })

  const canReview = computed<boolean>(() => {
    if (!user.value?.id) return false
    if (!profile.value?.user_id) return false
    if (user.value.id === profile.value.user_id) return false
    return !reviewedSellerIds.value.has(profile.value.user_id)
  })

  // --------------- Fetchers ---------------

  async function fetchProfile(slug?: string): Promise<void> {
    const targetSlug = slug ?? dealerSlug
    if (!targetSlug) return

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('dealers')
        .select('*')
        .eq('slug', targetSlug)
        .single()

      if (error) throw error
      profile.value = data as SellerProfile

      // Check if current user has already reviewed this seller
      if (user.value?.id && profile.value?.user_id) {
        const { data: existingReview } = await supabase
          .from('seller_reviews')
          .select('id')
          .eq('seller_id', profile.value.user_id)
          .eq('reviewer_id', user.value.id)
          .maybeSingle()

        if (existingReview) {
          reviewedSellerIds.value.add(profile.value.user_id)
        }
      }
    } catch (err) {
      console.error('[useSellerProfile] fetchProfile failed:', err)
      profile.value = null
    } finally {
      loading.value = false
    }
  }

  async function fetchReviews(page = 1, limit = 10): Promise<void> {
    if (!profile.value?.user_id) return

    reviewsLoading.value = true
    try {
      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data, error } = await supabase
        .from('seller_reviews')
        .select(
          'id, reviewer_id, rating, title, content, verified_purchase, created_at, reviewer_name',
        )
        .eq('seller_id', profile.value.user_id)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error
      reviews.value = (data ?? []) as SellerReview[]
    } catch (err) {
      console.error('[useSellerProfile] fetchReviews failed:', err)
      reviews.value = []
    } finally {
      reviewsLoading.value = false
    }
  }

  async function fetchActiveVehicles(): Promise<void> {
    if (!profile.value?.user_id) return

    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, slug, brand, model, price, images_json')
        .eq('dealer_id', profile.value.user_id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(12)

      if (error) throw error
      activeVehicles.value = (data ?? []) as ActiveVehicle[]
    } catch (err) {
      console.error('[useSellerProfile] fetchActiveVehicles failed:', err)
      activeVehicles.value = []
    }
  }

  async function submitReview(
    rating: number,
    title: string,
    content: string,
    vehicleId?: string,
  ): Promise<boolean> {
    if (!canReview.value || !profile.value?.user_id || !user.value?.id) return false

    try {
      const { error: insertError } = await supabase.from('seller_reviews').insert({
        seller_id: profile.value.user_id,
        reviewer_id: user.value.id,
        rating,
        title: title || null,
        content: content || null,
        vehicle_id: vehicleId ?? null,
        verified_purchase: false,
      })

      if (insertError) throw insertError

      // Update dealer aggregates
      const newTotal = (profile.value.total_reviews ?? 0) + 1
      const currentRating = profile.value.rating ?? 0
      const newAvg = Math.round(((currentRating * (newTotal - 1) + rating) / newTotal) * 10) / 10

      const { error: updateError } = await supabase
        .from('dealers')
        .update({ total_reviews: newTotal, rating: newAvg })
        .eq('user_id', profile.value.user_id)

      if (updateError) throw updateError

      // Update local state
      profile.value.total_reviews = newTotal
      profile.value.rating = newAvg
      reviewedSellerIds.value.add(profile.value.user_id)

      // Refresh reviews list
      await fetchReviews()
      return true
    } catch (err) {
      console.error('[useSellerProfile] submitReview failed:', err)
      return false
    }
  }

  // --------------- Auto-fetch on mount ---------------

  if (dealerSlug) {
    onMounted(async () => {
      await fetchProfile()
      await Promise.all([fetchReviews(), fetchActiveVehicles()])
    })
  }

  return {
    profile,
    reviews,
    loading,
    reviewsLoading,
    avgRating,
    responseTimeBadge,
    memberSince,
    activeVehicles,
    canReview,
    fetchProfile,
    fetchReviews,
    fetchActiveVehicles,
    submitReview,
  }
}
