<script setup lang="ts">
import type { Database } from '~/types/supabase'
import type { AuctionStatus } from '~/composables/useAuction'
import type { RegistrationStatus, DepositStatus } from '~/composables/useAuctionRegistration'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { t } = useI18n()
const supabase = useSupabaseClient<Database>()

// ─── Types ───────────────────────────────────────────────────
interface Vehicle {
  id: string
  brand: string
  model: string
  year: number | null
  slug: string
}

interface AuctionWithVehicle {
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
  vehicle?: Vehicle
  registrations_count?: number
}

interface AuctionRegistrationRow {
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

// ─── Constants ───────────────────────────────────────────────
const STATUS_FILTERS: Array<{ value: AuctionStatus | 'all'; labelKey: string }> = [
  { value: 'all', labelKey: 'admin.subastas.tabs.all' },
  { value: 'draft', labelKey: 'admin.subastas.status.draft' },
  { value: 'scheduled', labelKey: 'admin.subastas.status.scheduled' },
  { value: 'active', labelKey: 'admin.subastas.status.active' },
  { value: 'ended', labelKey: 'admin.subastas.status.ended' },
  { value: 'adjudicated', labelKey: 'admin.subastas.status.adjudicated' },
  { value: 'cancelled', labelKey: 'admin.subastas.status.cancelled' },
]

const STATUS_COLORS: Record<AuctionStatus, string> = {
  draft: '#6b7280',
  scheduled: '#3b82f6',
  active: '#16a34a',
  ended: '#f59e0b',
  adjudicated: '#8b5cf6',
  cancelled: '#dc2626',
  no_sale: '#9ca3af',
}

// ─── State ───────────────────────────────────────────────────
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
const vehicles = ref<Vehicle[]>([])
const vehiclesLoading = ref(false)

// ─── Empty form ──────────────────────────────────────────────
function getEmptyForm() {
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

// ─── Fetch auctions ──────────────────────────────────────────
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

// ─── Fetch vehicles for dropdown ─────────────────────────────
async function fetchVehicles() {
  vehiclesLoading.value = true
  try {
    const { data } = await supabase
      .from('vehicles')
      .select('id, brand, model, year, slug')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(200)

    vehicles.value = (data || []) as Vehicle[]
  } catch {
    // Silent fail
  } finally {
    vehiclesLoading.value = false
  }
}

// ─── Create/Edit modal ───────────────────────────────────────
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

// ─── Cancel auction ──────────────────────────────────────────
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

// ─── Adjudicate manually ─────────────────────────────────────
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

// ─── Registrations panel ─────────────────────────────────────
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

// ─── Approve / Reject registration ───────────────────────────
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
    alert('Error al aprobar')
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
    alert('Error al rechazar')
  }
}

