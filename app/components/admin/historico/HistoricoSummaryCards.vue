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
  gap: 16px;
  margin-bottom: 20px;
}
.summary-card {
  padding: 16px 20px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
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
  background: #e0e7ff;
  color: #3730a3;
}
.summary-card.ingresos {
  background: #dbeafe;
  color: #1e40af;
}
.summary-card.beneficio {
  background: #dcfce7;
  color: #166534;
}
.summary-card.beneficio.negative {
  background: #fee2e2;
  color: #991b1b;
}
.summary-card.percent {
  background: #f3e8ff;
  color: #7c3aed;
}

@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
