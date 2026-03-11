<script setup lang="ts">
import type { AuctionRegistrationRow } from '~/composables/admin/useAdminAuctionList'

defineProps<{
  show: boolean
  auctionTitle: string
  registrations: AuctionRegistrationRow[]
  loading: boolean
}>()

const emit = defineEmits<{
  close: []
  approve: [regId: string]
  reject: [regId: string]
}>()

const { t } = useI18n()
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" role="dialog" aria-modal="true" @click.self="emit('close')">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h3>{{ t('admin.subastas.detail.bidders') }} &mdash; {{ auctionTitle }}</h3>
          <button class="modal-close" @click="emit('close')">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="loading" class="loading-state">
            <div class="spinner" />
            <span>{{ t('admin.subastas.loading') }}</span>
          </div>
          <div v-else-if="registrations.length === 0" class="empty-state">
            {{ t('admin.subastas.detail.noBidders') }}
          </div>
          <table v-else class="registrations-table">
            <thead>
              <tr>
                <th>{{ t('admin.subastas.detail.bidderUser') }}</th>
                <th>{{ t('admin.subastas.detail.bidderIdType') }}</th>
                <th>{{ t('admin.subastas.detail.bidderIdNumber') }}</th>
                <th>{{ t('admin.subastas.detail.bidderCompany') }}</th>
                <th>{{ t('admin.subastas.detail.bidderDeposit') }}</th>
                <th>{{ t('admin.subastas.detail.bidderStatus') }}</th>
                <th>{{ t('admin.subastas.detail.bidderActions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="reg in registrations" :key="reg.id">
                <td>
                  <div class="user-cell">
                    <strong>{{ reg.user?.full_name || 'N/A' }}</strong>
                    <span class="user-email">{{ reg.user?.email }}</span>
                  </div>
                </td>
                <td>{{ reg.id_type || '-' }}</td>
                <td>{{ reg.id_number || '-' }}</td>
                <td>{{ reg.company_name || '-' }}</td>
                <td>
                  <span class="deposit-badge" :class="`deposit-${reg.deposit_status}`">
                    {{ t(`admin.subastas.depositStatus.${reg.deposit_status}`) }}
                  </span>
                </td>
                <td>
                  <span class="reg-status-badge" :class="`reg-status-${reg.status}`">
                    {{ t(`admin.subastas.regStatus.${reg.status}`) }}
                  </span>
                </td>
                <td>
                  <div class="reg-actions">
                    <button
                      v-if="reg.status === 'pending'"
                      class="reg-btn reg-approve"
                      @click="emit('approve', reg.id)"
                    >
                      {{ t('admin.subastas.detail.approve') }}
                    </button>
                    <button
                      v-if="reg.status === 'pending'"
                      class="reg-btn reg-reject"
                      @click="emit('reject', reg.id)"
                    >
                      {{ t('admin.subastas.detail.reject') }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close')">
            {{ t('admin.dealerSubscriptions.closeBtn') }}
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-5);
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-large {
  max-width: 45rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-5) var(--spacing-6);
  border-bottom: 1px solid var(--color-gray-200);
  position: sticky;
  top: 0;
  background: var(--bg-primary);
  z-index: 1;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  cursor: pointer;
  color: var(--color-gray-500);
  min-width: 2.75rem;
  min-height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: var(--spacing-6);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  padding: var(--spacing-4) var(--spacing-6);
  border-top: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
  position: sticky;
  bottom: 0;
}

/* ============================================
   LOADING / EMPTY
   ============================================ */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  padding: 3.75rem var(--spacing-5);
  color: var(--text-auxiliary);
}

.spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 3px solid var(--color-gray-200);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  padding: var(--spacing-10) var(--spacing-5);
  color: var(--color-gray-500);
}

/* ============================================
   REGISTRATIONS TABLE
   ============================================ */
.registrations-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.registrations-table th,
.registrations-table td {
  padding: 0.625rem var(--spacing-3);
  text-align: left;
  border-bottom: 1px solid var(--color-gray-200);
}

.registrations-table th {
  background: var(--color-gray-50);
  font-weight: 600;
  color: var(--color-gray-700);
}

.user-cell {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.user-email {
  font-size: 0.75rem;
  color: var(--color-gray-500);
}

.deposit-badge,
.reg-status-badge {
  display: inline-block;
  padding: 0.1875rem var(--spacing-2);
  border-radius: var(--border-radius-sm);
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.deposit-pending {
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning-text);
}

.deposit-held {
  background: var(--color-info-bg, var(--color-info-bg));
  color: var(--color-info);
}

.deposit-captured {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-green-700);
}

.deposit-released {
  background: var(--bg-secondary);
  color: var(--color-gray-500);
}

.deposit-forfeited {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}

.reg-status-pending {
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning-text);
}

.reg-status-approved {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-green-700);
}

.reg-status-rejected {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}

.reg-actions {
  display: flex;
  gap: 0.375rem;
}

.reg-btn {
  padding: 0.375rem var(--spacing-3);
  border-radius: var(--border-radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  min-height: 2.25rem;
}

.reg-approve {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-green-700);
  border-color: var(--color-success-border);
}

.reg-approve:hover {
  background: var(--color-success-border);
}

.reg-reject {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  border-color: var(--color-error-border);
}

.reg-reject:hover {
  background: var(--color-error-border);
}

/* ============================================
   BUTTONS
   ============================================ */
.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--color-gray-700);
  border: none;
  padding: 0.625rem var(--spacing-5);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  min-height: 2.75rem;
}

/* ============================================
   RESPONSIVE — Mobile-first
   ============================================ */
@media (max-width: 48em) {
  .registrations-table {
    font-size: 0.75rem;
  }

  .registrations-table th,
  .registrations-table td {
    padding: var(--spacing-2);
  }
}
</style>
