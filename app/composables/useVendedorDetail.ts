/**
 * Composable that orchestrates the vendor detail page logic.
 * Extracts all refs, computeds, watchers and actions from the [slug].vue page.
 *
 * Does NOT call onMounted — exposes init() instead.
 */

// ---- Types used only by this module ----

export interface VendedorProfile {
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

export interface VendedorReview {
  id: string
  reviewer_id: string
  rating: number
  title: string | null
  content: string | null
  verified_purchase: boolean
  created_at: string
  reviewer_name?: string
}

export interface VendedorVehicle {
  id: string
  slug: string
  brand: string
  model: string
  price: number | null
  images_json: unknown[]
}

/** Pure function — render a star string for a given numeric rating */
export function renderStars(rating: number): string {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5 ? 1 : 0
  const empty = 5 - full - half
  return '\u2605'.repeat(full) + (half ? '\u00BD' : '') + '\u2606'.repeat(empty)
}

export function useVendedorDetail() {
  const { t, locale } = useI18n()
  const route = useRoute()

  const {
    profile,
    reviews,
    loading,
    reviewsLoading,
    avgRating,
    responseTimeBadge,
    memberSince,
    activeVehicles,
    fetchProfile,
    fetchReviews,
    fetchActiveVehicles,
    submitReview,
    canReview,
  } = useSellerProfile()

  // ---- Review form state ----

  const reviewPage = ref(1)
  const reviewRating = ref(5)
  const reviewTitle = ref('')
  const reviewContent = ref('')
  const submitting = ref(false)
  const submitError = ref<string | null>(null)
  const submitSuccess = ref(false)

  // ---- Computed helpers ----

  const sellerName = computed<string>(() => {
    if (!profile.value) return ''
    return (
      localizedField(profile.value.company_name, locale.value) || profile.value.legal_name || ''
    )
  })

  const sellerBio = computed<string>(() => {
    if (!profile.value?.bio) return ''
    return localizedField(profile.value.bio, locale.value)
  })

  const sellerLocation = computed<string>(() => {
    if (!profile.value?.location_data) return ''
    const loc = profile.value.location_data
    return [loc.city, loc.province, loc.country].filter(Boolean).join(', ')
  })

  const responseTimeLabel = computed<string>(() => {
    const badge = responseTimeBadge.value
    if (badge === 'fast') return t('seller.responseTimeFast')
    if (badge === 'good') return t('seller.responseTimeGood')
    if (badge === 'slow') return t('seller.responseTimeSlow')
    return t('seller.responseTimeUnknown')
  })

  const responseRateFormatted = computed<string>(() => {
    const rate = profile.value?.response_rate_pct
    if (rate === null || rate === undefined) return '--'
    return `${rate}%`
  })

  const slug = computed(() => route.params.slug as string)

  // ---- SEO structured data (computed JSON strings) ----

  const jsonLdBusiness = computed<string>(() => {
    if (!profile.value) return ''
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: sellerName.value,
      description: sellerBio.value,
      image: profile.value.logo_url || undefined,
      address: profile.value.location_data
        ? {
            '@type': 'PostalAddress',
            addressLocality: profile.value.location_data.city || undefined,
            addressRegion: profile.value.location_data.province || undefined,
            addressCountry: profile.value.location_data.country || undefined,
          }
        : undefined,
      aggregateRating:
        profile.value.total_reviews > 0
          ? {
              '@type': 'AggregateRating',
              ratingValue: avgRating.value,
              reviewCount: profile.value.total_reviews,
            }
          : undefined,
      url: profile.value.website || undefined,
      telephone: profile.value.phone || undefined,
    })
  })

  const jsonLdBreadcrumb = computed<string>(() => {
    if (!sellerName.value) return ''
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://tracciona.com' },
        {
          '@type': 'ListItem',
          position: 2,
          name: sellerName.value,
          item: `https://tracciona.com/vendedor/${route.params.slug}`,
        },
      ],
    })
  })

  const hrefLinks = computed(() => {
    const s = route.params.slug as string
    const path = `/vendedor/${s}`
    return [
      { rel: 'canonical', href: `https://tracciona.com${path}` },
      { rel: 'alternate', hreflang: 'es', href: `https://tracciona.com${path}` },
      { rel: 'alternate', hreflang: 'en', href: `https://tracciona.com/en${path}` },
      { rel: 'alternate', hreflang: 'x-default', href: `https://tracciona.com${path}` },
    ]
  })

  // ---- Actions ----

  async function loadMoreReviews(): Promise<void> {
    reviewPage.value += 1
    await fetchReviews(reviewPage.value)
  }

  async function handleSubmitReview(): Promise<void> {
    submitError.value = null
    submitSuccess.value = false

    if (reviewRating.value < 1 || reviewRating.value > 5) {
      submitError.value = t('seller.reviewErrorRating')
      return
    }
    if (!reviewContent.value.trim()) {
      submitError.value = t('seller.reviewErrorContent')
      return
    }

    submitting.value = true
    try {
      const success = await submitReview(
        reviewRating.value,
        reviewTitle.value.trim(),
        reviewContent.value.trim(),
      )
      if (success) {
        submitSuccess.value = true
        reviewRating.value = 5
        reviewTitle.value = ''
        reviewContent.value = ''
      } else {
        submitError.value = t('seller.reviewErrorGeneric')
      }
    } catch {
      submitError.value = t('seller.reviewErrorGeneric')
    } finally {
      submitting.value = false
    }
  }

  function setReviewRating(value: number): void {
    reviewRating.value = value
  }

  function setReviewTitle(value: string): void {
    reviewTitle.value = value
  }

  function setReviewContent(value: string): void {
    reviewContent.value = value
  }

  // ---- Init (call from onMounted in page) ----

  async function init(): Promise<void> {
    await fetchProfile(slug.value)
    await Promise.all([fetchReviews(), fetchActiveVehicles()])
  }

  return {
    // State from useSellerProfile
    profile: profile as Ref<VendedorProfile | null>,
    reviews: reviews as Ref<VendedorReview[]>,
    loading,
    reviewsLoading,
    avgRating,
    responseTimeBadge,
    memberSince,
    activeVehicles: activeVehicles as Ref<VendedorVehicle[]>,
    canReview,

    // Computed helpers
    sellerName,
    sellerBio,
    sellerLocation,
    responseTimeLabel,
    responseRateFormatted,

    // Review form state
    reviewRating,
    reviewTitle,
    reviewContent,
    submitting,
    submitError,
    submitSuccess,

    // Actions
    init,
    loadMoreReviews,
    handleSubmitReview,
    setReviewRating,
    setReviewTitle,
    setReviewContent,

    // SEO helpers
    jsonLdBusiness,
    jsonLdBreadcrumb,
    hrefLinks,
  }
}
