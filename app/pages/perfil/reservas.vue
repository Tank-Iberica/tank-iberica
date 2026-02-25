<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

const { t } = useI18n()
const { getImageUrl } = useImageUrl()

const {
  reservations,
  loading,
  fetchMyReservations,
  cancelReservation,
  confirmReservation,
  timeRemaining,
} = useReservation()

// --------------- Local state ---------------

const cancelling = ref<string | null>(null)
const confirming = ref<string | null>(null)
const error = ref<string | null>(null)

// --------------- Computed ---------------

type StatusKey =
  | 'pending'
  | 'active'
  | 'seller_responded'
  | 'completed'
  | 'expired'
  | 'refunded'
  | 'forfeited'

const statusConfig: Record<StatusKey, { labelKey: string; cssClass: string }> = {
  pending: { labelKey: 'reservations.statusPending', cssClass: 'status--pending' },
  active: { labelKey: 'reservations.statusActive', cssClass: 'status--active' },
  seller_responded: {
    labelKey: 'reservations.statusSellerResponded',
    cssClass: 'status--responded',
  },
  completed: { labelKey: 'reservations.statusCompleted', cssClass: 'status--completed' },
  expired: { labelKey: 'reservations.statusExpired', cssClass: 'status--expired' },
  refunded: { labelKey: 'reservations.statusRefunded', cssClass: 'status--refunded' },
  forfeited: { labelKey: 'reservations.statusForfeited', cssClass: 'status--expired' },
}

function getStatusConfig(status: string): { labelKey: string; cssClass: string } {
  return (
    statusConfig[status as StatusKey] ?? { labelKey: 'reservations.statusUnknown', cssClass: '' }
  )
}

function formatDeposit(cents: number): string {
  return (cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function canCancel(status: string): boolean {
  return status === 'pending' || status === 'active'
}

function canConfirm(status: string): boolean {
  return status === 'seller_responded'
}

function isTimerVisible(status: string): boolean {
  return status === 'active' || status === 'pending'
}

// --------------- Actions ---------------

async function handleCancel(reservationId: string): Promise<void> {
  cancelling.value = reservationId
  error.value = null
  try {
    await cancelReservation(reservationId)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : t('reservations.errorCancel')
  } finally {
    cancelling.value = null
  }
}

async function handleConfirm(reservationId: string): Promise<void> {
  confirming.value = reservationId
  error.value = null
  try {
    await confirmReservation(reservationId)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : t('reservations.errorConfirm')
  } finally {
    confirming.value = null
  }
}

// --------------- Countdown timer ---------------

const countdowns = ref<Record<string, string>>({})
let countdownInterval: ReturnType<typeof setInterval> | null = null

function updateCountdowns(): void {
  const updated: Record<string, string> = {}
  for (const reservation of reservations.value) {
    if (isTimerVisible(reservation.status)) {
      updated[reservation.id] = timeRemaining(reservation)
    }
  }
  countdowns.value = updated
}

// --------------- SEO ---------------

useHead({
  title: t('reservations.pageTitle'),
})

// --------------- Lifecycle ---------------

onMounted(async () => {
  await fetchMyReservations()
  updateCountdowns()
  countdownInterval = setInterval(updateCountdowns, 60_000)
})

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
})
</script>

