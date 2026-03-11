<script setup lang="ts">
import type { Report, ReportStatus } from '~/composables/admin/useAdminReportes'
import {
  statusColors,
  statusLabels,
  formatReportDate,
  truncateEmail,
} from '~/composables/admin/useAdminReportes'

defineProps<{
  report: Report
  isExpanded: boolean
  isSaving: boolean
  notesValue: string
}>()

const emit = defineEmits<{
  'toggle-expand': [id: string]
  'update-status': [id: string, status: ReportStatus]
  'save-notes': [id: string]
  'update-notes': [id: string, value: string]
}>()

const { t } = useI18n()
</script>

<template>
  <div
    class="report-card"
    :class="{
      'report-pending': report.status === 'pending',
      'report-expanded': isExpanded,
    }"
  >
    <!-- Card header (clickable) -->
    <div class="report-header" @click="emit('toggle-expand', report.id)">
      <div class="report-main-info">
        <div class="report-top-row">
          <span class="reporter-email" :title="report.reporter_email">
            {{ truncateEmail(report.reporter_email) }}
          </span>
          <span
            class="status-badge"
            :style="{
              backgroundColor: statusColors[report.status] + '1A',
              color: statusColors[report.status],
              borderColor: statusColors[report.status] + '40',
            }"
          >
            {{ t(statusLabels[report.status]) }}
          </span>
        </div>
        <div class="report-meta-row">
          <span class="entity-badge">
            {{ report.entity_type }}
          </span>
          <span class="reason-text">
            {{ t(`report.reasons.${report.reason}`, report.reason) }}
          </span>
          <span class="report-date">
            {{ formatReportDate(report.created_at) }}
          </span>
        </div>
      </div>
      <div class="expand-indicator">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          :class="{ rotated: isExpanded }"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>

    <!-- Expanded details -->
    <div v-if="isExpanded" class="report-details">
      <!-- Details section -->
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">{{ t('report.admin.reporter') }}</span>
          <span class="detail-value">{{ report.reporter_email }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ t('report.admin.entityType') }}</span>
          <span class="detail-value">{{ report.entity_type }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Entity ID</span>
          <span class="detail-value detail-id">{{ report.entity_id }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ t('report.admin.reason') }}</span>
          <span class="detail-value">{{
            t(`report.reasons.${report.reason}`, report.reason)
          }}</span>
        </div>
        <div v-if="report.details" class="detail-item detail-full">
          <span class="detail-label">{{ t('report.admin.details') }}</span>
          <span class="detail-value">{{ report.details }}</span>
        </div>
        <div v-if="report.resolved_at" class="detail-item">
          <span class="detail-label">{{ t('report.admin.resolvedAt') }}</span>
          <span class="detail-value">{{ formatReportDate(report.resolved_at) }}</span>
        </div>
      </div>

      <!-- Admin notes -->
      <div class="notes-section">
        <label class="notes-label">{{ t('report.admin.notes') }}</label>
        <textarea
          class="notes-textarea"
          rows="3"
          :value="notesValue"
          :placeholder="t('report.admin.notesPlaceholder')"
          @input="emit('update-notes', report.id, ($event.target as HTMLTextAreaElement).value)"
        />
        <button class="btn-save-notes" :disabled="isSaving" @click="emit('save-notes', report.id)">
          {{ isSaving ? '...' : t('report.admin.saveNotes') }}
        </button>
      </div>

      <!-- Actions -->
      <div class="report-actions">
        <button
          v-if="report.status !== 'reviewing'"
          class="action-btn action-reviewing"
          :disabled="isSaving"
          @click="emit('update-status', report.id, 'reviewing')"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {{ t('report.admin.markReviewing') }}
        </button>
        <button
          v-if="!report.status.startsWith('resolved')"
          class="action-btn action-remove"
          :disabled="isSaving"
          @click="emit('update-status', report.id, 'resolved_removed')"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path
              d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            />
          </svg>
          {{ t('report.admin.resolveRemove') }}
        </button>
        <button
          v-if="!report.status.startsWith('resolved')"
          class="action-btn action-keep"
          :disabled="isSaving"
          @click="emit('update-status', report.id, 'resolved_kept')"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {{ t('report.admin.resolveKeep') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   CARD
   ============================================ */
.report-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.2s;
  overflow: hidden;
}

.report-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.report-card.report-pending {
  border-left: 3px solid var(--color-warning);
}

.report-card.report-expanded {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* ============================================
   CARD HEADER
   ============================================ */
.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4) var(--spacing-5);
  cursor: pointer;
  gap: var(--spacing-3);
}

