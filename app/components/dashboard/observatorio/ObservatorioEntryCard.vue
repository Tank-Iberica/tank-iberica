<script setup lang="ts">
/**
 * ObservatorioEntryCard — Single competitor vehicle card.
 */
import type { CompetitorVehicle } from '~/composables/dashboard/useDashboardObservatorio'
import { formatPrice } from '~/composables/shared/useListingUtils'

defineProps<{
  entry: CompetitorVehicle
  platformName: string | undefined
  platformColor: string
  statusClass: string
  isConfirmingDelete: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', entry: CompetitorVehicle): void
  (e: 'delete', id: string): void
}>()

const { t } = useI18n()
</script>

<template>
  <div class="entry-card" :style="{ borderLeftColor: platformColor }">
    <div class="card-top">
      <span
        v-if="entry.platform_id && platformName"
        class="platform-badge"
        :style="{ backgroundColor: platformColor }"
      >
        {{ platformName }}
      </span>
      <span :class="['status-badge', statusClass]">
        {{ t(`dashboard.observatory.status.${entry.status}`) }}
      </span>
    </div>

    <h3 class="card-title">
      {{ entry.brand }} {{ entry.model }}
      <span v-if="entry.year" class="card-year">({{ entry.year }})</span>
    </h3>

    <div class="card-details">
      <span v-if="entry.price !== null" class="card-price">
        {{ formatPrice(entry.price) }}
      </span>
      <span v-if="entry.location" class="card-location">
        {{ entry.location }}
      </span>
    </div>

    <p v-if="entry.notes" class="card-notes">
      {{ entry.notes.length > 120 ? entry.notes.substring(0, 120) + '...' : entry.notes }}
    </p>

    <div class="card-actions">
      <a
        v-if="entry.url"
        :href="entry.url"
        target="_blank"
        rel="noopener noreferrer"
        class="btn-link"
      >
        {{ t('dashboard.observatory.viewListing') }}
      </a>
      <button type="button" class="btn-action" @click="emit('edit', entry)">
        {{ t('common.edit') }}
      </button>
      <button type="button" class="btn-action btn-danger" @click="emit('delete', entry.id)">
        {{ isConfirmingDelete ? t('dashboard.observatory.confirmDelete') : t('common.delete') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.entry-card {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border-left: 4px solid var(--color-gray-400);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.platform-badge {
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

.status-badge {
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-watching {
  background: var(--color-info-bg, #dbeafe);
  color: var(--color-info);
}

.status-sold {
  background: var(--color-success-bg, #dcfce7);
  color: #15803d;
}

.status-expired {
  background: var(--color-warning-bg, #fef3c7);
  color: var(--color-warning-text);
}

.card-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.card-year {
  font-weight: 400;
  color: var(--text-disabled);
}

.card-details {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.card-price {
  font-weight: 700;
  color: var(--color-primary);
  font-size: 1rem;
}

.card-location {
  font-size: 0.875rem;
  color: var(--text-auxiliary);
}

.card-notes {
  font-size: 0.85rem;
  color: var(--text-auxiliary);
  margin: 0;
  line-height: 1.4;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.btn-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 6px 14px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
}

.btn-link:hover {
  background: var(--color-primary-dark);
}

.btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 6px 14px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--color-gray-200);
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-action:hover {
  background: var(--bg-secondary);
}

.btn-danger {
  color: var(--color-error);
  border-color: var(--color-error-border);
}

.btn-danger:hover {
  background: var(--color-error-bg, #fef2f2);
}
</style>