<template>
  <div class="reservations-page">
    <div class="reservations-container">
      <h1 class="page-title">
        {{ $t('reservations.pageTitle') }}
      </h1>
      <p class="page-subtitle">
        {{ $t('reservations.pageSubtitle') }}
      </p>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        {{ $t('common.loading') }}
      </div>

      <!-- Global error -->
      <div v-if="error" class="error-banner" role="alert">
        {{ error }}
        <button class="error-dismiss" @click="error = null">&times;</button>
      </div>

      <!-- Empty state -->
      <div v-if="!loading && reservations.length === 0" class="empty-state">
        <div class="empty-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            width="48"
            height="48"
            stroke-width="1.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p class="empty-title">{{ $t('reservations.emptyTitle') }}</p>
        <p class="empty-desc">{{ $t('reservations.emptyDesc') }}</p>
        <NuxtLink to="/catalogo" class="btn-primary">
          {{ $t('reservations.browseCatalog') }}
        </NuxtLink>
      </div>

      <!-- Reservation cards -->
      <div v-if="!loading && reservations.length > 0" class="reservation-list">
        <article v-for="reservation in reservations" :key="reservation.id" class="reservation-card">
          <!-- Vehicle info row -->
          <div class="reservation-card__vehicle">
            <NuxtLink
              :to="`/vehiculo/${reservation.vehicle_id}`"
              class="reservation-card__image-link"
            >
              <div class="reservation-card__image">
                <img
                  v-if="reservation.vehicle_image"
                  :src="getImageUrl(reservation.vehicle_image, 'thumb')"
                  :alt="reservation.vehicle_title || $t('reservations.vehicle')"
                  loading="lazy"
                >
                <div v-else class="reservation-card__image-placeholder">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    width="24"
                    height="24"
                    stroke-width="1.5"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                    />
                  </svg>
                </div>
              </div>
            </NuxtLink>

            <div class="reservation-card__info">
              <NuxtLink :to="`/vehiculo/${reservation.vehicle_id}`" class="reservation-card__title">
                {{ reservation.vehicle_title || $t('reservations.vehicle') }}
              </NuxtLink>

              <span v-if="reservation.seller_name" class="reservation-card__seller">
                {{ $t('reservations.seller') }}: {{ reservation.seller_name }}
              </span>

              <time class="reservation-card__date" :datetime="reservation.created_at">
                {{ new Date(reservation.created_at).toLocaleDateString() }}
              </time>
            </div>

            <!-- Status badge -->
            <span class="status-badge" :class="getStatusConfig(reservation.status).cssClass">
              {{ $t(getStatusConfig(reservation.status).labelKey) }}
            </span>
          </div>

          <!-- Details row -->
          <div class="reservation-card__details">
            <!-- Deposit -->
            <div class="detail-item">
              <span class="detail-label">{{ $t('reservations.deposit') }}</span>
              <span class="detail-value"
                >{{ formatDeposit(reservation.deposit_cents) }} &euro;</span
              >
            </div>

            <!-- Countdown -->
            <div
              v-if="isTimerVisible(reservation.status) && countdowns[reservation.id]"
              class="detail-item"
            >
              <span class="detail-label">{{ $t('reservations.timeRemaining') }}</span>
              <span class="detail-value detail-value--countdown">
                {{ countdowns[reservation.id] }}
              </span>
            </div>

            <!-- Freebie indicator -->
            <div v-if="reservation.subscription_freebie" class="detail-item">
              <span class="freebie-badge">{{ $t('reservations.freeReservation') }}</span>
            </div>
          </div>

          <!-- Seller response -->
          <div v-if="reservation.seller_response" class="reservation-card__response">
            <p class="response-label">{{ $t('reservations.sellerResponse') }}</p>
            <p class="response-content">{{ reservation.seller_response }}</p>
            <time
              v-if="reservation.seller_responded_at"
              class="response-date"
              :datetime="reservation.seller_responded_at"
            >
              {{ new Date(reservation.seller_responded_at).toLocaleDateString() }}
            </time>
          </div>

          <!-- Actions -->
          <div
            v-if="canCancel(reservation.status) || canConfirm(reservation.status)"
            class="reservation-card__actions"
          >
            <button
              v-if="canCancel(reservation.status)"
              class="btn-cancel"
              :disabled="cancelling === reservation.id"
              @click="handleCancel(reservation.id)"
            >
              {{ cancelling === reservation.id ? $t('common.loading') : $t('reservations.cancel') }}
            </button>

            <button
              v-if="canConfirm(reservation.status)"
              class="btn-confirm"
              :disabled="confirming === reservation.id"
              @click="handleConfirm(reservation.id)"
            >
              {{
                confirming === reservation.id ? $t('common.loading') : $t('reservations.confirm')
              }}
            </button>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reservations-page {
  min-height: 60vh;
  padding: var(--spacing-4) 0 var(--spacing-12);
}

