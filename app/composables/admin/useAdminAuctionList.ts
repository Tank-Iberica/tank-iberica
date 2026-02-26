import { formatPriceCents } from '~/composables/shared/useListingUtils'
import type { Database } from '~/types/supabase'
import type { AuctionStatus } from '~/composables/useAuction'
import type { RegistrationStatus, DepositStatus } from '~/composables/useAuctionRegistration'

// ─── Types ───────────────────────────────────────────────────
export interface AuctionListVehicle {
  id: string
  brand: string
  model: string
  year: number | null
  slug: string
}

export interface AuctionWithVehicle {
  id: string
  vehicle_id: string
  vertical: string
  title: string | null
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
  status: AuctionStatus
  created_at: string
  vehicle?: AuctionListVehicle
  registrations_count?: number
}

export interface AuctionRegistrationRow {
  id: string
  auction_id: string
  user_id: string
  id_type: string | null
  id_number: string | null
  company_name: string | null
  deposit_status: DepositStatus
  status: RegistrationStatus
  registered_at: string
  user?: {
    id: string
    email: string
    full_name: string | null
  }
}

export interface AuctionForm {
  vehicle_id: string
  title: string
  description: string
  start_price_cents: number
  reserve_price_cents: number
  bid_increment_cents: number
  deposit_cents: number
  buyer_premium_pct: number
  starts_at: string
  ends_at: string
  anti_snipe_seconds: number
  status: AuctionStatus
}

// ─── Constants ───────────────────────────────────────────────
export const STATUS_FILTERS: Array<{ value: AuctionStatus | 'all'; labelKey: string }> = [
  { value: 'all', labelKey: 'admin.subastas.tabs.all' },
  { value: 'draft', labelKey: 'admin.subastas.status.draft' },
  { value: 'scheduled', labelKey: 'admin.subastas.status.scheduled' },
  { value: 'active', labelKey: 'admin.subastas.status.active' },
  { value: 'ended', labelKey: 'admin.subastas.status.ended' },
  { value: 'adjudicated', labelKey: 'admin.subastas.status.adjudicated' },
  { value: 'cancelled', labelKey: 'admin.subastas.status.cancelled' },
]

export const STATUS_COLORS: Record<AuctionStatus, string> = {
  draft: '#6b7280',
  scheduled: '#3b82f6',
  active: '#16a34a',
  ended: '#f59e0b',
  adjudicated: '#8b5cf6',
  cancelled: '#dc2626',
  no_sale: '#9ca3af',
}

