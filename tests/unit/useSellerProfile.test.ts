import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSellerProfile } from '../../app/composables/useSellerProfile'

// ─── Reactive computed + stubs ────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  // Use getter-based computed so we can test after mutating reactive state
  vi.stubGlobal('computed', (fn: () => unknown) => ({
    get value() {
      return (fn as () => unknown)()
    },
  }))
  vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
          order: () => ({
            range: () => Promise.resolve({ data: [], error: null }),
          }),
          eq: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
  }))
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('profile starts as null', () => {
    const c = useSellerProfile()
    expect(c.profile.value).toBeNull()
  })

  it('reviews starts as empty array', () => {
    const c = useSellerProfile()
    expect(c.reviews.value).toHaveLength(0)
  })

  it('loading starts as false', () => {
    const c = useSellerProfile()
    expect(c.loading.value).toBe(false)
  })

  it('activeVehicles starts as empty array', () => {
    const c = useSellerProfile()
    expect(c.activeVehicles.value).toHaveLength(0)
  })
})

// ─── avgRating computed ───────────────────────────────────────────────────────

describe('avgRating', () => {
  it('returns 0 when no reviews and no profile', () => {
    const c = useSellerProfile()
    expect(c.avgRating.value).toBe(0)
  })

  it('returns profile.rating when no reviews and profile has rating', () => {
    const c = useSellerProfile()
    ;(c.profile as { value: Record<string, unknown> | null }).value = {
      id: 'p1', user_id: 'u1', rating: 4.5, avg_response_minutes: null,
      created_at: '', slug: '', company_name: {}, legal_name: null, logo_url: null,
      cover_image_url: null, location_data: {}, phone: null, email: null, website: null,
      bio: {}, verified: false, featured: false, badge: null, total_listings: 0,
      active_listings: 0, total_reviews: 0, response_rate_pct: null, social_links: {},
    }
    expect(c.avgRating.value).toBe(4.5)
  })

  it('calculates avg from reviews when reviews exist', () => {
    const c = useSellerProfile()
    ;(c.reviews as { value: unknown[] }).value = [
      { id: '1', reviewer_id: 'u2', rating: 4, title: null, content: null, verified_purchase: false, created_at: '' },
      { id: '2', reviewer_id: 'u3', rating: 5, title: null, content: null, verified_purchase: false, created_at: '' },
      { id: '3', reviewer_id: 'u4', rating: 3, title: null, content: null, verified_purchase: false, created_at: '' },
    ]
    // avg = 12/3 = 4.0
    expect(c.avgRating.value).toBe(4)
  })

  it('rounds avg to 1 decimal place', () => {
    const c = useSellerProfile()
    ;(c.reviews as { value: unknown[] }).value = [
      { id: '1', reviewer_id: 'u2', rating: 5, title: null, content: null, verified_purchase: false, created_at: '' },
      { id: '2', reviewer_id: 'u3', rating: 4, title: null, content: null, verified_purchase: false, created_at: '' },
    ]
    // avg = 9/2 = 4.5
    expect(c.avgRating.value).toBe(4.5)
  })
})

// ─── responseTimeBadge computed ───────────────────────────────────────────────

