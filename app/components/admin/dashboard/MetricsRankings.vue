<script setup lang="ts">
import type { TopDealer, TopVehicle } from '~/composables/admin/useAdminMetrics'
import { formatNumber } from '~/composables/admin/useAdminDashboardPage'

defineProps<{
  topDealers: readonly TopDealer[]
  topVehicles: readonly TopVehicle[]
}>()
</script>

<template>
  <section class="rankings-grid">
    <!-- Top 10 Dealers -->
    <div class="ranking-card">
      <h2 class="ranking-card__title">{{ $t('admin.metrics.topDealers') }}</h2>
      <div v-if="!topDealers?.length" class="ranking-card__empty">
        {{ $t('admin.metrics.noData') }}
      </div>
      <div v-else class="ranking-card__table-wrapper">
        <table class="ranking-table">
          <thead>
            <tr>
              <th class="col-rank">{{ $t('admin.metrics.rank') }}</th>
              <th class="col-name">{{ $t('admin.metrics.name') }}</th>
              <th class="col-num">{{ $t('admin.metrics.vehicles') }}</th>
              <th class="col-num">{{ $t('admin.metrics.leads') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(dealer, idx) in topDealers" :key="dealer.dealerId">
              <td class="col-rank">{{ idx + 1 }}</td>
              <td class="col-name">{{ dealer.name }}</td>
              <td class="col-num">{{ formatNumber(dealer.vehicleCount) }}</td>
              <td class="col-num">{{ formatNumber(dealer.leadCount) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Top 10 Vehicles -->
    <div class="ranking-card">
      <h2 class="ranking-card__title">{{ $t('admin.metrics.topVehicles') }}</h2>
      <div v-if="!topVehicles?.length" class="ranking-card__empty">
        {{ $t('admin.metrics.noData') }}
      </div>
      <div v-else class="ranking-card__table-wrapper">
        <table class="ranking-table">
          <thead>
            <tr>
              <th class="col-rank">{{ $t('admin.metrics.rank') }}</th>
              <th class="col-name">{{ $t('admin.metrics.name') }}</th>
              <th class="col-num">{{ $t('admin.metrics.views') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(vehicle, idx) in topVehicles" :key="vehicle.vehicleId">
              <td class="col-rank">{{ idx + 1 }}</td>
              <td class="col-name">{{ vehicle.title }}</td>
              <td class="col-num">{{ formatNumber(vehicle.views) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<style scoped>
.rankings-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

.ranking-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-4);
}

.ranking-card__title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-3) 0;
}

.ranking-card__empty {
  padding: var(--spacing-8) 0;
  text-align: center;
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

.ranking-card__table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.ranking-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.ranking-table thead th {
  text-align: left;
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border-bottom: 1px solid var(--border-color);
  white-space: nowrap;
}

.ranking-table tbody td {
  padding: var(--spacing-3);
  border-bottom: 1px solid var(--border-color-light);
  color: var(--text-primary);
  vertical-align: middle;
  min-height: 44px;
}

.ranking-table tbody tr:last-child td {
  border-bottom: none;
}

.col-rank {
  width: 48px;
  text-align: center;
  font-weight: var(--font-weight-semibold);
  color: var(--text-auxiliary);
}

.col-name {
  min-width: 120px;
}

.col-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.ranking-table thead th.col-num {
  text-align: right;
}

@media (min-width: 768px) {
  .rankings-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
