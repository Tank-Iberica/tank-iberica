<script setup lang="ts">
/**
 * SuscripcionTable — Data table with all columns + action buttons per row
 * Extracted from pages/admin/dealers/suscripciones.vue
 */

import type { DealerSubscription } from '~/composables/admin/useAdminDealerSuscripciones'
import { formatPriceCents } from '~/composables/shared/useListingUtils'

const { t } = useI18n()

defineProps<{
  filteredSubscriptions: DealerSubscription[]
  saving: boolean
  getPlanConfig: (plan: string) => { value: string; label: string; color: string }
  getStatusConfig: (status: string | null) => { value: string; label: string; color: string }
  getDealerName: (sub: DealerSubscription) => string
  formatDate: (dateStr: string | null) => string
  isExpired: (expiresAt: string | null) => boolean
}>()

const emit = defineEmits<{
  'change-plan': [sub: DealerSubscription]
  extend: [sub: DealerSubscription]
  cancel: [sub: DealerSubscription]
}>()
</script>

<template>
  <div class="table-container">
    <table class="admin-table">
      <thead>
        <tr>
          <th>{{ t('admin.dealerSubscriptions.colDealer') }}</th>
          <th style="width: 100px">
            {{ t('admin.dealerSubscriptions.colPlan') }}
          </th>
          <th style="width: 100px">
            {{ t('admin.dealerSubscriptions.colStatus') }}
          </th>
          <th style="width: 5rem">
            {{ t('admin.dealerSubscriptions.vertical') }}
          </th>
          <th style="width: 100px">
            {{ t('admin.dealerSubscriptions.colStarted') }}
          </th>
          <th style="width: 100px">
            {{ t('admin.dealerSubscriptions.colExpires') }}
          </th>
          <th style="width: 90px">
            {{ t('admin.dealerSubscriptions.colPrice') }}
          </th>
          <th style="width: 160px">
            {{ t('admin.dealerSubscriptions.colActions') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="sub in filteredSubscriptions"
          :key="sub.id"
          :class="{
            'row-canceled': sub.status === 'canceled',
            'row-expired': isExpired(sub.expires_at) && sub.status === 'active',
          }"
        >
          <td>
            <div class="dealer-info">
              <strong>{{ getDealerName(sub) }}</strong>
              <span v-if="sub.dealer?.slug" class="dealer-slug">/{{ sub.dealer.slug }}</span>
            </div>
          </td>
          <td>
            <span
              class="plan-badge"
              :style="{
                backgroundColor: getPlanConfig(sub.plan).color + '18',
                color: getPlanConfig(sub.plan).color,
                borderColor: getPlanConfig(sub.plan).color + '40',
              }"
            >
              {{ getPlanConfig(sub.plan).label }}
            </span>
          </td>
          <td>
            <span
              class="status-badge"
              :style="{
                backgroundColor: getStatusConfig(sub.status).color + '18',
                color: getStatusConfig(sub.status).color,
                borderColor: getStatusConfig(sub.status).color + '40',
              }"
            >
              {{ getStatusConfig(sub.status).label }}
            </span>
          </td>
          <td>
            <span class="vertical-badge">{{ sub.vertical }}</span>
          </td>
          <td>{{ formatDate(sub.started_at) }}</td>
          <td :class="{ 'text-expired': isExpired(sub.expires_at) }">
            {{ formatDate(sub.expires_at) }}
          </td>
          <td class="text-right">
            {{ formatPriceCents(sub.price_cents) }}
          </td>
          <td>
            <div class="action-buttons">
              <button
                class="btn-icon btn-edit"
                :title="t('admin.dealerSubscriptions.changePlan')"
                @click="emit('change-plan', sub)"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                class="btn-icon btn-extend"
                :title="t('admin.dealerSubscriptions.extend30Days')"
                @click="emit('extend', sub)"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </button>
              <button
                v-if="sub.status !== 'canceled'"
                class="btn-icon btn-cancel"
                :title="t('admin.dealerSubscriptions.cancelSubscription')"
                @click="emit('cancel', sub)"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!filteredSubscriptions.length">
          <td colspan="8" class="empty-state">
            {{ t('admin.dealerSubscriptions.noResults') }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-container {
  background: var(--bg-primary, white);
  border-radius: var(--border-radius, 8px);
  overflow: hidden;
  box-shadow: var(--shadow-sm, var(--shadow-card));
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 56.25em;
}

.admin-table th,
.admin-table td {
  padding: var(--spacing-3) var(--spacing-4);
  text-align: left;
  border-bottom: 1px solid var(--border-color-light, var(--color-gray-200));
}

.admin-table th {
  background: var(--color-gray-50, var(--color-gray-50));
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-gray-700, var(--color-gray-700));
  font-size: var(--font-size-sm, 0.875rem);
  white-space: nowrap;
}

.admin-table tr:hover {
  background: var(--color-gray-50, var(--color-gray-50));
}

.admin-table tr.row-canceled {
  opacity: 0.6;
}

.admin-table tr.row-expired {
  background: var(--color-warning-bg, var(--color-warning-bg));
}

.admin-table tr.row-expired:hover {
  background: var(--color-warning-bg, var(--color-warning-bg));
}

/* ---- Dealer Info ---- */
.dealer-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.dealer-info strong {
  font-size: var(--font-size-sm, 0.95rem);
  color: var(--text-primary, var(--text-primary));
}

.dealer-slug {
  font-size: var(--font-size-xs, 0.75rem);
  color: var(--color-gray-400, var(--color-gray-400));
}

/* ---- Badges ---- */
.plan-badge,
.status-badge {
  display: inline-block;
  padding: 0.1875rem 0.625rem;
  border-radius: var(--border-radius-lg, 12px);
  font-size: var(--font-size-xs, 0.75rem);
  font-weight: var(--font-weight-semibold, 600);
  border: 1px solid;
  white-space: nowrap;
}

.vertical-badge {
  display: inline-block;
  background: var(--color-gray-100, var(--color-gray-100));
  color: var(--color-gray-600, var(--color-gray-600));
  padding: 0.1875rem 0.5rem;
  border-radius: var(--border-radius-sm, 4px);
  font-size: var(--font-size-xs, 0.75rem);
  font-weight: var(--font-weight-medium, 500);
}

.text-right {
  text-align: right;
}

.text-expired {
  color: var(--color-error);
  font-weight: var(--font-weight-semibold, 600);
}

/* ---- Action Buttons ---- */
.action-buttons {
  display: flex;
  gap: 0.375rem;
}

.btn-icon {
  background: none;
  border: 1px solid var(--border-color-light, var(--color-gray-200));
  padding: 0.375rem 0.5rem;
  border-radius: var(--border-radius-sm, 4px);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast, 150ms ease);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  min-width: 2.75rem;
  color: var(--color-gray-500, var(--color-gray-500));
}

.btn-icon:hover {
  background: var(--color-gray-100, var(--color-gray-100));
}

.btn-edit:hover {
  background: var(--color-info-bg, var(--color-info-bg));
  color: var(--color-info);
  border-color: var(--color-info);
}

.btn-extend:hover {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-success);
  border-color: var(--color-success);
}

.btn-cancel:hover {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  border-color: var(--color-error);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-10);
  color: var(--color-gray-500, var(--color-gray-500));
}

@media (max-width: 30em) {
  .action-buttons {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>
