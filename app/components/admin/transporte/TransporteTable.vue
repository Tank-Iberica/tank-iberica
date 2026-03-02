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
  <div class="table-wrapper desktop-only">
    <table class="data-table">
      <thead>
        <tr>
          <th>{{ t('admin.transporte.colVehicle') }}</th>
          <th>{{ t('admin.transporte.colRequester') }}</th>
          <th>{{ t('admin.transporte.colOrigin') }}</th>
          <th>{{ t('admin.transporte.colDestination') }}</th>
          <th>{{ t('admin.transporte.colPrice') }}</th>
          <th>{{ t('admin.transporte.colStatus') }}</th>
          <th>{{ t('admin.transporte.colDate') }}</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="req in requests" :key="req.id">
          <tr
            class="table-row"
            :class="{ expanded: expandedId === req.id }"
            @click="emit('toggleExpand', req.id)"
          >
            <td class="cell-vehicle">{{ req.vehicles?.title || '-' }}</td>
            <td class="cell-requester">{{ req.user_id?.slice(0, 8) }}...</td>
            <td>{{ req.origin || '-' }}</td>
            <td>{{ req.destination_postal_code || '-' }}</td>
            <td>{{ formatPriceCents(req.estimated_price_cents) }}</td>
            <td>
              <span class="status-badge" :class="getStatusClass(req.status)">
                {{ getStatusLabel(req.status) }}
              </span>
            </td>
            <td>{{ formatDate(req.created_at) }}</td>
          </tr>
          <!-- Expanded row -->
          <tr v-if="expandedId === req.id" class="expanded-row">
            <td colspan="7">
              <div class="expanded-content">
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
                  <button
                    class="btn-save-notes"
                    :disabled="savingNotes"
                    @click.stop="emit('saveNotes', req.id)"
                  >
                    {{ savingNotes ? t('admin.transporte.saving') : t('common.save') }}
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.desktop-only {
  display: none;
}

.table-wrapper {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border-bottom: 1px solid var(--color-gray-200);
  white-space: nowrap;
}

.data-table td {
  padding: 12px 16px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--color-gray-100);
}

.table-row {
  cursor: pointer;
  transition: background 0.15s;
}

.table-row:hover {
  background: var(--bg-secondary);
}

.table-row.expanded {
  background: var(--bg-secondary);
}

.cell-vehicle {
  font-weight: 600;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-requester {
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--text-auxiliary);
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

/* Expanded row */
.expanded-row td {
  padding: 0;
  border-bottom: 2px solid var(--color-gray-200);
}

.expanded-content {
  padding: 16px;
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  background: var(--bg-secondary);
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
  .desktop-only {
    display: block;
  }
}
</style>
