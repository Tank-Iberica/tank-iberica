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
    draft: 'var(--color-gray-500)',
    signed: 'var(--color-info)',
    active: '#22c55e',
    expired: 'var(--color-warning)',
    cancelled: 'var(--color-error)',
  }
  return colors[status] || 'var(--color-gray-500)'
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
    <div v-else-if="error" class="alert alert-error" style="margin: 1rem">
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
  padding: 1rem 1.25rem;
  background: var(--color-gray-50);
  border-bottom: 1px solid var(--color-gray-200);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tool-header h2 {
  margin: 0;
  font-size: 1.1rem;
}

.history-count {
  font-size: 0.85rem;
  color: var(--color-gray-500);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  gap: 1rem;
}

.loading-state.compact {
  padding: 2rem 1rem;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 0.1875rem solid var(--border-color-light);
  border-top-color: var(--color-primary);
  border-radius: var(--border-radius-full);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.alert-error {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  border: 1px solid var(--color-error-border);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 1rem;
  color: var(--color-gray-500);
  text-align: center;
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
}

.btn {
  padding: 0.625rem 1.25rem;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-decoration: none;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.history-list {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-card {
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  padding: 1rem;
  transition: box-shadow 0.2s;
}

.history-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.history-card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.contract-type-badge {
  font-size: var(--font-size-xs);
  font-weight: 600;
  padding: 0.25rem 0.625rem;
  border-radius: var(--border-radius);
  text-transform: uppercase;
  letter-spacing: 0.0188rem;
}

.contract-type-badge.arrendamiento {
  background: var(--color-info-bg, var(--color-info-bg));
  color: var(--badge-info-bg);
}

.contract-type-badge.compraventa {
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning-text);
}

.status-badge {
  font-size: var(--font-size-xs);
  font-weight: 600;
  padding: 0.25rem 0.625rem;
  border-radius: var(--border-radius);
}

.history-card-body {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.history-field {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.field-label {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--color-gray-500);
  text-transform: uppercase;
}

.field-value {
  font-size: 0.9rem;
  color: var(--color-gray-900);
}

.history-card-actions {
  display: flex;
  justify-content: flex-end;
}

.status-select {
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  min-height: 2.25rem;
  cursor: pointer;
}

.status-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-ring);
}

@media (max-width: 48em) {
  .history-card-body {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
}
</style>
