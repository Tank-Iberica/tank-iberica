<script setup lang="ts">
import {
  type BrokerageDeal,
  type DealStatus,
  getStatusLabel,
  getStatusColor,
  getDealModeLabel,
  formatDealPrice,
  formatDealDate,
} from '~/composables/admin/useAdminBrokerage'
import type {
  BrokerageMessage,
  BrokerageAuditEntry,
  AddMessagePayload,
} from '~/composables/admin/useAdminBrokerageDeal'

const props = defineProps<{
  show: boolean
  deal: BrokerageDeal | null
  messages: readonly BrokerageMessage[]
  auditLog: readonly BrokerageAuditEntry[]
  loading: boolean
  saving: boolean
  error: string | null
  validNextStatuses: DealStatus[]
  dealPhase: string
}>()

const emit = defineEmits<{
  close: []
  transition: [status: DealStatus, reason?: string]
  addMessage: [payload: AddMessagePayload]
  updateFields: [fields: Record<string, unknown>]
  assignHuman: [name: string]
}>()

// Transition reason (for cancellations/escalations)
const transitionReason = ref('')
const showTransitionInput = ref(false)
const pendingTransition = ref<DealStatus | null>(null)

function startTransition(status: DealStatus) {
  const needsReason = [
    'deal_cancelled',
    'broker_failed',
    'seller_declined',
    'no_margin',
    'escalated_to_humans',
  ].includes(status)
  if (needsReason) {
    pendingTransition.value = status
    showTransitionInput.value = true
    transitionReason.value = ''
  } else {
    emit('transition', status)
  }
}

function confirmTransition() {
  if (pendingTransition.value) {
    emit('transition', pendingTransition.value, transitionReason.value || undefined)
    showTransitionInput.value = false
    pendingTransition.value = null
    transitionReason.value = ''
  }
}

function cancelTransition() {
  showTransitionInput.value = false
  pendingTransition.value = null
}

// Human assignment
const assigneeName = ref('')
const showAssignInput = ref(false)

function submitAssign() {
  if (assigneeName.value.trim()) {
    emit('assignHuman', assigneeName.value.trim())
    showAssignInput.value = false
    assigneeName.value = ''
  }
}

// Message form
function onAddMessage(payload: AddMessagePayload) {
  emit('addMessage', payload)
}

