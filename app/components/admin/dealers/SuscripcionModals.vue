<script setup lang="ts">
/**
 * SuscripcionModals — All 4 modals (change plan, extend, cancel, new subscription)
 * Extracted from pages/admin/dealers/suscripciones.vue
 */

import type {
  DealerInfo,
  DealerSubscription,
  PlanType,
  CancelModalState,
  NewModalState,
  ExtendModalState,
  ChangePlanModalState,
} from '~/composables/admin/useAdminDealerSuscripciones'
import { formatPriceCents } from '~/composables/shared/useListingUtils'

const { t } = useI18n()

const props = defineProps<{
  cancelModal: CancelModalState
  newModal: NewModalState
  extendModal: ExtendModalState
  changePlanModal: ChangePlanModalState
  saving: boolean
  canCancel: boolean
  availableDealersForNew: DealerInfo[]
  uniqueVerticals: string[]
  foundingCountByVertical: Record<string, number>
  plans: Array<{ value: PlanType; label: string; color: string }>
  foundingMaxPerVertical: number
  formatDate: (dateStr: string | null) => string
  getDealerName: (sub: DealerSubscription) => string
  getDealerLabel: (dealer: DealerInfo) => string
}>()

const emit = defineEmits<{
  'change-plan': []
  'extend-expiry': []
  'cancel-subscription': []
  'create-subscription': []
  'close-cancel': []
  'close-new': []
  'close-extend': []
  'close-change-plan': []
  'update:cancelModal': [value: CancelModalState]
  'update:newModal': [value: NewModalState]
  'update:changePlanModal': [value: ChangePlanModalState]
}>()

function updateCancelConfirmText(text: string) {
  emit('update:cancelModal', { ...props.cancelModal, confirmText: text })
}

function updateNewDealerId(id: string) {
  emit('update:newModal', { ...props.newModal, selectedDealerId: id })
}

function updateNewVertical(vertical: string) {
  emit('update:newModal', { ...props.newModal, selectedVertical: vertical })
}

function updateNewPlan(plan: PlanType) {
  emit('update:newModal', { ...props.newModal, selectedPlan: plan })
}

function updateNewPriceCents(price: number) {
  emit('update:newModal', { ...props.newModal, priceCents: price })
}

function updateChangePlanNewPlan(plan: PlanType) {
  emit('update:changePlanModal', { ...props.changePlanModal, newPlan: plan })
}
</script>

