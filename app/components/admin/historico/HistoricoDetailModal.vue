<script setup lang="ts">
import type { HistoricoEntry } from '~/composables/admin/useAdminHistorico'
import { SALE_CATEGORIES } from '~/composables/admin/useAdminHistorico'

defineProps<{
  visible: boolean
  entry: HistoricoEntry | null
  fmt: (val: number | null | undefined) => string
  fmtDate: (date: string) => string
}>()

defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="visible && entry" class="modal-bg" @click.self="$emit('close')">
      <div class="modal modal-lg">
        <div class="modal-head">
          <span>📜 {{ entry.brand }} {{ entry.model }} ({{ entry.year }})</span>
          <button @click="$emit('close')">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-grid">
            <div class="detail-section">
              <h4>Información de Venta</h4>
              <div class="detail-row">
                <span class="label">Fecha de venta:</span>
                <span>{{ entry.sale_date ? fmtDate(entry.sale_date) : '—' }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Categoría:</span>
                <span>{{ SALE_CATEGORIES[entry.sale_category || ''] || '—' }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Comprador:</span>
                <span>{{ entry.buyer_name || '—' }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Contacto:</span>
                <span>{{ entry.buyer_contact || '—' }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h4>Resumen Financiero</h4>
              <div class="detail-row">
                <span class="label">Precio original:</span>
                <span>{{ fmt(entry.original_price) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Precio de venta:</span>
                <span class="highlight">{{ fmt(entry.sale_price) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Coste adquisición:</span>
                <span>{{ fmt(entry.acquisition_cost) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Total mantenimiento:</span>
                <span>{{ fmt(entry.total_maintenance) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Ingresos alquiler:</span>
                <span class="profit-pos">{{ fmt(entry.total_rental_income) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Coste total:</span>
                <span>{{ fmt(entry.total_cost) }}</span>
              </div>
              <div class="detail-row total">
                <span class="label">Beneficio:</span>
                <span :class="(entry.benefit || 0) >= 0 ? 'profit-pos' : 'profit-neg'">
                  {{ fmt(entry.benefit) }} ({{ entry.benefit_percent }}%)
                </span>
              </div>
            </div>
          </div>

          <!-- Maintenance History -->
          <div v-if="entry.maintenance_history?.length" class="detail-section">
            <h4>Historial de Mantenimiento</h4>
            <table class="mini-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Razón</th>
                  <th>Coste</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in entry.maintenance_history" :key="m.id">
                  <td>{{ fmtDate(m.date) }}</td>
                  <td>{{ m.reason }}</td>
                  <td>{{ fmt(m.cost) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Rental History -->
          <div v-if="entry.rental_history?.length" class="detail-section">
            <h4>Historial de Alquiler</h4>
            <table class="mini-table">
              <thead>
                <tr>
                  <th>Desde</th>
                  <th>Hasta</th>
                  <th>Importe</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in entry.rental_history" :key="r.id">
                  <td>{{ fmtDate(r.from_date) }}</td>
                  <td>{{ fmtDate(r.to_date) }}</td>
                  <td>{{ fmt(r.amount) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn" @click="$emit('close')">Cerrar</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-bg {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}
.modal {
  background: var(--bg-primary);
  border-radius: 10px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
}
.modal-lg {
  max-width: 700px;
}
.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
  position: sticky;
  top: 0;
  background: var(--bg-primary);
}
.modal-head button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--text-disabled);
}
.modal-body {
  padding: 16px;
}
.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 10px 10px;
  position: sticky;
  bottom: 0;
}
.btn {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
}

/* Detail modal */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}
.detail-section {
  margin-bottom: 16px;
}
.detail-section h4 {
  margin: 0 0 12px;
  font-size: 0.9rem;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 8px;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 0.85rem;
}
.detail-row .label {
  color: #6b7280;
}
.detail-row.total {
  border-top: 1px solid #e5e7eb;
  margin-top: 8px;
  padding-top: 10px;
  font-weight: 600;
}
.detail-row .highlight {
  font-weight: 700;
  color: #1e40af;
}

/* Profit colors */
.profit-pos {
  color: var(--color-success);
  font-weight: 600;
}
.profit-neg {
  color: var(--color-error);
  font-weight: 600;
}

/* Mini table */
.mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}
.mini-table th,
.mini-table td {
  padding: 6px 8px;
  border: 1px solid var(--border-color-light);
  text-align: left;
}
.mini-table th {
  background: #f9fafb;
  font-weight: 600;
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
