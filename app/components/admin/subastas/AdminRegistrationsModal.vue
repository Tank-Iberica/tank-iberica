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
    <div v-if="show" class="modal-overlay" @click.self="emit('close')">
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
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-large {
  max-width: 720px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
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
  gap: 12px;
  padding: 60px 20px;
  color: #64748b;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
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
  padding: 40px 20px;
  color: #6b7280;
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
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.registrations-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.user-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-email {
  font-size: 0.75rem;
  color: #6b7280;
}

.deposit-badge,
.reg-status-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.deposit-pending {
  background: #fef3c7;
  color: #92400e;
}

.deposit-held {
  background: #dbeafe;
  color: #1d4ed8;
}

.deposit-captured {
  background: #dcfce7;
  color: #15803d;
}

.deposit-released {
  background: #f3f4f6;
  color: #6b7280;
}

.deposit-forfeited {
  background: #fee2e2;
  color: #991b1b;
}

.reg-status-pending {
  background: #fef3c7;
  color: #92400e;
}

.reg-status-approved {
  background: #dcfce7;
  color: #15803d;
}

.reg-status-rejected {
  background: #fee2e2;
  color: #991b1b;
}

.reg-actions {
  display: flex;
  gap: 6px;
}

.reg-btn {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  min-height: 36px;
}

.reg-approve {
  background: #dcfce7;
  color: #15803d;
  border-color: #bbf7d0;
}

.reg-approve:hover {
  background: #bbf7d0;
}

.reg-reject {
  background: #fee2e2;
  color: #991b1b;
  border-color: #fecaca;
}

.reg-reject:hover {
  background: #fecaca;
}

/* ============================================
   BUTTONS
   ============================================ */
.btn-secondary {
  background: #e5e7eb;
  color: #374151;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  min-height: 44px;
}

/* ============================================
   RESPONSIVE — Mobile-first
   ============================================ */
@media (max-width: 768px) {
  .registrations-table {
    font-size: 0.75rem;
  }

  .registrations-table th,
  .registrations-table td {
    padding: 8px;
  }
}
</style>
