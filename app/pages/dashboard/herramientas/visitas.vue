<script setup lang="ts">
/**
 * Visit Management Tool
 * Dealers can configure availability time slots and manage visit bookings.
 */
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t, locale } = useI18n()
const supabase = useSupabaseClient()
const { dealerProfile, loadDealer } = useDealerDashboard()

// ---------- Types ----------

type BookingStatus = 'pending' | 'confirmed' | 'cancelled'

interface VisitSlot {
  id: string
  dealer_id: string
  day_of_week: number
  start_time: string
  end_time: string
  max_visitors: number
  created_at: string
}

interface VisitBooking {
  id: string
  dealer_id: string
  slot_id: string | null
  vehicle_id: string | null
  vehicle_brand: string
  vehicle_model: string
  buyer_name: string
  buyer_email: string | null
  visit_date: string
  visit_time: string
  status: BookingStatus
  notes: string | null
  created_at: string
}

interface SlotFormData {
  day_of_week: number
  start_time: string
  end_time: string
  max_visitors: number
}

// ---------- State ----------

const slots = ref<VisitSlot[]>([])
const bookings = ref<VisitBooking[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const successMsg = ref<string | null>(null)
const visitsEnabled = ref(true)

// Slot form
const slotForm = reactive<SlotFormData>({
  day_of_week: 1,
  start_time: '09:00',
  end_time: '18:00',
  max_visitors: 5,
})

// Days mapping
const daysKeys = [
  'visits.monday',
  'visits.tuesday',
  'visits.wednesday',
  'visits.thursday',
  'visits.friday',
  'visits.saturday',
  'visits.sunday',
]

// ---------- Computed ----------

const sortedSlots = computed(() =>
  [...slots.value].sort((a, b) => {
    if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week
    return a.start_time.localeCompare(b.start_time)
  }),
)

const upcomingBookings = computed(() => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return [...bookings.value]
    .filter((b) => new Date(b.visit_date) >= now || b.status === 'pending')
    .sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime())
})

const isSlotFormValid = computed(() => {
  return (
    slotForm.start_time !== '' &&
    slotForm.end_time !== '' &&
    slotForm.start_time < slotForm.end_time &&
    slotForm.max_visitors > 0
  )
})

// ---------- Data loading ----------

async function loadData() {
  loading.value = true
  error.value = null

  try {
    const dealer = dealerProfile.value || (await loadDealer())
    if (!dealer) {
      error.value = t('visits.errorNoDealer')
      return
    }

    // Load visit slots
    const { data: slotsData, error: sErr } = await supabase
      .from('visit_slots')
      .select('*')
      .eq('dealer_id', dealer.id)
      .order('day_of_week', { ascending: true })

    if (sErr) throw sErr
    slots.value = (slotsData || []) as VisitSlot[]

    // Load visit bookings
    const { data: bookingsData, error: bErr } = await supabase
      .from('visit_bookings')
      .select('*, vehicles(brand, model)')
      .eq('dealer_id', dealer.id)
      .order('visit_date', { ascending: false })
      .limit(50)

    if (bErr) throw bErr

    bookings.value = (
      (bookingsData || []) as Array<{
        id: string
        dealer_id: string
        slot_id: string | null
        vehicle_id: string | null
        buyer_name: string
        buyer_email: string | null
        visit_date: string
        visit_time: string
        status: BookingStatus
        notes: string | null
        created_at: string
        vehicles: { brand: string; model: string } | null
      }>
    ).map((b) => ({
      id: b.id,
      dealer_id: b.dealer_id,
      slot_id: b.slot_id,
      vehicle_id: b.vehicle_id,
      vehicle_brand: b.vehicles?.brand || '',
      vehicle_model: b.vehicles?.model || '',
      buyer_name: b.buyer_name,
      buyer_email: b.buyer_email,
      visit_date: b.visit_date,
      visit_time: b.visit_time,
      status: b.status,
      notes: b.notes,
      created_at: b.created_at,
    }))
  } catch (err: unknown) {
    const supabaseError = err as { message?: string }
    error.value = supabaseError?.message || t('visits.errorLoading')
  } finally {
    loading.value = false
  }
}

// ---------- Slot CRUD ----------