<template>
  <!-- Change Plan Modal -->
  <Teleport to="body">
    <div v-if="changePlanModal.show" class="modal-overlay" @click.self="emit('close-change-plan')">
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h3>{{ t('admin.dealerSubscriptions.changePlanTitle') }}</h3>
          <button class="modal-close" @click="emit('close-change-plan')">x</button>
        </div>
        <div class="modal-body">
          <p class="modal-description">
            {{ t('admin.dealerSubscriptions.changePlanText') }}
            <strong>{{ getDealerName(changePlanModal.subscription!) }}</strong>
          </p>
          <div class="form-group">
            <label for="change-plan-select">{{ t('admin.dealerSubscriptions.selectPlan') }}</label>
            <select
              id="change-plan-select"
              :value="changePlanModal.newPlan"
              class="form-select"
              @change="
                updateChangePlanNewPlan(($event.target as HTMLSelectElement).value as PlanType)
              "
            >
              <option v-for="p in plans" :key="p.value" :value="p.value">
                {{ p.label }}
              </option>
            </select>
            <p v-if="changePlanModal.newPlan === 'founding'" class="founding-warning">
              {{ t('admin.dealerSubscriptions.foundingCount') }}:
              {{
                foundingCountByVertical[changePlanModal.subscription?.vertical || 'tracciona'] || 0
              }}
              / {{ foundingMaxPerVertical }}
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close-change-plan')">
            {{ t('admin.dealerSubscriptions.cancelBtn') }}
          </button>
          <button
            class="btn-primary"
            :disabled="saving || changePlanModal.newPlan === changePlanModal.subscription?.plan"
            @click="emit('change-plan')"
          >
            {{
              saving
                ? t('admin.dealerSubscriptions.saving')
                : t('admin.dealerSubscriptions.saveBtn')
            }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Extend Expiry Modal -->
  <Teleport to="body">
    <div v-if="extendModal.show" class="modal-overlay" @click.self="emit('close-extend')">
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h3>{{ t('admin.dealerSubscriptions.extendTitle') }}</h3>
          <button class="modal-close" @click="emit('close-extend')">x</button>
        </div>
        <div class="modal-body">
          <p class="modal-description">
            {{ t('admin.dealerSubscriptions.extendText') }}
            <strong>{{ getDealerName(extendModal.subscription!) }}</strong>
          </p>
          <div class="extend-info">
            <div class="extend-row">
              <span class="extend-label">{{ t('admin.dealerSubscriptions.colExpires') }}:</span>
              <span class="extend-value">{{
                formatDate(extendModal.subscription?.expires_at ?? null)
              }}</span>
            </div>
            <div class="extend-row">
              <span class="extend-label">{{ t('admin.dealerSubscriptions.extend30Days') }}:</span>
              <span class="extend-value extend-new">
                {{
                  formatDate(
                    new Date(
                      (extendModal.subscription?.expires_at
                        ? new Date(extendModal.subscription.expires_at).getTime()
                        : Date.now()) +
                        30 * 24 * 60 * 60 * 1000,
                    ).toISOString(),
                  )
                }}
              </span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close-extend')">
            {{ t('admin.dealerSubscriptions.cancelBtn') }}
          </button>
          <button class="btn-primary" :disabled="saving" @click="emit('extend-expiry')">
            {{
              saving
                ? t('admin.dealerSubscriptions.extending')
                : t('admin.dealerSubscriptions.extend30Days')
            }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Cancel Subscription Modal -->
  <Teleport to="body">
    <div v-if="cancelModal.show" class="modal-overlay" @click.self="emit('close-cancel')">
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h3>{{ t('admin.dealerSubscriptions.confirmCancel') }}</h3>
          <button class="modal-close" @click="emit('close-cancel')">x</button>
        </div>
        <div class="modal-body">
          <p>
            {{ t('admin.dealerSubscriptions.confirmCancelText') }}
            <strong>{{ getDealerName(cancelModal.subscription!) }}</strong
            >?
          </p>
          <p class="text-warning">
            {{ t('admin.dealerSubscriptions.confirmCancelWarning') }}
          </p>
          <div class="form-group delete-confirm-group">
            <label for="cancel-confirm">
              {{ t('admin.dealerSubscriptions.typeCancel') }}
            </label>
            <input
              id="cancel-confirm"
              :value="cancelModal.confirmText"
              type="text"
              placeholder="cancelar"
              autocomplete="off"
              @input="updateCancelConfirmText(($event.target as HTMLInputElement).value)"
            >
            <p v-if="cancelModal.confirmText && !canCancel" class="text-error">
              {{ t('admin.dealerSubscriptions.typeCancel') }}
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close-cancel')">
            {{ t('admin.dealerSubscriptions.closeBtn') }}
          </button>
          <button
            class="btn-danger"
            :disabled="!canCancel || saving"
            @click="emit('cancel-subscription')"
          >
            {{
              saving
                ? t('admin.dealerSubscriptions.saving')
                : t('admin.dealerSubscriptions.confirmBtn')
            }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- New Subscription Modal -->
  <Teleport to="body">
    <div v-if="newModal.show" class="modal-overlay" @click.self="emit('close-new')">
      <div class="modal-content modal-medium">
        <div class="modal-header">
          <h3>{{ t('admin.dealerSubscriptions.modalNewTitle') }}</h3>
          <button class="modal-close" @click="emit('close-new')">x</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="new-dealer">{{ t('admin.dealerSubscriptions.selectDealer') }}</label>
            <select
              id="new-dealer"
              :value="newModal.selectedDealerId"
              class="form-select"
              @change="updateNewDealerId(($event.target as HTMLSelectElement).value)"
            >
              <option value="" disabled>
                -- {{ t('admin.dealerSubscriptions.selectDealer') }} --
              </option>
              <option v-for="d in availableDealersForNew" :key="d.id" :value="d.id">
                {{ getDealerLabel(d) }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="new-vertical">{{ t('admin.dealerSubscriptions.selectVertical') }}</label>
            <select
              id="new-vertical"
              :value="newModal.selectedVertical"
              class="form-select"
              @change="updateNewVertical(($event.target as HTMLSelectElement).value)"
            >
              <option v-for="v in uniqueVerticals" :key="v" :value="v">
                {{ v }}
              </option>
              <option v-if="!uniqueVerticals.includes('tracciona')" value="tracciona">
                tracciona
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="new-plan">{{ t('admin.dealerSubscriptions.selectPlan') }}</label>
            <select
              id="new-plan"
              :value="newModal.selectedPlan"
              class="form-select"
              @change="updateNewPlan(($event.target as HTMLSelectElement).value as PlanType)"
            >
              <option v-for="p in plans" :key="p.value" :value="p.value">
                {{ p.label }}
              </option>
            </select>
            <p v-if="newModal.selectedPlan === 'founding'" class="founding-warning">
              {{ t('admin.dealerSubscriptions.foundingCount') }}:
              {{ foundingCountByVertical[newModal.selectedVertical] || 0 }}
              / {{ foundingMaxPerVertical }}
            </p>
          </div>

          <div class="form-group">
            <label for="new-price">{{ t('admin.dealerSubscriptions.priceCents') }}</label>
            <input
              id="new-price"
              :value="newModal.priceCents"
              type="number"
              min="0"
              step="100"
              class="form-input"
              @input="updateNewPriceCents(Number(($event.target as HTMLInputElement).value))"
            >
            <span class="price-preview">= {{ formatPriceCents(newModal.priceCents) }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close-new')">
            {{ t('admin.dealerSubscriptions.cancelBtn') }}
          </button>
          <button
            class="btn-primary"
            :disabled="saving || !newModal.selectedDealerId"
            @click="emit('create-subscription')"
          >
            {{
              saving
                ? t('admin.dealerSubscriptions.creating')
                : t('admin.dealerSubscriptions.createBtn')
            }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ---- Modal ---- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal, 500);
  padding: var(--spacing-5, 20px);
}

.modal-content {
  background: var(--bg-primary, white);
  border-radius: var(--border-radius-md, 12px);
  width: 100%;
  box-shadow: var(--shadow-xl, 0 25px 50px -12px rgba(0, 0, 0, 0.25));
  max-height: 90vh;
  overflow-y: auto;
}

.modal-small {
  max-width: 440px;
}

.modal-medium {
  max-width: 560px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-5, 20px) var(--spacing-6, 24px);
  border-bottom: 1px solid var(--border-color-light, #e5e7eb);
  position: sticky;
  top: 0;
  background: var(--bg-primary, white);
  z-index: 1;
}

.modal-header h3 {
  margin: 0;
  font-size: var(--font-size-xl, 1.25rem);
  color: var(--text-primary, #1f2a2a);
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--color-gray-500, #6b7280);
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-sm, 4px);
}

.modal-close:hover {
  background: var(--color-gray-100, #f3f4f6);
}

.modal-body {
  padding: var(--spacing-6, 24px);
}

.modal-description {
  margin: 0 0 var(--spacing-4, 16px) 0;
  color: var(--text-secondary, #4a5a5a);
  line-height: var(--line-height-relaxed, 1.625);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3, 12px);
  padding: var(--spacing-4, 16px) var(--spacing-6, 24px);
  border-top: 1px solid var(--border-color-light, #e5e7eb);
  background: var(--color-gray-50, #f9fafb);
  position: sticky;
  bottom: 0;
}

/* ---- Buttons ---- */
.btn-primary {
  background: var(--color-primary);
  color: var(--color-white, white);
  border: none;
  padding: 10px 20px;
  border-radius: var(--border-radius-sm, 6px);
  cursor: pointer;
  font-weight: var(--font-weight-medium, 500);
  min-height: 44px;
  font-size: var(--font-size-sm, 0.875rem);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-gray-200, #e5e7eb);
  color: var(--color-gray-700, #374151);
  border: none;
  padding: 10px 20px;
  border-radius: var(--border-radius-sm, 6px);
  cursor: pointer;
  font-weight: var(--font-weight-medium, 500);
  min-height: 44px;
  font-size: var(--font-size-sm, 0.875rem);
}

.btn-danger {
  background: var(--color-error, var(--color-error));
  color: var(--color-white, white);
  border: none;
  padding: 10px 20px;
  border-radius: var(--border-radius-sm, 6px);
  cursor: pointer;
  font-weight: var(--font-weight-medium, 500);
  min-height: 44px;
  font-size: var(--font-size-sm, 0.875rem);
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ---- Forms ---- */
.form-group {
  margin-bottom: var(--spacing-4, 16px);
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-weight: var(--font-weight-medium, 500);
  margin-bottom: 6px;
  color: var(--color-gray-700, #374151);
  font-size: var(--font-size-sm, 0.875rem);
}

.form-select,
.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: var(--border-radius-sm, 6px);
  font-size: var(--font-size-sm, 0.95rem);
  min-height: 44px;
  background: var(--bg-primary, white);
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.price-preview {
  display: inline-block;
  margin-top: 4px;
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-gray-500, #6b7280);
}

.founding-warning {
  margin-top: 6px;
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-gold);
  font-weight: var(--font-weight-medium, 500);
}

/* ---- Extend Info ---- */
.extend-info {
  background: var(--color-gray-50, #f9fafb);
  border-radius: var(--border-radius, 8px);
  padding: var(--spacing-4, 16px);
  margin-top: var(--spacing-4, 16px);
}

.extend-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.extend-row:not(:last-child) {
  border-bottom: 1px solid var(--border-color-light, #e5e7eb);
}

.extend-label {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-gray-500, #6b7280);
}

.extend-value {
  font-weight: var(--font-weight-semibold, 600);
  color: var(--text-primary, #1f2a2a);
}

.extend-new {
  color: var(--color-success);
}

/* ---- Delete / Cancel Confirmation ---- */
.delete-confirm-group {
  margin-top: var(--spacing-4, 16px);
  padding-top: var(--spacing-4, 16px);
  border-top: 1px solid var(--border-color-light, #e5e7eb);
}

.delete-confirm-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: var(--border-radius-sm, 6px);
  font-size: var(--font-size-sm, 0.95rem);
  min-height: 44px;
}

.delete-confirm-group input:focus {
  outline: none;
  border-color: var(--color-error, var(--color-error));
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.text-warning {
  color: var(--color-warning, var(--color-warning));
  font-size: var(--font-size-sm, 0.85rem);
  background: #fffbeb;
  padding: 8px 12px;
  border-radius: var(--border-radius-sm, 6px);
  margin-top: 8px;
}

.text-error {
  color: var(--color-error, var(--color-error));
  font-size: var(--font-size-xs, 0.75rem);
  margin-top: 4px;
}

/* ---- Mobile Responsive ---- */
@media (max-width: 768px) {
  .modal-content {
    margin: var(--spacing-3, 12px);
  }

  .modal-body {
    padding: var(--spacing-4, 16px);
  }

  .modal-header {
    padding: var(--spacing-4, 16px);
  }

  .modal-footer {
    padding: var(--spacing-3, 12px) var(--spacing-4, 16px);
    flex-direction: column;
  }

  .modal-footer .btn-secondary,
  .modal-footer .btn-primary,
  .modal-footer .btn-danger {
    width: 100%;
    text-align: center;
  }
}
</style>
