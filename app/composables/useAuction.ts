/**
 * Auction Composable
 * Handles auction listing, bidding, and realtime updates via Supabase
 */

import type { RealtimeChannel } from '@supabase/supabase-js'

export type AuctionStatus =
  | 'draft'
  | 'scheduled'
  | 'active'
  | 'ended'
  | 'adjudicated'
  | 'cancelled'
  | 'no_sale'

export interface Auction {
  id: string
  vehicle_id: string
  vertical: string
  title: string | null
  description: string | null
  start_price_cents: number
  reserve_price_cents: number | null
  current_bid_cents: number
  bid_count: number
  bid_increment_cents: number
  deposit_cents: number
  buyer_premium_pct: number
  starts_at: string
  ends_at: string
  anti_snipe_seconds: number
  extended_until: string | null
  status: AuctionStatus
  winner_id: string | null
  winning_bid_cents: number | null
  created_at: string
  // Joined data
  vehicle?: {
    id: string
    slug: string
    brand: string
    model: string
    year: number | null
    price: number | null
    location: string | null
    vehicle_images: { url: string; position: number }[]
  }
}

export interface AuctionBid {
  id: string
  auction_id: string
  user_id: string
  amount_cents: number
  is_winning: boolean
  created_at: string
}

/**
 * Format cents to a EUR currency string (0 decimal places).
 * Exported standalone so display components can import without calling useAuction().
 */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export function useAuction() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabaseClient<any>()

  const auctions = ref<Auction[]>([])
  const auction = ref<Auction | null>(null)
  const bids = ref<AuctionBid[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let bidChannel: RealtimeChannel | null = null
  let auctionChannel: RealtimeChannel | null = null

  // --- Fetch auctions list (public) ---
  async function fetchAuctions(filters?: {
    status?: AuctionStatus | AuctionStatus[]
    vertical?: string
  }) {
    loading.value = true
    error.value = null
    try {
      let query = supabase
        .from('auctions')
        .select(
          `
          *,
          vehicle:vehicles(id, slug, brand, model, year, price, location, vehicle_images(url, position))
        `,
        )
        .order('starts_at', { ascending: true })

      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status)
        } else {
          query = query.eq('status', filters.status)
        }
      }
      if (filters?.vertical) {
        query = query.eq('vertical', filters.vertical)
      }

      const { data, error: fetchErr } = await query
      if (fetchErr) throw fetchErr
      auctions.value = (data || []) as Auction[]
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error fetching auctions'
    } finally {
      loading.value = false
    }
  }

  // --- Fetch single auction with bids ---
  async function fetchAuctionById(id: string) {
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchErr } = await supabase
        .from('auctions')
        .select(
          `
          *,
          vehicle:vehicles(id, slug, brand, model, year, price, location, vehicle_images(url, position))
        `,
        )
        .eq('id', id)
        .single()

      if (fetchErr) throw fetchErr
      auction.value = data as Auction

      // Fetch bids for this auction
      await fetchBids(id)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error fetching auction'
    } finally {
      loading.value = false
    }
  }

  // --- Fetch bids for an auction ---
  async function fetchBids(auctionId: string) {
    const { data, error: fetchErr } = await supabase
      .from('auction_bids')
      .select('*')
      .eq('auction_id', auctionId)
      .order('amount_cents', { ascending: false })

    if (fetchErr) {
      error.value = fetchErr.message
      return
    }
    bids.value = (data || []) as AuctionBid[]
  }

  // --- Place a bid ---
  async function placeBid(auctionId: string, amountCents: number): Promise<boolean> {
    error.value = null
    const user = useSupabaseUser()
    if (!user.value) {
      error.value = 'Debes iniciar sesión para pujar'
      return false
    }
    try {
      const { error: insertErr } = await supabase.from('auction_bids').insert({
        auction_id: auctionId,
        user_id: user.value.id,
        amount_cents: amountCents,
      })

      if (insertErr) throw insertErr

      // --- Anti-snipe: extend auction if bid lands within the snipe window ---
      if (auction.value) {
        const now = Date.now()
        const effectiveEnd = new Date(
          auction.value.extended_until || auction.value.ends_at,
        ).getTime()
        const windowMs = auction.value.anti_snipe_seconds * 1000

        if (effectiveEnd - now <= windowMs) {
          // New deadline = now + anti_snipe_seconds
          const newExtendedUntil = new Date(now + windowMs).toISOString()

          const { error: updateErr } = await supabase
            .from('auctions')
            .update({ extended_until: newExtendedUntil })
            .eq('id', auctionId)

          if (!updateErr) {
            // Reflect extension locally so the countdown updates immediately
            auction.value.extended_until = newExtendedUntil
          }
        }
      }

      return true
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error placing bid'
      return false
    }
  }

  // --- Realtime subscriptions ---

  /**
   * Subscribe to realtime updates for bids and auction status changes
   */
  function subscribeToAuction(auctionId: string) {
    // Subscribe to new bids
    bidChannel = supabase
      .channel(`auction-bids:${auctionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'auction_bids',
          filter: `auction_id=eq.${auctionId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const newBid = payload.new as unknown as AuctionBid

          // Avoid duplicates
          if (!bids.value.find((b) => b.id === newBid.id)) {
            bids.value = [newBid, ...bids.value]
          }

          // Update auction current bid locally
          if (auction.value) {
            auction.value.current_bid_cents = Number(newBid.amount_cents)
            auction.value.bid_count = (auction.value.bid_count || 0) + 1
          }
        },
      )
      .subscribe()

    // Subscribe to auction updates (status, anti-sniping extensions)
    auctionChannel = supabase
      .channel(`auction-status:${auctionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'auctions',
          filter: `id=eq.${auctionId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const updated = payload.new as unknown as Auction
          if (auction.value) {
            auction.value.status = updated.status
            auction.value.extended_until = updated.extended_until
            auction.value.current_bid_cents = updated.current_bid_cents
            auction.value.bid_count = updated.bid_count
            auction.value.winner_id = updated.winner_id
            auction.value.winning_bid_cents = updated.winning_bid_cents
          }
        },
      )
      .subscribe()
  }

  /**
   * Unsubscribe from all realtime channels
   */
  function unsubscribe() {
    if (bidChannel) {
      supabase.removeChannel(bidChannel)
      bidChannel = null
    }
    if (auctionChannel) {
      supabase.removeChannel(auctionChannel)
      auctionChannel = null
    }
  }

  // --- Helpers ---

  /**
   * Get the effective end time, accounting for anti-snipe extensions
   */
  function getEffectiveEndTime(a: Auction): Date {
    return new Date(a.extended_until || a.ends_at)
  }

  /**
   * Calculate the minimum next bid amount in cents
   */
  function getMinimumBid(a: Auction): number {
    if (a.current_bid_cents > 0) {
      return a.current_bid_cents + a.bid_increment_cents
    }
    return a.start_price_cents
  }

  // Cleanup on unmount
  onUnmounted(() => {
    unsubscribe()
  })

  return {
    auctions: readonly(auctions),
    auction,
    bids: readonly(bids),
    loading: readonly(loading),
    error: readonly(error),
    fetchAuctions,
    fetchAuctionById,
    fetchBids,
    placeBid,
    subscribeToAuction,
    unsubscribe,
    getEffectiveEndTime,
    getMinimumBid,
    formatCents,
  }
}
