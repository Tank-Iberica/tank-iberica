<script setup lang="ts">
/**
 * VehicleLifecyclePanel — Dealer UI for managing vehicle status transitions.
 *
 * Displays current status, available next states, and transition history.
 * Uses useListingLifecycle (#135 from Agent E).
 */
import { useListingLifecycle, STATUS_META, getValidTargets } from '~/composables/useListingLifecycle'
import type { VehicleStatus } from '~/composables/useListingLifecycle'

const props = defineProps<{
  vehicleId: string
  currentStatus: VehicleStatus
  dealerId: string
}>()

const emit = defineEmits<{
  statusChanged: [newStatus: VehicleStatus]
}>()

const { t } = useI18n()

const { transitioning, error, transition, getTransitionHistory } = useListingLifecycle()

const history = ref<Array<{ from: VehicleStatus; to: VehicleStatus; reason: string | null; timestamp: string }>>([])
const showHistory = ref(false)
const confirmTarget = ref<VehicleStatus | null>(null)
const reason = ref('')
const salePrice = ref<number | null>(null)
const buyerName = ref('')

const validTargets = computed(() => getValidTargets(props.currentStatus))
const currentMeta = computed(() => STATUS_META[props.currentStatus])
const requiresSaleInfo = computed(() => confirmTarget.value === 'sold')

async function loadHistory() {
  history.value = await getTransitionHistory(props.vehicleId)
  showHistory.value = true
}

function selectTarget(status: VehicleStatus) {
  confirmTarget.value = status
  reason.value = ''
  salePrice.value = null
  buyerName.value = ''
}

function cancelTransition() {
  confirmTarget.value = null
}

