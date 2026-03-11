<script setup lang="ts">
import { formatPriceCents } from '~/composables/shared/useListingUtils'
import type { TransportRequest } from '~/composables/admin/useAdminTransporte'
import { STATUS_OPTIONS } from '~/composables/admin/useAdminTransporte'

defineProps<{
  requests: TransportRequest[]
  expandedId: string | null
  editingNotes: string
  savingNotes: boolean
  updatingStatus: string | null
  getStatusClass: (status: string) => string
  getStatusLabel: (status: string) => string
  formatDate: (dateStr: string | null) => string
}>()

const emit = defineEmits<{
  (e: 'toggleExpand' | 'saveNotes' | 'update:editingNotes', value: string): void
  (e: 'updateStatus', id: string, status: string): void
}>()

const { t } = useI18n()

function onStatusChange(requestId: string, event: Event) {
  const target = event.target as HTMLSelectElement
  emit('updateStatus', requestId, target.value)
}

function onNotesInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update:editingNotes', target.value)
}
</script>

<template>
  <div class="card-list mobile-only">
    <div
      v-for="req in requests"
      :key="req.id"
      class="request-card"
      :class="{ expanded: expandedId === req.id }"
    >
      <button class="card-header" @click="emit('toggleExpand', req.id)">
        <div class="card-top">
          <span class="card-vehicle">{{ req.vehicles?.title || '-' }}</span>
          <span class="status-badge" :class="getStatusClass(req.status)">
            {{ getStatusLabel(req.status) }}
          </span>
        </div>
        <div class="card-details">
          <div class="card-detail">
            <span class="detail-label">{{ t('admin.transporte.colOrigin') }}</span>
            <span class="detail-value">{{ req.origin || '-' }}</span>
          </div>
          <div class="card-detail">
            <span class="detail-label">{{ t('admin.transporte.colDestination') }}</span>
            <span class="detail-value">{{ req.destination_postal_code || '-' }}</span>
          </div>
          <div class="card-detail">
            <span class="detail-label">{{ t('admin.transporte.colPrice') }}</span>
            <span class="detail-value">{{ formatPriceCents(req.estimated_price_cents) }}</span>
          </div>
          <div class="card-detail">
            <span class="detail-label">{{ t('admin.transporte.colDate') }}</span>
            <span class="detail-value">{{ formatDate(req.created_at) }}</span>
          </div>
        </div>
        <div class="card-expand-icon">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            :class="{ rotated: expandedId === req.id }"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      <!-- Expanded section -->
      <div v-if="expandedId === req.id" class="card-expanded">
        <div class="expanded-field">
          <label>{{ t('admin.transporte.colRequester') }}</label>
          <span>{{ req.user_id?.slice(0, 8) }}...</span>
        </div>
        <div class="expanded-field">
          <label>{{ t('admin.transporte.status') }}</label>
          <select
            :value="req.status"
            :disabled="updatingStatus === req.id"
            @change="onStatusChange(req.id, $event)"
          >
            <option v-for="opt in STATUS_OPTIONS" :key="opt" :value="opt">
              {{ getStatusLabel(opt) }}
            </option>
          </select>
        </div>
        <div class="expanded-field notes-field">
          <label>{{ t('admin.transporte.adminNotes') }}</label>
          <textarea
            :value="editingNotes"
            rows="3"
            :placeholder="t('admin.transporte.notesPlaceholder')"
            @input="onNotesInput"
          />
          <button class="btn-save-notes" :disabled="savingNotes" @click="emit('saveNotes', req.id)">
            {{ savingNotes ? t('admin.transporte.saving') : t('common.save') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mobile-only {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.request-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.request-card:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.request-card.expanded {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-4);
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  min-height: 2.75rem;
}

.card-header:hover {
  background: var(--bg-secondary);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-2);
}

.card-vehicle {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Status badges */
.status-badge {
  display: inline-block;
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius-md);
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.status-pending {
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning-text);
}

.status-badge.status-accepted {
  background: var(--color-info-bg, var(--color-info-bg));
  color: var(--color-info);
}

.status-badge.status-transit {
  background: var(--color-info-bg, var(--color-info-bg));
  color: var(--color-info);
}

.status-badge.status-completed {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-success);
}

.status-badge.status-cancelled {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}

.card-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-2);
}

.card-detail {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.detail-label {
  font-size: 0.75rem;
  color: var(--text-disabled);
  font-weight: 500;
}

.detail-value {
  font-size: 0.85rem;
  color: var(--text-primary);
  font-weight: 500;
}

.card-expand-icon {
  display: flex;
  justify-content: center;
  color: var(--text-disabled);
}

.card-expand-icon svg {
  transition: transform 0.2s;
}

.card-expand-icon svg.rotated {
  transform: rotate(180deg);
}

/* Card expanded section */
.card-expanded {
  padding: 0 var(--spacing-4) var(--spacing-4);
  border-top: 1px solid var(--color-gray-100);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding-top: var(--spacing-3);
}

.expanded-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.expanded-field label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.expanded-field select {
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  min-height: 2.75rem;
  background: var(--bg-primary);
  cursor: pointer;
}

.expanded-field select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.notes-field {
  flex: 1;
  min-width: 15rem;
}

.notes-field textarea {
  width: 100%;
  padding: 0.625rem var(--spacing-3);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 3.75rem;
}

.notes-field textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.btn-save-notes {
  align-self: flex-start;
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 2.75rem;
  margin-top: var(--spacing-2);
}

.btn-save-notes:hover {
  background: var(--color-primary-dark);
}

.btn-save-notes:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (min-width: 48em) {
  .mobile-only {
    display: none;
  }
}
</style>