async function addSlot() {
  if (!isSlotFormValid.value) return
  saving.value = true
  error.value = null
  successMsg.value = null

  try {
    const dealer = dealerProfile.value
    if (!dealer) throw new Error('Dealer not found')

    const payload = {
      dealer_id: dealer.id,
      day_of_week: slotForm.day_of_week,
      start_time: slotForm.start_time,
      end_time: slotForm.end_time,
      max_visitors: slotForm.max_visitors,
    }

    const { error: err } = await supabase.from('visit_slots').insert(payload as never)
    if (err) throw err

    successMsg.value = t('visits.slotAdded')
    await loadData()
  } catch (err: unknown) {
    const supabaseError = err as { message?: string }
    error.value = supabaseError?.message || t('visits.errorSaving')
  } finally {
    saving.value = false
  }
}

async function deleteSlot(slotId: string) {
  saving.value = true
  error.value = null

  try {
    const { error: err } = await supabase.from('visit_slots').delete().eq('id', slotId)

    if (err) throw err

    slots.value = slots.value.filter((s) => s.id !== slotId)
    successMsg.value = t('visits.slotDeleted')
  } catch (err: unknown) {
    const supabaseError = err as { message?: string }
    error.value = supabaseError?.message || t('visits.errorDeleting')
  } finally {
    saving.value = false
  }
}

// ---------- Booking actions ----------

async function updateBookingStatus(bookingId: string, status: BookingStatus) {
  saving.value = true
  error.value = null
  successMsg.value = null

  try {
    const { error: err } = await supabase
      .from('visit_bookings')
      .update({ status, updated_at: new Date().toISOString() } as never)
      .eq('id', bookingId)

    if (err) throw err

    const booking = bookings.value.find((b) => b.id === bookingId)
    if (booking) booking.status = status

    successMsg.value =
      status === 'confirmed' ? t('visits.bookingConfirmed') : t('visits.bookingCancelled')
  } catch (err: unknown) {
    const supabaseError = err as { message?: string }
    error.value = supabaseError?.message || t('visits.errorUpdating')
  } finally {
    saving.value = false
  }
}

// ---------- Formatting ----------

function getDayLabel(dayNum: number): string {
  const key = daysKeys[dayNum - 1]
  return key ? t(key) : String(dayNum)
}