function vehicleTitle(): string {
  if (!props.deal?.vehicle) return '-'
  const v = props.deal.vehicle
  return [v.brand, v.model, v.year].filter(Boolean).join(' ')
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function transitionBtnClass(status: DealStatus): string {
  if (status === 'deal_cancelled') return 'btn-danger'
  if (status === 'deal_closed') return 'btn-success'
  return 'btn-action'
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content" role="dialog" aria-label="Detalle Deal">
        <div class="modal-header">
          <h2>Deal {{ deal?.id?.slice(0, 8) }}...</h2>
          <button class="close-btn" aria-label="Cerrar" @click="$emit('close')">&times;</button>
        </div>

        <div v-if="loading" class="modal-loading">{{ $t('common.loading') }}</div>

        <div v-else-if="deal" class="modal-body">
          <!-- Info panel -->
          <section class="info-panel">
            <div class="info-row">
              <span class="info-label">Estado</span>
              <span class="status-badge" :style="{ '--badge-color': getStatusColor(deal.status) }">
                {{ getStatusLabel(deal.status) }}
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Modo</span>
              <span class="mode-badge" :class="`mode-${deal.deal_mode}`">
                {{ getDealModeLabel(deal.deal_mode) }}
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Vehiculo</span>
              <span>{{ vehicleTitle() }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Comprador</span>
              <span>{{ deal.buyer?.email || deal.buyer_phone || '-' }}</span>
            </div>
            <div v-if="deal.buyer_budget_min || deal.buyer_budget_max" class="info-row">
              <span class="info-label">Presupuesto</span>
              <span
                >{{ formatDealPrice(deal.buyer_budget_min) }} -
                {{ formatDealPrice(deal.buyer_budget_max) }}</span
              >
            </div>
            <div v-if="deal.buyer_score != null" class="info-row">
              <span class="info-label">Score</span>
              <span>{{ deal.buyer_score }}/100</span>
            </div>
            <div class="info-row">
              <span class="info-label">Precio pedido</span>
              <span>{{ formatDealPrice(deal.asking_price) }}</span>
            </div>
            <div v-if="deal.offer_price" class="info-row">
              <span class="info-label">Precio ofertado</span>
              <span>{{ formatDealPrice(deal.offer_price) }}</span>
            </div>
            <div v-if="deal.agreed_deal_price || deal.agreed_buy_price" class="info-row">
              <span class="info-label">Precio acordado</span>
              <span>{{ formatDealPrice(deal.agreed_deal_price || deal.agreed_buy_price) }}</span>
            </div>
            <div v-if="deal.margin_amount" class="info-row">
              <span class="info-label">Margen</span>
              <span>{{ formatDealPrice(deal.margin_amount) }} ({{ deal.margin_pct }}%)</span>
            </div>
            <div class="info-row">
              <span class="info-label">Asignado a</span>
              <span v-if="deal.human_assignee">{{ deal.human_assignee }}</span>
              <button v-else class="link-btn" @click="showAssignInput = true">Asignar</button>
            </div>
            <div class="info-row">
              <span class="info-label">Creado</span>
              <span>{{ formatDealDate(deal.created_at) }}</span>
            </div>
          </section>

          <!-- Assign human input -->
          <div v-if="showAssignInput" class="inline-input">
            <input
              v-model="assigneeName"
              type="text"
              class="form-input-sm"
              placeholder="Nombre del responsable"
              @keyup.enter="submitAssign"
            >
            <button class="btn-sm" @click="submitAssign">OK</button>
            <button class="btn-sm-ghost" @click="showAssignInput = false">X</button>
          </div>

          <!-- Status transitions -->
          <section v-if="validNextStatuses.length" class="transitions-section">
            <h3 class="section-title">Acciones</h3>
            <div class="transition-btns">
              <button
                v-for="status in validNextStatuses"
                :key="status"
                :class="transitionBtnClass(status)"
                :disabled="saving"
                @click="startTransition(status)"
              >
                {{ getStatusLabel(status) }}
              </button>
            </div>

            <!-- Reason input for transitions that need it -->
            <div v-if="showTransitionInput" class="transition-reason">
              <input
                v-model="transitionReason"
                type="text"
                class="form-input-sm"
                :placeholder="`Motivo para '${getStatusLabel(pendingTransition!)}'`"
                @keyup.enter="confirmTransition"
              >
              <button class="btn-sm" :disabled="saving" @click="confirmTransition">
                {{ $t('common.confirm') }}
              </button>
              <button class="btn-sm-ghost" @click="cancelTransition">
                {{ $t('common.cancel') }}
              </button>
            </div>
          </section>

          <p v-if="error" class="error-msg">{{ error }}</p>

          <!-- Messages timeline -->
          <section class="messages-section">
            <h3 class="section-title">Mensajes ({{ messages.length }})</h3>
            <div v-if="messages.length === 0" class="empty-hint">Sin mensajes todavia.</div>
            <div v-else class="messages-list">
              <div
                v-for="msg in messages"
                :key="msg.id"
                class="message-bubble"
                :class="msg.direction"
              >
                <div class="msg-header">
                  <span class="msg-sender">{{ msg.sender_entity }}</span>
                  <span class="msg-channel">{{ msg.channel }}</span>
                  <span class="msg-time">{{ formatTime(msg.created_at) }}</span>
                </div>
                <div class="msg-content">{{ msg.content }}</div>
              </div>
            </div>

            <AdminBrokerajeBrokerajeMessageForm :saving="saving" @submit="onAddMessage" />
          </section>

          <!-- Audit log -->
          <AdminBrokerajeBrokerajeAuditLog :entries="auditLog" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: var(--z-modal, 1000);
  padding: var(--spacing-4);
  overflow-y: auto;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg, 0.75rem);
  width: 100%;
  max-width: 40rem;
  margin: var(--spacing-8) 0;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-4) var(--spacing-6);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  background: var(--bg-primary);
  z-index: 1;
  border-radius: var(--border-radius-lg, 0.75rem) var(--border-radius-lg, 0.75rem) 0 0;
}

