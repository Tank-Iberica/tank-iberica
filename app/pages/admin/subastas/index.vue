<script setup lang="ts">
import type { Auction, AuctionStatus } from '~/composables/useAuction'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { t } = useI18n()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = useSupabaseClient<any>()
const _router = useRouter()

// ---------- State ----------
const auctions = ref<Auction[]>([])
const vehicles = ref<{ id: string; brand: string; model: string; year: number | null }[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const activeTab = ref<AuctionStatus | 'all'>('all')

// Modal state
const activeModal = ref<'form' | 'cancel' | null>(null)
const editingAuction = ref<Auction | null>(null)

// Form data
const formData = ref({
  vehicle_id: '',
  title: '',
  description: '',
  start_price_cents: 0,
  reserve_price_cents: 0,
  bid_increment_cents: 500,
  deposit_cents: 5000,
  buyer_premium_pct: 5,
  starts_at: '',
  ends_at: '',
  anti_snipe_seconds: 120,
})

// Cancel state
const cancelAuctionId = ref<string | null>(null)
const cancelReason = ref('')

// ---------- Status tabs ----------
const statusTabs: { value: AuctionStatus | 'all'; label: string }[] = [
  { value: 'all', label: t('admin.subastas.tabs.all') },
  { value: 'scheduled', label: t('admin.subastas.tabs.scheduled') },
  { value: 'active', label: t('admin.subastas.tabs.active') },
  { value: 'ended', label: t('admin.subastas.tabs.ended') },
  { value: 'cancelled', label: t('admin.subastas.tabs.cancelled') },
]

// ---------- Computed ----------
const filteredAuctions = computed(() => {
  if (activeTab.value === 'all') return auctions.value
  if (activeTab.value === 'ended') {
    return auctions.value.filter(
      (a) => a.status === 'ended' || a.status === 'adjudicated' || a.status === 'no_sale',
    )
  }
  return auctions.value.filter((a) => a.status === activeTab.value)
})

const isFormValid = computed(() => {
  return (
    formData.value.vehicle_id &&
    formData.value.start_price_cents > 0 &&
    formData.value.starts_at &&
    formData.value.ends_at &&
    new Date(formData.value.ends_at) > new Date(formData.value.starts_at)
  )
})

// ---------- Data loading ----------
onMounted(async () => {
  await Promise.all([loadAuctions(), loadVehicles()])
})

async function loadAuctions() {
  loading.value = true
  error.value = null
  try {
    const { data, error: err } = await supabase
      .from('auctions')
      .select(
        `
        *,
        vehicle:vehicles(id, slug, brand, model, year, price, location, vehicle_images(url, position))
      `,
      )
      .order('created_at', { ascending: false })

    if (err) throw err
    auctions.value = (data || []) as Auction[]
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error loading auctions'
  } finally {
    loading.value = false
  }
}

async function loadVehicles() {
  const { data } = await supabase
    .from('vehicles')
    .select('id, brand, model, year')
    .in('status', ['published', 'draft'])
    .order('brand', { ascending: true })

  vehicles.value = (data || []) as {
    id: string
    brand: string
    model: string
    year: number | null
  }[]
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

function getVehicleLabel(auction: Auction): string {
  if (auction.vehicle) {
    return `${auction.vehicle.brand} ${auction.vehicle.model}${auction.vehicle.year ? ` (${auction.vehicle.year})` : ''}`
  }
  return auction.vehicle_id
}

function toLocalDatetime(isoString: string): string {
  if (!isoString) return ''
  const d = new Date(isoString)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

function fromLocalDatetime(localStr: string): string {
  if (!localStr) return ''
  return new Date(localStr).toISOString()
}

// ---------- Modal actions ----------
function openCreateModal() {
  editingAuction.value = null
  formData.value = {
    vehicle_id: '',
    title: '',
    description: '',
    start_price_cents: 0,
    reserve_price_cents: 0,
    bid_increment_cents: 500,
    deposit_cents: 5000,
    buyer_premium_pct: 5,
    starts_at: '',
    ends_at: '',
    anti_snipe_seconds: 120,
  }
  activeModal.value = 'form'
}

function openEditModal(auction: Auction) {
  editingAuction.value = auction
  formData.value = {
    vehicle_id: auction.vehicle_id,
    title: auction.title || '',
    description: auction.description || '',
    start_price_cents: auction.start_price_cents,
    reserve_price_cents: auction.reserve_price_cents || 0,
    bid_increment_cents: auction.bid_increment_cents,
    deposit_cents: auction.deposit_cents,
    buyer_premium_pct: auction.buyer_premium_pct,
    starts_at: toLocalDatetime(auction.starts_at),
    ends_at: toLocalDatetime(auction.ends_at),
    anti_snipe_seconds: auction.anti_snipe_seconds,
  }
  activeModal.value = 'form'
}

function openCancelModal(auctionId: string) {
  cancelAuctionId.value = auctionId
  cancelReason.value = ''
  activeModal.value = 'cancel'
}

function closeModal() {
  activeModal.value = null
  editingAuction.value = null
  cancelAuctionId.value = null
  cancelReason.value = ''
}

// ---------- CRUD ----------
async function saveAuction() {
  if (!isFormValid.value) return
  error.value = null

  const payload = {
    vehicle_id: formData.value.vehicle_id,
    title: formData.value.title || null,
    description: formData.value.description || null,
    start_price_cents: formData.value.start_price_cents,
    reserve_price_cents: formData.value.reserve_price_cents || null,
    bid_increment_cents: formData.value.bid_increment_cents,
    deposit_cents: formData.value.deposit_cents,
    buyer_premium_pct: formData.value.buyer_premium_pct,
    starts_at: fromLocalDatetime(formData.value.starts_at),
    ends_at: fromLocalDatetime(formData.value.ends_at),
    anti_snipe_seconds: formData.value.anti_snipe_seconds,
    status: 'scheduled' as AuctionStatus,
  }

  try {
    if (editingAuction.value) {
      const { error: err } = await supabase
        .from('auctions')
        .update(payload)
        .eq('id', editingAuction.value.id)

      if (err) throw err
    } else {
      const { error: err } = await supabase.from('auctions').insert({
        ...payload,
        vertical: 'vehiculos',
        current_bid_cents: 0,
        bid_count: 0,
      })

      if (err) throw err
    }

    closeModal()
    await loadAuctions()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error saving auction'
  }
}

async function cancelAuction() {
  if (!cancelAuctionId.value) return
  error.value = null

  try {
    const { error: err } = await supabase
      .from('auctions')
      .update({
        status: 'cancelled',
      })
      .eq('id', cancelAuctionId.value)

    if (err) throw err
    closeModal()
    await loadAuctions()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error cancelling auction'
  }
}

async function adjudicateAuction(auctionId: string) {
  error.value = null

  try {
    // Fetch highest bid
    const { data: topBid, error: bidErr } = await supabase
      .from('auction_bids')
      .select('*')
      .eq('auction_id', auctionId)
      .order('amount_cents', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (bidErr) throw bidErr

    if (!topBid) {
      error.value = t('admin.subastas.errors.noBids')
      return
    }

    const { error: err } = await supabase
      .from('auctions')
      .update({
        status: 'adjudicated',
        winner_id: topBid.user_id,
        winning_bid_cents: topBid.amount_cents,
      })
      .eq('id', auctionId)

    if (err) throw err

    // Mark winning bid
    await supabase.from('auction_bids').update({ is_winning: true }).eq('id', topBid.id)

    await loadAuctions()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error adjudicating auction'
  }
}
</script>

<template>
  <div class="admin-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1>{{ t('admin.subastas.title') }}</h1>
        <span class="count-badge">{{ filteredAuctions.length }}</span>
      </div>
      <button class="btn-primary" @click="openCreateModal">
        + {{ t('admin.subastas.create') }}
      </button>
    </div>

    <!-- Filter tabs -->
    <div class="page-content">
      <div class="tabs-row">
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          class="tab-btn"
          :class="{ active: activeTab === tab.value }"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Error -->
      <div v-if="error" class="alert-error">
        {{ error }}
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner" />
        <span>{{ t('admin.subastas.loading') }}</span>
      </div>

      <!-- Auction list -->
      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('admin.subastas.columns.vehicle') }}</th>
              <th>{{ t('admin.subastas.columns.title') }}</th>
              <th class="col-num">{{ t('admin.subastas.columns.startPrice') }}</th>
              <th class="col-num">{{ t('admin.subastas.columns.currentBid') }}</th>
              <th>{{ t('admin.subastas.columns.status') }}</th>
              <th>{{ t('admin.subastas.columns.startDate') }}</th>
              <th>{{ t('admin.subastas.columns.endDate') }}</th>
              <th class="col-num">{{ t('admin.subastas.columns.bids') }}</th>
              <th class="col-actions">{{ t('admin.subastas.columns.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="auction in filteredAuctions" :key="auction.id">
              <td>
                <NuxtLink :to="`/admin/subastas/${auction.id}`" class="vehicle-link">
                  <strong>{{ getVehicleLabel(auction) }}</strong>
                </NuxtLink>
              </td>
              <td class="text-muted">
                {{ auction.title || '-' }}
              </td>
              <td class="col-num">
                {{ formatCents(auction.start_price_cents) }}
              </td>
              <td class="col-num">
                <strong v-if="auction.current_bid_cents > 0">{{
                  formatCents(auction.current_bid_cents)
                }}</strong>
                <span v-else class="text-muted">-</span>
              </td>
              <td>
                <span class="status-badge" :class="getStatusClass(auction.status)">
                  {{ getStatusLabel(auction.status) }}
                </span>
              </td>
              <td class="text-small">
                {{ formatDate(auction.starts_at) }}
              </td>
              <td class="text-small">
                {{ formatDate(auction.ends_at) }}
              </td>
              <td class="col-num">
                {{ auction.bid_count }}
              </td>
              <td class="col-actions">
                <div class="row-actions">
                  <NuxtLink
                    :to="`/admin/subastas/${auction.id}`"
                    class="action-btn"
                    :title="t('admin.subastas.actions.view')"
                  >
                    &#128065;
                  </NuxtLink>
                  <button
                    v-if="auction.status === 'draft' || auction.status === 'scheduled'"
                    class="action-btn"
                    :title="t('admin.subastas.actions.edit')"
                    @click="openEditModal(auction)"
                  >
                    &#9998;
                  </button>
                  <button
                    v-if="auction.status === 'ended'"
                    class="action-btn action-adjudicate"
                    :title="t('admin.subastas.actions.adjudicate')"
                    @click="adjudicateAuction(auction.id)"
                  >
                    &#9989;
                  </button>
                  <button
                    v-if="
                      auction.status !== 'cancelled' &&
                      auction.status !== 'adjudicated' &&
                      auction.status !== 'no_sale'
                    "
                    class="action-btn action-cancel"
                    :title="t('admin.subastas.actions.cancel')"
                    @click="openCancelModal(auction.id)"
                  >
                    &#10060;
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredAuctions.length === 0">
              <td colspan="9" class="empty-cell">
                <div class="empty-state">
                  <span class="empty-icon">&#128268;</span>
                  <p>{{ t('admin.subastas.empty') }}</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div v-if="activeModal === 'form'" class="modal-overlay" @click.self="closeModal">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h3>
              {{ editingAuction ? t('admin.subastas.editTitle') : t('admin.subastas.createTitle') }}
            </h3>
            <button class="modal-close" @click="closeModal">&times;</button>
          </div>
          <div class="modal-body">
            <!-- Vehicle select -->
            <div class="form-group">
              <label>{{ t('admin.subastas.form.vehicle') }} *</label>
              <select v-model="formData.vehicle_id">
                <option value="" disabled>{{ t('admin.subastas.form.selectVehicle') }}</option>
                <option v-for="v in vehicles" :key="v.id" :value="v.id">
                  {{ v.brand }} {{ v.model }} {{ v.year ? `(${v.year})` : '' }}
                </option>
              </select>
            </div>

            <!-- Title & Description -->
            <div class="form-group">
              <label>{{ t('admin.subastas.form.title') }}</label>
              <input
                v-model="formData.title"
                type="text"
                :placeholder="t('admin.subastas.form.titlePlaceholder')"
              />
            </div>
            <div class="form-group">
              <label>{{ t('admin.subastas.form.description') }}</label>
              <textarea
                v-model="formData.description"
                rows="3"
                :placeholder="t('admin.subastas.form.descriptionPlaceholder')"
              />
            </div>

            <!-- Prices -->
            <div class="form-grid-2">
              <div class="form-group">
                <label>{{ t('admin.subastas.form.startPrice') }} * (cents)</label>
                <input
                  v-model.number="formData.start_price_cents"
                  type="number"
                  min="0"
                  step="100"
                />
                <span class="form-hint">{{ formatCents(formData.start_price_cents) }}</span>
              </div>
              <div class="form-group">
                <label>{{ t('admin.subastas.form.reservePrice') }} (cents)</label>
                <input
                  v-model.number="formData.reserve_price_cents"
                  type="number"
                  min="0"
                  step="100"
                />
                <span class="form-hint">{{ formatCents(formData.reserve_price_cents) }}</span>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label>{{ t('admin.subastas.form.bidIncrement') }} (cents)</label>
                <input
                  v-model.number="formData.bid_increment_cents"
                  type="number"
                  min="100"
                  step="100"
                />
                <span class="form-hint">{{ formatCents(formData.bid_increment_cents) }}</span>
              </div>
              <div class="form-group">
                <label>{{ t('admin.subastas.form.deposit') }} (cents)</label>
                <input v-model.number="formData.deposit_cents" type="number" min="0" step="100" />
                <span class="form-hint">{{ formatCents(formData.deposit_cents) }}</span>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label>{{ t('admin.subastas.form.buyerPremium') }} (%)</label>
                <input
                  v-model.number="formData.buyer_premium_pct"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                />
              </div>
              <div class="form-group">
                <label>{{ t('admin.subastas.form.antiSnipe') }} (s)</label>
                <input
                  v-model.number="formData.anti_snipe_seconds"
                  type="number"
                  min="0"
                  step="30"
                />
              </div>
            </div>

            <!-- Dates -->
            <div class="form-grid-2">
              <div class="form-group">
                <label>{{ t('admin.subastas.form.startsAt') }} *</label>
                <input v-model="formData.starts_at" type="datetime-local" />
              </div>
              <div class="form-group">
                <label>{{ t('admin.subastas.form.endsAt') }} *</label>
                <input v-model="formData.ends_at" type="datetime-local" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeModal">
              {{ t('admin.subastas.form.cancel') }}
            </button>
            <button class="btn-primary" :disabled="!isFormValid" @click="saveAuction">
              {{ editingAuction ? t('admin.subastas.form.save') : t('admin.subastas.form.create') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Cancel Confirmation Modal -->
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
            <button class="btn-danger" @click="cancelAuction">
              {{ t('admin.subastas.confirmCancel') }}
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

.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.count-badge {
  background: #e2e8f0;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
}

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
}

.btn-primary:hover {
  background: #1a3238;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================
   PAGE CONTENT
   ============================================ */
.page-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ============================================
   TABS
   ============================================ */
.tabs-row {
  display: flex;
  gap: 4px;
  background: white;
  padding: 6px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-btn {
  padding: 10px 18px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: #64748b;
  white-space: nowrap;
  min-height: 44px;
  transition: all 0.15s;
}

.tab-btn:hover {
  background: #f1f5f9;
}

.tab-btn.active {
  background: var(--color-primary, #23424a);
  color: white;
}

/* ============================================
   TABLE
   ============================================ */
.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
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

.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}

.data-table th {
  position: sticky;
  top: 0;
  background: #f8fafc;
  padding: 12px 14px;
  text-align: left;
  font-weight: 600;
  font-size: 0.8rem;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
  z-index: 10;
}

.data-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.9rem;
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
  width: 140px;
}

.text-muted {
  color: #64748b;
}

.text-small {
  font-size: 0.8rem;
}

.vehicle-link {
  color: #1e293b;
  text-decoration: none;
}

.vehicle-link:hover {
  color: var(--color-primary, #23424a);
  text-decoration: underline;
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

/* Row actions */
.row-actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
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

.action-adjudicate:hover {
  background: #f0fdf4;
  border-color: #22c55e;
}

.action-cancel:hover {
  background: #fef2f2;
  border-color: #fca5a5;
}

/* Empty state */
.empty-cell {
  text-align: center;
}

.empty-state {
  padding: 60px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.3;
  display: block;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 0 0 16px 0;
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
.modal-lg {
  max-width: 640px;
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
}

/* Buttons */
.btn-secondary {
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
}

.btn-secondary:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
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

/* Form elements */
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

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  min-height: 44px;
  box-sizing: border-box;
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-hint {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 4px;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.text-danger {
  color: #dc2626;
  font-size: 0.875rem;
}

/* ============================================
   RESPONSIVE -- Mobile-first
   ============================================ */
.page-header {
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
}

.form-grid-2 {
  grid-template-columns: 1fr;
}

.modal {
  margin: 10px;
}

@media (min-width: 480px) {
  .form-grid-2 {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    gap: 0;
    align-items: center;
  }

  .modal {
    margin: 0;
  }
}
</style>
