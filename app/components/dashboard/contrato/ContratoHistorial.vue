<script setup lang="ts">
/**
 * Contract History Component
 * Displays list of saved contracts with status management
 */

type ContractStatus = 'draft' | 'signed' | 'active' | 'expired' | 'cancelled'

interface ContractRow {
  id: string
  dealer_id: string
  contract_type: string
  contract_date: string
  vehicle_id: string | null
  vehicle_plate: string | null
  vehicle_type: string | null
  client_name: string
  client_doc_number: string | null
  client_address: string | null
  terms: Record<string, unknown>
  pdf_url: string | null
  status: string
  created_at: string | null
  updated_at: string | null
}

interface Props {
  contracts: ContractRow[]
  loading: boolean
  error: string | null
}

defineProps<Props>()

const emit = defineEmits<{
  updateStatus: [contractId: string, newStatus: ContractStatus]
  createNew: []
}>()

const { t } = useI18n()

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: t('dashboard.tools.contract.statusDraft'),
    signed: t('dashboard.tools.contract.statusSigned'),
    active: t('dashboard.tools.contract.statusActive'),
    expired: t('dashboard.tools.contract.statusExpired'),
    cancelled: t('dashboard.tools.contract.statusCancelled'),
  }
  return labels[status] || status
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: '#6b7280',
    signed: '#3b82f6',
    active: '#22c55e',
    expired: '#f59e0b',
    cancelled: '#ef4444',
  }
  return colors[status] || '#6b7280'
}

function getContractTypeLabel(type: string): string {
  return type === 'arrendamiento'
    ? t('dashboard.tools.contract.typeRental')
    : t('dashboard.tools.contract.typeSale')
}
</script>

<template>
  <div class="contrato-historial">
    <div class="tool-header">
      <h2>{{ t('dashboard.tools.contract.historyTitle') }}</h2>
      <span class="history-count"
        >{{ contracts.length }} {{ t('dashboard.tools.contract.contracts') }}</span
      >
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state compact">
      <div class="spinner" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-error" style="margin: 16px">
      {{ error }}
    </div>

    <!-- Empty -->
    <div v-else-if="contracts.length === 0" class="empty-state">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      <p>{{ t('dashboard.tools.contract.noContracts') }}</p>
      <button class="btn btn-primary" @click="emit('createNew')">
        {{ t('dashboard.tools.contract.createFirst') }}
      </button>
    </div>

    <!-- Contract list -->
    <div v-else class="history-list">
      <div v-for="c in contracts" :key="c.id" class="history-card">
        <div class="history-card-header">
          <span class="contract-type-badge" :class="c.contract_type">
            {{ getContractTypeLabel(c.contract_type) }}
          </span>
          <span
            class="status-badge"
            :style="{
              background: getStatusColor(c.status) + '20',
              color: getStatusColor(c.status),
            }"
          >
            {{ getStatusLabel(c.status) }}
          </span>
        </div>

        <div class="history-card-body">
          <div class="history-field">
            <span class="field-label">{{ t('dashboard.tools.contract.client') }}</span>
            <span class="field-value">{{ c.client_name }}</span>
          </div>
          <div class="history-field">
            <span class="field-label">{{ t('dashboard.tools.contract.vehicle') }}</span>
            <span class="field-value">{{ c.vehicle_type || '' }} {{ c.vehicle_plate || '-' }}</span>
          </div>
          <div class="history-field">
            <span class="field-label">{{ t('dashboard.tools.contract.date') }}</span>
            <span class="field-value">{{ formatDateShort(c.contract_date) }}</span>
          </div>
        </div>

        <div class="history-card-actions">
          <select
            :value="c.status"
            class="status-select"
            @change="
              emit(
                'updateStatus',
                c.id,
                ($event.target as HTMLSelectElement).value as ContractStatus,
              )
            "
          >
            <option value="draft">{{ t('dashboard.tools.contract.statusDraft') }}</option>
            <option value="signed">{{ t('dashboard.tools.contract.statusSigned') }}</option>
            <option value="active">{{ t('dashboard.tools.contract.statusActive') }}</option>
            <option value="expired">{{ t('dashboard.tools.contract.statusExpired') }}</option>
            <option value="cancelled">{{ t('dashboard.tools.contract.statusCancelled') }}</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contrato-historial {
  background: var(--bg-primary);
}

.tool-header {
  padding: 16px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.tool-header h2 {
  margin: 0;
  font-size: 1.1rem;
}

.history-count {
  font-size: 0.85rem;
  color: #6b7280;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 16px;
  gap: 16px;
}

.loading-state.compact {
  padding: 32px 16px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color-light);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.alert {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 16px;
}

.alert-error {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
  border: 1px solid var(--color-error-border);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px 16px;
  color: #6b7280;
  text-align: center;
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
}

.btn {
  padding: 10px 20px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
  border: none;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.history-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-card {
  border: 1px solid var(--border-color-light);
  border-radius: 10px;
  padding: 16px;
  transition: box-shadow 0.2s;
}

.history-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.history-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.contract-type-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.contract-type-badge.arrendamiento {
  background: var(--color-info-bg, #dbeafe);
  color: #1e40af;
}

.contract-type-badge.compraventa {
  background: var(--color-warning-bg, #fef3c7);
  color: var(--color-warning-text);
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
}

.history-card-body {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.history-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.field-label {
  font-size: 0.7rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
}

.field-value {
  font-size: 0.9rem;
  color: #111827;
}

.history-card-actions {
  display: flex;
  justify-content: flex-end;
}

.status-select {
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.8rem;
  min-height: 36px;
  cursor: pointer;
}

.status-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
}

@media (max-width: 768px) {
  .history-card-body {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
