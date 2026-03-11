<script setup lang="ts">
import {
  DEMAND_STATUSES,
  type AdminDemand,
  type DemandStatus,
  getStatusConfig,
  getTypeLabel,
  formatDate,
  formatPriceRange,
  formatYearRange,
} from '~/composables/admin/useAdminSolicitantes'

defineProps<{
  demands: readonly AdminDemand[]
}>()

const emit = defineEmits<{
  (e: 'status-change', demand: AdminDemand, status: DemandStatus): void
  (e: 'view-detail' | 'confirm-delete', demand: AdminDemand): void
}>()

const { locale } = useI18n()

function onStatusChange(demand: AdminDemand, event: Event) {
  const target = event.target as HTMLSelectElement
  emit('status-change', demand, target.value as DemandStatus)
}
</script>

<template>
  <div class="table-container">
    <table class="admin-table">
      <thead>
        <tr>
          <th style="width: 100px">{{ $t('common.status') }}</th>
          <th>Contacto</th>
          <th>Busca</th>
          <th style="width: 110px">Rango Precio</th>
          <th style="width: 90px">Rango Año</th>
          <th style="width: 100px">{{ $t('common.date') }}</th>
          <th style="width: 130px">{{ $t('common.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="d in demands" :key="d.id" :class="{ 'row-pending': d.status === 'pending' }">
          <td>
            <select
              :value="d.status"
              class="status-select"
              :style="{
                borderColor: getStatusConfig(d.status).color,
                color: getStatusConfig(d.status).color,
              }"
              @change="onStatusChange(d, $event)"
            >
              <option v-for="st in DEMAND_STATUSES" :key="st.value" :value="st.value">
                {{ st.label }}
              </option>
            </select>
          </td>
          <td>
            <div class="contact-info">
              <strong>{{ d.contact_name }}</strong>
              <span v-if="d.contact_phone" class="contact-detail">{{ d.contact_phone }}</span>
              <span v-if="d.contact_email" class="contact-detail">{{ d.contact_email }}</span>
            </div>
          </td>
          <td>
            <div class="vehicle-info">
              <span class="vehicle-type-label">{{ getTypeLabel(d, locale) }}</span>
              <span v-if="d.brand_preference" class="vehicle-brand">{{ d.brand_preference }}</span>
            </div>
          </td>
          <td class="text-right">
            {{ formatPriceRange(d.price_min, d.price_max) }}
          </td>
          <td class="text-center">
            {{ formatYearRange(d.year_min, d.year_max) }}
          </td>
          <td>
            {{ formatDate(d.created_at) }}
          </td>
          <td>
            <div class="action-buttons">
              <button
                class="btn-icon btn-view"
                title="Ver detalles"
                @click="emit('view-detail', d)"
              >
                👁️
              </button>
              <button
                class="btn-icon btn-delete"
                title="Eliminar"
                @click="emit('confirm-delete', d)"
              >
                🗑️
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!demands.length">
          <td colspan="7" class="empty-state">
            {{ $t('common.noResults') }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-container {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 53.125rem;
}

.admin-table th,
.admin-table td {
  padding: var(--spacing-3) var(--spacing-4);
  text-align: left;
  border-bottom: 1px solid var(--color-gray-200);
}

.admin-table th {
  background: var(--color-gray-50);
  font-weight: 600;
  color: var(--color-gray-700);
  font-size: 0.875rem;
}

.admin-table tr:hover {
  background: var(--color-gray-50);
}

.admin-table tr.row-pending {
  background: var(--color-error-bg, var(--color-error-bg));
}

.admin-table tr.row-pending:hover {
  background: var(--color-error-bg, var(--color-error-bg));
}

.status-select {
  padding: 0.375rem var(--spacing-2);
  border-radius: var(--border-radius);
  border: 2px solid;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  background: var(--bg-primary);
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.contact-info strong {
  font-size: 0.95rem;
}

.contact-detail {
  font-size: 0.8rem;
  color: var(--color-gray-500);
}

.vehicle-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.vehicle-type-label {
  font-weight: 500;
  font-size: 0.9rem;
}

.vehicle-brand {
  font-size: 0.8rem;
  color: var(--color-gray-500);
  font-style: italic;
}

.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
}

.action-buttons {
  display: flex;
  gap: var(--spacing-2);
}

.btn-icon {
  background: none;
  border: 1px solid var(--border-color-light);
  padding: 0.375rem 0.625rem;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all 0.2s;
}

.btn-icon:hover {
  background: var(--bg-secondary);
}

.btn-view:hover {
  background: var(--color-info-bg, var(--color-info-bg));
}

.btn-delete:hover {
  background: var(--color-error-bg, var(--color-error-bg));
}

.empty-state {
  text-align: center;
  padding: var(--spacing-10);
  color: var(--color-gray-500);
}
</style>
