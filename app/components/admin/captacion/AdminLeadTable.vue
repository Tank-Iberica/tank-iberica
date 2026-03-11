<script setup lang="ts">
import type { DealerLead, AdminUser, LeadStatus } from '~/composables/admin/useAdminCaptacion'

defineProps<{
  leads: DealerLead[]
  expandedId: string | null
  editingNotes: string
  savingNotes: boolean
  updatingStatus: string | null
  updatingAssign: string | null
  statusOptions: LeadStatus[]
  adminUsers: AdminUser[]
  allFilteredSelected: boolean
  selectedIds: Set<string>
  getSourceClass: (source: string) => string
  getSourceLabel: (source: string) => string
  getStatusClass: (status: string) => string
  getStatusLabel: (status: string) => string
  getAssignedName: (userId: string | null) => string
  formatDate: (dateStr: string | null) => string
  formatVehicleTypes: (types: string[]) => string
}>()

const emit = defineEmits<{
  toggleExpand: [id: string]
  updateStatus: [leadId: string, newStatus: string]
  updateAssignment: [leadId: string, userId: string | null]
  saveNotes: [leadId: string]
  toggleSelectAll: []
  toggleSelect: [id: string]
  'update:editingNotes': [value: string]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="table-wrapper desktop-only">
    <table class="data-table">
      <thead>
        <tr>
          <th class="col-check">
            <input
              type="checkbox"
              :checked="allFilteredSelected"
              @change="emit('toggleSelectAll')"
            >
          </th>
          <th>{{ t('admin.captacion.company') }}</th>
          <th>{{ t('admin.captacion.source') }}</th>
          <th>{{ t('admin.captacion.location') }}</th>
          <th>{{ t('admin.captacion.activeListings') }}</th>
          <th>{{ t('admin.captacion.vehicleTypes') }}</th>
          <th>{{ t('admin.captacion.status') }}</th>
          <th>{{ t('admin.captacion.assignedTo') }}</th>
          <th>{{ t('admin.captacion.date') }}</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="lead in leads" :key="lead.id">
          <tr
            class="table-row"
            :class="{ expanded: expandedId === lead.id, selected: selectedIds.has(lead.id) }"
            @click="emit('toggleExpand', lead.id)"
          >
            <td class="col-check" @click.stop>
              <input
                type="checkbox"
                :checked="selectedIds.has(lead.id)"
                @change="emit('toggleSelect', lead.id)"
              >
            </td>
            <td class="cell-company">{{ lead.company_name }}</td>
            <td>
              <span class="source-badge" :class="getSourceClass(lead.source)">
                {{ getSourceLabel(lead.source) }}
              </span>
            </td>
            <td>{{ lead.location || '-' }}</td>
            <td class="cell-listings">{{ lead.active_listings }}</td>
            <td class="cell-types">{{ formatVehicleTypes(lead.vehicle_types) }}</td>
            <td>
              <span class="status-badge" :class="getStatusClass(lead.status)">
                {{ getStatusLabel(lead.status) }}
              </span>
            </td>
            <td class="cell-assigned">{{ getAssignedName(lead.assigned_to) }}</td>
            <td>{{ formatDate(lead.created_at) }}</td>
          </tr>
          <!-- Expanded row -->
          <tr v-if="expandedId === lead.id" class="expanded-row">
            <td colspan="9">
              <div class="expanded-content">
                <!-- Status + Assign -->
                <div class="expanded-row-top">
                  <div class="expanded-field">
                    <label>{{ t('admin.captacion.changeStatus') }}</label>
                    <select
                      :value="lead.status"
                      :disabled="updatingStatus === lead.id"
                      @change="
                        emit('updateStatus', lead.id, ($event.target as HTMLSelectElement).value)
                      "
                    >
                      <option v-for="opt in statusOptions" :key="opt" :value="opt">
                        {{ getStatusLabel(opt) }}
                      </option>
                    </select>
                  </div>
                  <div class="expanded-field">
                    <label>{{ t('admin.captacion.assignTo') }}</label>
                    <select
                      :value="lead.assigned_to || ''"
                      :disabled="updatingAssign === lead.id"
                      @change="
                        emit(
                          'updateAssignment',
                          lead.id,
                          ($event.target as HTMLSelectElement).value || null,
                        )
                      "
                    >
                      <option value="">{{ t('admin.captacion.unassigned') }}</option>
                      <option v-for="admin in adminUsers" :key="admin.id" :value="admin.id">
                        {{ admin.full_name || admin.email }}
                      </option>
                    </select>
                  </div>
                </div>

                <!-- Contact info -->
                <div class="expanded-row-contact">
                  <div class="contact-item">
                    <label>{{ t('admin.captacion.phone') }}</label>
                    <a v-if="lead.phone" :href="`tel:${lead.phone}`" class="contact-link">{{
                      lead.phone
                    }}</a>
                    <span v-else class="contact-empty">{{ t('admin.captacion.noPhone') }}</span>
                  </div>
                  <div class="contact-item">
                    <label>{{ t('admin.captacion.email') }}</label>
                    <a v-if="lead.email" :href="`mailto:${lead.email}`" class="contact-link">{{
                      lead.email
                    }}</a>
                    <span v-else class="contact-empty">{{ t('admin.captacion.noEmail') }}</span>
                  </div>
                  <div v-if="lead.source_url" class="contact-item">
                    <label>{{ t('admin.captacion.sourceUrl') }}</label>
                    <a
                      :href="lead.source_url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="contact-link"
                      >{{ t('admin.captacion.visitSource') }}</a
                    >
                  </div>
                  <div v-if="lead.contacted_at" class="contact-item">
                    <label>{{ t('admin.captacion.contactedAt') }}</label>
                    <span>{{ formatDate(lead.contacted_at) }}</span>
                  </div>
                </div>

                <!-- Notes -->
                <div class="expanded-field notes-field">
                  <label>{{ t('admin.captacion.contactNotes') }}</label>
                  <textarea
                    :value="editingNotes"
                    rows="3"
                    :placeholder="t('admin.captacion.notesPlaceholder')"
                    @input="
                      emit('update:editingNotes', ($event.target as HTMLTextAreaElement).value)
                    "
                  />
                  <button
                    class="btn-save-notes"
                    :disabled="savingNotes"
                    @click.stop="emit('saveNotes', lead.id)"
                  >
                    {{ savingNotes ? t('admin.captacion.saving') : t('admin.captacion.saveNotes') }}
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
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border-bottom: 1px solid var(--color-gray-200);
  white-space: nowrap;
}

