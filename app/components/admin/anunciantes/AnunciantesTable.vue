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
  <div v-if="loading" class="loading-state">Cargando anunciantes...</div>

  <!-- Table -->
  <div v-else class="table-container">
    <table class="admin-table">
      <thead>
        <tr>
          <th style="width: 100px">Estado</th>
          <th>Contacto</th>
          <th>Vehículo</th>
          <th style="width: 100px">Precio</th>
          <th style="width: 100px">Fecha</th>
          <th style="width: 130px">Acciones</th>
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
          <td colspan="6" class="empty-state">No hay anunciantes que coincidan con los filtros.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.error-banner {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.admin-table th,
.admin-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.admin-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.admin-table tr:hover {
  background: #f9fafb;
}

.admin-table tr.row-pending {
  background: #fef2f2;
}

.admin-table tr.row-pending:hover {
  background: #fee2e2;
}

.status-select {
  padding: 6px 8px;
  border-radius: 6px;
  border: 2px solid;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  background: white;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.contact-info strong {
  font-size: 0.95rem;
}

.contact-detail {
  font-size: 0.8rem;
  color: #6b7280;
}

.vehicle-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vehicle-name {
  font-weight: 500;
}

.vehicle-year {
  font-size: 0.85rem;
  color: #6b7280;
}

.vehicle-type {
  font-size: 0.75rem;
  color: #9ca3af;
  font-style: italic;
}

.no-data {
  color: #9ca3af;
  font-style: italic;
}

.text-right {
  text-align: right;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: 1px solid #e5e7eb;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #f3f4f6;
}

.btn-view:hover {
  background: #dbeafe;
}

.btn-delete:hover {
  background: #fee2e2;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}
</style>
