/**
 * Negotiation Workflow Composable
 *
 * Manages offer → counteroffer → acceptance flow within conversations.
 */

import type { Database } from '~~/types/supabase'

export type OfferStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'countered'
  | 'expired'
  | 'withdrawn'

export interface NegotiationOffer {
  id: string
  conversation_id: string
  vehicle_id: string
  sender_id: string
  amount_cents: number
  currency: string
  message: string | null
  status: OfferStatus
  parent_offer_id: string | null
  expires_at: string | null
  responded_at: string | null
  created_at: string
}

export function useNegotiation() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const offers = ref<NegotiationOffer[]>([])
  const loading = ref(false)

  const latestOffer = computed<NegotiationOffer | null>(() => {
    if (offers.value.length === 0) return null
    return offers.value.at(-1) ?? null
  })

  const hasPendingOffer = computed<boolean>(() => {
    return offers.value.some((o) => o.status === 'pending')
  })

  const isMyTurn = computed<boolean>(() => {
    if (!user.value || !latestOffer.value) return false
    // My turn to respond if the latest pending offer was NOT sent by me
    return latestOffer.value.status === 'pending' && latestOffer.value.sender_id !== user.value.id
  })

  async function fetchOffers(conversationId: string): Promise<void> {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('negotiation_offers')
        .select(
          'id, conversation_id, vehicle_id, sender_id, amount_cents, currency, message, status, parent_offer_id, expires_at, responded_at, created_at',
        )
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      offers.value = (data ?? []) as NegotiationOffer[]
    } finally {
      loading.value = false
    }
  }

  async function makeOffer(
    conversationId: string,
    vehicleId: string,
    amountCents: number,
    message?: string,
  ): Promise<string | null> {
    if (!user.value) return null

    const { data, error } = await supabase
      .from('negotiation_offers')
      .insert({
        conversation_id: conversationId,
        vehicle_id: vehicleId,
        sender_id: user.value.id,
        amount_cents: amountCents,
        currency: 'EUR',
        message: message || null,
      })
      .select('id')
      .single()

    if (error) throw error
    await fetchOffers(conversationId)
    return data?.id ?? null
  }

  async function counterOffer(
    conversationId: string,
    vehicleId: string,
    parentOfferId: string,
    amountCents: number,
    message?: string,
  ): Promise<string | null> {
    if (!user.value) return null

    // Mark parent as countered
    await supabase
      .from('negotiation_offers')
      .update({ status: 'countered', responded_at: new Date().toISOString() })
      .eq('id', parentOfferId)

    // Create counter offer
    const { data, error } = await supabase
      .from('negotiation_offers')
      .insert({
        conversation_id: conversationId,
        vehicle_id: vehicleId,
        sender_id: user.value.id,
        amount_cents: amountCents,
        currency: 'EUR',
        message: message || null,
        parent_offer_id: parentOfferId,
      })
      .select('id')
      .single()

    if (error) throw error
    await fetchOffers(conversationId)
    return data?.id ?? null
  }

  async function acceptOffer(offerId: string, conversationId: string): Promise<void> {
    await supabase
      .from('negotiation_offers')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', offerId)

    await fetchOffers(conversationId)
  }

  async function rejectOffer(offerId: string, conversationId: string): Promise<void> {
    await supabase
      .from('negotiation_offers')
      .update({ status: 'rejected', responded_at: new Date().toISOString() })
      .eq('id', offerId)

    await fetchOffers(conversationId)
  }

  async function withdrawOffer(offerId: string, conversationId: string): Promise<void> {
    await supabase
      .from('negotiation_offers')
      .update({ status: 'withdrawn', responded_at: new Date().toISOString() })
      .eq('id', offerId)

    await fetchOffers(conversationId)
  }

  function formatAmount(amountCents: number, currency = 'EUR'): string {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amountCents / 100)
  }

  return {
    offers,
    loading,
    latestOffer,
    hasPendingOffer,
    isMyTurn,
    fetchOffers,
    makeOffer,
    counterOffer,
    acceptOffer,
    rejectOffer,
    withdrawOffer,
    formatAmount,
  }
}
