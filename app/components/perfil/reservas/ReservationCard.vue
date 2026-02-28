<script setup lang="ts">
import type { ReservationItem } from '~/composables/usePerfilReservas'

defineProps<{
  reservation: ReservationItem
  statusLabel: string
  statusClass: string
  countdown: string | null
  canCancel: boolean
  canConfirm: boolean
  isCancelling: boolean
  isConfirming: boolean
}>()

const emit = defineEmits<{
  (e: 'cancel' | 'confirm'): void
}>()

const { getImageUrl } = useImageUrl()
</script>

<template>
  <article class="reservation-card">
    <!-- Vehicle info row -->
    <div class="reservation-card__vehicle">
      <NuxtLink :to="`/vehiculo/${reservation.vehicle_id}`" class="reservation-card__image-link">
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

      <span class="status-badge" :class="statusClass">
        {{ $t(statusLabel) }}
      </span>
    </div>

    <!-- Details row -->
    <div class="reservation-card__details">
      <div class="detail-item">
        <span class="detail-label">{{ $t('reservations.deposit') }}</span>
        <span class="detail-value"
          >{{
            (reservation.deposit_cents / 100).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          }}
          &euro;</span
        >
      </div>

      <div v-if="countdown" class="detail-item">
        <span class="detail-label">{{ $t('reservations.timeRemaining') }}</span>
        <span class="detail-value detail-value--countdown">{{ countdown }}</span>
      </div>

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
    <div v-if="canCancel || canConfirm" class="reservation-card__actions">
      <button v-if="canCancel" class="btn-cancel" :disabled="isCancelling" @click="emit('cancel')">
        {{ isCancelling ? $t('common.loading') : $t('reservations.cancel') }}
      </button>
      <button
        v-if="canConfirm"
        class="btn-confirm"
        :disabled="isConfirming"
        @click="emit('confirm')"
      >
        {{ isConfirming ? $t('common.loading') : $t('reservations.confirm') }}
      </button>
    </div>
  </article>
</template>

<style scoped>
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

.reservation-card__details {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-4);
  padding: var(--spacing-3) var(--spacing-4);
  border-top: 1px solid var(--border-color-light);
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

.reservation-card__response {
  margin: 0 var(--spacing-4) var(--spacing-3);
  padding: var(--spacing-3);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
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

@media (min-width: 768px) {
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

@media (min-width: 1024px) {
  .reservation-card__vehicle {
    flex-wrap: nowrap;
    align-items: center;
  }
}
</style>