function fmtDate(date: string | null): string {
  if (!date) return '--'
  return new Date(date).toLocaleDateString(locale.value === 'en' ? 'en-GB' : 'es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getStatusClass(status: BookingStatus): string {
  switch (status) {
    case 'pending':
      return 'status-pending'
    case 'confirmed':
      return 'status-confirmed'
    case 'cancelled':
      return 'status-cancelled'
    default:
      return ''
  }
}

// ---------- Lifecycle ----------

onMounted(async () => {
  await loadData()
})
</script>

<template>
  <div class="visits-page">
    <!-- Page Header -->
    <header class="page-header">
      <div>
        <h1>{{ t('visits.title') }}</h1>
        <p class="subtitle">{{ t('visits.subtitle') }}</p>
      </div>
      <div class="header-actions">
        <label class="toggle-switch">
          <input v-model="visitsEnabled" type="checkbox" >
          <span class="toggle-slider" />
          <span class="toggle-label">{{ t('visits.enableVisits') }}</span>
        </label>
      </div>
    </header>

    <!-- Success -->
    <div v-if="successMsg" class="alert-success">{{ successMsg }}</div>

    <!-- Error -->
    <div v-if="error" class="alert-error">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>{{ t('common.loading') }}...</span>
    </div>

    <template v-else-if="visitsEnabled">
      <!-- Time Slots Configuration -->
      <section class="section-card">
        <h2 class="section-title">{{ t('visits.slotsConfig') }}</h2>

        <!-- Add Slot Form -->
        <div class="slot-form">
          <div class="slot-form-fields">
            <div class="field">
              <label>{{ t('visits.dayOfWeek') }}</label>
              <select v-model.number="slotForm.day_of_week" class="field-input">
                <option v-for="(dayKey, idx) in daysKeys" :key="idx" :value="idx + 1">
                  {{ t(dayKey) }}
                </option>
              </select>
            </div>
            <div class="field">
              <label>{{ t('visits.startTime') }}</label>
              <input v-model="slotForm.start_time" type="time" class="field-input" >
            </div>
            <div class="field">
              <label>{{ t('visits.endTime') }}</label>
              <input v-model="slotForm.end_time" type="time" class="field-input" >
            </div>
            <div class="field">
              <label>{{ t('visits.maxVisitors') }}</label>
              <input
                v-model.number="slotForm.max_visitors"
                type="number"
                min="1"
                max="100"
                class="field-input"
              >
            </div>
          </div>
          <button class="btn-primary" :disabled="!isSlotFormValid || saving" @click="addSlot">
            <span v-if="saving" class="spinner-sm" />
            {{ t('visits.addSlot') }}
          </button>
        </div>

        <!-- Existing Slots -->
        <div v-if="sortedSlots.length === 0" class="empty-state">
          <p>{{ t('visits.noSlots') }}</p>
        </div>

        <div v-else class="slots-list">
          <div v-for="slot in sortedSlots" :key="slot.id" class="slot-item">
            <div class="slot-info">
              <span class="slot-day">{{ getDayLabel(slot.day_of_week) }}</span>
              <span class="slot-time">{{ slot.start_time }} - {{ slot.end_time }}</span>
              <span class="slot-capacity">
                {{ t('visits.maxVisitors') }}: {{ slot.max_visitors }}
              </span>
            </div>
            <button
              class="btn-icon delete"
              :title="t('visits.deleteSlot')"
              :disabled="saving"
              @click="deleteSlot(slot.id)"
            >
              &times;
            </button>
          </div>
        </div>
      </section>

      <!-- Upcoming Bookings -->
      <section class="section-card">
        <h2 class="section-title">{{ t('visits.bookings') }}</h2>

        <div v-if="upcomingBookings.length === 0" class="empty-state">
          <p>{{ t('visits.noBookings') }}</p>
        </div>

        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t('visits.date') }}</th>
                <th>{{ t('visits.time') }}</th>
                <th>{{ t('visits.vehicle') }}</th>
                <th>{{ t('visits.buyerName') }}</th>
                <th>{{ t('visits.status') }}</th>
                <th>{{ t('visits.notes') }}</th>
                <th class="actions-col">{{ t('visits.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="booking in upcomingBookings" :key="booking.id">
                <td>{{ fmtDate(booking.visit_date) }}</td>
                <td>{{ booking.visit_time }}</td>
                <td class="vehicle-cell">
                  <template v-if="booking.vehicle_brand">
                    <strong>{{ booking.vehicle_brand }}</strong> {{ booking.vehicle_model }}
                  </template>
                  <template v-else>--</template>
                </td>
                <td>
                  <div>{{ booking.buyer_name }}</div>
                  <div v-if="booking.buyer_email" class="buyer-email">
                    {{ booking.buyer_email }}
                  </div>
                </td>
                <td>
                  <span class="status-badge" :class="getStatusClass(booking.status)">
                    {{ t(`visits.statuses.${booking.status}`) }}
                  </span>
                </td>
                <td class="notes-cell">{{ booking.notes || '--' }}</td>
                <td class="actions-cell">
                  <template v-if="booking.status === 'pending'">
                    <button
                      class="btn-sm btn-confirm"
                      :disabled="saving"
                      @click="updateBookingStatus(booking.id, 'confirmed')"
                    >
                      {{ t('visits.confirm') }}
                    </button>
                    <button
                      class="btn-sm btn-cancel"
                      :disabled="saving"
                      @click="updateBookingStatus(booking.id, 'cancelled')"
                    >
                      {{ t('visits.cancel') }}
                    </button>
                  </template>
                  <template v-else-if="booking.status === 'confirmed'">
                    <button
                      class="btn-sm btn-cancel"
                      :disabled="saving"
                      @click="updateBookingStatus(booking.id, 'cancelled')"
                    >
                      {{ t('visits.cancel') }}
                    </button>
                  </template>
                  <span v-else class="text-muted">--</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <!-- Visits disabled state -->
    <div v-else class="disabled-state">
      <p>{{ t('visits.disabledMessage') }}</p>
    </div>
  </div>
</template>

<style scoped>
.visits-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

/* Header */
.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.page-header h1 {
  margin: 0;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

/* Toggle switch */
.toggle-switch {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  cursor: pointer;
  min-height: 44px;
}

.toggle-switch input {
  display: none;
}

.toggle-slider {
  width: 48px;
  height: 26px;
  background: var(--color-gray-300);
  border-radius: var(--border-radius-full);
  position: relative;
  transition: background var(--transition-fast);
  flex-shrink: 0;
}

.toggle-slider::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background: var(--color-white);
  border-radius: 50%;
  transition: transform var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.toggle-switch input:checked + .toggle-slider {
  background: var(--color-success);
}

.toggle-switch input:checked + .toggle-slider::after {
  transform: translateX(22px);
}

.toggle-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

/* Section cards */
.section-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-sm);
}

.section-title {
  margin: 0 0 var(--spacing-4);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

/* Slot form */
.slot-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
  padding-bottom: var(--spacing-4);
  border-bottom: 1px solid var(--border-color-light);
}

.slot-form-fields {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-3);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.field label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-auxiliary);
  text-transform: uppercase;
}

