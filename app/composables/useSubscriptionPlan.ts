/**
 * Composable for dealer subscription plan enforcement.
 * Manages plan limits, feature gates, and subscription status.
 */

export type PlanType = 'free' | 'basic' | 'premium' | 'founding'

export type StatsLevel = 'basic' | 'standard' | 'full'

export type BadgeType = 'none' | 'basic' | 'premium' | 'founding'

export interface PlanLimitsConfig {
  maxActiveListings: number // Infinity for unlimited
  maxPhotosPerListing: number
  badge: BadgeType
  publicProfile: 'basic' | 'full' | 'full_cover_featured'
  statsAccess: StatsLevel
  sortBoost: number
  aiListingsPerMonth: number // Infinity for unlimited
  whatsappPublishing: boolean
  embeddableWidget: boolean
  catalogExport: boolean
  demandAlerts: boolean
}

export const PLAN_LIMITS: Record<PlanType, PlanLimitsConfig> = {
  free: {
    maxActiveListings: 3,
    maxPhotosPerListing: 5,
    badge: 'none',
    publicProfile: 'basic',
    statsAccess: 'basic',
    sortBoost: 0,
    aiListingsPerMonth: 3,
    whatsappPublishing: false,
    embeddableWidget: false,
    catalogExport: false,
    demandAlerts: false,
  },
  basic: {
    maxActiveListings: 20,
    maxPhotosPerListing: 15,
    badge: 'basic',
    publicProfile: 'full',
    statsAccess: 'standard',
    sortBoost: 1,
    aiListingsPerMonth: 20,
    whatsappPublishing: true,
    embeddableWidget: false,
    catalogExport: true,
    demandAlerts: false,
  },
  premium: {
    maxActiveListings: Infinity,
    maxPhotosPerListing: 30,
    badge: 'premium',
    publicProfile: 'full_cover_featured',
    statsAccess: 'full',
    sortBoost: 3,
    aiListingsPerMonth: Infinity,
    whatsappPublishing: true,
    embeddableWidget: true,
    catalogExport: true,
    demandAlerts: true,
  },
  founding: {
    maxActiveListings: Infinity,
    maxPhotosPerListing: 30,
    badge: 'founding',
    publicProfile: 'full_cover_featured',
    statsAccess: 'full',
    sortBoost: 2,
    aiListingsPerMonth: Infinity,
    whatsappPublishing: true,
    embeddableWidget: true,
    catalogExport: true,
    demandAlerts: true,
  },
}

interface SubscriptionRow {
  id: string
  user_id: string
  plan: string
  status: string | null
  started_at: string | null
  expires_at: string | null
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  price_cents: number | null
  vertical: string
  created_at: string | null
  updated_at: string | null
}

function isValidPlan(plan: string): plan is PlanType {
  return ['free', 'basic', 'premium', 'founding'].includes(plan)
}

/**
 * Determines if a subscription is currently active based on status and expiry.
 * Founding plans with NULL expires_at never expire.
 */
function isSubscriptionActive(subscription: SubscriptionRow): boolean {
  // Must have an active status
  if (subscription.status !== 'active') return false

  // Founding plans with no expiry never expire
  if (subscription.plan === 'founding' && !subscription.expires_at) return true

  // If there is an expiry date, check it
  if (subscription.expires_at) {
    return new Date(subscription.expires_at) > new Date()
  }

  // No expiry and not founding — treat as active (e.g. ongoing Stripe subscription)
  return true
}

export function useSubscriptionPlan(dealerId?: string) {
  const supabase = useSupabaseClient()

  const subscription = ref<SubscriptionRow | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * The effective plan after checking subscription validity.
   * Expired subscriptions (except founding with NULL expires_at) fall back to 'free'.
   */
  const currentPlan = computed<PlanType>(() => {
    if (!subscription.value) return 'free'

    const plan = subscription.value.plan
    if (!isValidPlan(plan)) return 'free'

    // Check if subscription is still active
    if (!isSubscriptionActive(subscription.value)) return 'free'

    return plan
  })

  /** The limits configuration for the current effective plan */
  const planLimits = computed<PlanLimitsConfig>(() => {
    return PLAN_LIMITS[currentPlan.value]
  })

  /** Maximum number of photos allowed per listing */
  const maxPhotos = computed<number>(() => {
    return planLimits.value.maxPhotosPerListing
  })

  /** Sort boost value for catalog ordering */
  const sortBoost = computed<number>(() => {
    return planLimits.value.sortBoost
  })

  /** Whether the dealer has a visible badge */
  const hasBadge = computed<boolean>(() => {
    return planLimits.value.badge !== 'none'
  })

  /** The badge type for the current plan */
  const badgeType = computed<BadgeType>(() => {
    return planLimits.value.badge
  })

  /** Whether catalog PDF/CSV export is available */
  const canExport = computed<boolean>(() => {
    return planLimits.value.catalogExport
  })

  /** Whether the embeddable widget feature is available */
  const canUseWidget = computed<boolean>(() => {
    return planLimits.value.embeddableWidget
  })

  /** Whether WhatsApp publishing is available */
  const hasWhatsappPublishing = computed<boolean>(() => {
    return planLimits.value.whatsappPublishing
  })

  /** Whether demand/search alerts are available */
  const hasDemandAlerts = computed<boolean>(() => {
    return planLimits.value.demandAlerts
  })

  /** The stats access level: 'basic' (views only), 'standard' (views+leads+favorites), 'full' (all+comparison) */
  const statsLevel = computed<StatsLevel>(() => {
    return planLimits.value.statsAccess
  })

  /**
   * Check if the dealer can publish a new listing given their current active count.
   * @param currentListings - Number of currently active listings
   */
  function canPublish(currentListings: number): boolean {
    return currentListings < planLimits.value.maxActiveListings
  }

  /**
   * Fetch the dealer's current subscription from the database.
   * @param userId - The dealer's user ID (overrides the dealerId passed to the composable)
   */
  async function fetchSubscription(userId?: string): Promise<void> {
    const id = userId || dealerId
    if (!id) {
      subscription.value = null
      return
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (err) throw err

      subscription.value = (data as SubscriptionRow | null) ?? null
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching subscription'
      subscription.value = null
    } finally {
      loading.value = false
    }
  }

  // Auto-fetch if dealerId is provided on initialization
  if (dealerId) {
    fetchSubscription()
  }

  return {
    /** Raw subscription row from database */
    subscription: readonly(subscription),
    /** Loading state */
    loading: readonly(loading),
    /** Error message if fetch failed */
    error: readonly(error),
    /** Effective plan type after expiry checks */
    currentPlan,
    /** Full limits config for the current plan */
    planLimits,
    /** Check if dealer can publish given current listing count */
    canPublish,
    /** Max photos allowed per listing */
    maxPhotos,
    /** Sort boost value */
    sortBoost,
    /** Whether dealer has a visible badge */
    hasBadge,
    /** Badge type string */
    badgeType,
    /** Whether catalog export is available */
    canExport,
    /** Whether embeddable widget is available */
    canUseWidget,
    /** Whether WhatsApp publishing is available */
    hasWhatsappPublishing,
    /** Whether demand alerts are available */
    hasDemandAlerts,
    /** Stats access level */
    statsLevel,
    /** Manually fetch/refresh subscription data */
    fetchSubscription,
  }
}
