/**
 * Composable for calculating a dealer's "health score" (0-100).
 *
 * Scoring criteria:
 *   - Photos quality (>3 photos per vehicle average):        +10
 *   - Description completeness (avg length > 100 chars):     +10
 *   - Responds to leads within 24h:                          +20
 *   - Updates prices monthly (updated_at within 30 days):    +10
 *   - Complete profile (logo, bio, phone, email):            +10
 *   - Active vehicles: +10 per every 5 vehicles (max +40):   0-40
 */

interface HealthScoreBreakdown {
  photosScore: number // 0-10
  descriptionScore: number // 0-10
  responseScore: number // 0-20
  priceUpdateScore: number // 0-10
  profileScore: number // 0-10
  vehiclesScore: number // 0-40
  total: number // 0-100
}

interface DealerProfileData {
  id: string
  logo_url: string | null
  bio: Record<string, string> | string | null
  phone: string | null
  email: string | null
  avg_response_time_hours: number | null
}

interface VehicleData {
  id: string
  description_es: string | null
  description_en: string | null
  updated_at: string | null
  status: string | null
}

interface VehicleImageCount {
  vehicle_id: string
}

const EMPTY_BREAKDOWN: HealthScoreBreakdown = {
  photosScore: 0,
  descriptionScore: 0,
  responseScore: 0,
  priceUpdateScore: 0,
  profileScore: 0,
  vehiclesScore: 0,
  total: 0,
}

export function useDealerHealthScore(dealerId: string) {
  const supabase = useSupabaseClient()

  const score = ref<HealthScoreBreakdown>({ ...EMPTY_BREAKDOWN })
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Whether the dealer is eligible for a quality badge (score > 80).
   */
  const badgeEligible = computed<boolean>(() => score.value.total > 80)

  /**
   * Calculate the photos quality score.
   * Awards 10 points if average photos per vehicle > 3.
   */
  function calcPhotosScore(imageCount: number, vehicleCount: number): number {
    if (vehicleCount === 0) return 0
    const avgPhotos = imageCount / vehicleCount
    return avgPhotos > 3 ? 10 : Math.round((avgPhotos / 3) * 10)
  }

  /**
   * Calculate the description completeness score.
   * Awards 10 points if average description length > 100 characters.
   */
  function calcDescriptionScore(vehicles: VehicleData[]): number {
    if (vehicles.length === 0) return 0

    const totalLength = vehicles.reduce((sum, v) => {
      const descEs = v.description_es || ''
      const descEn = v.description_en || ''
      // Use the longest available description for each vehicle
      const bestLength = Math.max(descEs.length, descEn.length)
      return sum + bestLength
    }, 0)

    const avgLength = totalLength / vehicles.length
    return avgLength > 100 ? 10 : Math.round((avgLength / 100) * 10)
  }

  /**
   * Calculate the response time score.
   * Awards 20 points if avg_response_time_hours <= 24.
   * Scales linearly between 0 and 20 for response times between 24h and 72h.
   */
  function calcResponseScore(avgResponseTimeHours: number | null): number {
    if (avgResponseTimeHours === null) return 0
    if (avgResponseTimeHours <= 24) return 20
    if (avgResponseTimeHours >= 72) return 0
    // Linear scale between 24h (20 points) and 72h (0 points)
    return Math.round(((72 - avgResponseTimeHours) / (72 - 24)) * 20)
  }

  /**
   * Calculate the price update score.
   * Awards 10 points if any vehicle has been updated within the last 30 days.
   * Scales based on the proportion of vehicles updated recently.
   */
  function calcPriceUpdateScore(vehicles: VehicleData[]): number {
    if (vehicles.length === 0) return 0

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const cutoff = thirtyDaysAgo.toISOString()

    const recentlyUpdated = vehicles.filter((v) => v.updated_at && v.updated_at >= cutoff).length

    const ratio = recentlyUpdated / vehicles.length
    return Math.round(ratio * 10)
  }

  /**
   * Calculate the profile completeness score.
   * Awards 2.5 points for each of: logo, bio, phone, email (max 10).
   */
  function calcProfileScore(profile: DealerProfileData): number {
    let filledFields = 0

    if (profile.logo_url) filledFields++
    if (profile.bio) {
      // Bio can be JSONB (localized) or string
      if (typeof profile.bio === 'string' && profile.bio.trim().length > 0) {
        filledFields++
      } else if (typeof profile.bio === 'object') {
        const values = Object.values(profile.bio)
        if (values.some((v) => typeof v === 'string' && v.trim().length > 0)) {
          filledFields++
        }
      }
    }
    if (profile.phone) filledFields++
    if (profile.email) filledFields++

    // 2.5 points per field, rounded to nearest integer
    return Math.round((filledFields / 4) * 10)
  }

  /**
   * Calculate the active vehicles score.
   * Awards 10 points per every 5 active vehicles, up to 40 points max.
   */
  function calcVehiclesScore(activeCount: number): number {
    const groups = Math.floor(activeCount / 5)
    return Math.min(groups * 10, 40)
  }

  /**
   * Fetch all required data and calculate the full health score breakdown.
   */
  async function calculateScore(): Promise<HealthScoreBreakdown> {
    if (!dealerId) {
      error.value = 'Dealer ID is required'
      return { ...EMPTY_BREAKDOWN }
    }

    loading.value = true
    error.value = null

    try {
      // Fetch dealer profile, vehicles, and image counts in parallel
      const [dealerRes, vehiclesRes, imagesRes] = await Promise.all([
        // Dealer profile
        supabase
          .from('dealers')
          .select('id, logo_url, bio, phone, email, avg_response_time_hours')
          .eq('id', dealerId)
          .single(),

        // All published vehicles for this dealer
        supabase
          .from('vehicles')
          .select('id, description_es, description_en, updated_at, status')
          .eq('dealer_id', dealerId)
          .eq('status', 'published'),

        // Count of images across all dealer vehicles
        supabase
          .from('vehicle_images')
          .select('vehicle_id, vehicles!inner(dealer_id)')
          .eq('vehicles.dealer_id', dealerId),
      ])

      if (dealerRes.error) throw dealerRes.error

      const profile = dealerRes.data as unknown as DealerProfileData
      const vehicles = (vehiclesRes.data || []) as unknown as VehicleData[]
      const images = (imagesRes.data || []) as unknown as VehicleImageCount[]

      const activeCount = vehicles.length
      const imageCount = images.length

      const photosScore = calcPhotosScore(imageCount, activeCount)
      const descriptionScore = calcDescriptionScore(vehicles)
      const responseScore = calcResponseScore(profile.avg_response_time_hours)
      const priceUpdateScore = calcPriceUpdateScore(vehicles)
      const profileScore = calcProfileScore(profile)
      const vehiclesScore = calcVehiclesScore(activeCount)

      const total =
        photosScore +
        descriptionScore +
        responseScore +
        priceUpdateScore +
        profileScore +
        vehiclesScore

      const breakdown: HealthScoreBreakdown = {
        photosScore,
        descriptionScore,
        responseScore,
        priceUpdateScore,
        profileScore,
        vehiclesScore,
        total,
      }

      score.value = breakdown
      return breakdown
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value =
        supabaseError?.message ||
        (err instanceof Error ? err.message : 'Error calculating health score')
      score.value = { ...EMPTY_BREAKDOWN }
      return { ...EMPTY_BREAKDOWN }
    } finally {
      loading.value = false
    }
  }

  return {
    score: readonly(score),
    loading: readonly(loading),
    error: readonly(error),
    calculateScore,
    badgeEligible,
  }
}
