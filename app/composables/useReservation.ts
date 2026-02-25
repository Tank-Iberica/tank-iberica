/**
 * Composable for managing vehicle reservations with deposit payments.
 * Handles tier-based deposit pricing, free reservation allowances,
 * and the full buyer/seller reservation lifecycle.
 */

export type ReservationStatus =
  | 'pending'
  | 'active'
  | 'seller_responded'
  | 'completed'
  | 'expired'
  | 'refunded'
  | 'forfeited'

export interface Reservation {
  id: string
  vehicle_id: string
  buyer_id: string
  seller_id: string
  deposit_cents: number
  stripe_payment_intent_id: string | null
  status: ReservationStatus
  seller_response: string | null
  seller_responded_at: string | null
  buyer_confirmed_at: string | null
  expires_at: string
  subscription_freebie: boolean
  created_at: string
  vehicle_title?: string
  vehicle_image?: string
  seller_name?: string
}

export interface DepositInfo {
  amount_cents: number
  free_remaining: number
  is_free: boolean
}

interface DepositTierConfig {
  deposit_cents: number
  free_per_month: number
}

const DEPOSIT_BY_PLAN: Record<string, DepositTierConfig> = {
  free: { deposit_cents: 5000, free_per_month: 0 },
  basic: { deposit_cents: 2500, free_per_month: 1 },
  premium: { deposit_cents: 1000, free_per_month: 3 },
  founding: { deposit_cents: 1000, free_per_month: 3 },
}

const SELLER_RESPONSE_MIN_LENGTH = 50

/**
 * Composable for the full reservation lifecycle.
 * Uses Supabase for data persistence and useSubscriptionPlan for tier checks.
 */
