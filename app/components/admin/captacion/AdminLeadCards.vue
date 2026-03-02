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
  selectedIds: Set<string>
  getSourceClass: (source: string) => string
  getSourceLabel: (source: string) => string
  getStatusClass: (status: string) => string
  getStatusLabel: (status: string) => string
  formatDate: (dateStr: string | null) => string
  formatVehicleTypes: (types: string[]) => string
}>()

const emit = defineEmits<{
  toggleExpand: [id: string]
  updateStatus: [leadId: string, newStatus: string]
  updateAssignment: [leadId: string, userId: string | null]
  saveNotes: [leadId: string]
  toggleSelect: [id: string]
  'update:editingNotes': [value: string]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="card-list mobile-only">
    <div
      v-for="lead in leads"
      :key="lead.id"
      class="lead-card"
      :class="{ expanded: expandedId === lead.id, selected: selectedIds.has(lead.id) }"
    >
      <button class="card-header" @click="emit('toggleExpand', lead.id)">
        <div class="card-top">
          <div class="card-top-left">
            <input
              type="checkbox"
              :checked="selectedIds.has(lead.id)"
              class="card-checkbox"
              @click.stop
              @change.stop="emit('toggleSelect', lead.id)"
            >
            <span class="card-company">{{ lead.company_name }}</span>
          </div>
          <span class="status-badge" :class="getStatusClass(lead.status)">
            {{ getStatusLabel(lead.status) }}
          </span>
        </div>
        <div class="card-details">
          <div class="card-detail">
            <span class="detail-label">{{ t('admin.captacion.source') }}</span>
            <span class="source-badge small" :class="getSourceClass(lead.source)">
              {{ getSourceLabel(lead.source) }}
            </span>
          </div>
          <div class="card-detail">
            <span class="detail-label">{{ t('admin.captacion.location') }}</span>
            <span class="detail-value">{{ lead.location || '-' }}</span>
          </div>
          <div class="card-detail">
            <span class="detail-label">{{ t('admin.captacion.activeListings') }}</span>
            <span class="detail-value">{{ lead.active_listings }}</span>
          </div>
          <div class="card-detail">
            <span class="detail-label">{{ t('admin.captacion.date') }}</span>
            <span class="detail-value">{{ formatDate(lead.created_at) }}</span>
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
            :class="{ rotated: expandedId === lead.id }"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      <!-- Expanded section -->
      <div v-if="expandedId === lead.id" class="card-expanded">
        <div class="expanded-field">
          <label>{{ t('admin.captacion.changeStatus') }}</label>
          <select
            :value="lead.status"
            :disabled="updatingStatus === lead.id"
            @change="emit('updateStatus', lead.id, ($event.target as HTMLSelectElement).value)"
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
              emit('updateAssignment', lead.id, ($event.target as HTMLSelectElement).value || null)
            "
          >
            <option value="">{{ t('admin.captacion.unassigned') }}</option>
            <option v-for="admin in adminUsers" :key="admin.id" :value="admin.id">
              {{ admin.full_name || admin.email }}
            </option>
          </select>
        </div>

        <!-- Contact info -->
        <div class="card-contact-section">
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

        <!-- Vehicle types -->
        <div v-if="lead.vehicle_types && lead.vehicle_types.length > 0" class="expanded-field">
          <label>{{ t('admin.captacion.vehicleTypes') }}</label>
          <span>{{ formatVehicleTypes(lead.vehicle_types) }}</span>
        </div>

        <!-- Notes -->
        <div class="expanded-field notes-field">
          <label>{{ t('admin.captacion.contactNotes') }}</label>
          <textarea
            :value="editingNotes"
            rows="3"
            :placeholder="t('admin.captacion.notesPlaceholder')"
            @input="emit('update:editingNotes', ($event.target as HTMLTextAreaElement).value)"
          />
          <button
            class="btn-save-notes"
            :disabled="savingNotes"
            @click="emit('saveNotes', lead.id)"
          >
            {{ savingNotes ? t('admin.captacion.saving') : t('admin.captacion.saveNotes') }}
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

.lead-card {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.lead-card:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.lead-card.expanded {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.lead-card.selected {
  border: 2px solid #2563eb;
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

.card-top-left {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.card-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary);
  flex-shrink: 0;
}

.card-company {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

/* Source badges */
.source-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}

.source-badge.small {
  padding: 2px 8px;
  font-size: 0.72rem;
}

.source-badge.source-mascus {
  background: var(--color-info-bg, #dbeafe);
  color: var(--color-info);
}

.source-badge.source-europa {
  background: var(--color-success-bg, #dcfce7);
  color: var(--color-success);
}

.source-badge.source-milanuncios {
  background: #fff7ed;
  color: #c2410c;
}

.source-badge.source-autoline {
  background: #f3e8ff;
  color: #7c3aed;
}

.source-badge.source-manual {
  background: var(--bg-secondary);
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

.status-badge.status-new {
  background: var(--color-info-bg, #dbeafe);
  color: var(--color-info);
}

.status-badge.status-contacted {
  background: var(--color-warning-bg, #fef3c7);
  color: var(--color-warning-text);
}

.status-badge.status-interested {
  background: var(--color-success-bg, #dcfce7);
  color: var(--color-success);
}

.status-badge.status-onboarding {
  background: #cffafe;
  color: #0e7490;
}

.status-badge.status-active {
  background: #d1fae5;
  color: #059669;
}

.status-badge.status-rejected {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
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

.card-expanded .expanded-field select {
  width: 100%;
}

.card-expanded .notes-field textarea {
  width: 100%;
}

.card-contact-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

.contact-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-item label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.contact-link {
  color: #2563eb;
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