describe('responseTimeBadge', () => {
  it('returns unknown when profile is null', () => {
    const c = useSellerProfile()
    expect(c.responseTimeBadge.value).toBe('unknown')
  })

  it('returns unknown when avg_response_minutes is null', () => {
    const c = useSellerProfile()
    ;(c.profile as { value: Record<string, unknown> | null }).value = {
      id: 'p1', user_id: 'u1', avg_response_minutes: null, rating: null,
      created_at: '', slug: '', company_name: {}, legal_name: null, logo_url: null,
      cover_image_url: null, location_data: {}, phone: null, email: null, website: null,
      bio: {}, verified: false, featured: false, badge: null, total_listings: 0,
      active_listings: 0, total_reviews: 0, response_rate_pct: null, social_links: {},
    }
    expect(c.responseTimeBadge.value).toBe('unknown')
  })

  it('returns fast when avg_response_minutes < 60', () => {
    const c = useSellerProfile()
    ;(c.profile as { value: Record<string, unknown> | null }).value = {
      id: 'p1', user_id: 'u1', avg_response_minutes: 30, rating: null,
      created_at: '', slug: '', company_name: {}, legal_name: null, logo_url: null,
      cover_image_url: null, location_data: {}, phone: null, email: null, website: null,
      bio: {}, verified: false, featured: false, badge: null, total_listings: 0,
      active_listings: 0, total_reviews: 0, response_rate_pct: null, social_links: {},
    }
    expect(c.responseTimeBadge.value).toBe('fast')
  })

  it('returns good when avg_response_minutes is between 60 and 240', () => {
    const c = useSellerProfile()
    ;(c.profile as { value: Record<string, unknown> | null }).value = {
      id: 'p1', user_id: 'u1', avg_response_minutes: 120, rating: null,
      created_at: '', slug: '', company_name: {}, legal_name: null, logo_url: null,
      cover_image_url: null, location_data: {}, phone: null, email: null, website: null,
      bio: {}, verified: false, featured: false, badge: null, total_listings: 0,
      active_listings: 0, total_reviews: 0, response_rate_pct: null, social_links: {},
    }
    expect(c.responseTimeBadge.value).toBe('good')
  })

  it('returns slow when avg_response_minutes >= 240', () => {
    const c = useSellerProfile()
    ;(c.profile as { value: Record<string, unknown> | null }).value = {
      id: 'p1', user_id: 'u1', avg_response_minutes: 500, rating: null,
      created_at: '', slug: '', company_name: {}, legal_name: null, logo_url: null,
      cover_image_url: null, location_data: {}, phone: null, email: null, website: null,
      bio: {}, verified: false, featured: false, badge: null, total_listings: 0,
      active_listings: 0, total_reviews: 0, response_rate_pct: null, social_links: {},
    }
    expect(c.responseTimeBadge.value).toBe('slow')
  })
})

// ─── memberSince computed ─────────────────────────────────────────────────────

describe('memberSince', () => {
  it('returns empty string when no profile', () => {
    const c = useSellerProfile()
    expect(c.memberSince.value).toBe('')
  })

  it('returns a non-empty string when profile has created_at', () => {
    const c = useSellerProfile()
    ;(c.profile as { value: Record<string, unknown> | null }).value = {
      id: 'p1', user_id: 'u1', created_at: '2024-01-15T00:00:00Z', slug: '',
      company_name: {}, legal_name: null, logo_url: null, cover_image_url: null,
      location_data: {}, phone: null, email: null, website: null, bio: {},
      verified: false, featured: false, badge: null, total_listings: 0, active_listings: 0,
      total_reviews: 0, avg_response_minutes: null, response_rate_pct: null, rating: null,
      social_links: {},
    }
    expect(c.memberSince.value).toBeTruthy()
    expect(typeof c.memberSince.value).toBe('string')
  })
})

// ─── canReview computed ───────────────────────────────────────────────────────

describe('canReview', () => {
  it('returns false when no user', () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = useSellerProfile()
    ;(c.profile as { value: Record<string, unknown> | null }).value = {
      id: 'p1', user_id: 'seller-1', created_at: '', slug: '', company_name: {},
      legal_name: null, logo_url: null, cover_image_url: null, location_data: {},
      phone: null, email: null, website: null, bio: {}, verified: false, featured: false,
      badge: null, total_listings: 0, active_listings: 0, total_reviews: 0,
      avg_response_minutes: null, response_rate_pct: null, rating: null, social_links: {},
    }
    expect(c.canReview.value).toBe(false)
  })

  it('returns false when no profile', () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
    const c = useSellerProfile()
    expect(c.canReview.value).toBe(false)
  })

  it('returns false when user is the seller', () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'seller-1' } }))
    const c = useSellerProfile()
    ;(c.profile as { value: Record<string, unknown> | null }).value = {
      id: 'p1', user_id: 'seller-1', created_at: '', slug: '', company_name: {},
      legal_name: null, logo_url: null, cover_image_url: null, location_data: {},
      phone: null, email: null, website: null, bio: {}, verified: false, featured: false,
      badge: null, total_listings: 0, active_listings: 0, total_reviews: 0,
      avg_response_minutes: null, response_rate_pct: null, rating: null, social_links: {},
    }
    expect(c.canReview.value).toBe(false)
  })

  it('returns true when user is different from seller and has not reviewed', () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'buyer-1' } }))
    const c = useSellerProfile()
    ;(c.profile as { value: Record<string, unknown> | null }).value = {
      id: 'p1', user_id: 'seller-1', created_at: '', slug: '', company_name: {},
      legal_name: null, logo_url: null, cover_image_url: null, location_data: {},
      phone: null, email: null, website: null, bio: {}, verified: false, featured: false,
      badge: null, total_listings: 0, active_listings: 0, total_reviews: 0,
      avg_response_minutes: null, response_rate_pct: null, rating: null, social_links: {},
    }
    expect(c.canReview.value).toBe(true)
  })
})

