import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useVendedorDetail } from '../../app/composables/useVendedorDetail'

// ─── Stubs ────────────────────────────────────────────────────────────────────

const mockProfile = { value: null as unknown }
const mockReviews = { value: [] as unknown[] }

function stubSellerProfile() {
  vi.stubGlobal('useSellerProfile', () => ({
    profile: mockProfile,
    reviews: mockReviews,
    loading: { value: false },
    reviewsLoading: { value: false },
    avgRating: { value: 4.5 },
    responseTimeBadge: { value: 'fast' },
    memberSince: { value: 'Jan 2024' },
    activeVehicles: { value: [] },
    fetchProfile: vi.fn().mockResolvedValue(undefined),
    fetchReviews: vi.fn().mockResolvedValue(undefined),
    fetchActiveVehicles: vi.fn().mockResolvedValue(undefined),
    submitReview: vi.fn().mockResolvedValue(undefined),
    canReview: { value: true },
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  mockProfile.value = null
  mockReviews.value = []
  vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
  vi.stubGlobal('useRoute', () => ({ params: { slug: 'dealer-acme' } }))
  vi.stubGlobal('useHead', vi.fn())
  vi.stubGlobal('localizedField', (field: Record<string, string>, locale: string) => field?.[locale] ?? '')
  vi.stubGlobal('watch', vi.fn())
  stubSellerProfile()
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('loading starts as false', () => {
    const c = useVendedorDetail()
    expect(c.loading.value).toBe(false)
  })

  it('reviewRating starts as 5', () => {
    const c = useVendedorDetail()
    expect(c.reviewRating.value).toBe(5)
  })

  it('reviewTitle starts as empty string', () => {
    const c = useVendedorDetail()
    expect(c.reviewTitle.value).toBe('')
  })

  it('reviewContent starts as empty string', () => {
    const c = useVendedorDetail()
    expect(c.reviewContent.value).toBe('')
  })

  it('submitting starts as false', () => {
    const c = useVendedorDetail()
    expect(c.submitting.value).toBe(false)
  })

  it('submitError starts as null', () => {
    const c = useVendedorDetail()
    expect(c.submitError.value).toBeNull()
  })

  it('submitSuccess starts as false', () => {
    const c = useVendedorDetail()
    expect(c.submitSuccess.value).toBe(false)
  })
})

// ─── sellerName computed ──────────────────────────────────────────────────────

describe('sellerName', () => {
  it('returns empty string when no profile', () => {
    const c = useVendedorDetail()
    expect(c.sellerName.value).toBe('')
  })

  it('returns localized company_name when profile loaded', () => {
    mockProfile.value = {
      id: 'd-1', company_name: { es: 'Dealer ES', en: 'Dealer EN' }, legal_name: 'Legal SL',
    }
    const c = useVendedorDetail()
    expect(c.sellerName.value).toBe('Dealer ES')
  })

  it('falls back to legal_name when company_name is empty', () => {
    vi.stubGlobal('localizedField', () => '')
    mockProfile.value = {
      id: 'd-1', company_name: {}, legal_name: 'Fallback Legal',
    }
    const c = useVendedorDetail()
    expect(c.sellerName.value).toBe('Fallback Legal')
  })
})

// ─── sellerBio computed ───────────────────────────────────────────────────────

describe('sellerBio', () => {
  it('returns empty string when no profile', () => {
    const c = useVendedorDetail()
    expect(c.sellerBio.value).toBe('')
  })

  it('returns localized bio when profile has bio', () => {
    mockProfile.value = {
      id: 'd-1', bio: { es: 'Bio ES', en: 'Bio EN' }, company_name: {}, legal_name: null,
    }
    const c = useVendedorDetail()
    expect(c.sellerBio.value).toBe('Bio ES')
  })
})

// ─── sellerLocation computed ──────────────────────────────────────────────────

describe('sellerLocation', () => {
  it('returns empty string when no profile', () => {
    const c = useVendedorDetail()
    expect(c.sellerLocation.value).toBe('')
  })

  it('formats city, province, country', () => {
    mockProfile.value = {
      id: 'd-1', location_data: { city: 'Madrid', province: 'Madrid', country: 'España' },
      company_name: {}, legal_name: null,
    }
    const c = useVendedorDetail()
    expect(c.sellerLocation.value).toContain('Madrid')
  })
})

// ─── responseRateFormatted computed ──────────────────────────────────────────

describe('responseRateFormatted', () => {
  it('returns -- when no response_rate_pct', () => {
    const c = useVendedorDetail()
    expect(c.responseRateFormatted.value).toBe('--')
  })

  it('returns percentage when rate is set', () => {
    mockProfile.value = { id: 'd-1', response_rate_pct: 85, company_name: {}, legal_name: null }
    const c = useVendedorDetail()
    expect(c.responseRateFormatted.value).toBe('85%')
  })
})

// ─── responseTimeLabel computed ───────────────────────────────────────────────

describe('responseTimeLabel', () => {
  it('returns fast label when badge is fast', () => {
    const c = useVendedorDetail()
    // responseTimeBadge.value = 'fast' from stub
    const label = c.responseTimeLabel.value
    expect(label).toBe('seller.responseTimeFast') // t() returns key in stub
  })
})

// ─── hrefLinks computed ───────────────────────────────────────────────────────

describe('hrefLinks', () => {
  it('returns 4 links', () => {
    const c = useVendedorDetail()
    expect(c.hrefLinks.value).toHaveLength(4)
  })

  it('includes canonical link', () => {
    const c = useVendedorDetail()
    const canonical = (c.hrefLinks.value as Array<{ rel: string; href: string }>).find((l) => l.rel === 'canonical')
    expect(canonical?.href).toContain('dealer-acme')
  })
})

// ─── setters ──────────────────────────────────────────────────────────────────

describe('review form setters', () => {
  it('setReviewRating updates reviewRating', () => {
    const c = useVendedorDetail()
    c.setReviewRating(3)
    expect(c.reviewRating.value).toBe(3)
  })

  it('setReviewTitle updates reviewTitle', () => {
    const c = useVendedorDetail()
    c.setReviewTitle('Great dealer')
    expect(c.reviewTitle.value).toBe('Great dealer')
  })

  it('setReviewContent updates reviewContent', () => {
    const c = useVendedorDetail()
    c.setReviewContent('Really happy with the purchase')
    expect(c.reviewContent.value).toBe('Really happy with the purchase')
  })
})
