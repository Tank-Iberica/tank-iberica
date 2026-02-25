<template>
  <div class="reserve-button-wrapper">
    <!-- Main reserve button -->
    <button
      class="reserve-btn"
      :disabled="isReserved || creating || checkingReserved"
      @click="openModal"
    >
      <span v-if="checkingReserved" class="spinner" />
      <template v-else-if="isReserved">
        {{ $t('reservation.alreadyReserved') }}
      </template>
      <template v-else>
        {{ $t('reservation.reserve') }}
      </template>
    </button>

    <!-- Confirmation modal -->
    <Teleport to="body">
      <Transition name="reserve-modal">
        <div v-if="modalOpen" class="reserve-backdrop" @click.self="closeModal">
          <div class="reserve-modal" role="dialog" :aria-label="$t('reservation.confirmTitle')">
            <!-- Close button -->
            <button
              type="button"
              class="modal-close"
              :aria-label="$t('common.close')"
              @click="closeModal"
            >
              <span aria-hidden="true">&times;</span>
            </button>

            <!-- Success state -->
            <div v-if="successReservation" class="reserve-success">
              <div class="success-icon-wrapper" aria-hidden="true">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 class="success-title">{{ $t('reservation.successTitle') }}</h3>
              <p class="success-id">
                {{ $t('reservation.reservationId') }}:
                <strong>{{ successReservation.id.slice(0, 8) }}</strong>
              </p>
              <p class="success-note">{{ $t('reservation.successNote') }}</p>
              <button class="btn-primary" @click="closeModal">
                {{ $t('common.close') }}
              </button>
            </div>

            <!-- Confirmation form -->
            <div v-else class="reserve-confirm">
              <h3 class="confirm-title">{{ $t('reservation.confirmTitle') }}</h3>

              <div class="confirm-vehicle">
                <span class="confirm-vehicle-title">{{ vehicleTitle }}</span>
              </div>

              <!-- Deposit info -->
              <div v-if="depositInfo" class="confirm-deposit">
                <div class="deposit-row">
                  <span class="deposit-label">{{ $t('reservation.deposit') }}</span>
                  <span
                    class="deposit-amount"
                    :class="{ 'deposit-amount--free': depositInfo.is_free }"
                  >
                    <template v-if="depositInfo.is_free">
                      {{ $t('reservation.free') }}
                    </template>
                    <template v-else>
                      {{ formatCents(depositInfo.amount_cents) }}
                    </template>
                  </span>
                </div>

                <p v-if="depositInfo.is_free" class="deposit-freebie">
                  {{ $t('reservation.freebieNote', { remaining: depositInfo.free_remaining }) }}
                </p>
              </div>

              <!-- Loading deposit info -->
              <div v-else class="deposit-loading">
                <span class="spinner" />
                <span>{{ $t('common.loading') }}</span>
              </div>

              <!-- Terms -->
              <p class="confirm-terms">
                {{ $t('reservation.terms') }}
              </p>

              <!-- Error -->
              <p v-if="errorMsg" class="confirm-error">
                {{ errorMsg }}
              </p>

              <!-- Actions -->
              <div class="confirm-actions">
                <button class="btn-primary" :disabled="creating || !depositInfo" @click="onConfirm">
                  <span v-if="creating" class="spinner spinner--white" />
                  <template v-else>
                    {{ $t('reservation.confirm') }}
                  </template>
                </button>
                <button class="btn-secondary" :disabled="creating" @click="closeModal">
                  {{ $t('common.cancel') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useReservation } from '~/composables/useReservation'
import type { Reservation, DepositInfo } from '~/composables/useReservation'

const props = defineProps<{
  vehicleId: string
  sellerId: string
  vehicleTitle: string
}>()

const { creating, getDepositInfo, createReservation, isVehicleReserved } = useReservation()

const modalOpen = ref(false)
const isReserved = ref(false)
const checkingReserved = ref(false)
const depositInfo = ref<DepositInfo | null>(null)
const successReservation = ref<Reservation | null>(null)
const errorMsg = ref('')

// Check reservation status on mount
onMounted(async () => {
  checkingReserved.value = true
  try {
    isReserved.value = await isVehicleReserved(props.vehicleId)
  } catch {
    // Silently ignore — button stays enabled
  } finally {
    checkingReserved.value = false
  }
})

async function openModal(): Promise<void> {
  if (isReserved.value || creating.value) return

  modalOpen.value = true
  successReservation.value = null
  errorMsg.value = ''
  depositInfo.value = null
  document.body.style.overflow = 'hidden'

  try {
    depositInfo.value = await getDepositInfo()
  } catch {
    errorMsg.value = 'Error loading deposit info'
  }
}

function closeModal(): void {
  modalOpen.value = false
  document.body.style.overflow = ''
}

async function onConfirm(): Promise<void> {
  if (!depositInfo.value || creating.value) return

  errorMsg.value = ''
  try {
    const reservation = await createReservation(props.vehicleId)
    successReservation.value = reservation
    isReserved.value = true
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Error creating reservation'
  }
}

function formatCents(cents: number): string {
  const euros = cents / 100
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(euros)
}

// Cleanup
onUnmounted(() => {
  if (modalOpen.value) {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
/* Main button */
.reserve-btn {
  width: 100%;
  min-height: 48px;
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
}

.reserve-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.reserve-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Backdrop */
.reserve-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: var(--z-modal-backdrop);
}

/* Modal (mobile bottom sheet) */
.reserve-modal {
  position: relative;
  width: 100%;
  max-height: 85vh;
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
  padding: var(--spacing-6);
  padding-top: var(--spacing-8);
  overflow-y: auto;
}

.modal-close {
  position: absolute;
  top: var(--spacing-2);
  right: var(--spacing-3);
  background: none;
  border: none;
  font-size: 28px;
  color: var(--text-auxiliary);
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Confirm section */
.confirm-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-4) 0;
}

.confirm-vehicle {
  padding: var(--spacing-3);
  background: var(--color-gray-50);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
}

.confirm-vehicle-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

/* Deposit */
.confirm-deposit {
  padding: var(--spacing-4);
  background: var(--color-gray-50);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
}

.deposit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.deposit-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.deposit-amount {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.deposit-amount--free {
  color: var(--color-success);
}

.deposit-freebie {
  font-size: var(--font-size-xs);
  color: var(--color-success);
  margin: var(--spacing-2) 0 0 0;
  font-weight: var(--font-weight-medium);
}

.deposit-loading {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-4);
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}

/* Terms */
.confirm-terms {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  line-height: var(--line-height-relaxed);
  margin: 0 0 var(--spacing-4) 0;
}

/* Error */
.confirm-error {
  font-size: var(--font-size-sm);
  color: var(--color-error);
  margin: 0 0 var(--spacing-4) 0;
}

/* Actions */
.confirm-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.btn-primary {
  width: 100%;
  min-height: 48px;
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  width: 100%;
  min-height: 48px;
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Success state */
.reserve-success {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
}

.success-icon-wrapper {
  color: var(--color-success);
}

.success-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
}

.success-id {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
}

.success-id strong {
  color: var(--text-primary);
  font-family: monospace;
}

.success-note {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  line-height: var(--line-height-relaxed);
  margin: 0;
}

/* Spinner */
.spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.spinner--white {
  border-top-color: var(--color-white);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Modal transitions */
.reserve-modal-enter-active,
.reserve-modal-leave-active {
  transition: opacity var(--transition-normal);
}

.reserve-modal-enter-active .reserve-modal,
.reserve-modal-leave-active .reserve-modal {
  transition: transform var(--transition-normal);
}

.reserve-modal-enter-from,
.reserve-modal-leave-to {
  opacity: 0;
}

.reserve-modal-enter-from .reserve-modal,
.reserve-modal-leave-to .reserve-modal {
  transform: translateY(100%);
}

/* Desktop: centered modal */
@media (min-width: 768px) {
  .reserve-backdrop {
    align-items: center;
  }

  .reserve-modal {
    max-width: 480px;
    border-radius: var(--border-radius-md);
    margin: 0 auto;
  }

  .reserve-modal-enter-from .reserve-modal,
  .reserve-modal-leave-to .reserve-modal {
    transform: scale(0.9);
  }
}
</style>