// ─── Profile helper ──────────────────────────────────────────────────────────

function makeProfileData(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1', user_id: 'seller-1', slug: 'test-dealer', company_name: {},
    legal_name: null, logo_url: null, cover_image_url: null, location_data: {},
    phone: null, email: null, website: null, bio: {}, verified: false,
    featured: false, badge: null, total_listings: 5, active_listings: 3,
    total_reviews: 2, avg_response_minutes: 30, response_rate_pct: 80,
    rating: 4.0, social_links: {}, created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function tableAwareMock(opts: {
  profileData?: unknown
  profileError?: unknown
  existingReview?: unknown
  reviewsData?: unknown[]
  reviewsError?: unknown
  vehiclesData?: unknown[]
  vehiclesError?: unknown
  insertError?: unknown
  updateError?: unknown
} = {}) {
  return () => ({
    from: (table: string) => {
      if (table === 'dealers') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: opts.profileData ?? null,
                error: opts.profileError ?? null,
              }),
            }),
          }),
          update: () => ({
            eq: () => Promise.resolve({ data: null, error: opts.updateError ?? null }),
          }),
        }
      }
      if (table === 'seller_reviews') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: opts.existingReview ?? null, error: null }),
              }),
              order: () => ({
                range: () => Promise.resolve({ data: opts.reviewsData ?? [], error: opts.reviewsError ?? null }),
              }),
            }),
          }),
          insert: () => Promise.resolve({ data: null, error: opts.insertError ?? null }),
        }
      }
      if (table === 'vehicles') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => Promise.resolve({ data: opts.vehiclesData ?? [], error: opts.vehiclesError ?? null }),
                }),
              }),
            }),
          }),
        }
      }
      return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }
    },
  })
}

// ─── fetchProfile ──────────────────────────────────────────────────────────

describe('fetchProfile', () => {
  it('loads profile and sets loading to false on success', async () => {
    const pd = makeProfileData()
    vi.stubGlobal('useSupabaseClient', tableAwareMock({ profileData: pd }))
    const c = useSellerProfile()
    await c.fetchProfile('test-dealer')
    expect(c.profile.value).not.toBeNull()
    expect(c.profile.value?.slug).toBe('test-dealer')
    expect(c.loading.value).toBe(false)
  })

  it('sets profile to null on error', async () => {
    vi.stubGlobal('useSupabaseClient', tableAwareMock({ profileError: { message: 'Not found' } }))
    const c = useSellerProfile()
    await c.fetchProfile('bad-slug')
    expect(c.profile.value).toBeNull()
    expect(c.loading.value).toBe(false)
  })

  it('does nothing when no slug provided and no dealerSlug', async () => {
    const c = useSellerProfile()
    await c.fetchProfile()
    expect(c.profile.value).toBeNull()
  })

  it('checks for existing review when user is logged in', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'buyer-1' } }))
    vi.stubGlobal('useSupabaseClient', tableAwareMock({
      profileData: makeProfileData(),
      existingReview: { id: 'review-1' },
    }))
    const c = useSellerProfile()
    await c.fetchProfile('test-dealer')
    // After finding an existing review, canReview should be false
    expect(c.canReview.value).toBe(false)
  })
})

// ─── fetchReviews ──────────────────────────────────────────────────────────

