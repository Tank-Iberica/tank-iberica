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
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s;
  overflow: hidden;
}

.report-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.report-card.report-pending {
  border-left: 3px solid #f59e0b;
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
  padding: 16px 20px;
  cursor: pointer;
  gap: 12px;
}

.report-header:hover {
  background: #fafafa;
}

.report-main-info {
  flex: 1;
  min-width: 0;
}

.report-top-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.reporter-email {
  font-weight: 600;
  font-size: 0.9rem;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid;
}

.report-meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.entity-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  background: #eff6ff;
  color: #1d4ed8;
}

.reason-text {
  font-size: 0.8rem;
  color: #6b7280;
}

.report-date {
  font-size: 0.75rem;
  color: #9ca3af;
  white-space: nowrap;
}

.expand-indicator {
  flex-shrink: 0;
  color: #9ca3af;
  transition: color 0.2s;
}

.expand-indicator svg {
  transition: transform 0.2s;
}

.expand-indicator svg.rotated {
  transform: rotate(180deg);
}

.report-header:hover .expand-indicator {
  color: #6b7280;
}

/* ============================================
   EXPANDED DETAILS
   ============================================ */
.report-details {
  padding: 0 20px 20px;
  border-top: 1px solid #f3f4f6;
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
  gap: 12px;
  padding: 16px 0;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-item.detail-full {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.detail-value {
  font-size: 0.9rem;
  color: #374151;
  word-break: break-word;
}

.detail-id {
  font-family: monospace;
  font-size: 0.8rem;
  color: #6b7280;
}

/* ============================================
   ADMIN NOTES
   ============================================ */
.notes-section {
  padding: 16px 0;
  border-top: 1px solid #f3f4f6;
}

.notes-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.notes-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  color: #374151;
  line-height: 1.5;
}

.notes-textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.btn-save-notes {
  margin-top: 8px;
  padding: 8px 16px;
  background: white;
  color: var(--color-primary, #23424a);
  border: 1px solid var(--color-primary, #23424a);
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
  transition: background 0.2s;
}

.btn-save-notes:hover:not(:disabled) {
  background: #f0f4f5;
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
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition:
    background 0.2s,
    border-color 0.2s;
  min-height: 44px;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-reviewing {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
}

.action-reviewing:hover:not(:disabled) {
  background: #dbeafe;
}

.action-remove {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}

.action-remove:hover:not(:disabled) {
  background: #fee2e2;
}

.action-keep {
  background: #f0fdf4;
  color: #16a34a;
  border-color: #bbf7d0;
}

.action-keep:hover:not(:disabled) {
  background: #dcfce7;
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (min-width: 480px) {
  .report-actions {
    flex-wrap: nowrap;
  }

  .reporter-email {
    max-width: 280px;
  }
}

@media (min-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr 1fr;
  }

  .report-header {
    padding: 16px 24px;
  }

  .report-details {
    padding: 0 24px 24px;
  }

  .reporter-email {
    max-width: 360px;
  }
}

@media (min-width: 1024px) {
  .detail-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .report-card {
    padding: 0;
  }

  .report-actions {
    gap: 10px;
  }
}
</style>