// ─── Helpers ─────────────────────────────────────────────────
function formatPrice(cents: number | null): string {
  if (!cents) return '-'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
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

// ─── Init ────────────────────────────────────────────────────
onMounted(() => {
  fetchAuctions()
})

watch(activeFilter, fetchAuctions)
</script>

<template>
  <div class="admin-subastas">
    <!-- Header -->
    <div class="section-header">
      <div class="header-left">
        <h2>{{ t('admin.subastas.title') }}</h2>
        <span v-if="!loading" class="total-badge">{{ auctions.length }} total</span>
      </div>
      <button class="btn-primary" @click="openNewAuction">
        + {{ t('admin.subastas.create') }}
      </button>
    </div>

    <!-- Filter tabs -->
    <div class="filters-bar">
      <div class="filter-group status-filter">
        <button
          v-for="f in STATUS_FILTERS"
          :key="f.value"
          class="filter-btn"
          :class="{ active: activeFilter === f.value }"
          @click="activeFilter = f.value"
        >
          {{ t(f.labelKey) }}
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>{{ t('admin.subastas.loading') }}</span>
    </div>

    <!-- Auctions list -->
    <div v-else-if="auctions.length > 0" class="auctions-list">
      <div v-for="auction in auctions" :key="auction.id" class="auction-card">
        <!-- Card header -->
        <div class="auction-card-header">
          <div class="auction-main-info">
            <h3 class="auction-title">{{ auction.title || getVehicleTitle(auction) }}</h3>
            <div class="auction-meta">
              <span
                class="status-badge"
                :style="{
                  backgroundColor: getStatusColor(auction.status) + '1a',
                  color: getStatusColor(auction.status),
                  borderColor: getStatusColor(auction.status) + '40',
                }"
              >
                {{ t(`admin.subastas.status.${auction.status}`) }}
              </span>
              <span class="meta-item">
                {{ auction.bid_count || 0 }} {{ t('admin.subastas.columns.bids') }}
              </span>
              <span class="meta-item">
                {{ auction.registrations_count || 0 }}
                {{ t('admin.subastas.detail.registeredBidders') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Card body -->
        <div class="auction-card-body">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">{{ t('admin.subastas.columns.startPrice') }}</span>
              <span class="info-value">{{ formatPrice(auction.start_price_cents) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ t('admin.subastas.columns.currentBid') }}</span>
              <span class="info-value current-bid">
                {{
                  auction.current_bid_cents > 0
                    ? formatPrice(auction.current_bid_cents)
                    : t('admin.subastas.errors.noBids')
                }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ t('admin.subastas.form.reservePrice') }}</span>
              <span class="info-value">{{ formatPrice(auction.reserve_price_cents) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ t('admin.subastas.form.deposit') }}</span>
              <span class="info-value">{{ formatPrice(auction.deposit_cents) }}</span>
            </div>
          </div>

          <div class="dates-row">
            <div class="date-item">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span>{{ formatDate(auction.starts_at) }}</span>
            </div>
            <span class="date-separator">→</span>
            <div class="date-item">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span>{{ formatDate(auction.ends_at) }}</span>
            </div>
          </div>
        </div>

        <!-- Card actions -->
        <div class="auction-card-actions">
          <button
            v-if="canEdit(auction)"
            class="action-btn action-edit"
            :disabled="saving"
            @click="openEditAuction(auction)"
          >
            {{ t('admin.subastas.actions.edit') }}
          </button>
          <button class="action-btn action-registrations" @click="openRegistrationsPanel(auction)">
            {{ t('admin.subastas.detail.bidders') }} ({{ auction.registrations_count || 0 }})
          </button>
          <button
            v-if="canAdjudicate(auction)"
            class="action-btn action-adjudicate"
            :disabled="saving"
            @click="adjudicateAuction(auction.id)"
          >
            {{ t('admin.subastas.actions.adjudicate') }}
          </button>
          <button
            v-if="canCancel(auction)"
            class="action-btn action-cancel"
            :disabled="saving"
            @click="cancelAuction(auction.id)"
          >
            {{ t('admin.subastas.actions.cancel') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state-container">
      <div class="empty-icon">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9ca3af"
          stroke-width="1.5"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      </div>
      <h3 class="empty-title">{{ t('admin.subastas.empty') }}</h3>
    </div>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- MODAL: CREATE / EDIT AUCTION                            -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="auctionModal.show" class="modal-overlay" @click.self="closeAuctionModal">
        <div class="modal-content modal-large">
          <div class="modal-header">
            <h3>
              {{
                auctionModal.editing
                  ? t('admin.subastas.editTitle')
                  : t('admin.subastas.createTitle')
              }}
            </h3>
            <button class="modal-close" @click="closeAuctionModal">&times;</button>
          </div>
          <div class="modal-body">
            <!-- Vehicle -->
            <div class="form-group">
              <label for="auction-vehicle">{{ t('admin.subastas.form.vehicle') }} *</label>
              <select id="auction-vehicle" v-model="auctionModal.form.vehicle_id" required>
                <option value="" disabled>
                  {{ t('admin.subastas.form.selectVehicle') }}
                </option>
                <option v-for="v in vehicles" :key="v.id" :value="v.id">
                  {{ v.brand }} {{ v.model }} {{ v.year || '' }} ({{ v.slug }})
                </option>
              </select>
            </div>

            <!-- Title (optional) -->
            <div class="form-group">
              <label for="auction-title">{{ t('admin.subastas.form.title') }}</label>
              <input
                id="auction-title"
                v-model="auctionModal.form.title"
                type="text"
                :placeholder="t('admin.subastas.form.titlePlaceholder')"
              >
            </div>

            <!-- Prices -->
            <div class="form-row">
              <div class="form-group">
                <label for="auction-start-price"
                  >{{ t('admin.subastas.form.startPrice') }} (€) *</label
                >
                <input
                  id="auction-start-price"
                  v-model.number="auctionModal.form.start_price_cents"
                  type="number"
                  min="0"
                  step="100"
                  required
                >
              </div>
              <div class="form-group">
                <label for="auction-reserve-price"
                  >{{ t('admin.subastas.form.reservePrice') }} (€)</label
                >
                <input
                  id="auction-reserve-price"
                  v-model.number="auctionModal.form.reserve_price_cents"
                  type="number"
                  min="0"
                  step="100"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="auction-bid-increment"
                  >{{ t('admin.subastas.form.bidIncrement') }} (€) *</label
                >
                <input
                  id="auction-bid-increment"
                  v-model.number="auctionModal.form.bid_increment_cents"
                  type="number"
                  min="1"
                  step="100"
                  required
                >
              </div>
              <div class="form-group">
                <label for="auction-deposit">{{ t('admin.subastas.form.deposit') }} (€) *</label>
                <input
                  id="auction-deposit"
                  v-model.number="auctionModal.form.deposit_cents"
                  type="number"
                  min="0"
                  step="100"
                  required
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="auction-buyer-premium"
                  >{{ t('admin.subastas.form.buyerPremium') }} (%) *</label
                >
                <input
                  id="auction-buyer-premium"
                  v-model.number="auctionModal.form.buyer_premium_pct"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  required
                >
              </div>
              <div class="form-group">
                <label for="auction-anti-snipe"
                  >{{ t('admin.subastas.form.antiSnipe') }} (seg) *</label
                >
                <input
                  id="auction-anti-snipe"
                  v-model.number="auctionModal.form.anti_snipe_seconds"
                  type="number"
                  min="0"
                  step="1"
                  required
                >
              </div>
            </div>

            <!-- Dates -->
            <div class="form-row">
              <div class="form-group">
                <label for="auction-starts">{{ t('admin.subastas.form.startsAt') }} *</label>
                <input
                  id="auction-starts"
                  v-model="auctionModal.form.starts_at"
                  type="datetime-local"
                  required
                >
              </div>
              <div class="form-group">
                <label for="auction-ends">{{ t('admin.subastas.form.endsAt') }} *</label>
                <input
                  id="auction-ends"
                  v-model="auctionModal.form.ends_at"
                  type="datetime-local"
                  required
                >
              </div>
            </div>

            <!-- Status -->
            <div class="form-group">
              <label for="auction-status">{{ t('admin.subastas.columns.status') }} *</label>
              <select id="auction-status" v-model="auctionModal.form.status" required>
                <option value="draft">{{ t('admin.subastas.status.draft') }}</option>
                <option value="scheduled">{{ t('admin.subastas.status.scheduled') }}</option>
                <option value="active">{{ t('admin.subastas.status.active') }}</option>
                <option value="ended">{{ t('admin.subastas.status.ended') }}</option>
                <option value="adjudicated">{{ t('admin.subastas.status.adjudicated') }}</option>
                <option value="cancelled">{{ t('admin.subastas.status.cancelled') }}</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeAuctionModal">
              {{ t('admin.subastas.form.cancel') }}
            </button>
            <button
              class="btn-primary"
              :disabled="saving || !auctionModal.form.vehicle_id"
              @click="saveAuction"
            >
              {{
                saving
                  ? '...'
                  : auctionModal.editing
                    ? t('admin.subastas.form.save')
                    : t('admin.subastas.form.create')
              }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- MODAL: REGISTRATIONS                                    -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div
        v-if="registrationsPanel.show"
        class="modal-overlay"
        @click.self="closeRegistrationsPanel"
      >
        <div class="modal-content modal-large">
          <div class="modal-header">
            <h3>
              {{ t('admin.subastas.detail.bidders') }} — {{ registrationsPanel.auctionTitle }}
            </h3>
            <button class="modal-close" @click="closeRegistrationsPanel">&times;</button>
          </div>
          <div class="modal-body">
            <div v-if="registrationsPanel.loading" class="loading-state">
              <div class="spinner" />
              <span>{{ t('admin.subastas.loading') }}</span>
            </div>
            <div v-else-if="registrationsPanel.registrations.length === 0" class="empty-state">
              {{ t('admin.subastas.detail.noBidders') }}
            </div>
            <table v-else class="registrations-table">
              <thead>
                <tr>
                  <th>{{ t('admin.subastas.detail.bidderUser') }}</th>
                  <th>{{ t('admin.subastas.detail.bidderIdType') }}</th>
                  <th>{{ t('admin.subastas.detail.bidderIdNumber') }}</th>
                  <th>{{ t('admin.subastas.detail.bidderCompany') }}</th>
                  <th>{{ t('admin.subastas.detail.bidderDeposit') }}</th>
                  <th>{{ t('admin.subastas.detail.bidderStatus') }}</th>
                  <th>{{ t('admin.subastas.detail.bidderActions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="reg in registrationsPanel.registrations" :key="reg.id">
                  <td>
                    <div class="user-cell">
                      <strong>{{ reg.user?.full_name || 'N/A' }}</strong>
                      <span class="user-email">{{ reg.user?.email }}</span>
                    </div>
                  </td>
                  <td>{{ reg.id_type || '-' }}</td>
                  <td>{{ reg.id_number || '-' }}</td>
                  <td>{{ reg.company_name || '-' }}</td>
                  <td>
                    <span class="deposit-badge" :class="`deposit-${reg.deposit_status}`">
                      {{ t(`admin.subastas.depositStatus.${reg.deposit_status}`) }}
                    </span>
                  </td>
                  <td>
                    <span class="reg-status-badge" :class="`reg-status-${reg.status}`">
                      {{ t(`admin.subastas.regStatus.${reg.status}`) }}
                    </span>
                  </td>
                  <td>
                    <div class="reg-actions">
                      <button
                        v-if="reg.status === 'pending'"
                        class="reg-btn reg-approve"
                        @click="approveRegistration(reg.id)"
                      >
                        {{ t('admin.subastas.detail.approve') }}
                      </button>
                      <button
                        v-if="reg.status === 'pending'"
                        class="reg-btn reg-reject"
                        @click="rejectRegistration(reg.id)"
                      >
                        {{ t('admin.subastas.detail.reject') }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeRegistrationsPanel">
              {{ t('admin.dealerSubscriptions.closeBtn') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.admin-subastas {
  padding: 0;
}

/* ============================================
   HEADER
   ============================================ */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #111827;
}

.total-badge {
  background: #f3f4f6;
  color: #6b7280;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
}

/* ============================================
   FILTERS
   ============================================ */
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  align-items: center;
}

.filter-group {
  display: flex;
  gap: 0;
}

.status-filter {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.filter-btn {
  padding: 8px 14px;
  border: none;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
  transition:
    background 0.2s,
    color 0.2s;
  min-height: 44px;
  white-space: nowrap;
}

.filter-btn:not(:last-child) {
  border-right: 1px solid #e5e7eb;
}

.filter-btn.active {
  background: var(--color-primary, #23424a);
  color: white;
}

.filter-btn:hover:not(.active) {
  background: #f3f4f6;
}

/* ============================================
   ERROR / LOADING
   ============================================ */
.error-banner {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: #64748b;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ============================================
   AUCTIONS LIST
   ============================================ */
.auctions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.auction-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.auction-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

/* Card header */
.auction-card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
}

.auction-main-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.auction-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.auction-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid;
}

.meta-item {
  font-size: 0.8rem;
  color: #6b7280;
}

/* Card body */
.auction-card-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.info-value {
  font-size: 0.95rem;
  color: #374151;
  font-weight: 600;
}

.info-value.current-bid {
  color: var(--color-primary, #23424a);
}

.dates-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
  font-size: 0.8rem;
  color: #6b7280;
}

.date-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.date-separator {
  color: #d1d5db;
  font-weight: 600;
}

/* Card actions */
.auction-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 20px;
  background: #f9fafb;
  border-top: 1px solid #f3f4f6;
}

.action-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
  min-height: 44px;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-edit {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
}

.action-edit:hover:not(:disabled) {
  background: #dbeafe;
}

.action-registrations {
  background: #f0fdf4;
  color: #16a34a;
  border-color: #bbf7d0;
}

.action-registrations:hover {
  background: #dcfce7;
}

.action-adjudicate {
  background: #faf5ff;
  color: #7c3aed;
  border-color: #e9d5ff;
}

.action-adjudicate:hover:not(:disabled) {
  background: #f3e8ff;
}

.action-cancel {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}

.action-cancel:hover:not(:disabled) {
  background: #fee2e2;
}

/* ============================================
   EMPTY STATE
   ============================================ */
.empty-state-container {
  background: white;
  border-radius: 8px;
  padding: 60px 24px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  margin-bottom: 16px;
}

.empty-title {
  margin: 0;
  font-size: 1.1rem;
  color: #374151;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

/* ============================================
   MODAL
   ============================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-large {
  max-width: 720px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  position: sticky;
  bottom: 0;
}

/* ============================================
   FORM
   ============================================ */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 6px;
  color: #374151;
  font-size: 0.875rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  box-sizing: border-box;
  min-height: 44px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* ============================================
   REGISTRATIONS TABLE
   ============================================ */
.registrations-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.registrations-table th,
.registrations-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.registrations-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.user-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-email {
  font-size: 0.75rem;
  color: #6b7280;
}

.deposit-badge,
.reg-status-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.deposit-pending {
  background: #fef3c7;
  color: #92400e;
}

.deposit-held {
  background: #dbeafe;
  color: #1d4ed8;
}

.deposit-captured {
  background: #dcfce7;
  color: #15803d;
}

.deposit-released {
  background: #f3f4f6;
  color: #6b7280;
}

.deposit-forfeited {
  background: #fee2e2;
  color: #991b1b;
}

.reg-status-pending {
  background: #fef3c7;
  color: #92400e;
}

.reg-status-approved {
  background: #dcfce7;
  color: #15803d;
}

.reg-status-rejected {
  background: #fee2e2;
  color: #991b1b;
}

.reg-actions {
  display: flex;
  gap: 6px;
}

.reg-btn {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  min-height: 36px;
}

.reg-approve {
  background: #dcfce7;
  color: #15803d;
  border-color: #bbf7d0;
}

.reg-approve:hover {
  background: #bbf7d0;
}

.reg-reject {
  background: #fee2e2;
  color: #991b1b;
  border-color: #fecaca;
}

.reg-reject:hover {
  background: #fecaca;
}

/* ============================================
   BUTTONS
   ============================================ */
.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  min-height: 44px;
  font-size: 0.9rem;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  min-height: 44px;
}

/* ============================================
   RESPONSIVE — Mobile-first
   ============================================ */

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .auction-card-actions {
    flex-direction: column;
  }

  .registrations-table {
    font-size: 0.75rem;
  }

  .registrations-table th,
  .registrations-table td {
    padding: 8px;
  }
}

@media (min-width: 768px) {
  .auction-card-header {
    padding: 16px 24px;
  }

  .auction-card-body {
    padding: 16px 24px;
  }

  .auction-card-actions {
    padding: 12px 24px;
  }

  .info-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1024px) {
  .auction-card-actions {
    gap: 10px;
  }
}
</style>