.report-header:hover {
  background: var(--color-gray-50);
}

.report-main-info {
  flex: 1;
  min-width: 0;
}

.report-top-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 0.375rem;
  flex-wrap: wrap;
}

.reporter-email {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-gray-900);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 12.5rem;
}

.status-badge {
  display: inline-block;
  padding: 0.1875rem 0.625rem;
  border-radius: var(--border-radius-md);
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid;
}

.report-meta-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-wrap: wrap;
}

.entity-badge {
  display: inline-block;
  padding: 0.125rem var(--spacing-2);
  border-radius: var(--border-radius-sm);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  background: var(--color-blue-50);
  color: var(--color-info);
}

.reason-text {
  font-size: 0.8rem;
  color: var(--color-gray-500);
}

.report-date {
  font-size: 0.75rem;
  color: var(--text-disabled);
  white-space: nowrap;
}

.expand-indicator {
  flex-shrink: 0;
  color: var(--text-disabled);
  transition: color 0.2s;
}

.expand-indicator svg {
  transition: transform 0.2s;
}

.expand-indicator svg.rotated {
  transform: rotate(180deg);
}

.report-header:hover .expand-indicator {
  color: var(--color-gray-500);
}

/* ============================================
   EXPANDED DETAILS
   ============================================ */
.report-details {
  padding: 0 1.25rem 1.25rem;
  border-top: 1px solid var(--color-gray-100);
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-3);
  padding: var(--spacing-4) 0;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.detail-item.detail-full {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-disabled);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.detail-value {
  font-size: 0.9rem;
  color: var(--color-gray-700);
  word-break: break-word;
}

.detail-id {
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--color-gray-500);
}

/* ============================================
   ADMIN NOTES
   ============================================ */
.notes-section {
  padding: var(--spacing-4) 0;
  border-top: 1px solid var(--color-gray-100);
}

.notes-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-gray-700);
  margin-bottom: var(--spacing-2);
}

.notes-textarea {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 5rem;
  color: var(--color-gray-700);
  line-height: 1.5;
}

.notes-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.btn-save-notes {
  margin-top: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--bg-primary);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--border-radius);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  min-height: 2.75rem;
  transition: background 0.2s;
}

.btn-save-notes:hover:not(:disabled) {
  background: var(--color-gray-50);
}

.btn-save-notes:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================
   ACTIONS
   ============================================ */
.report-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--color-gray-100);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition:
    background 0.2s,
    border-color 0.2s;
  min-height: 2.75rem;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-reviewing {
  background: var(--color-blue-50);
  color: var(--color-info);
  border-color: var(--color-info-border);
}

.action-reviewing:hover:not(:disabled) {
  background: var(--color-info-bg, var(--color-info-bg));
}

.action-remove {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  border-color: var(--color-error-border);
}

.action-remove:hover:not(:disabled) {
  background: var(--color-error-bg, var(--color-error-bg));
}

.action-keep {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-success);
  border-color: var(--color-success-border);
}

.action-keep:hover:not(:disabled) {
  background: var(--color-success-bg, var(--color-success-bg));
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (min-width: 30em) {
  .report-actions {
    flex-wrap: nowrap;
  }

  .reporter-email {
    max-width: 17.5rem;
  }
}

@media (min-width: 48em) {
  .detail-grid {
    grid-template-columns: 1fr 1fr;
  }

  .report-header {
    padding: var(--spacing-4) var(--spacing-6);
  }

  .report-details {
    padding: 0 1.5rem 1.5rem;
  }

  .reporter-email {
    max-width: 22.5rem;
  }
}

@media (min-width: 64em) {
  .detail-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .report-card {
    padding: 0;
  }

  .report-actions {
    gap: 0.625rem;
  }
}
</style>