.reservations-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-1);
}

.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-6);
}

/* Loading */
.loading-state {
  text-align: center;
  padding: var(--spacing-12) var(--spacing-4);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* Error banner */
.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: var(--border-radius);
  color: #991b1b;
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-4);
}

.error-dismiss {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-xl);
  color: #991b1b;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: var(--spacing-12) var(--spacing-4);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
}

.empty-icon {
  color: var(--text-auxiliary);
  margin-bottom: var(--spacing-4);
}

.empty-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}

.empty-desc {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  margin-bottom: var(--spacing-6);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3) var(--spacing-6);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  background: var(--color-primary);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  text-decoration: none;
  transition: background var(--transition-fast);
  min-height: 44px;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

/* Reservation list */
.reservation-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

/* Reservation card */
.reservation-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.reservation-card__vehicle {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  flex-wrap: wrap;
}

.reservation-card__image-link {
  flex-shrink: 0;
  text-decoration: none;
}

.reservation-card__image {
  width: 80px;
  height: 60px;
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  background: var(--bg-secondary);
}

.reservation-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.reservation-card__image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-auxiliary);
  background: var(--bg-tertiary);
}

.reservation-card__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.reservation-card__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reservation-card__title:hover {
  color: var(--color-primary);
}

.reservation-card__seller {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.reservation-card__date {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

/* Status badge */
.status-badge {
  flex-shrink: 0;
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  align-self: flex-start;
}

.status--pending {
  background: #fef3c7;
  color: #92400e;
}

.status--active {
  background: #d1fae5;
  color: #065f46;
}

.status--responded {
  background: #dbeafe;
  color: #1e40af;
}

.status--completed {
  background: #d1fae5;
  color: #047857;
}

.status--expired {
  background: var(--bg-tertiary);
  color: var(--text-auxiliary);
}

.status--refunded {
  background: #dbeafe;
  color: #1e40af;
}

/* Details row */
.reservation-card__details {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-4);
  padding: 0 var(--spacing-4) var(--spacing-3);
  border-top: 1px solid var(--border-color-light);
  padding-top: var(--spacing-3);
  margin: 0 var(--spacing-4);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

.detail-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.detail-value--countdown {
  color: var(--color-warning);
}

.freebie-badge {
  display: inline-block;
  padding: 2px var(--spacing-2);
  background: #ede9fe;
  color: #6d28d9;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

/* Seller response */
.reservation-card__response {
  margin: 0 var(--spacing-4);
  padding: var(--spacing-3);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-3);
}

.response-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}

.response-content {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-2);
}

.response-date {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

/* Actions */
.reservation-card__actions {
  display: flex;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4) var(--spacing-4);
}

.btn-cancel {
  flex: 1;
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-error);
  background: var(--bg-primary);
  border: 2px solid var(--color-error);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background var(--transition-fast);
  min-height: 44px;
}

.btn-cancel:hover {
  background: #fee2e2;
}

.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-confirm {
  flex: 1;
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  background: var(--color-success);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background var(--transition-fast);
  min-height: 44px;
}

.btn-confirm:hover {
  background: #059669;
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ---- Tablet (768px) ---- */
@media (min-width: 768px) {
  .reservations-container {
    padding: 0 var(--spacing-8);
  }

  .page-title {
    font-size: var(--font-size-3xl);
  }

  .reservation-card__image {
    width: 120px;
    height: 80px;
  }

  .reservation-card__title {
    font-size: var(--font-size-base);
  }

  .reservation-card__details {
    gap: var(--spacing-8);
  }

  .reservation-card__actions {
    justify-content: flex-end;
  }

  .btn-cancel,
  .btn-confirm {
    flex: unset;
    min-width: 140px;
  }
}

/* ---- Desktop (1024px) ---- */
@media (min-width: 1024px) {
  .reservation-card__vehicle {
    flex-wrap: nowrap;
    align-items: center;
  }
}
</style>
