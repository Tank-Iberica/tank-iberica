<script setup lang="ts">
import type { HistoricoSummary } from '~/composables/admin/useAdminHistorico'

defineProps<{
  summary: HistoricoSummary
  fmt: (val: number | null | undefined) => string
}>()
</script>

<template>
  <div class="summary-cards">
    <div class="summary-card ventas">
      <span class="label">Total Ventas</span>
      <span class="value">{{ summary.totalVentas }}</span>
    </div>
    <div class="summary-card ingresos">
      <span class="label">Total Ingresos</span>
      <span class="value">{{ fmt(summary.totalIngresos) }}</span>
    </div>
    <div
      class="summary-card beneficio"
      :class="summary.totalBeneficio >= 0 ? 'positive' : 'negative'"
    >
      <span class="label">Total Beneficio</span>
      <span class="value">{{ fmt(summary.totalBeneficio) }}</span>
    </div>
    <div class="summary-card percent">
      <span class="label">Beneficio Medio</span>
      <span class="value">{{ summary.avgBeneficioPercent }}%</span>
    </div>
  </div>
</template>

<style scoped>
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-4);
  margin-bottom: 1.25rem;
}
.summary-card {
  padding: 1rem 1.25rem;
  border-radius: var(--border-radius-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}
.summary-card .label {
  font-size: 0.8rem;
  font-weight: 500;
  opacity: 0.8;
}
.summary-card .value {
  font-size: 1.5rem;
  font-weight: 700;
}
.summary-card.ventas {
  background: var(--color-indigo-100);
  color: var(--color-indigo-800);
}
.summary-card.ingresos {
  background: var(--color-info-bg, var(--color-info-bg));
  color: var(--badge-info-bg);
}
.summary-card.beneficio {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--badge-success-bg);
}
.summary-card.beneficio.negative {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}
.summary-card.percent {
  background: var(--color-purple-100);
  color: var(--color-purple-600);
}

@media (max-width: 48em) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
