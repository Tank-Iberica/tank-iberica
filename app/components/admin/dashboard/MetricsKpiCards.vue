<script setup lang="ts">
import type { KpiSummary } from '~/composables/admin/useAdminMetrics'
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from '~/composables/admin/useAdminDashboardPage'

defineProps<{
  kpiSummary: KpiSummary
}>()
</script>

<template>
  <section class="kpi-grid">
    <!-- Revenue -->
    <div class="kpi-card">
      <span class="kpi-label">{{ $t('admin.metrics.revenue') }}</span>
      <span class="kpi-value">{{ formatCurrency(kpiSummary.monthlyRevenue.current / 100) }}</span>
      <span
        class="kpi-change"
        :class="{
          'kpi-change--up': kpiSummary.monthlyRevenue.changePercent > 0,
          'kpi-change--down': kpiSummary.monthlyRevenue.changePercent < 0,
        }"
      >
        <template v-if="kpiSummary.monthlyRevenue.changePercent > 0">
          <svg class="change-arrow" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 3l7 7h-5v7H8v-7H3l7-7z" />
          </svg>
          {{ formatPercent(kpiSummary.monthlyRevenue.changePercent) }}
        </template>
        <template v-else-if="kpiSummary.monthlyRevenue.changePercent < 0">
          <svg class="change-arrow" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 17l-7-7h5V3h4v7h5l-7 7z" />
          </svg>
          {{ formatPercent(kpiSummary.monthlyRevenue.changePercent) }}
        </template>
        <template v-else> &mdash; {{ $t('admin.metrics.noChange') }} </template>
      </span>
      <span class="kpi-sublabel">{{ $t('admin.metrics.vsLastMonth') }}</span>
    </div>

    <!-- Active Vehicles -->
    <div class="kpi-card">
      <span class="kpi-label">{{ $t('admin.metrics.activeVehicles') }}</span>
      <span class="kpi-value">{{ formatNumber(kpiSummary.activeVehicles.current) }}</span>
      <span
        class="kpi-change"
        :class="{
          'kpi-change--up': kpiSummary.activeVehicles.changePercent > 0,
          'kpi-change--down': kpiSummary.activeVehicles.changePercent < 0,
        }"
      >
        <template v-if="kpiSummary.activeVehicles.changePercent > 0">
          <svg class="change-arrow" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 3l7 7h-5v7H8v-7H3l7-7z" />
          </svg>
          {{ formatPercent(kpiSummary.activeVehicles.changePercent) }}
        </template>
        <template v-else-if="kpiSummary.activeVehicles.changePercent < 0">
          <svg class="change-arrow" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 17l-7-7h5V3h4v7h5l-7 7z" />
          </svg>
          {{ formatPercent(kpiSummary.activeVehicles.changePercent) }}
        </template>
        <template v-else> &mdash; {{ $t('admin.metrics.noChange') }} </template>
      </span>
      <span class="kpi-sublabel">{{ $t('admin.metrics.vsLastMonth') }}</span>
    </div>

    <!-- Active Dealers -->
    <div class="kpi-card">
      <span class="kpi-label">{{ $t('admin.metrics.activeDealers') }}</span>
      <span class="kpi-value">{{ formatNumber(kpiSummary.activeDealers.current) }}</span>
      <span
        class="kpi-change"
        :class="{
          'kpi-change--up': kpiSummary.activeDealers.changePercent > 0,
          'kpi-change--down': kpiSummary.activeDealers.changePercent < 0,
        }"
      >
        <template v-if="kpiSummary.activeDealers.changePercent > 0">
          <svg class="change-arrow" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 3l7 7h-5v7H8v-7H3l7-7z" />
          </svg>
          {{ formatPercent(kpiSummary.activeDealers.changePercent) }}
        </template>
        <template v-else-if="kpiSummary.activeDealers.changePercent < 0">
          <svg class="change-arrow" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 17l-7-7h5V3h4v7h5l-7 7z" />
          </svg>
          {{ formatPercent(kpiSummary.activeDealers.changePercent) }}
        </template>
        <template v-else> &mdash; {{ $t('admin.metrics.noChange') }} </template>
      </span>
      <span class="kpi-sublabel">{{ $t('admin.metrics.vsLastMonth') }}</span>
    </div>

    <!-- Monthly Leads -->
    <div class="kpi-card">
      <span class="kpi-label">{{ $t('admin.metrics.monthlyLeads') }}</span>
      <span class="kpi-value">{{ formatNumber(kpiSummary.monthlyLeads.current) }}</span>
      <span
        class="kpi-change"
        :class="{
          'kpi-change--up': kpiSummary.monthlyLeads.changePercent > 0,
          'kpi-change--down': kpiSummary.monthlyLeads.changePercent < 0,
        }"
      >
        <template v-if="kpiSummary.monthlyLeads.changePercent > 0">
          <svg class="change-arrow" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 3l7 7h-5v7H8v-7H3l7-7z" />
          </svg>
          {{ formatPercent(kpiSummary.monthlyLeads.changePercent) }}
        </template>
        <template v-else-if="kpiSummary.monthlyLeads.changePercent < 0">
          <svg class="change-arrow" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 17l-7-7h5V3h4v7h5l-7 7z" />
          </svg>
          {{ formatPercent(kpiSummary.monthlyLeads.changePercent) }}
        </template>
        <template v-else> &mdash; {{ $t('admin.metrics.noChange') }} </template>
      </span>
      <span class="kpi-sublabel">{{ $t('admin.metrics.vsLastMonth') }}</span>
    </div>
  </section>
</template>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-4);
}

.kpi-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.kpi-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  line-height: var(--line-height-tight);
}

.kpi-change {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-auxiliary);
  padding: 2px 0;
}

.kpi-change--up {
  color: var(--color-success);
}

.kpi-change--down {
  color: var(--color-error);
}

.change-arrow {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.kpi-sublabel {
  font-size: var(--font-size-xs);
  color: var(--text-disabled);
}

@media (min-width: 768px) {
  .kpi-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-4);
  }

  .kpi-value {
    font-size: var(--font-size-2xl);
  }
}
</style>