// ─── Composable ──────────────────────────────────────────────
export function useAdminAuctionList() {
  const { t } = useI18n()
  const toast = useToast()
  const supabase = useSupabaseClient<Database>()

  // ─── State ───────────────────────────────────────────────
  const activeFilter = ref<AuctionStatus | 'all'>('all')
  const auctions = ref<AuctionWithVehicle[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')

  // Create/Edit modal
  const auctionModal = ref({
    show: false,
    editing: null as AuctionWithVehicle | null,
    form: getEmptyForm(),
  })

  // Registrations panel
  const registrationsPanel = ref({
    show: false,
    auctionId: '',
    auctionTitle: '',
    registrations: [] as AuctionRegistrationRow[],
    loading: false,
  })

  // Vehicles for dropdown
  const vehicles = ref<AuctionListVehicle[]>([])
  const vehiclesLoading = ref(false)

  // ─── Empty form ──────────────────────────────────────────
  function getEmptyForm(): AuctionForm {
    return {
      vehicle_id: '',
      title: '',
      description: '',
      start_price_cents: 0,
      reserve_price_cents: 0,
      bid_increment_cents: 10000,
      deposit_cents: 50000,
      buyer_premium_pct: 5,
      starts_at: '',
      ends_at: '',
      anti_snipe_seconds: 300,
      status: 'draft' as AuctionStatus,
    }
  }

  // ─── Fetch auctions ─────────────────────────────────────
  async function fetchAuctions() {
    loading.value = true
    error.value = ''
    try {
      let query = supabase
        .from('auctions')
        .select(
          `
          *,
          vehicle:vehicles(id, brand, model, year, slug)
        `,
        )
        .order('created_at', { ascending: false })

      if (activeFilter.value !== 'all') {
        query = query.eq('status', activeFilter.value)
      }

      const { data, error: err } = await query
      if (err) throw err

      auctions.value = (data || []) as AuctionWithVehicle[]

      // Fetch registration counts for each auction
      for (const auction of auctions.value) {
        const { count } = await supabase
          .from('auction_registrations')
          .select('id', { count: 'exact', head: true })
          .eq('auction_id', auction.id)
        auction.registrations_count = count || 0
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  // ─── Fetch vehicles for dropdown ────────────────────────
  async function fetchVehicles() {
    vehiclesLoading.value = true
    try {
      const { data } = await supabase
        .from('vehicles')
        .select('id, brand, model, year, slug')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(200)

      vehicles.value = (data || []) as AuctionListVehicle[]
    } catch {
      // Silent fail
    } finally {
      vehiclesLoading.value = false
    }
  }

  // ─── Create/Edit modal ──────────────────────────────────
  function openNewAuction() {
    if (vehicles.value.length === 0) fetchVehicles()
    auctionModal.value = {
      show: true,
      editing: null,
      form: getEmptyForm(),
    }
  }

  function openEditAuction(auction: AuctionWithVehicle) {
    if (vehicles.value.length === 0) fetchVehicles()
    auctionModal.value = {
      show: true,
      editing: auction,
      form: {
        vehicle_id: auction.vehicle_id,
        title: auction.title || '',
        description: '',
        start_price_cents: auction.start_price_cents,
        reserve_price_cents: auction.reserve_price_cents || 0,
        bid_increment_cents: auction.bid_increment_cents,
        deposit_cents: auction.deposit_cents,
        buyer_premium_pct: auction.buyer_premium_pct,
        starts_at: auction.starts_at ? auction.starts_at.slice(0, 16) : '',
        ends_at: auction.ends_at ? auction.ends_at.slice(0, 16) : '',
        anti_snipe_seconds: auction.anti_snipe_seconds,
        status: auction.status,
      },
    }
  }

  function closeAuctionModal() {
    auctionModal.value = { show: false, editing: null, form: getEmptyForm() }
  }

  async function saveAuction() {
    saving.value = true
    error.value = ''
    try {
      const f = auctionModal.value.form
      const payload = {
        vehicle_id: f.vehicle_id,
        title: f.title || null,
        start_price_cents: f.start_price_cents,
        reserve_price_cents: f.reserve_price_cents || null,
        bid_increment_cents: f.bid_increment_cents,
        deposit_cents: f.deposit_cents,
        buyer_premium_pct: f.buyer_premium_pct,
        starts_at: f.starts_at || null,
        ends_at: f.ends_at || null,
        anti_snipe_seconds: f.anti_snipe_seconds,
        status: f.status,
      }

      if (auctionModal.value.editing) {
        const { error: err } = await supabase
          .from('auctions')
          .update(payload)
          .eq('id', auctionModal.value.editing.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('auctions').insert(payload)
        if (err) throw err
      }

      closeAuctionModal()
      await fetchAuctions()
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      saving.value = false
    }
  }

  // ─── Cancel auction ─────────────────────────────────────
  async function cancelAuction(auctionId: string) {
    if (!confirm(t('admin.subastas.cancelConfirm'))) return
    saving.value = true
    error.value = ''
    try {
      const { error: err } = await supabase
        .from('auctions')
        .update({ status: 'cancelled' })
        .eq('id', auctionId)
      if (err) throw err
      await fetchAuctions()
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      saving.value = false
    }
  }

  // ─── Adjudicate manually ────────────────────────────────
  async function adjudicateAuction(auctionId: string) {
    if (!confirm(t('admin.subastas.detail.adjudicate'))) return
    saving.value = true
    error.value = ''
    try {
      const { error: err } = await supabase
        .from('auctions')
        .update({ status: 'adjudicated' })
        .eq('id', auctionId)
      if (err) throw err
      await fetchAuctions()
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      saving.value = false
    }
  }

  // ─── Registrations panel ────────────────────────────────
  async function openRegistrationsPanel(auction: AuctionWithVehicle) {
    registrationsPanel.value = {
      show: true,
      auctionId: auction.id,
      auctionTitle: auction.title || getVehicleTitle(auction),
      registrations: [],
      loading: true,
    }

    try {
      const { data } = await supabase
        .from('auction_registrations')
        .select(
          `
          *,
          user:profiles(id, email, full_name)
        `,
        )
        .eq('auction_id', auction.id)
        .order('registered_at', { ascending: false })

      registrationsPanel.value.registrations = (data || []) as AuctionRegistrationRow[]
    } catch {
      // Silent fail
    } finally {
      registrationsPanel.value.loading = false
    }
  }

  function closeRegistrationsPanel() {
    registrationsPanel.value = {
      show: false,
      auctionId: '',
      auctionTitle: '',
      registrations: [],
      loading: false,
    }
  }

  // ─── Approve / Reject registration ──────────────────────
  async function approveRegistration(regId: string) {
    try {
      const { error: err } = await supabase
        .from('auction_registrations')
        .update({ status: 'approved' })
        .eq('id', regId)
      if (err) throw err

      // Update locally
      const idx = registrationsPanel.value.registrations.findIndex((r) => r.id === regId)
      if (idx !== -1) {
        registrationsPanel.value.registrations[idx].status = 'approved'
      }
    } catch {
      toast.error(t('toast.approveError'))
    }
  }

  async function rejectRegistration(regId: string) {
    const reason = prompt(t('admin.subastas.cancelReason'))
    if (!reason) return

    try {
      const { error: err } = await supabase
        .from('auction_registrations')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', regId)
      if (err) throw err

      // Update locally
      const idx = registrationsPanel.value.registrations.findIndex((r) => r.id === regId)
      if (idx !== -1) {
        registrationsPanel.value.registrations[idx].status = 'rejected'
      }
    } catch {
      toast.error(t('toast.rejectError'))
    }
  }

  // ─── Helpers ────────────────────────────────────────────
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

  function getStatusColor(status: AuctionStatus): string {
    return STATUS_COLORS[status] || '#6b7280'
  }

  function getVehicleTitle(auction: AuctionWithVehicle): string {
    if (auction.vehicle) {
      return `${auction.vehicle.brand} ${auction.vehicle.model} ${auction.vehicle.year || ''}`
    }
    return auction.vehicle_id
  }

  function canEdit(auction: AuctionWithVehicle): boolean {
    return auction.status === 'draft' || auction.status === 'scheduled'
  }

  function canCancel(auction: AuctionWithVehicle): boolean {
    return auction.status !== 'ended' && auction.status !== 'cancelled'
  }

  function canAdjudicate(auction: AuctionWithVehicle): boolean {
    return auction.status === 'ended'
  }

  // ─── Watch ──────────────────────────────────────────────
  watch(activeFilter, fetchAuctions)

  return {
    // State
    activeFilter,
    auctions,
    loading,
    saving,
    error,
    auctionModal,
    registrationsPanel,
    vehicles,
    vehiclesLoading,

    // Functions
    fetchAuctions,
    fetchVehicles,
    openNewAuction,
    openEditAuction,
    closeAuctionModal,
    saveAuction,
    cancelAuction,
    adjudicateAuction,
    openRegistrationsPanel,
    closeRegistrationsPanel,
    approveRegistration,
    rejectRegistration,

    // Helpers
    formatDate,
    getStatusColor,
    getVehicleTitle,
    canEdit,
    canCancel,
    canAdjudicate,
    formatPriceCents,
  }
}
