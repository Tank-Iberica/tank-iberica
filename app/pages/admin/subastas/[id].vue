<script setup lang="ts">
import type { Auction, AuctionStatus, AuctionBid } from '~/composables/useAuction'
import type {
  AuctionRegistration,
  RegistrationStatus,
  DepositStatus,
} from '~/composables/useAuctionRegistration'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { t } = useI18n()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = useSupabaseClient<any>()
const route = useRoute()
const router = useRouter()

const auctionId = computed(() => route.params.id as string)

// ---------- State ----------
const auction = ref<Auction | null>(null)
const bids = ref<AuctionBid[]>([])
const registrations = ref<AuctionRegistration[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const actionLoading = ref(false)

// Modals
const activeModal = ref<'cancel' | 'adjudicate' | 'reject' | null>(null)
const cancelReason = ref('')
const rejectRegId = ref<string | null>(null)
const rejectReason = ref('')

// Adjudication state
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
onMounted(async () => {
  await loadAuctionData()
})

async function loadAuctionData() {
  loading.value = true
  error.value = null
  try {
    // Fetch auction with vehicle join
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

    // Fetch bids
    await loadBids()

    // Fetch registrations
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

// ---------- Actions ----------
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

// ---------- Registration actions ----------
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

function goBack() {
  router.push('/admin/subastas')
}
</script>

<template>
  <div class="admin-page">
    <!-- Loading -->
    <div v-if="loading && !auction" class="loading-state">
      <div class="spinner" />
      <span>{{ t('admin.subastas.loading') }}</span>
    </div>

    <template v-else-if="auction">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <button class="btn-back" @click="goBack">&larr;</button>
          <div class="header-info">
            <h1>{{ auction.title || getVehicleLabel() }}</h1>
            <span class="status-badge" :class="getStatusClass(auction.status)">
              {{ getStatusLabel(auction.status) }}
            </span>
          </div>
        </div>
        <NuxtLink to="/admin/subastas" class="btn-secondary btn-sm-link">
          {{ t('admin.subastas.backToList') }}
        </NuxtLink>
      </div>

      <!-- Error -->
      <div v-if="error" class="alert-error">
        {{ error }}
      </div>

      <div class="page-content">
        <!-- ==============================
             AUCTION INFO SECTION
             ============================== -->
        <section class="section">
          <h2 class="section-title">{{ t('admin.subastas.detail.info') }}</h2>
          <div class="info-grid">
            <!-- Vehicle card -->
            <div class="info-card vehicle-card">
              <div class="vehicle-thumb">
                <img
                  v-if="getVehicleThumbnail()"
                  :src="getVehicleThumbnail()!"
                  :alt="getVehicleLabel()"
                />
                <span v-else class="thumb-placeholder">&#128247;</span>
              </div>
              <div class="vehicle-info">
                <strong>{{ getVehicleLabel() }}</strong>
                <span v-if="auction.vehicle?.location" class="text-muted">{{
                  auction.vehicle.location
                }}</span>
                <span v-if="auction.vehicle?.price" class="vehicle-price">
                  {{
                    new Intl.NumberFormat('es-ES', {
                      style: 'currency',
                      currency: 'EUR',
                      minimumFractionDigits: 0,
                    }).format(auction.vehicle.price)
                  }}
                </span>
              </div>
            </div>

            <!-- Config -->
            <div class="info-card">
              <h3>{{ t('admin.subastas.detail.config') }}</h3>
              <dl class="info-dl">
                <div class="dl-row">
                  <dt>{{ t('admin.subastas.detail.startPrice') }}</dt>
                  <dd>{{ formatCents(auction.start_price_cents) }}</dd>
                </div>
                <div class="dl-row">
                  <dt>{{ t('admin.subastas.detail.reservePrice') }}</dt>
                  <dd>
                    {{
                      auction.reserve_price_cents
                        ? formatCents(auction.reserve_price_cents)
                        : t('admin.subastas.detail.noReserve')
                    }}
                  </dd>
                </div>
                <div class="dl-row">
                  <dt>{{ t('admin.subastas.detail.currentBid') }}</dt>
                  <dd>
                    <strong>{{
                      auction.current_bid_cents > 0 ? formatCents(auction.current_bid_cents) : '-'
                    }}</strong>
                  </dd>
                </div>
                <div class="dl-row">
                  <dt>{{ t('admin.subastas.detail.bidIncrement') }}</dt>
                  <dd>{{ formatCents(auction.bid_increment_cents) }}</dd>
                </div>
                <div class="dl-row">
                  <dt>{{ t('admin.subastas.detail.deposit') }}</dt>
                  <dd>{{ formatCents(auction.deposit_cents) }}</dd>
                </div>
                <div class="dl-row">
                  <dt>{{ t('admin.subastas.detail.buyerPremium') }}</dt>
                  <dd>{{ auction.buyer_premium_pct }}%</dd>
                </div>
                <div class="dl-row">
                  <dt>{{ t('admin.subastas.detail.antiSnipe') }}</dt>
                  <dd>{{ auction.anti_snipe_seconds }}s</dd>
                </div>
              </dl>
            </div>

            <!-- Dates -->
            <div class="info-card">
              <h3>{{ t('admin.subastas.detail.dates') }}</h3>
              <dl class="info-dl">
                <div class="dl-row">
                  <dt>{{ t('admin.subastas.detail.startsAt') }}</dt>
                  <dd>{{ formatDate(auction.starts_at) }}</dd>
                </div>
                <div class="dl-row">
                  <dt>{{ t('admin.subastas.detail.endsAt') }}</dt>
                  <dd>{{ formatDate(auction.ends_at) }}</dd>
                </div>
                <div v-if="auction.extended_until" class="dl-row">
                  <dt>{{ t('admin.subastas.detail.extendedUntil') }}</dt>
                  <dd class="text-warning">{{ formatDate(auction.extended_until) }}</dd>
                </div>
                <div class="dl-row">
                  <dt>{{ t('admin.subastas.detail.created') }}</dt>
                  <dd class="text-muted">{{ formatDate(auction.created_at) }}</dd>
                </div>
              </dl>
            </div>

            <!-- Stats summary -->
            <div class="info-card stats-card">
              <h3>{{ t('admin.subastas.detail.stats') }}</h3>
              <div class="stats-grid">
                <div class="stat">
                  <span class="stat-value">{{ auction.bid_count }}</span>
                  <span class="stat-label">{{ t('admin.subastas.detail.totalBids') }}</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{ registrations.length }}</span>
                  <span class="stat-label">{{ t('admin.subastas.detail.registeredBidders') }}</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{
                    registrations.filter((r) => r.status === 'approved').length
                  }}</span>
                  <span class="stat-label">{{ t('admin.subastas.detail.approvedBidders') }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div v-if="auction.description" class="auction-description">
            <h3>{{ t('admin.subastas.detail.description') }}</h3>
            <p>{{ auction.description }}</p>
          </div>

          <!-- Winner info -->
          <div v-if="auction.winner_id" class="winner-card">
            <h3>{{ t('admin.subastas.detail.winner') }}</h3>
            <div class="winner-info">
              <span class="winner-badge">&#127942;</span>
              <div>
                <strong>{{ t('admin.subastas.detail.winnerId') }}: {{ auction.winner_id }}</strong>
                <span
                  >{{ t('admin.subastas.detail.winningBid') }}:
                  {{ formatCents(auction.winning_bid_cents) }}</span
                >
              </div>
            </div>
          </div>
        </section>

        <!-- ==============================
             ACTIONS SECTION
             ============================== -->
        <section class="section actions-section">
          <h2 class="section-title">{{ t('admin.subastas.detail.actions') }}</h2>
          <div class="actions-row">
            <!-- Start auction -->
            <button
              v-if="auction.status === 'scheduled' && new Date(auction.starts_at) <= new Date()"
              class="btn-action btn-start"
              :disabled="actionLoading"
              @click="startAuction"
            >
              &#9654; {{ t('admin.subastas.detail.startAuction') }}
            </button>

            <!-- End auction manually -->
            <button
              v-if="auction.status === 'active'"
              class="btn-action btn-end"
              :disabled="actionLoading"
              @click="endAuction"
            >
              &#9632; {{ t('admin.subastas.detail.endAuction') }}
            </button>

            <!-- Adjudicate -->
            <button
              v-if="auction.status === 'ended' && bids.length > 0"
              class="btn-action btn-adjudicate"
              :disabled="actionLoading"
              @click="openAdjudicateModal"
            >
              &#9989; {{ t('admin.subastas.detail.adjudicate') }}
            </button>

            <!-- Cancel -->
            <button
              v-if="
                auction.status !== 'cancelled' &&
                auction.status !== 'adjudicated' &&
                auction.status !== 'no_sale'
              "
              class="btn-action btn-cancel"
              :disabled="actionLoading"
              @click="openCancelModal"
            >
              &#10060; {{ t('admin.subastas.detail.cancelAuction') }}
            </button>

            <!-- Refresh -->
            <button
              class="btn-action btn-refresh"
              :disabled="actionLoading"
              @click="loadAuctionData"
            >
              &#8634; {{ t('admin.subastas.detail.refresh') }}
            </button>
          </div>
        </section>

        <!-- ==============================
             REGISTERED BIDDERS SECTION
             ============================== -->
        <section class="section">
          <h2 class="section-title">
            {{ t('admin.subastas.detail.bidders') }}
            <span class="count-badge-sm">{{ registrations.length }}</span>
          </h2>

          <div v-if="registrations.length === 0" class="empty-msg">
            {{ t('admin.subastas.detail.noBidders') }}
          </div>

          <div v-else class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ t('admin.subastas.detail.bidderUser') }}</th>
                  <th>{{ t('admin.subastas.detail.bidderIdType') }}</th>
                  <th>{{ t('admin.subastas.detail.bidderIdNumber') }}</th>
                  <th>{{ t('admin.subastas.detail.bidderCompany') }}</th>
                  <th>{{ t('admin.subastas.detail.bidderDeposit') }}</th>
                  <th>{{ t('admin.subastas.detail.bidderStatus') }}</th>
                  <th>{{ t('admin.subastas.detail.bidderDate') }}</th>
                  <th class="col-actions">{{ t('admin.subastas.detail.bidderActions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="reg in registrations" :key="reg.id">
                  <td class="text-small">{{ reg.user_id.slice(0, 8) }}...</td>
                  <td>{{ reg.id_type?.toUpperCase() || '-' }}</td>
                  <td>{{ reg.id_number || '-' }}</td>
                  <td class="text-small">{{ reg.company_name || '-' }}</td>
                  <td>
                    <span class="deposit-badge" :class="getDepositStatusClass(reg.deposit_status)">
                      {{ getDepositStatusLabel(reg.deposit_status) }}
                    </span>
                  </td>
                  <td>
                    <span class="reg-badge" :class="getRegStatusClass(reg.status)">
                      {{ getRegStatusLabel(reg.status) }}
                    </span>
                  </td>
                  <td class="text-small text-muted">{{ formatDateShort(reg.registered_at) }}</td>
                  <td class="col-actions">
                    <div class="row-actions">
                      <button
                        v-if="reg.status === 'pending'"
                        class="action-btn action-approve"
                        :title="t('admin.subastas.detail.approve')"
                        :disabled="actionLoading"
                        @click="approveRegistration(reg.id)"
                      >
                        &#10003;
                      </button>
                      <button
                        v-if="reg.status === 'pending'"
                        class="action-btn action-reject"
                        :title="t('admin.subastas.detail.reject')"
                        :disabled="actionLoading"
                        @click="openRejectModal(reg.id)"
                      >
                        &#10005;
                      </button>
                      <a
                        v-if="reg.id_document_url"
                        :href="reg.id_document_url"
                        target="_blank"
                        rel="noopener"
                        class="action-btn"
                        :title="t('admin.subastas.detail.viewDoc')"
                      >
                        &#128196;
                      </a>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ==============================
             BID HISTORY SECTION
             ============================== -->
        <section class="section">
          <h2 class="section-title">
            {{ t('admin.subastas.detail.bidHistory') }}
            <span class="count-badge-sm">{{ bids.length }}</span>
          </h2>

          <div v-if="bids.length === 0" class="empty-msg">
            {{ t('admin.subastas.detail.noBids') }}
          </div>

          <div v-else class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{{ t('admin.subastas.detail.bidUser') }}</th>
                  <th class="col-num">{{ t('admin.subastas.detail.bidAmount') }}</th>
                  <th>{{ t('admin.subastas.detail.bidTime') }}</th>
                  <th>{{ t('admin.subastas.detail.bidWinning') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(bid, idx) in bids"
                  :key="bid.id"
                  :class="{ 'bid-winning': bid.is_winning }"
                >
                  <td class="text-muted">{{ bids.length - idx }}</td>
                  <td class="text-small">{{ bid.user_id.slice(0, 8) }}...</td>
                  <td class="col-num">
                    <strong>{{ formatCents(bid.amount_cents) }}</strong>
                  </td>
                  <td class="text-small">{{ formatDateShort(bid.created_at) }}</td>
                  <td>
                    <span v-if="bid.is_winning" class="winner-indicator"
                      >&#127942; {{ t('admin.subastas.detail.winnerLabel') }}</span
                    >
                    <span v-else-if="idx === 0" class="highest-indicator"
                      >&#9650; {{ t('admin.subastas.detail.highest') }}</span
                    >
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </template>

    <!-- Auction not found -->
    <div v-else-if="!loading" class="empty-state-full">
      <p>{{ t('admin.subastas.notFound') }}</p>
      <NuxtLink to="/admin/subastas" class="btn-primary">{{
        t('admin.subastas.backToList')
      }}</NuxtLink>
    </div>

    <!-- ==============================
         MODALS
         ============================== -->

    <!-- Cancel Modal -->
    <Teleport to="body">
      <div v-if="activeModal === 'cancel'" class="modal-overlay" @click.self="closeModal">
        <div class="modal modal-sm">
          <div class="modal-header danger">
            <h3>{{ t('admin.subastas.cancelTitle') }}</h3>
            <button class="modal-close" @click="closeModal">&times;</button>
          </div>
          <div class="modal-body">
            <p>{{ t('admin.subastas.cancelConfirm') }}</p>
            <p class="text-danger">{{ t('admin.subastas.cancelWarning') }}</p>
            <div class="form-group">
              <label>{{ t('admin.subastas.cancelReason') }}</label>
              <textarea
                v-model="cancelReason"
                rows="2"
                :placeholder="t('admin.subastas.cancelReasonPlaceholder')"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeModal">
              {{ t('admin.subastas.form.cancel') }}
            </button>
            <button class="btn-danger" :disabled="actionLoading" @click="confirmCancel">
              {{ t('admin.subastas.confirmCancel') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Adjudicate Modal -->
    <Teleport to="body">
      <div v-if="activeModal === 'adjudicate'" class="modal-overlay" @click.self="closeModal">
        <div class="modal modal-md">
          <div class="modal-header">
            <h3>{{ t('admin.subastas.detail.adjudicateTitle') }}</h3>
            <button class="modal-close" @click="closeModal">&times;</button>
          </div>
          <div class="modal-body">
            <div v-if="highestBid" class="adjudicate-info">
              <div class="adjudicate-bid">
                <span class="adjudicate-label">{{ t('admin.subastas.detail.highestBid') }}</span>
                <strong class="adjudicate-amount">{{
                  formatCents(highestBid.amount_cents)
                }}</strong>
              </div>
              <div class="adjudicate-bidder">
                <span class="adjudicate-label">{{ t('admin.subastas.detail.bidder') }}</span>
                <span>{{ highestBid.user_id.slice(0, 12) }}...</span>
              </div>
            </div>

            <!-- Reserve check -->
            <div v-if="reserveMet" class="reserve-met">
              <span>&#9989;</span>
              <span>{{ t('admin.subastas.detail.reserveMet') }}</span>
            </div>
            <div v-else class="reserve-not-met">
              <span>&#9888;</span>
              <div>
                <strong>{{ t('admin.subastas.detail.reserveNotMet') }}</strong>
                <p>
                  {{ t('admin.subastas.detail.reserveNotMetDesc') }}
                  ({{ t('admin.subastas.detail.reserve') }}:
                  {{ formatCents(auction?.reserve_price_cents || 0) }},
                  {{ t('admin.subastas.detail.currentBid') }}:
                  {{ formatCents(auction?.current_bid_cents || 0) }})
                </p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeModal">
              {{ t('admin.subastas.form.cancel') }}
            </button>
            <button
              v-if="!reserveMet"
              class="btn-secondary"
              :disabled="actionLoading"
              @click="markNoSale"
            >
              {{ t('admin.subastas.detail.markNoSale') }}
            </button>
            <button
              class="btn-primary"
              :disabled="actionLoading || !highestBid"
              @click="confirmAdjudicate"
            >
              {{
                reserveMet
                  ? t('admin.subastas.detail.confirmAdjudicate')
                  : t('admin.subastas.detail.adjudicateAnyway')
              }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Reject Registration Modal -->
    <Teleport to="body">
      <div v-if="activeModal === 'reject'" class="modal-overlay" @click.self="closeModal">
        <div class="modal modal-sm">
          <div class="modal-header danger">
            <h3>{{ t('admin.subastas.detail.rejectTitle') }}</h3>
            <button class="modal-close" @click="closeModal">&times;</button>
          </div>
          <div class="modal-body">
            <p>{{ t('admin.subastas.detail.rejectConfirm') }}</p>
            <div class="form-group">
              <label>{{ t('admin.subastas.detail.rejectReasonLabel') }}</label>
              <textarea
                v-model="rejectReason"
                rows="2"
                :placeholder="t('admin.subastas.detail.rejectReasonPlaceholder')"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeModal">
              {{ t('admin.subastas.form.cancel') }}
            </button>
            <button class="btn-danger" :disabled="actionLoading" @click="confirmReject">
              {{ t('admin.subastas.detail.confirmReject') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* ============================================
   BASE LAYOUT
   ============================================ */
.admin-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

/* ============================================
   HEADER
   ============================================ */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-back {
  width: 44px;
  height: 44px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn-back:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.header-info h1 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: #1e293b;
}

.btn-secondary {
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.btn-secondary:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-sm-link {
  font-size: 0.875rem;
  padding: 8px 16px;
}

/* ============================================
   PAGE CONTENT
   ============================================ */
.page-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ============================================
   SECTIONS
   ============================================ */
.section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 20px 24px;
}

.section-title {
  margin: 0 0 16px;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ============================================
   INFO GRID
   ============================================ */
.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.info-card {
  padding: 16px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.info-card h3 {
  margin: 0 0 12px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

/* Vehicle card */
.vehicle-card {
  display: flex;
  gap: 16px;
  align-items: center;
}

.vehicle-thumb {
  width: 80px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.vehicle-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-placeholder {
  font-size: 24px;
  opacity: 0.3;
}

.vehicle-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vehicle-info strong {
  font-size: 1rem;
  color: #1e293b;
}

.vehicle-price {
  font-weight: 600;
  color: var(--color-primary, #23424a);
}

/* Info definition list */
.info-dl {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dl-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.dl-row dt {
  color: #64748b;
}

.dl-row dd {
  margin: 0;
  font-weight: 500;
  color: #1e293b;
}

/* Stats card */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;
}

/* Description */
.auction-description {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.auction-description h3 {
  margin: 0 0 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
}

.auction-description p {
  margin: 0;
  font-size: 0.9rem;
  color: #334155;
  line-height: 1.5;
}

/* Winner card */
.winner-card {
  margin-top: 16px;
  padding: 16px;
  background: #f0fdf4;
  border: 2px solid #22c55e;
  border-radius: 10px;
}

.winner-card h3 {
  margin: 0 0 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #16a34a;
  text-transform: uppercase;
}

.winner-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.winner-badge {
  font-size: 2rem;
}

.winner-info div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.winner-info strong {
  font-size: 0.9rem;
  color: #1e293b;
}

.winner-info span {
  font-size: 0.85rem;
  color: #16a34a;
  font-weight: 500;
}

/* ============================================
   ACTIONS SECTION
   ============================================ */
.actions-section {
  border: 2px solid #e2e8f0;
}

.actions-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-action {
  padding: 12px 20px;
  border-radius: 10px;
  border: 2px solid #e2e8f0;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  min-height: 48px;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-start {
  border-color: #22c55e;
  color: #16a34a;
}
.btn-start:hover:not(:disabled) {
  background: #f0fdf4;
}

.btn-end {
  border-color: #f59e0b;
  color: #92400e;
}
.btn-end:hover:not(:disabled) {
  background: #fffbeb;
}

.btn-adjudicate {
  border-color: #7c3aed;
  color: #7c3aed;
}
.btn-adjudicate:hover:not(:disabled) {
  background: #faf5ff;
}

.btn-cancel {
  border-color: #dc2626;
  color: #dc2626;
}
.btn-cancel:hover:not(:disabled) {
  background: #fef2f2;
}

.btn-refresh {
  border-color: #64748b;
  color: #475569;
}
.btn-refresh:hover:not(:disabled) {
  background: #f8fafc;
}

/* ============================================
   TABLE
   ============================================ */
.table-container {
  overflow: auto;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 700px;
}

.data-table th {
  position: sticky;
  top: 0;
  background: #f8fafc;
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 0.75rem;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
  z-index: 10;
}

.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.85rem;
  color: #334155;
}

.data-table tr:hover {
  background: #f8fafc;
}

.col-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.col-actions {
  width: 120px;
}

.text-muted {
  color: #64748b;
}
.text-small {
  font-size: 0.8rem;
}
.text-warning {
  color: #f59e0b;
  font-weight: 500;
}
.text-danger {
  color: #dc2626;
  font-size: 0.875rem;
}

/* Bid winning row */
.bid-winning {
  background: #f0fdf4 !important;
}

.winner-indicator {
  color: #16a34a;
  font-weight: 600;
  font-size: 0.8rem;
}

.highest-indicator {
  color: #1d4ed8;
  font-weight: 500;
  font-size: 0.8rem;
}

/* Status badges */
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-draft {
  background: #f1f5f9;
  color: #64748b;
}
.status-scheduled {
  background: #dbeafe;
  color: #1d4ed8;
}
.status-active {
  background: #dcfce7;
  color: #16a34a;
}
.status-ended {
  background: #fef3c7;
  color: #92400e;
}
.status-adjudicated {
  background: #ede9fe;
  color: #7c3aed;
}
.status-cancelled {
  background: #fee2e2;
  color: #dc2626;
}
.status-no-sale {
  background: #e2e8f0;
  color: #475569;
}

/* Registration badges */
.reg-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
}

.reg-pending {
  background: #fef3c7;
  color: #92400e;
}
.reg-approved {
  background: #dcfce7;
  color: #16a34a;
}
.reg-rejected {
  background: #fee2e2;
  color: #dc2626;
}

/* Deposit badges */
.deposit-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
}

.deposit-pending {
  background: #f1f5f9;
  color: #64748b;
}
.deposit-held {
  background: #dbeafe;
  color: #1d4ed8;
}
.deposit-captured {
  background: #dcfce7;
  color: #16a34a;
}
.deposit-released {
  background: #e2e8f0;
  color: #475569;
}
.deposit-forfeited {
  background: #fee2e2;
  color: #dc2626;
}

/* Row actions */
.row-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.15s;
  min-width: 36px;
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-approve:hover {
  background: #f0fdf4;
  border-color: #22c55e;
  color: #16a34a;
}

.action-reject:hover {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #dc2626;
}

/* Count badges */
.count-badge-sm {
  background: #e2e8f0;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

/* Empty states */
.empty-msg {
  text-align: center;
  color: #94a3b8;
  font-size: 0.875rem;
  padding: 32px 16px;
}

.empty-state-full {
  text-align: center;
  padding: 80px 20px;
  color: #64748b;
}

.empty-state-full p {
  margin: 0 0 16px;
  font-size: 1.1rem;
}

/* Loading */
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

/* Error */
.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
}

/* ============================================
   MODALS
   ============================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 20px;
  backdrop-filter: blur(2px);
}

.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: modalIn 0.2s ease-out;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-sm {
  max-width: 420px;
}
.modal-md {
  max-width: 540px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.modal-header.danger {
  background: #fef2f2;
  border-color: #fecaca;
}

.modal-header.danger h3 {
  color: #dc2626;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #475569;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 0 0 16px 16px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

/* Form elements in modal */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  margin-bottom: 6px;
}

.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  min-height: 80px;
  resize: vertical;
  box-sizing: border-box;
}

.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

/* Buttons */
.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.btn-primary:hover {
  background: #1a3238;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
}

.btn-danger:hover {
  background: #b91c1c;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Adjudicate modal */
.adjudicate-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 10px;
}

.adjudicate-bid,
.adjudicate-bidder {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.adjudicate-label {
  font-size: 0.85rem;
  color: #64748b;
}

.adjudicate-amount {
  font-size: 1.2rem;
  color: var(--color-primary, #23424a);
}

.reserve-met {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #22c55e;
  border-radius: 8px;
  color: #16a34a;
  font-weight: 500;
}

.reserve-not-met {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  color: #92400e;
}

.reserve-not-met strong {
  display: block;
  margin-bottom: 4px;
}

.reserve-not-met p {
  margin: 0;
  font-size: 0.85rem;
}

/* ============================================
   RESPONSIVE -- Mobile-first
   ============================================ */
.page-header {
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
}

.header-info {
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}

.header-info h1 {
  font-size: 1.1rem;
}

.info-grid {
  grid-template-columns: 1fr;
}

.actions-row {
  flex-direction: column;
}

.btn-action {
  width: 100%;
  justify-content: center;
}

.modal {
  margin: 10px;
}

@media (min-width: 480px) {
  .actions-row {
    flex-direction: row;
  }

  .btn-action {
    width: auto;
  }
}

@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    align-items: center;
  }

  .header-info {
    flex-direction: row;
    align-items: center;
  }

  .header-info h1 {
    font-size: 1.3rem;
  }

  .info-grid {
    grid-template-columns: 1fr 1fr;
  }

  .modal {
    margin: 0;
  }
}

@media (min-width: 1024px) {
  .info-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
