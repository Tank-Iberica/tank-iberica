<script setup lang="ts">
import {
  truncateId,
  getStripeAccountUrl,
  type DealerStripeAccount,
} from '~/composables/admin/useAdminPagos'

defineProps<{
  accounts: DealerStripeAccount[]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="stripe-connect-section">
    <h2>{{ t('admin.pagos.stripeConnect') }}</h2>
    <p class="section-subtitle">{{ t('admin.pagos.stripeConnectSubtitle') }}</p>

    <!-- Desktop table -->
    <div class="table-wrapper desktop-only">
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ t('admin.pagos.connectDealer') }}</th>
            <th>{{ t('admin.pagos.connectAccountId') }}</th>
            <th>{{ t('admin.pagos.connectOnboarding') }}</th>
            <th>{{ t('admin.pagos.connectCharges') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="account in accounts" :key="account.id">
            <td class="cell-dealer">{{ account.dealers?.company_name || '-' }}</td>
            <td>
              <a
                :href="getStripeAccountUrl(account.stripe_account_id)"
                target="_blank"
                rel="noopener"
                class="stripe-link"
              >
                {{ truncateId(account.stripe_account_id) }}
              </a>
            </td>
            <td>
              <span
                class="connect-status"
                :class="account.onboarding_completed ? 'connect-ok' : 'connect-pending'"
              >
                {{
                  account.onboarding_completed
                    ? t('admin.pagos.connectCompleted')
                    : t('admin.pagos.connectIncomplete')
                }}
              </span>
            </td>
            <td>
              <span
                class="connect-status"
                :class="account.charges_enabled ? 'connect-ok' : 'connect-pending'"
              >
                {{
                  account.charges_enabled
                    ? t('admin.pagos.connectEnabled')
                    : t('admin.pagos.connectDisabled')
                }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile cards for Stripe Connect -->
    <div class="card-list mobile-only">
      <div v-for="account in accounts" :key="account.id" class="connect-card">
        <div class="connect-card-name">{{ account.dealers?.company_name || '-' }}</div>
        <div class="card-details">
          <div class="card-detail">
            <span class="detail-label">{{ t('admin.pagos.connectAccountId') }}</span>
            <a
              :href="getStripeAccountUrl(account.stripe_account_id)"
              target="_blank"
              rel="noopener"
              class="stripe-link"
            >
              {{ truncateId(account.stripe_account_id) }}
            </a>
          </div>
          <div class="card-detail">
            <span class="detail-label">{{ t('admin.pagos.connectOnboarding') }}</span>
            <span
              class="connect-status"
              :class="account.onboarding_completed ? 'connect-ok' : 'connect-pending'"
            >
              {{
                account.onboarding_completed
                  ? t('admin.pagos.connectCompleted')
                  : t('admin.pagos.connectIncomplete')
              }}
            </span>
          </div>
          <div class="card-detail">
            <span class="detail-label">{{ t('admin.pagos.connectCharges') }}</span>
            <span
              class="connect-status"
              :class="account.charges_enabled ? 'connect-ok' : 'connect-pending'"
            >
              {{
                account.charges_enabled
                  ? t('admin.pagos.connectEnabled')
                  : t('admin.pagos.connectDisabled')
              }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stripe-connect-section {
  margin-top: 16px;
}

.stripe-connect-section h2 {
  margin: 0 0 4px;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.section-subtitle {
  margin: 0 0 16px;
  color: var(--text-auxiliary);
  font-size: 0.875rem;
}

/* Desktop table */
.desktop-only {
  display: none;
}

.table-wrapper {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border-bottom: 1px solid var(--color-gray-200);
  white-space: nowrap;
}

.data-table td {
  padding: 12px 16px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--color-gray-100);
}

.cell-dealer {
  font-weight: 600;
}

.stripe-link {
  color: #635bff;
  text-decoration: none;
  font-family: monospace;
  font-size: 0.8rem;
}

.stripe-link:hover {
  text-decoration: underline;
}

/* Mobile cards */
.mobile-only {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.connect-card {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: box-shadow 0.2s;
  padding: 16px;
}

.connect-card:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.connect-card-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.card-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.card-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 0.75rem;
  color: var(--text-disabled);
  font-weight: 500;
}

.connect-status {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
}

.connect-status.connect-ok {
  background: var(--color-success-bg, #dcfce7);
  color: var(--color-success);
}

.connect-status.connect-pending {
  background: var(--color-warning-bg, #fef3c7);
  color: var(--color-warning-text);
}

@media (min-width: 768px) {
  .desktop-only {
    display: block;
  }

  .mobile-only {
    display: none;
  }
}
</style>
