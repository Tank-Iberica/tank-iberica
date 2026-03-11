<script setup lang="ts">
/**
 * HistoricoDetailModal — Detail view modal for a sold vehicle entry.
 * Shows sale info, buyer data, and full financial breakdown.
 */
import type { SoldVehicle } from '~/composables/dashboard/useDashboardHistorico'
import {
  getProfit,
  getMarginPercent,
  getTotalCost,
} from '~/composables/dashboard/useDashboardHistorico'

defineProps<{
  show: boolean
  entry: SoldVehicle | null
  fmt: (val: number | null | undefined) => string
  fmtDate: (date: string | null) => string
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
</script>

<template>
  <Teleport to="body">
    <div v-if="show && entry" class="modal-bg" @click.self="emit('close')">
      <div class="modal modal-lg">
        <div class="modal-head">
          <span>{{ entry.brand }} {{ entry.model }} ({{ entry.year || '--' }})</span>
          <button @click="emit('close')">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-grid">
            <!-- Sale info -->
            <div class="detail-section">
              <h4>{{ t('dashboard.historico.detail.saleInfo') }}</h4>
              <div class="detail-row">
                <span class="dlabel">{{ t('dashboard.historico.detail.saleDate') }}:</span>
                <span>{{ fmtDate(entry.sale_date) }}</span>
              </div>
              <div class="detail-row">
                <span class="dlabel">{{ t('dashboard.historico.detail.buyer') }}:</span>
                <span>{{ entry.buyer_name || '--' }}</span>
              </div>
              <div class="detail-row">
                <span class="dlabel">{{ t('dashboard.historico.detail.buyerContact') }}:</span>
                <span>{{ entry.buyer_contact || '--' }}</span>
              </div>
            </div>

            <!-- Financial -->
            <div class="detail-section">
              <h4>{{ t('dashboard.historico.detail.financial') }}</h4>
              <div class="detail-row">
                <span class="dlabel">{{ t('dashboard.historico.detail.originalPrice') }}:</span>
                <span>{{ fmt(entry.price) }}</span>
              </div>
              <div class="detail-row">
                <span class="dlabel">{{ t('dashboard.historico.detail.salePrice') }}:</span>
                <span class="highlight">{{ fmt(entry.sale_price) }}</span>
              </div>
              <div class="detail-row">
                <span class="dlabel">{{ t('dashboard.historico.detail.acquisitionCost') }}:</span>
                <span>{{ fmt(entry.acquisition_cost) }}</span>
              </div>
              <div class="detail-row">
                <span class="dlabel">{{ t('dashboard.historico.detail.totalMaintenance') }}:</span>
                <span>{{ fmt(entry.total_maintenance) }}</span>
              </div>
              <div class="detail-row">
                <span class="dlabel">{{ t('dashboard.historico.detail.rentalIncome') }}:</span>
                <span class="profit-pos">{{ fmt(entry.total_rental_income) }}</span>
              </div>
              <div class="detail-row">
                <span class="dlabel">{{ t('dashboard.historico.detail.totalCost') }}:</span>
                <span>{{ fmt(getTotalCost(entry)) }}</span>
              </div>
              <div class="detail-row total-row">
                <span class="dlabel">{{ t('dashboard.historico.detail.profit') }}:</span>
                <span :class="getProfit(entry) >= 0 ? 'profit-pos' : 'profit-neg'">
                  {{ fmt(getProfit(entry)) }} ({{ getMarginPercent(entry) }}%)
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn" @click="emit('close')">
            {{ t('dashboard.historico.detail.close') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Modal */
.modal-bg {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  width: 100%;
  max-width: 26.25rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-lg {
  max-width: 40em;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--color-gray-200);
  font-weight: 600;
  position: sticky;
  top: 0;
  background: var(--bg-primary);
  border-radius: var(--border-radius-md) var(--border-radius-md) 0 0;
}

.modal-head button {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: var(--text-disabled);
  width: 2.75rem;
  height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius);
}

.modal-head button:hover {
  background: var(--bg-secondary);
}

.modal-body {
  padding: 1rem;
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
  border-radius: 0 0 var(--border-radius-md) var(--border-radius-md);
  position: sticky;
  bottom: 0;
}

/* Detail layout */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}

.detail-section {
  margin-bottom: 0.5rem;
}

.detail-section h4 {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  color: var(--color-gray-700);
  border-bottom: 1px solid var(--color-gray-200);
  padding-bottom: 0.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.375rem 0;
  font-size: 0.85rem;
}

.detail-row .dlabel {
  color: var(--color-gray-500);
}

.detail-row .highlight {
  font-weight: 700;
  color: var(--badge-info-bg);
}

.total-row {
  border-top: 1px solid var(--color-gray-200);
  margin-top: 0.5rem;
  padding-top: 0.625rem;
  font-weight: 600;
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

/* Button */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem 1rem;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: background 0.15s;
}

.btn:hover {
  background: var(--bg-secondary);
}

@media (min-width: 48em) {
  .detail-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
