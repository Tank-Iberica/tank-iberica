<template>
  <div class="kpi-summary-row">
    <div class="kpi-mini-card">
      <span class="kpi-mini-label">Ingresos mes</span>
      <span class="kpi-mini-value">{{ formatEuros(kpiSummary.monthlyRevenue.current) }}</span>
      <span class="kpi-mini-change" :class="changeClass(kpiSummary.monthlyRevenue.changePercent)">
        {{ kpiSummary.monthlyRevenue.changePercent > 0 ? '+' : ''
        }}{{ kpiSummary.monthlyRevenue.changePercent }}%
      </span>
    </div>
    <div class="kpi-mini-card">
      <span class="kpi-mini-label">Vehiculos</span>
      <span class="kpi-mini-value">{{ kpiSummary.activeVehicles.current }}</span>
      <span class="kpi-mini-change" :class="changeClass(kpiSummary.activeVehicles.changePercent)">
        {{ kpiSummary.activeVehicles.changePercent > 0 ? '+' : ''
        }}{{ kpiSummary.activeVehicles.changePercent }}%
      </span>
    </div>
    <div class="kpi-mini-card">
      <span class="kpi-mini-label">Dealers</span>
      <span class="kpi-mini-value">{{ kpiSummary.activeDealers.current }}</span>
      <span class="kpi-mini-change" :class="changeClass(kpiSummary.activeDealers.changePercent)">
        {{ kpiSummary.activeDealers.changePercent > 0 ? '+' : ''
        }}{{ kpiSummary.activeDealers.changePercent }}%
      </span>
    </div>
    <div class="kpi-mini-card">
      <span class="kpi-mini-label">Leads mes</span>
      <span class="kpi-mini-value">{{ kpiSummary.monthlyLeads.current }}</span>
      <span class="kpi-mini-change" :class="changeClass(kpiSummary.monthlyLeads.changePercent)">
        {{ kpiSummary.monthlyLeads.changePercent > 0 ? '+' : ''
        }}{{ kpiSummary.monthlyLeads.changePercent }}%
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { KpiSummary } from '~/composables/admin/useAdminMetrics'

defineProps<{
  kpiSummary: KpiSummary
  formatEuros: (cents: number) => string
  changeClass: (pct: number) => string
}>()
</script>

<style scoped>
.kpi-summary-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}

.kpi-mini-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-3);
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-shadow: var(--shadow-sm);
}

.kpi-mini-label {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.kpi-mini-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.kpi-mini-change {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.kpi-change-up {
  color: #16a34a;
}

.kpi-change-down {
  color: #dc2626;
}

.kpi-change-flat {
  color: var(--text-auxiliary);
}

@media (min-width: 768px) {
  .kpi-summary-row {
    grid-template-columns: repeat(4, 1fr);
  }

  .kpi-mini-value {
    font-size: var(--font-size-xl);
  }
}
</style>
