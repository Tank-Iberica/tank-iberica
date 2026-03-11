<script setup lang="ts">
import type { Auction, AuctionBid } from '~/composables/useAuction'
import type { ModalType } from '~/composables/admin/useAdminAuctionDetail'

defineProps<{
  activeModal: ModalType
  auction: Auction | null
  highestBid: AuctionBid | null
  reserveMet: boolean
  actionLoading: boolean
  cancelReason: string
  rejectReason: string
  formatCents: (cents: number | null) => string
}>()

const emit = defineEmits<{
  'update:cancelReason': [value: string]
  'update:rejectReason': [value: string]
  confirmCancel: []
  confirmAdjudicate: []
  markNoSale: []
  confirmReject: []
  close: []
}>()

const { t } = useI18n()
</script>

<template>
  <!-- Cancel Modal -->
  <Teleport to="body">
    <div v-if="activeModal === 'cancel'" class="modal-overlay" role="dialog" aria-modal="true" @click.self="emit('close')">
      <div class="modal modal-sm">
        <div class="modal-header danger">
          <h3>{{ t('admin.subastas.cancelTitle') }}</h3>
          <button class="modal-close" @click="emit('close')">&times;</button>
        </div>
        <div class="modal-body">
          <p>{{ t('admin.subastas.cancelConfirm') }}</p>
          <p class="text-danger">{{ t('admin.subastas.cancelWarning') }}</p>
          <div class="form-group">
            <label>{{ t('admin.subastas.cancelReason') }}</label>
            <textarea
              :value="cancelReason"
              rows="2"
              :placeholder="t('admin.subastas.cancelReasonPlaceholder')"
              @input="emit('update:cancelReason', ($event.target as HTMLTextAreaElement).value)"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close')">
            {{ t('admin.subastas.form.cancel') }}
          </button>
          <button class="btn-danger" :disabled="actionLoading" @click="emit('confirmCancel')">
            {{ t('admin.subastas.confirmCancel') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Adjudicate Modal -->
  <Teleport to="body">
    <div v-if="activeModal === 'adjudicate'" class="modal-overlay" role="dialog" aria-modal="true" @click.self="emit('close')">
      <div class="modal modal-md">
        <div class="modal-header">
          <h3>{{ t('admin.subastas.detail.adjudicateTitle') }}</h3>
          <button class="modal-close" @click="emit('close')">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="highestBid" class="adjudicate-info">
            <div class="adjudicate-bid">
              <span class="adjudicate-label">{{ t('admin.subastas.detail.highestBid') }}</span>
              <strong class="adjudicate-amount">{{ formatCents(highestBid.amount_cents) }}</strong>
            </div>
            <div class="adjudicate-bidder">
              <span class="adjudicate-label">{{ t('admin.subastas.detail.bidder') }}</span>
              <span>{{ highestBid.user_id.slice(0, 12) }}...</span>
            </div>
          </div>

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
          <button class="btn-secondary" @click="emit('close')">
            {{ t('admin.subastas.form.cancel') }}
          </button>
          <button
            v-if="!reserveMet"
            class="btn-secondary"
            :disabled="actionLoading"
            @click="emit('markNoSale')"
          >
            {{ t('admin.subastas.detail.markNoSale') }}
          </button>
          <button
            class="btn-primary"
            :disabled="actionLoading || !highestBid"
            @click="emit('confirmAdjudicate')"
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
    <div v-if="activeModal === 'reject'" class="modal-overlay" role="dialog" aria-modal="true" @click.self="emit('close')">
      <div class="modal modal-sm">
        <div class="modal-header danger">
          <h3>{{ t('admin.subastas.detail.rejectTitle') }}</h3>
          <button class="modal-close" @click="emit('close')">&times;</button>
        </div>
        <div class="modal-body">
          <p>{{ t('admin.subastas.detail.rejectConfirm') }}</p>
          <div class="form-group">
            <label>{{ t('admin.subastas.detail.rejectReasonLabel') }}</label>
            <textarea
              :value="rejectReason"
              rows="2"
              :placeholder="t('admin.subastas.detail.rejectReasonPlaceholder')"
              @input="emit('update:rejectReason', ($event.target as HTMLTextAreaElement).value)"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close')">
            {{ t('admin.subastas.form.cancel') }}
          </button>
          <button class="btn-danger" :disabled="actionLoading" @click="emit('confirmReject')">
            {{ t('admin.subastas.detail.confirmReject') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: var(--spacing-5);
  backdrop-filter: blur(2px);
}

.modal {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: modalIn 0.2s ease-out;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  margin: 0.625rem;
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
  max-width: 26.25rem;
}
.modal-md {
  max-width: 33.75rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-5) var(--spacing-6);
  border-bottom: 1px solid var(--color-gray-200);
  flex-shrink: 0;
}

.modal-header.danger {
  background: var(--color-error-bg, var(--color-error-bg));
  border-color: var(--color-error-border);
}

.modal-header.danger h3 {
  color: var(--color-error);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  color: var(--text-disabled);
  cursor: pointer;
  padding: 0;
  line-height: 1;
  min-width: 2.75rem;
  min-height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: var(--text-secondary);
}

.modal-body {
  padding: var(--spacing-6);
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  padding: var(--spacing-4) var(--spacing-6);
  border-top: 1px solid var(--color-gray-200);
  background: var(--bg-secondary);
  border-radius: 0 0 16px 16px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.form-group {
  margin-bottom: var(--spacing-4);
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.375rem;
}

.form-group textarea {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  min-height: 5rem;
  resize: vertical;
  box-sizing: border-box;
}

.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.text-danger {
  color: var(--color-error);
  font-size: 0.875rem;
}

.btn-secondary {
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--color-gray-200);
  padding: 0.625rem var(--spacing-5);
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
}

.btn-secondary:hover {
  background: var(--bg-secondary);
  border-color: var(--color-gray-300);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.625rem 1.125rem;
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger {
  background: var(--color-error);
  color: white;
  border: none;
  padding: 0.625rem var(--spacing-5);
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  min-height: 2.75rem;
}

.btn-danger:hover {
  background: var(--color-error);
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Adjudicate modal */
.adjudicate-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
  padding: var(--spacing-4);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
}

.adjudicate-bid,
.adjudicate-bidder {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.adjudicate-label {
  font-size: 0.85rem;
  color: var(--text-auxiliary);
}

.adjudicate-amount {
  font-size: 1.2rem;
  color: var(--color-primary);
}

.reserve-met {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-success-bg, var(--color-success-bg));
  border: 1px solid var(--color-success);
  border-radius: var(--border-radius);
  color: var(--color-success);
  font-weight: 500;
}

.reserve-not-met {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-warning-bg, var(--color-warning-bg));
  border: 1px solid var(--color-warning);
  border-radius: var(--border-radius);
  color: var(--color-warning-text);
}

.reserve-not-met strong {
  display: block;
  margin-bottom: var(--spacing-1);
}

.reserve-not-met p {
  margin: 0;
  font-size: 0.85rem;
}

@media (min-width: 48em) {
  .modal {
    margin: 0;
  }
}
</style>
