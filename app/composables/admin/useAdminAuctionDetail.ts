import type { Ref } from 'vue'
import type { Auction, AuctionStatus, AuctionBid } from '~/composables/useAuction'
import type {
  AuctionRegistration,
  RegistrationStatus,
  DepositStatus,
} from '~/composables/useAuctionRegistration'

export type ModalType = 'cancel' | 'adjudicate' | 'reject' | null

export function useAdminAuctionDetail(auctionId: Ref<string>) {
  const { t } = useI18n()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabaseClient<any>()

  // ---------- State ----------
  const auction = ref<Auction | null>(null)
  const bids = ref<AuctionBid[]>([])
  const registrations = ref<AuctionRegistration[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const actionLoading = ref(false)

  // Modals
  const activeModal = ref<ModalType>(null)
  const cancelReason = ref('')
  const rejectRegId = ref<string | null>(null)
  const rejectReason = ref('')

  // ---------- Computed ----------
  const reserveMet = computed(() => {
    if (!auction.value) return false
    if (!auction.value.reserve_price_cents) return true
    return auction.value.current_bid_cents >= auction.value.reserve_price_cents
  })

  const highestBid = computed(() => {
    if (!bids.value.length) return null
    return bids.value[0]
  })

  // ---------- Data loading ----------
  async function loadAuctionData() {
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
        .eq('id', auctionId.value)
        .single()

      if (fetchErr) throw fetchErr
      auction.value = data as Auction

      await loadBids()
      await loadRegistrations()
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error loading auction'
    } finally {
      loading.value = false
    }
  }

  async function loadBids() {
    const { data, error: err } = await supabase
      .from('auction_bids')
      .select('*')
      .eq('auction_id', auctionId.value)
      .order('amount_cents', { ascending: false })

    if (err) {
      error.value = err.message
      return
    }
    bids.value = (data || []) as AuctionBid[]
  }

  async function loadRegistrations() {
    const { data, error: err } = await supabase
      .from('auction_registrations')
      .select('*')
      .eq('auction_id', auctionId.value)
      .order('registered_at', { ascending: false })

    if (err) {
      error.value = err.message
      return
    }
    registrations.value = (data || []) as AuctionRegistration[]
  }

  // ---------- Helpers ----------
  function formatCents(cents: number | null): string {
    if (!cents && cents !== 0) return '-'
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function formatDateShort(dateStr: string | null): string {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  function getStatusClass(status: AuctionStatus): string {
    const classes: Record<string, string> = {
      draft: 'status-draft',
      scheduled: 'status-scheduled',
      active: 'status-active',
      ended: 'status-ended',
      adjudicated: 'status-adjudicated',
      cancelled: 'status-cancelled',
      no_sale: 'status-no-sale',
    }
    return classes[status] || ''
  }

  function getStatusLabel(status: AuctionStatus): string {
    return t(`admin.subastas.status.${status}`)
  }

  function getRegStatusClass(status: RegistrationStatus): string {
    const classes: Record<string, string> = {
      pending: 'reg-pending',
      approved: 'reg-approved',
      rejected: 'reg-rejected',
    }
    return classes[status] || ''
  }

  function getRegStatusLabel(status: RegistrationStatus): string {
    return t(`admin.subastas.regStatus.${status}`)
  }

  function getDepositStatusLabel(status: DepositStatus): string {
    return t(`admin.subastas.depositStatus.${status}`)
  }

  function getDepositStatusClass(status: DepositStatus): string {
    const classes: Record<string, string> = {
      pending: 'deposit-pending',
      held: 'deposit-held',
      captured: 'deposit-captured',
      released: 'deposit-released',
      forfeited: 'deposit-forfeited',
    }
    return classes[status] || ''
  }

  function getVehicleLabel(): string {
    if (auction.value?.vehicle) {
      const v = auction.value.vehicle
      return `${v.brand} ${v.model}${v.year ? ` (${v.year})` : ''}`
    }
    return auction.value?.vehicle_id || '-'
  }

  function getVehicleThumbnail(): string | null {
    const images = auction.value?.vehicle?.vehicle_images
    if (!images?.length) return null
    return [...images].sort((a, b) => a.position - b.position)[0]?.url || null
  }

  // ---------- Auction Actions ----------
  async function startAuction() {
    if (!auction.value) return
    actionLoading.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('auctions')
        .update({ status: 'active' })
        .eq('id', auctionId.value)

      if (err) throw err
      await loadAuctionData()
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error starting auction'
    } finally {
      actionLoading.value = false
    }
  }

  async function endAuction() {
    if (!auction.value) return
    actionLoading.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('auctions')
        .update({ status: 'ended' })
        .eq('id', auctionId.value)

      if (err) throw err
      await loadAuctionData()
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error ending auction'
    } finally {
      actionLoading.value = false
    }
  }

  function openCancelModal() {
    cancelReason.value = ''
    activeModal.value = 'cancel'
  }

  async function confirmCancel() {
    if (!auction.value) return
    actionLoading.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('auctions')
        .update({ status: 'cancelled' })
        .eq('id', auctionId.value)

      if (err) throw err
      activeModal.value = null
      await loadAuctionData()
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error cancelling auction'
    } finally {
      actionLoading.value = false
    }
  }

  function openAdjudicateModal() {
    activeModal.value = 'adjudicate'
  }

  async function confirmAdjudicate() {
    if (!auction.value || !highestBid.value) return
    actionLoading.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('auctions')
        .update({
          status: 'adjudicated',
          winner_id: highestBid.value.user_id,
          winning_bid_cents: highestBid.value.amount_cents,
        })
        .eq('id', auctionId.value)

      if (err) throw err

      // Mark winning bid
      await supabase.from('auction_bids').update({ is_winning: true }).eq('id', highestBid.value.id)

      activeModal.value = null
      await loadAuctionData()
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error adjudicating auction'
    } finally {
      actionLoading.value = false
    }
  }

  async function markNoSale() {
    if (!auction.value) return
    actionLoading.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('auctions')
        .update({ status: 'no_sale' })
        .eq('id', auctionId.value)

      if (err) throw err
      activeModal.value = null
      await loadAuctionData()
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error marking as no sale'
    } finally {
      actionLoading.value = false
    }
  }

  // ---------- Registration Actions ----------
  async function approveRegistration(regId: string) {
    actionLoading.value = true
    error.value = null
    try {
      const user = useSupabaseUser()
      const { error: err } = await supabase
        .from('auction_registrations')
        .update({
          status: 'approved',
          approved_by: user.value?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', regId)

      if (err) throw err
      await loadRegistrations()
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error approving registration'
    } finally {
      actionLoading.value = false
    }
  }

  function openRejectModal(regId: string) {
    rejectRegId.value = regId
    rejectReason.value = ''
    activeModal.value = 'reject'
  }

  async function confirmReject() {
    if (!rejectRegId.value) return
    actionLoading.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('auction_registrations')
        .update({
          status: 'rejected',
          rejection_reason: rejectReason.value || null,
        })
        .eq('id', rejectRegId.value)

      if (err) throw err
      activeModal.value = null
      rejectRegId.value = null
      await loadRegistrations()
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error rejecting registration'
    } finally {
      actionLoading.value = false
    }
  }

  function closeModal() {
    activeModal.value = null
    rejectRegId.value = null
  }

  return {
    // State
    auction,
    bids,
    registrations,
    loading,
    error,
    actionLoading,
    activeModal,
    cancelReason,
    rejectReason,

    // Computed
    reserveMet,
    highestBid,

    // Data loading
    loadAuctionData,

    // Helpers
    formatCents,
    formatDate,
    formatDateShort,
    getStatusClass,
    getStatusLabel,
    getRegStatusClass,
    getRegStatusLabel,
    getDepositStatusLabel,
    getDepositStatusClass,
    getVehicleLabel,
    getVehicleThumbnail,

    // Auction actions
    startAuction,
    endAuction,
    openCancelModal,
    confirmCancel,
    openAdjudicateModal,
    confirmAdjudicate,
    markNoSale,

    // Registration actions
    approveRegistration,
    openRejectModal,
    confirmReject,
    closeModal,
  }
}
