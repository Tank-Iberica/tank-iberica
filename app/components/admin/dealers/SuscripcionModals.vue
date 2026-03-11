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
  padding: var(--spacing-5);
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
  max-width: 27.5rem;
}

.modal-medium {
  max-width: 35rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-5) var(--spacing-6);
  border-bottom: 1px solid var(--border-color-light, var(--color-gray-200));
  position: sticky;
  top: 0;
  background: var(--bg-primary, white);
  z-index: 1;
}

.modal-header h3 {
  margin: 0;
  font-size: var(--font-size-xl, 1.25rem);
  color: var(--text-primary, var(--text-primary));
}

.modal-close {
  background: none;
  border: none;
  font-size: var(--font-size-xl);
  cursor: pointer;
  color: var(--color-gray-500, var(--color-gray-500));
  min-height: 2.75rem;
  min-width: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-sm, 4px);
}

.modal-close:hover {
  background: var(--color-gray-100, var(--color-gray-100));
}

.modal-body {
  padding: var(--spacing-6);
}

.modal-description {
  margin: 0 0 var(--spacing-4) 0;
  color: var(--text-secondary, var(--text-secondary));
  line-height: var(--line-height-relaxed, 1.625);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  padding: var(--spacing-4) var(--spacing-6);
  border-top: 1px solid var(--border-color-light, var(--color-gray-200));
  background: var(--color-gray-50, var(--color-gray-50));
  position: sticky;
  bottom: 0;
}

/* ---- Buttons ---- */
.btn-primary {
  background: var(--color-primary);
  color: var(--color-white, white);
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: var(--border-radius-sm, 6px);
  cursor: pointer;
  font-weight: var(--font-weight-medium, 500);
  min-height: 2.75rem;
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
  background: var(--color-gray-200, var(--color-gray-200));
  color: var(--color-gray-700, var(--color-gray-700));
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: var(--border-radius-sm, 6px);
  cursor: pointer;
  font-weight: var(--font-weight-medium, 500);
  min-height: 2.75rem;
  font-size: var(--font-size-sm, 0.875rem);
}

.btn-danger {
  background: var(--color-error, var(--color-error));
  color: var(--color-white, white);
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: var(--border-radius-sm, 6px);
  cursor: pointer;
  font-weight: var(--font-weight-medium, 500);
  min-height: 2.75rem;
  font-size: var(--font-size-sm, 0.875rem);
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ---- Forms ---- */
.form-group {
  margin-bottom: var(--spacing-4);
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-weight: var(--font-weight-medium, 500);
  margin-bottom: 0.375rem;
  color: var(--color-gray-700, var(--color-gray-700));
  font-size: var(--font-size-sm, 0.875rem);
}

.form-select,
.form-input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border-color, var(--color-gray-300));
  border-radius: var(--border-radius-sm, 6px);
  font-size: var(--font-size-sm, 0.95rem);
  min-height: 2.75rem;
  background: var(--bg-primary, white);
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.price-preview {
  display: inline-block;
  margin-top: 0.25rem;
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-gray-500, var(--color-gray-500));
}

.founding-warning {
  margin-top: 0.375rem;
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-gold);
  font-weight: var(--font-weight-medium, 500);
}

/* ---- Extend Info ---- */
.extend-info {
  background: var(--color-gray-50, var(--color-gray-50));
  border-radius: var(--border-radius, 8px);
  padding: var(--spacing-4);
  margin-top: var(--spacing-4);
}

.extend-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.extend-row:not(:last-child) {
  border-bottom: 1px solid var(--border-color-light, var(--color-gray-200));
}

.extend-label {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-gray-500, var(--color-gray-500));
}

.extend-value {
  font-weight: var(--font-weight-semibold, 600);
  color: var(--text-primary, var(--text-primary));
}

.extend-new {
  color: var(--color-success);
}

/* ---- Delete / Cancel Confirmation ---- */
.delete-confirm-group {
  margin-top: var(--spacing-4);
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--border-color-light, var(--color-gray-200));
}

.delete-confirm-group input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border-color, var(--color-gray-300));
  border-radius: var(--border-radius-sm, 6px);
  font-size: var(--font-size-sm, 0.95rem);
  min-height: 2.75rem;
}

.delete-confirm-group input:focus {
  outline: none;
  border-color: var(--color-error, var(--color-error));
  box-shadow: var(--shadow-focus-error);
}

.text-warning {
  color: var(--color-warning, var(--color-warning));
  font-size: var(--font-size-sm, 0.85rem);
  background: var(--color-warning-bg, var(--color-warning-bg));
  padding: 0.5rem 0.75rem;
  border-radius: var(--border-radius-sm, 6px);
  margin-top: 0.5rem;
}

.text-error {
  color: var(--color-error, var(--color-error));
  font-size: var(--font-size-xs, 0.75rem);
  margin-top: 0.25rem;
}

/* ---- Mobile Responsive ---- */
@media (max-width: 48em) {
  .modal-content {
    margin: var(--spacing-3);
  }

  .modal-body {
    padding: var(--spacing-4);
  }

  .modal-header {
    padding: var(--spacing-4);
  }

  .modal-footer {
    padding: var(--spacing-3) var(--spacing-4);
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