describe('fetchReviews', () => {
  it('returns early when profile has no user_id', async () => {
    const c = useSellerProfile()
    await c.fetchReviews()
    expect(c.reviews.value).toHaveLength(0)
  })

  it('loads reviews when profile is set', async () => {
    const reviewsData = [
      { id: 'r1', reviewer_id: 'u2', rating: 5, title: 'Great', content: 'Good service', verified_purchase: false, created_at: '2025-01-01T00:00:00Z', reviewer_name: 'John' },
      { id: 'r2', reviewer_id: 'u3', rating: 4, title: null, content: null, verified_purchase: true, created_at: '2025-02-01T00:00:00Z' },
    ]
    vi.stubGlobal('useSupabaseClient', tableAwareMock({ profileData: makeProfileData(), reviewsData }))
    const c = useSellerProfile()
    await c.fetchProfile('test-dealer')
    await c.fetchReviews()
    expect(c.reviews.value).toHaveLength(2)
    expect(c.reviewsLoading.value).toBe(false)
  })

  it('clears reviews on error', async () => {
    vi.stubGlobal('useSupabaseClient', tableAwareMock({
      profileData: makeProfileData(),
      reviewsError: { message: 'DB error' },
    }))
    const c = useSellerProfile()
    await c.fetchProfile('test-dealer')
    await c.fetchReviews()
    expect(c.reviews.value).toHaveLength(0)
    expect(c.reviewsLoading.value).toBe(false)
  })
})

// ─── fetchActiveVehicles ──────────────────────────────────────────────────

describe('fetchActiveVehicles', () => {
  it('returns early when no profile', async () => {
    const c = useSellerProfile()
    await c.fetchActiveVehicles()
    expect(c.activeVehicles.value).toHaveLength(0)
  })

  it('loads vehicles when profile is set', async () => {
    const vehicles = [
      { id: 'v1', slug: 'volvo-fh', brand: 'Volvo', model: 'FH', price: 50000, images_json: [] },
    ]
    vi.stubGlobal('useSupabaseClient', tableAwareMock({
      profileData: makeProfileData(),
      vehiclesData: vehicles,
    }))
    const c = useSellerProfile()
    await c.fetchProfile('test-dealer')
    await c.fetchActiveVehicles()
    expect(c.activeVehicles.value).toHaveLength(1)
  })

  it('clears vehicles on error', async () => {
    vi.stubGlobal('useSupabaseClient', tableAwareMock({
      profileData: makeProfileData(),
      vehiclesError: { message: 'DB error' },
    }))
    const c = useSellerProfile()
    await c.fetchProfile('test-dealer')
    await c.fetchActiveVehicles()
    expect(c.activeVehicles.value).toHaveLength(0)
  })
})

// ─── submitReview ────────────────────────────────────────────────────────

describe('submitReview', () => {
  it('returns false when canReview is false (no user)', async () => {
    const c = useSellerProfile()
    const result = await c.submitReview(5, 'Great', 'Good service')
    expect(result).toBe(false)
  })

  it('returns true on successful review submission', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'buyer-1' } }))
    vi.stubGlobal('useSupabaseClient', tableAwareMock({
      profileData: makeProfileData({ total_reviews: 2, rating: 4.0 }),
    }))
    const c = useSellerProfile()
    await c.fetchProfile('test-dealer')
    const result = await c.submitReview(5, 'Excellent', 'Great service')
    expect(result).toBe(true)
    // total_reviews should have been updated
    expect(c.profile.value?.total_reviews).toBe(3)
  })

  it('returns false when insert fails', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'buyer-1' } }))
    vi.stubGlobal('useSupabaseClient', tableAwareMock({
      profileData: makeProfileData(),
      insertError: { message: 'Insert failed' },
    }))
    const c = useSellerProfile()
    await c.fetchProfile('test-dealer')
    const result = await c.submitReview(5, 'Title', 'Content')
    expect(result).toBe(false)
  })

  it('returns false when update fails', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'buyer-1' } }))
    vi.stubGlobal('useSupabaseClient', tableAwareMock({
      profileData: makeProfileData(),
      updateError: { message: 'Update failed' },
    }))
    const c = useSellerProfile()
    await c.fetchProfile('test-dealer')
    const result = await c.submitReview(5, 'Title', 'Content')
    expect(result).toBe(false)
  })
})
