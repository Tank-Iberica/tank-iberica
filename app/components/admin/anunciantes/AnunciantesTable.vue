<script setup lang="ts">
import { formatPrice } from '~/composables/shared/useListingUtils'
import { localizedName } from '~/composables/useLocalized'
import {
  ADVERTISEMENT_STATUSES,
  type AdminAdvertisement,
  type AdvertisementStatus,
} from '~/composables/admin/useAdminAnunciantes'

defineProps<{
  advertisements: readonly AdminAdvertisement[]
  loading: boolean
  error: string | null
  getStatusConfig: (status: AdvertisementStatus) => {
    value: AdvertisementStatus
    label: string
    color: string
  }
  formatDate: (dateStr: string) => string
}>()

const emit = defineEmits<{
  (e: 'status-change', ad: AdminAdvertisement, newStatus: AdvertisementStatus): void
  (e: 'view-detail' | 'delete', ad: AdminAdvertisement): void
}>()

const { locale } = useI18n()

function onStatusChange(ad: AdminAdvertisement, event: Event) {
  const target = event.target as HTMLSelectElement
  emit('status-change', ad, target.value as AdvertisementStatus)
}
</script>

<template>
  <!-- Error -->
  <div v-if="error" class="error-banner">
    {{ error }}
  </div>

  <!-- Loading -->
  <div v-if="loading" class="loading-state">{{ $t('common.loadingItems') }}</div>

  <!-- Table -->
  <div v-else class="table-container">
    <table class="admin-table">
      <thead>
        <tr>
          <th style="width: 100px">{{ $t('common.status') }}</th>
          <th>Contacto</th>
          <th>Vehículo</th>
          <th style="width: 100px">Precio</th>
          <th style="width: 100px">{{ $t('common.date') }}</th>
          <th style="width: 130px">{{ $t('common.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="ad in advertisements"
          :key="ad.id"
          :class="{ 'row-pending': ad.status === 'pending' }"
        >
          <td>
            <select
              :value="ad.status"
              class="status-select"
              :style="{
                borderColor: getStatusConfig(ad.status).color,
                color: getStatusConfig(ad.status).color,
              }"
              @change="onStatusChange(ad, $event)"
            >
              <option v-for="st in ADVERTISEMENT_STATUSES" :key="st.value" :value="st.value">
                {{ st.label }}
              </option>
            </select>
          </td>
          <td>
            <div class="contact-info">
              <strong>{{ ad.contact_name }}</strong>
              <span v-if="ad.contact_phone" class="contact-detail">📞 {{ ad.contact_phone }}</span>
              <span v-if="ad.contact_email" class="contact-detail">📧 {{ ad.contact_email }}</span>
            </div>
          </td>
          <td>
            <div class="vehicle-info">
              <span v-if="ad.brand || ad.model" class="vehicle-name">
                {{ ad.brand || '' }} {{ ad.model || '' }}
              </span>
              <span v-else class="no-data">Sin especificar</span>
              <span v-if="ad.year" class="vehicle-year">{{ ad.year }}</span>
              <span v-if="ad.subcategory || ad.type" class="vehicle-type">
                {{ localizedName(ad.subcategory, locale) || ''
                }}{{ ad.subcategory && ad.type ? ' > ' : ''
                }}{{ localizedName(ad.type, locale) || '' }}
              </span>
              <span v-else-if="ad.vehicle_type" class="vehicle-type">{{ ad.vehicle_type }}</span>
            </div>
          </td>
          <td class="text-right">
            {{ formatPrice(ad.price) }}
          </td>
          <td>
            {{ formatDate(ad.created_at) }}
          </td>
          <td>
            <div class="action-buttons">
              <button
                class="btn-icon btn-view"
                title="Ver detalles"
                @click="emit('view-detail', ad)"
              >
                👁️
              </button>
              <button class="btn-icon btn-delete" title="Eliminar" @click="emit('delete', ad)">
                🗑️
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!advertisements.length">
          <td colspan="6" class="empty-state">{{ $t('common.noResults') }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.error-banner {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
}

.loading-state {
  text-align: center;
  padding: var(--spacing-10);
  color: var(--color-gray-500);
}

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
  min-width: 50rem;
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

.vehicle-name {
  font-weight: 500;
}

.vehicle-year {
  font-size: 0.85rem;
  color: var(--color-gray-500);
}

.vehicle-type {
  font-size: 0.75rem;
  color: var(--text-disabled);
  font-style: italic;
}

.no-data {
  color: var(--text-disabled);
  font-style: italic;
}

.text-right {
  text-align: right;
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
