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
    <div v-if="activeModal === 'cancel'" class="modal-overlay" @click.self="emit('close')">
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
    <div v-if="activeModal === 'adjudicate'" class="modal-overlay" @click.self="emit('close')">
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
    <div v-if="activeModal === 'reject'" class="modal-overlay" @click.self="emit('close')">
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
  margin: 10px;
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

.text-danger {
  color: #dc2626;
  font-size: 0.875rem;
}

.btn-secondary {
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.btn-secondary:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
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

@media (min-width: 768px) {
  .modal {
    margin: 0;
  }
}
</style>