.data-table td {
  padding: 0.75rem 1rem;
  color: var(--text-primary);
  border-bottom: 1px solid var(--color-gray-100);
}

.col-check {
  width: 2.5rem;
  text-align: center;
}

.col-check input[type='checkbox'] {
  width: 1.125rem;
  height: 1.125rem;
  cursor: pointer;
  accent-color: var(--color-primary);
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

.table-row.selected {
  background: var(--color-blue-50);
}

.cell-company {
  font-weight: 600;
  max-width: 12.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-listings {
  font-weight: 600;
  text-align: center;
}

.cell-types {
  max-width: 11.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.85rem;
  color: var(--text-auxiliary);
}

.cell-assigned {
  font-size: 0.85rem;
  color: var(--text-auxiliary);
}

/* Source badges */
.source-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: var(--border-radius-md);
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}

.source-badge.source-mascus {
  background: var(--color-info-bg);
  color: var(--color-info);
}

.source-badge.source-europa {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.source-badge.source-milanuncios {
  background: var(--color-orange-bg);
  color: var(--color-orange-700);
}

.source-badge.source-autoline {
  background: var(--color-purple-100);
  color: var(--color-purple-600);
}

.source-badge.source-manual {
  background: var(--bg-secondary);
  color: var(--text-auxiliary);
}

/* Status badges */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: var(--border-radius-md);
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.status-new {
  background: var(--color-info-bg);
  color: var(--color-info);
}

.status-badge.status-contacted {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.status-badge.status-interested {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.status-badge.status-onboarding {
  background: var(--color-cyan-bg);
  color: var(--color-cyan-700);
}

.status-badge.status-active {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.status-badge.status-rejected {
  background: var(--color-error-bg);
  color: var(--color-error);
}

/* Expanded row */
.expanded-row td {
  padding: 0;
  border-bottom: 2px solid var(--color-gray-200);
}

.expanded-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: var(--bg-secondary);
}

.expanded-row-top {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.expanded-row-contact {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.contact-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.contact-item label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.contact-link {
  color: var(--color-focus);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
}

.contact-link:hover {
  text-decoration: underline;
}

.contact-empty {
  color: var(--text-disabled);
  font-size: 0.85rem;
  font-style: italic;
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
  padding: 0.5rem 0.75rem;
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
  padding: 0.625rem 0.75rem;
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
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 2.75rem;
  margin-top: 0.5rem;
}

.btn-save-notes:hover {
  background: var(--color-primary-dark);
}

.btn-save-notes:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (min-width: 48em) {
  .desktop-only {
    display: block;
  }
}
</style>