export function useReservation() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const reservations = ref<Reservation[]>([])
  const loading = ref(false)
  const creating = ref(false)

  /**
   * Fetch all reservations where the current user is the buyer.
   * Joins vehicle title, image, and seller name for display.
   */
  async function fetchMyReservations(): Promise<void> {
    if (!user.value) return

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(
          `
          *,
          vehicles:vehicle_id (
            title,
            main_image
          ),
          seller:seller_id (
            raw_user_meta_data
          )
        `,
        )
        .eq('buyer_id', user.value.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      reservations.value = (data ?? []).map((row: Record<string, unknown>) => {
        const vehicles = row.vehicles as Record<string, unknown> | null
        const seller = row.seller as Record<string, unknown> | null
        const metaData = seller?.raw_user_meta_data as Record<string, unknown> | null

        return {
          id: row.id as string,
          vehicle_id: row.vehicle_id as string,
          buyer_id: row.buyer_id as string,
          seller_id: row.seller_id as string,
          deposit_cents: row.deposit_cents as number,
          stripe_payment_intent_id: row.stripe_payment_intent_id as string | null,
          status: row.status as ReservationStatus,
          seller_response: row.seller_response as string | null,
          seller_responded_at: row.seller_responded_at as string | null,
          buyer_confirmed_at: row.buyer_confirmed_at as string | null,
          expires_at: row.expires_at as string,
          subscription_freebie: row.subscription_freebie as boolean,
          created_at: row.created_at as string,
          vehicle_title: (vehicles?.title as string) ?? undefined,
          vehicle_image: (vehicles?.main_image as string) ?? undefined,
          seller_name: (metaData?.full_name as string) ?? undefined,
        } satisfies Reservation
      })
    } finally {
      loading.value = false
    }
  }

  /**
   * Compute the deposit amount and free reservation availability
   * based on the buyer's subscription tier and this month's usage.
   */
  async function getDepositInfo(): Promise<DepositInfo> {
    if (!user.value) {
      return { amount_cents: 5000, free_remaining: 0, is_free: false }
    }

    const { currentPlan } = useSubscriptionPlan(user.value.id)

    // Wait a tick for the subscription fetch to complete
    await nextTick()

    const plan = currentPlan.value
    const tier = DEPOSIT_BY_PLAN[plan] ?? DEPOSIT_BY_PLAN.free

    if (tier.free_per_month === 0) {
      return {
        amount_cents: tier.deposit_cents,
        free_remaining: 0,
        is_free: false,
      }
    }

    // Count freebies used this calendar month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { count, error } = await supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('buyer_id', user.value.id)
      .eq('subscription_freebie', true)
      .gte('created_at', monthStart)

    if (error) throw error

    const usedFreebies = count ?? 0
    const freeRemaining = Math.max(0, tier.free_per_month - usedFreebies)

    return {
      amount_cents: freeRemaining > 0 ? 0 : tier.deposit_cents,
      free_remaining: freeRemaining,
      is_free: freeRemaining > 0,
    }
  }

  /**
   * Create a new reservation for a vehicle.
   * Validates no active reservation exists, computes deposit, and calls the API.
   */
  async function createReservation(vehicleId: string): Promise<Reservation> {
    if (!user.value) {
      throw new Error('Must be logged in to create a reservation')
    }

    const existing = await getActiveReservationForVehicle(vehicleId)
    if (existing) {
      throw new Error('An active reservation already exists for this vehicle')
    }

    creating.value = true
    try {
      const depositInfo = await getDepositInfo()

      const reservation = await $fetch<Reservation>('/api/reservations/create', {
        method: 'POST',
        body: {
          vehicleId,
          depositCents: depositInfo.amount_cents,
        },
      })

      // Add to local state
      reservations.value.unshift(reservation)

      return reservation
    } finally {
      creating.value = false
    }
  }

  /**
   * Seller responds to a reservation with a message.
   * Message must be at least 50 characters.
   */
  async function respondToReservation(reservationId: string, message: string): Promise<void> {
    if (message.length < SELLER_RESPONSE_MIN_LENGTH) {
      throw new Error(`Response must be at least ${SELLER_RESPONSE_MIN_LENGTH} characters`)
    }

    const { error } = await supabase
      .from('reservations')
      .update({
        status: 'seller_responded' as ReservationStatus,
        seller_response: message,
        seller_responded_at: new Date().toISOString(),
      })
      .eq('id', reservationId)
      .eq('status', 'active')

    if (error) throw error

    // Update local state
    const idx = reservations.value.findIndex((r) => r.id === reservationId)
    if (idx !== -1) {
      reservations.value[idx] = {
        ...reservations.value[idx],
        status: 'seller_responded',
        seller_response: message,
        seller_responded_at: new Date().toISOString(),
      }
    }
  }

  /**
   * Buyer cancels a pending or active reservation.
   * Sets status to 'refunded'.
   */
  async function cancelReservation(reservationId: string): Promise<void> {
    if (!user.value) {
      throw new Error('Must be logged in to cancel a reservation')
    }

    const { error } = await supabase
      .from('reservations')
      .update({ status: 'refunded' as ReservationStatus })
      .eq('id', reservationId)
      .eq('buyer_id', user.value.id)
      .in('status', ['pending', 'active'])

    if (error) throw error

    // Update local state
    const idx = reservations.value.findIndex((r) => r.id === reservationId)
    if (idx !== -1) {
      reservations.value[idx] = {
        ...reservations.value[idx],
        status: 'refunded',
      }
    }
  }

  /**
   * Buyer confirms a reservation after the seller has responded.
   * Sets status to 'completed' and records confirmation timestamp.
   */
  async function confirmReservation(reservationId: string): Promise<void> {
    if (!user.value) {
      throw new Error('Must be logged in to confirm a reservation')
    }

    const { error } = await supabase
      .from('reservations')
      .update({
        status: 'completed' as ReservationStatus,
        buyer_confirmed_at: new Date().toISOString(),
      })
      .eq('id', reservationId)
      .eq('buyer_id', user.value.id)
      .eq('status', 'seller_responded')

    if (error) throw error

    // Update local state
    const idx = reservations.value.findIndex((r) => r.id === reservationId)
    if (idx !== -1) {
      reservations.value[idx] = {
        ...reservations.value[idx],
        status: 'completed',
        buyer_confirmed_at: new Date().toISOString(),
      }
    }
  }

  /**
   * Get the active reservation for a specific vehicle, if one exists.
   * An "active" reservation has status pending, active, or seller_responded.
   */
  async function getActiveReservationForVehicle(vehicleId: string): Promise<Reservation | null> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .in('status', ['pending', 'active', 'seller_responded'])
      .limit(1)
      .maybeSingle()

    if (error) throw error

    return (data as Reservation | null) ?? null
  }

  /**
   * Check whether a vehicle currently has any active reservation.
   */
  async function isVehicleReserved(vehicleId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('vehicle_id', vehicleId)
      .in('status', ['pending', 'active', 'seller_responded'])

    if (error) throw error

    return (count ?? 0) > 0
  }

  /**
   * Compute the human-readable time remaining until a reservation expires.
   * Returns a string like "23h 45m" or "0h 0m" if already expired.
   */
  function timeRemaining(reservation: Reservation): string {
    const now = Date.now()
    const expiresAt = new Date(reservation.expires_at).getTime()
    const diffMs = Math.max(0, expiresAt - now)

    const totalMinutes = Math.floor(diffMs / 60_000)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    return `${hours}h ${minutes}m`
  }

  return {
    reservations,
    loading,
    creating,
    fetchMyReservations,
    getDepositInfo,
    createReservation,
    respondToReservation,
    cancelReservation,
    confirmReservation,
    getActiveReservationForVehicle,
    isVehicleReserved,
    timeRemaining,
  }
}