.field-input {
  min-height: 44px;
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  background: var(--bg-primary);
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
}

.field-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

/* Slots list */
.slots-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.slot-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color-light);
}

.slot-info {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  align-items: center;
}

.slot-day {
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  min-width: 80px;
}

.slot-time {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-family: monospace;
}

.slot-capacity {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

/* Bookings table */
.table-container {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.data-table th {
  text-align: left;
  padding: var(--spacing-3) var(--spacing-2);
  background: var(--bg-secondary);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  color: var(--text-auxiliary);
  border-bottom: 1px solid var(--border-color-light);
  white-space: nowrap;
}

.data-table th.actions-col {
  text-align: center;
  width: 140px;
}

.data-table td {
  padding: var(--spacing-2);
  border-bottom: 1px solid var(--color-gray-100);
  vertical-align: middle;
}

.vehicle-cell {
  white-space: nowrap;
}

.buyer-email {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

.notes-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-auxiliary);
  font-size: var(--font-size-xs);
}

.actions-cell {
  text-align: center;
  white-space: nowrap;
  display: flex;
  gap: var(--spacing-1);
  justify-content: center;
}

.text-muted {
  color: var(--text-disabled);
  font-size: var(--font-size-sm);
}

/* Status badges */
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}

.status-badge.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.status-confirmed {
  background: #dcfce7;
  color: #166534;
}

.status-badge.status-cancelled {
  background: #f1f5f9;
  color: var(--text-auxiliary);
}

/* Buttons */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: var(--spacing-2) var(--spacing-5);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
  gap: var(--spacing-1);
  align-self: flex-start;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  min-width: 44px;
  padding: var(--spacing-1) var(--spacing-3);
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-sm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-confirm {
  background: var(--color-success);
  color: var(--color-white);
}

.btn-confirm:hover {
  background: #059669;
}

.btn-cancel {
  background: var(--color-gray-200);
  color: var(--text-secondary);
}

.btn-cancel:hover {
  background: var(--color-gray-300);
}

.btn-icon {
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: var(--font-size-xl);
  border-radius: var(--border-radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-auxiliary);
}

.btn-icon:hover {
  background: var(--color-gray-100);
}

.btn-icon.delete:hover {
  background: #fee2e2;
  color: var(--color-error);
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Alerts */
.alert-error {
  padding: var(--spacing-3) var(--spacing-4);
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--border-radius);
  color: var(--color-error);
  font-size: var(--font-size-sm);
}

.alert-success {
  padding: var(--spacing-3) var(--spacing-4);
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: var(--border-radius);
  color: var(--color-success);
  font-size: var(--font-size-sm);
}

/* Empty & disabled states */
.empty-state {
  padding: var(--spacing-10) var(--spacing-5);
  text-align: center;
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

.empty-state p {
  margin: 0;
}

.disabled-state {
  padding: var(--spacing-12) var(--spacing-5);
  text-align: center;
  color: var(--text-auxiliary);
  font-size: var(--font-size-base);
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
}

.disabled-state p {
  margin: 0;
}

/* Loading */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  padding: 60px var(--spacing-5);
  color: var(--text-auxiliary);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-gray-200);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--color-white);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive: 480px */
@media (min-width: 480px) {
  .slot-form-fields {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Responsive: 768px */
@media (min-width: 768px) {
  .visits-page {
    padding: var(--spacing-6);
    gap: var(--spacing-5);
  }

  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .slot-form-fields {
    grid-template-columns: repeat(4, 1fr);
  }

  .slot-form {
    flex-direction: row;
    align-items: flex-end;
  }

  .slot-form-fields {
    flex: 1;
  }

  .section-card {
    padding: var(--spacing-6);
  }
}

/* Responsive: 1024px */
@media (min-width: 1024px) {
  .visits-page {
    padding: var(--spacing-8);
  }
}
</style>