async function confirmTransition() {
  if (!confirmTarget.value) return

  const result = await transition(props.vehicleId, confirmTarget.value, {
    dealerId: props.dealerId,
    reason: reason.value || undefined,
    salePrice: salePrice.value ?? undefined,
    buyerName: buyerName.value || undefined,
  })

  if (result.success) {
    emit('statusChanged', confirmTarget.value)
    confirmTarget.value = null
    // Refresh history if open
    if (showHistory.value) {
      history.value = await getTransitionHistory(props.vehicleId)
    }
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="lifecycle-panel">
    <!-- Current status -->
    <div class="current-status" :style="{ borderLeftColor: currentMeta.color }">
      <span class="status-dot" :style="{ background: currentMeta.color }" />
      <span class="status-label">
        {{ currentMeta.label[$i18n.locale] ?? currentMeta.label.es }}
      </span>
    </div>

    <!-- Error -->
    <div v-if="error" class="error-msg" role="alert">{{ error }}</div>

    <!-- Available transitions -->
    <div v-if="validTargets.length > 0 && !confirmTarget" class="transitions-section">
      <p class="transitions-title">{{ t('lifecycle.changeStatus') }}</p>
      <div class="transitions-grid">
        <button
          v-for="target in validTargets"
          :key="target"
          class="transition-btn"
          :style="{ borderColor: STATUS_META[target].color, color: STATUS_META[target].color }"
          :disabled="transitioning"
          @click="selectTarget(target)"
        >
          {{ STATUS_META[target].label[$i18n.locale] ?? STATUS_META[target].label.es }}
        </button>
      </div>
    </div>

    <!-- Confirm transition form -->
    <div v-if="confirmTarget" class="confirm-form">
      <p class="confirm-title">
        {{ t('lifecycle.confirmTo', { status: STATUS_META[confirmTarget].label[$i18n.locale] ?? STATUS_META[confirmTarget].label.es }) }}
      </p>

      <!-- Sold-specific fields -->
      <template v-if="requiresSaleInfo">
        <div class="form-field">
          <label for="sale-price">{{ t('lifecycle.salePrice') }}</label>
          <input
            id="sale-price"
            v-model.number="salePrice"
            type="number"
            min="0"
            step="100"
            autocomplete="off"
            class="form-input"
            :placeholder="t('lifecycle.salePricePlaceholder')"
          />
        </div>
        <div class="form-field">
          <label for="buyer-name">{{ t('lifecycle.buyerName') }}</label>
          <input
            id="buyer-name"
            v-model="buyerName"
            type="text"
            autocomplete="off"
            class="form-input"
            :placeholder="t('lifecycle.buyerNamePlaceholder')"
          />
        </div>
      </template>

      <div class="form-field">
        <label for="transition-reason">{{ t('lifecycle.reason') }}</label>
        <input
          id="transition-reason"
          v-model="reason"
          type="text"
          autocomplete="off"
          class="form-input"
          :placeholder="t('lifecycle.reasonPlaceholder')"
        />
      </div>

      <div class="confirm-actions">
        <button class="btn-cancel" :disabled="transitioning" @click="cancelTransition">
          {{ t('common.cancel') }}
        </button>
        <button
          class="btn-confirm"
          :style="{ background: STATUS_META[confirmTarget].color }"
          :disabled="transitioning"
          @click="confirmTransition"
        >
          {{ transitioning ? t('lifecycle.transitioning') : t('lifecycle.confirm') }}
        </button>
      </div>
    </div>

    <!-- History toggle -->
    <div class="history-section">
      <button class="history-btn" @click="showHistory ? (showHistory = false) : loadHistory()">
        {{ showHistory ? t('lifecycle.hideHistory') : t('lifecycle.showHistory') }}
      </button>

      <ul v-if="showHistory" class="history-list">
        <li v-for="(entry, i) in history" :key="i" class="history-entry">
          <span class="history-from" :style="{ color: STATUS_META[entry.from]?.color }">
            {{ STATUS_META[entry.from]?.label[$i18n.locale] ?? entry.from }}
          </span>
          →
          <span class="history-to" :style="{ color: STATUS_META[entry.to]?.color }">
            {{ STATUS_META[entry.to]?.label[$i18n.locale] ?? entry.to }}
          </span>
          <span class="history-date">{{ formatDate(entry.timestamp) }}</span>
          <span v-if="entry.reason" class="history-reason">— {{ entry.reason }}</span>
        </li>
        <li v-if="history.length === 0" class="history-empty">{{ t('lifecycle.noHistory') }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.lifecycle-panel {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.current-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-secondary);
  border-left: 3px solid;
  border-radius: var(--border-radius);
}

.status-dot {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-label {
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.error-msg {
  padding: 0.5rem 0.75rem;
  background: var(--color-error-bg);
  color: var(--color-error);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
}

.transitions-title {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0 0 0.5rem;
}

.transitions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.transition-btn {
  padding: 0.375rem 0.75rem;
  border: 1.5px solid;
  border-radius: var(--border-radius);
  background: transparent;
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  min-height: 2.75rem;
}

.transition-btn:hover:not(:disabled) {
  filter: brightness(0.9);
  background: var(--bg-secondary);
}

.transition-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.confirm-form {
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius);
  padding: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.confirm-title {
  font-weight: 600;
  font-size: var(--font-size-sm);
  margin: 0;
  color: var(--text-primary);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-field label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  font-weight: 500;
}

.form-input {
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
}

.confirm-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 0.25rem;
}

.btn-cancel, .btn-confirm {
  padding: 0.375rem 0.875rem;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  border: none;
  min-height: 2.75rem;
}

.btn-cancel {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-light);
}

.btn-confirm {
  color: white;
}

.btn-cancel:disabled, .btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.history-btn {
  background: none;
  border: none;
  color: var(--color-primary, #23424A);
  font-size: var(--font-size-sm);
  cursor: pointer;
  padding: 0.25rem 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.history-list {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.history-entry {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  align-items: center;
}

.history-from, .history-to {
  font-weight: 600;
}

.history-date {
  margin-left: auto;
  color: var(--text-tertiary, var(--text-secondary));
}

.history-reason {
  font-style: italic;
}

.history-empty {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}
</style>
