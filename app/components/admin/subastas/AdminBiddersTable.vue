<script setup lang="ts">
import type {
  AuctionRegistration,
  RegistrationStatus,
  DepositStatus,
} from '~/composables/useAuctionRegistration'

defineProps<{
  registrations: AuctionRegistration[]
  actionLoading: boolean
  formatDateShort: (dateStr: string | null) => string
  getRegStatusClass: (status: RegistrationStatus) => string
  getRegStatusLabel: (status: RegistrationStatus) => string
  getDepositStatusClass: (status: DepositStatus) => string
  getDepositStatusLabel: (status: DepositStatus) => string
}>()

const emit = defineEmits<{
  approve: [regId: string]
  reject: [regId: string]
}>()

const { t } = useI18n()
</script>

<template>
  <section class="section">
    <h2 class="section-title">
      {{ t('admin.subastas.detail.bidders') }}
      <span class="count-badge-sm">{{ registrations.length }}</span>
    </h2>

    <div v-if="registrations.length === 0" class="empty-msg">
      {{ t('admin.subastas.detail.noBidders') }}
    </div>

    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ t('admin.subastas.detail.bidderUser') }}</th>
            <th>{{ t('admin.subastas.detail.bidderIdType') }}</th>
            <th>{{ t('admin.subastas.detail.bidderIdNumber') }}</th>
            <th>{{ t('admin.subastas.detail.bidderCompany') }}</th>
            <th>{{ t('admin.subastas.detail.bidderDeposit') }}</th>
            <th>{{ t('admin.subastas.detail.bidderStatus') }}</th>
            <th>{{ t('admin.subastas.detail.bidderDate') }}</th>
            <th class="col-actions">{{ t('admin.subastas.detail.bidderActions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="reg in registrations" :key="reg.id">
            <td class="text-small">{{ reg.user_id.slice(0, 8) }}...</td>
            <td>{{ reg.id_type?.toUpperCase() || '-' }}</td>
            <td>{{ reg.id_number || '-' }}</td>
            <td class="text-small">{{ reg.company_name || '-' }}</td>
            <td>
              <span class="deposit-badge" :class="getDepositStatusClass(reg.deposit_status)">
                {{ getDepositStatusLabel(reg.deposit_status) }}
              </span>
            </td>
            <td>
              <span class="reg-badge" :class="getRegStatusClass(reg.status)">
                {{ getRegStatusLabel(reg.status) }}
              </span>
            </td>
            <td class="text-small text-muted">{{ formatDateShort(reg.registered_at) }}</td>
            <td class="col-actions">
              <div class="row-actions">
                <button
                  v-if="reg.status === 'pending'"
                  class="action-btn action-approve"
                  :title="t('admin.subastas.detail.approve')"
                  :disabled="actionLoading"
                  @click="emit('approve', reg.id)"
                >
                  &#10003;
                </button>
                <button
                  v-if="reg.status === 'pending'"
                  class="action-btn action-reject"
                  :title="t('admin.subastas.detail.reject')"
                  :disabled="actionLoading"
                  @click="emit('reject', reg.id)"
                >
                  &#10005;
                </button>
                <a
                  v-if="reg.id_document_url"
                  :href="reg.id_document_url"
                  target="_blank"
                  rel="noopener"
                  class="action-btn"
                  :title="t('admin.subastas.detail.viewDoc')"
                >
                  &#128196;
                </a>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.section {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 20px 24px;
}

.section-title {
  margin: 0 0 16px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-badge-sm {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.empty-msg {
  text-align: center;
  color: var(--text-disabled);
  font-size: 0.875rem;
  padding: 32px 16px;
}

.table-container {
  overflow: auto;
  border-radius: 8px;
  border: 1px solid var(--color-gray-200);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 700px;
}

.data-table th {
  position: sticky;
  top: 0;
  background: var(--bg-secondary);
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border-bottom: 2px solid var(--color-gray-200);
  white-space: nowrap;
  z-index: 10;
}

.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-gray-100);
  font-size: 0.85rem;
  color: #334155;
}

.data-table tr:hover {
  background: var(--bg-secondary);
}

.col-actions {
  width: 120px;
}

.text-muted {
  color: var(--text-auxiliary);
}

.text-small {
  font-size: 0.8rem;
}

/* Registration badges */
.reg-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
}

:deep(.reg-pending) {
  background: var(--color-warning-bg, #fef3c7);
  color: var(--color-warning-text);
}
:deep(.reg-approved) {
  background: var(--color-success-bg, #dcfce7);
  color: var(--color-success);
}
:deep(.reg-rejected) {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
}

/* Deposit badges */
.deposit-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
}

:deep(.deposit-pending) {
  background: var(--bg-secondary);
  color: var(--text-auxiliary);
}
:deep(.deposit-held) {
  background: var(--color-info-bg, #dbeafe);
  color: var(--color-info);
}
:deep(.deposit-captured) {
  background: var(--color-success-bg, #dcfce7);
  color: var(--color-success);
}
:deep(.deposit-released) {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}
:deep(.deposit-forfeited) {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
}

/* Row actions */
.row-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  padding: 6px 10px;
  border: 1px solid var(--color-gray-200);
  border-radius: 6px;
  background: var(--bg-primary);
  cursor: pointer;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.15s;
  min-width: 36px;
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: var(--bg-secondary);
  border-color: var(--color-gray-300);
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-approve:hover {
  background: var(--color-success-bg, #dcfce7);
  border-color: var(--color-success);
  color: var(--color-success);
}

.action-reject:hover {
  background: var(--color-error-bg, #fef2f2);
  border-color: #fca5a5;
  color: var(--color-error);
}
</style>