.modal-header h2 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin: 0;
}

.close-btn {
  font-size: 1.5rem;
  color: var(--text-secondary);
  line-height: 1;
  padding: var(--spacing-1);
}

.modal-loading {
  padding: var(--spacing-8);
  text-align: center;
  color: var(--text-secondary);
}

.modal-body {
  padding: var(--spacing-6);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

/* Info panel */
.info-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
  padding: var(--spacing-1) 0;
}

.info-label {
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.status-badge {
  display: inline-block;
  padding: 0.125rem var(--spacing-2);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--badge-color);
  background: color-mix(in srgb, var(--badge-color) 12%, transparent);
}

.mode-badge {
  display: inline-block;
  padding: 0.125rem var(--spacing-2);
  border-radius: var(--border-radius);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.mode-broker {
  color: var(--color-info);
  background: rgba(59, 130, 246, 0.1);
}

.mode-tank {
  color: var(--color-orange-500);
  background: rgba(249, 115, 22, 0.1);
}

.link-btn {
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  text-decoration: underline;
}

/* Inline inputs */
.inline-input {
  display: flex;
  gap: var(--spacing-2);
  align-items: center;
}

.form-input-sm {
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  flex: 1;
  min-height: 2rem;
}

.btn-sm {
  padding: var(--spacing-1) var(--spacing-2);
  background: var(--color-primary);
  color: var(--text-on-dark-primary);
  border-radius: var(--border-radius);
  font-size: var(--font-size-xs);
  min-height: 2rem;
}

.btn-sm-ghost {
  padding: var(--spacing-1) var(--spacing-2);
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  min-height: 2rem;
}

/* Transitions */
.transitions-section {
  border-top: 1px solid var(--border-color);
  padding-top: var(--spacing-3);
}

.section-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  margin: 0 0 var(--spacing-2);
}

.transition-btns {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.btn-action {
  padding: var(--spacing-1) var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  min-height: 2.25rem;
  transition: all var(--transition-fast);
}

.btn-action:hover {
  background: var(--bg-secondary);
}

.btn-action:disabled {
  opacity: 0.5;
}

.btn-danger {
  padding: var(--spacing-1) var(--spacing-3);
  border: 1px solid var(--color-error);
  color: var(--color-error);
  border-radius: var(--border-radius);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  min-height: 2.25rem;
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.1);
}

.btn-success {
  padding: var(--spacing-1) var(--spacing-3);
  border: 1px solid var(--color-success);
  color: var(--color-success);
  border-radius: var(--border-radius);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  min-height: 2.25rem;
}

.btn-success:hover {
  background: rgba(16, 185, 129, 0.1);
}

.transition-reason {
  display: flex;
  gap: var(--spacing-2);
  align-items: center;
  margin-top: var(--spacing-2);
}

.error-msg {
  color: var(--color-error);
  font-size: var(--font-size-sm);
}

/* Messages */
.messages-section {
  border-top: 1px solid var(--border-color);
  padding-top: var(--spacing-3);
}

.empty-hint {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  padding: var(--spacing-2) 0;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  max-height: 20rem;
  overflow-y: auto;
  padding: var(--spacing-2) 0;
}

.message-bubble {
  padding: var(--spacing-3);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  max-width: 85%;
}

.message-bubble.outbound {
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  align-self: flex-end;
  margin-left: auto;
}

.message-bubble.inbound {
  background: var(--bg-secondary);
  align-self: flex-start;
}

.msg-header {
  display: flex;
  gap: var(--spacing-2);
  align-items: baseline;
  margin-bottom: var(--spacing-1);
}

.msg-sender {
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-xs);
}

.msg-channel {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.msg-time {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-left: auto;
}

.msg-content {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
