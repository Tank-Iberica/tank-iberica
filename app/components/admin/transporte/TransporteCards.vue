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
  gap: 8px;
}

.request-card {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
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
  gap: 8px;
  padding: 16px;
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  min-height: 44px;
}

.card-header:hover {
  background: var(--bg-secondary);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
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
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.status-pending {
  background: var(--color-warning-bg, #fef3c7);
  color: var(--color-warning-text);
}

.status-badge.status-accepted {
  background: var(--color-info-bg, #dbeafe);
  color: var(--color-info);
}

.status-badge.status-transit {
  background: var(--color-info-bg, #dbeafe);
  color: var(--color-info);
}

.status-badge.status-completed {
  background: var(--color-success-bg, #dcfce7);
  color: var(--color-success);
}

.status-badge.status-cancelled {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
}

.card-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.card-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
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
  padding: 0 16px 16px;
  border-top: 1px solid var(--color-gray-100);
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
}

.expanded-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.expanded-field label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.expanded-field select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-size: 0.9rem;
  min-height: 44px;
  background: var(--bg-primary);
  cursor: pointer;
}

.expanded-field select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.notes-field {
  flex: 1;
  min-width: 240px;
}

.notes-field textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
}

.notes-field textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.btn-save-notes {
  align-self: flex-start;
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 44px;
  margin-top: 8px;
}

.btn-save-notes:hover {
  background: var(--color-primary-dark);
}

.btn-save-notes:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (min-width: 768px) {
  .mobile-only {
    display: none;
  }
}
</style>
