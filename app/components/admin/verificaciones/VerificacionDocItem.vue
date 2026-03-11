<script setup lang="ts">
import type {
  VerificationDocument,
  VehicleInfo,
  VerificationLevelInfo,
  VehicleVerificationEntry,
} from '~/composables/admin/useAdminVerificaciones'
import { formatPrice } from '~/composables/admin/useAdminVerificaciones'

const props = defineProps<{
  doc: VerificationDocument
  expanded: boolean
  actionLoading: boolean
  rejectionReason: string
  getVehicleThumbnail: (vehicle: VehicleInfo) => string | null
  getDealerName: (doc: VerificationDocument) => string
  formatDate: (dateStr: string | null) => string
  getDocTypeLabel: (docType: string) => string
  getStatusClass: (status: string | null) => string
  getStatusLabel: (status: string | null) => string
  getVerificationLevelInfo: (level: string | null) => VerificationLevelInfo
  isFileImage: (url: string | null) => boolean
  vehicleVerificationMap: Map<string, VehicleVerificationEntry>
}>()

const emit = defineEmits<{
  toggle: [docId: string]
  approve: [doc: VerificationDocument]
  reject: [doc: VerificationDocument]
  'update:rejectionReason': [value: string]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="doc-item" :class="{ expanded }">
    <!-- Row summary -->
    <button class="doc-row" @click="emit('toggle', doc.id)">
      <div class="doc-vehicle">
        <div class="doc-thumb">
          <img
            v-if="props.getVehicleThumbnail(doc.vehicles)"
            :src="props.getVehicleThumbnail(doc.vehicles)!"
            :alt="`${doc.vehicles.brand} ${doc.vehicles.model}`"
          >
          <span v-else class="thumb-placeholder">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              opacity="0.4"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </span>
        </div>
        <div class="doc-vehicle-info">
          <strong>{{ doc.vehicles.brand }} {{ doc.vehicles.model }}</strong>
          <span class="doc-dealer">{{ props.getDealerName(doc) }}</span>
        </div>
      </div>
      <div class="doc-type-cell">
        <span class="doc-type-badge">{{ props.getDocTypeLabel(doc.doc_type) }}</span>
      </div>
      <div class="doc-date-cell">
        {{ props.formatDate(doc.generated_at) }}
      </div>
      <div class="doc-status-cell">
        <span class="status-badge" :class="props.getStatusClass(doc.status)">
          {{ props.getStatusLabel(doc.status) }}
        </span>
      </div>
      <div class="doc-expand-icon">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          :class="{ rotated: expanded }"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </button>

    <!-- Expanded detail view -->
    <div v-if="expanded" class="doc-detail">
      <div class="detail-grid">
        <!-- Left: Document preview -->
        <div class="detail-preview">
          <h4>{{ t('admin.verificaciones.document') }}</h4>
          <div v-if="doc.file_url" class="preview-container">
            <img
              v-if="props.isFileImage(doc.file_url)"
              :src="doc.file_url"
              :alt="props.getDocTypeLabel(doc.doc_type)"
              class="preview-image"
            >
            <a
              v-else
              :href="doc.file_url"
              target="_blank"
              rel="noopener noreferrer"
              class="preview-link"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>{{ t('admin.verificaciones.openDocument') }}</span>
            </a>
          </div>
          <div v-else class="no-file">
            {{ t('admin.verificaciones.noFile') }}
          </div>

          <!-- Verification level progress for this vehicle -->
          <div class="detail-level">
            <h4>{{ t('admin.verificaciones.verificationLevel') }}</h4>
            <div class="level-display">
              <div class="progress-bar-container large">
                <div
                  class="progress-bar-fill"
                  :class="props.getVerificationLevelInfo(doc.vehicles.verification_level).cssClass"
                  :style="{
                    width:
                      props.getVerificationLevelInfo(doc.vehicles.verification_level).progress +
                      '%',
                  }"
                />
              </div>
              <span
                class="level-label"
                :class="props.getVerificationLevelInfo(doc.vehicles.verification_level).cssClass"
              >
                {{ props.getVerificationLevelInfo(doc.vehicles.verification_level).icon }}
                {{ props.getVerificationLevelInfo(doc.vehicles.verification_level).label }}
              </span>
            </div>

            <!-- Other docs for this vehicle -->
            <div v-if="vehicleVerificationMap.has(doc.vehicle_id)" class="other-docs">
              <span class="other-docs-label">{{ t('admin.verificaciones.vehicleDocs') }}:</span>
              <div class="other-docs-list">
                <span
                  v-for="otherDoc in vehicleVerificationMap.get(doc.vehicle_id)!.docs"
                  :key="otherDoc.id"
                  class="other-doc-chip"
                  :class="props.getStatusClass(otherDoc.status)"
                >
                  {{ props.getDocTypeLabel(otherDoc.doc_type) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Vehicle data + actions -->
        <div class="detail-data">
          <h4>{{ t('admin.verificaciones.vehicleData') }}</h4>
          <dl class="data-list">
            <div class="data-row">
              <dt>{{ t('admin.verificaciones.fields.brand') }}</dt>
              <dd>{{ doc.vehicles.brand }}</dd>
            </div>
            <div class="data-row">
              <dt>{{ t('admin.verificaciones.fields.model') }}</dt>
              <dd>{{ doc.vehicles.model }}</dd>
            </div>
            <div class="data-row">
              <dt>{{ t('admin.verificaciones.fields.year') }}</dt>
              <dd>{{ doc.vehicles.year || '-' }}</dd>
            </div>
            <div class="data-row">
              <dt>{{ t('admin.verificaciones.fields.price') }}</dt>
              <dd>{{ formatPrice(doc.vehicles.price) }}</dd>
            </div>
            <div class="data-row">
              <dt>{{ t('admin.verificaciones.fields.dealer') }}</dt>
              <dd>{{ props.getDealerName(doc) }}</dd>
            </div>
            <div class="data-row">
              <dt>{{ t('admin.verificaciones.fields.docType') }}</dt>
              <dd>{{ props.getDocTypeLabel(doc.doc_type) }}</dd>
            </div>
            <div class="data-row">
              <dt>{{ t('admin.verificaciones.fields.uploadDate') }}</dt>
              <dd>{{ props.formatDate(doc.generated_at) }}</dd>
            </div>
            <div v-if="doc.expires_at" class="data-row">
              <dt>{{ t('admin.verificaciones.fields.expiresAt') }}</dt>
              <dd>{{ props.formatDate(doc.expires_at) }}</dd>
            </div>
            <div v-if="doc.notes" class="data-row full">
              <dt>{{ t('admin.verificaciones.fields.notes') }}</dt>
              <dd>{{ doc.notes }}</dd>
            </div>
            <div v-if="doc.rejection_reason" class="data-row full rejection">
              <dt>{{ t('admin.verificaciones.fields.rejectionReason') }}</dt>
              <dd>{{ doc.rejection_reason }}</dd>
            </div>
          </dl>

          <!-- Actions -->
          <div v-if="doc.status === 'pending'" class="detail-actions">
            <div class="rejection-input">
              <label>{{ t('admin.verificaciones.rejectionReasonLabel') }}</label>
              <textarea
                :value="rejectionReason"
                rows="2"
                :placeholder="t('admin.verificaciones.rejectionReasonPlaceholder')"
                @input="
                  emit('update:rejectionReason', ($event.target as HTMLTextAreaElement).value)
                "
              />
            </div>
            <div class="action-buttons">
              <button class="btn-approve" :disabled="actionLoading" @click="emit('approve', doc)">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {{ t('admin.verificaciones.approve') }}
              </button>
              <button
                class="btn-reject"
                :disabled="actionLoading || !rejectionReason.trim()"
                @click="emit('reject', doc)"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                {{ t('admin.verificaciones.reject') }}
              </button>
            </div>
          </div>

          <!-- Already reviewed info -->
          <div v-else class="detail-reviewed">
            <span class="reviewed-badge" :class="props.getStatusClass(doc.status)">
              {{ props.getStatusLabel(doc.status) }}
            </span>
            <span v-if="doc.rejection_reason" class="reviewed-reason">
              {{ doc.rejection_reason }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   DOCUMENT ITEM
   ============================================ */
.doc-item {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.doc-item:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.doc-item.expanded {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.doc-row {
  display: grid;
  grid-template-columns: 1fr auto auto auto auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  min-height: 4rem;
  font-family: inherit;
}

.doc-row:hover {
  background: var(--bg-secondary);
}

/* Vehicle info cell */
.doc-vehicle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.doc-thumb {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.doc-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-disabled);
}

.doc-vehicle-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.doc-vehicle-info strong {
  font-size: 0.9rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-dealer {
  font-size: 0.8rem;
  color: var(--text-auxiliary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Doc type cell */
.doc-type-cell {
  display: none;
}

.doc-type-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border-radius: var(--border-radius-sm);
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

/* Date cell */
.doc-date-cell {
  display: none;
  font-size: 0.85rem;
  color: var(--text-auxiliary);
  white-space: nowrap;
}

/* Status cell */
.doc-status-cell {
  display: flex;
  align-items: center;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: var(--border-radius-md);
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.status-pending {
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning-text);
}

.status-badge.status-verified {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-success);
}

.status-badge.status-rejected {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}

/* Expand icon */
.doc-expand-icon {
  display: flex;
  align-items: center;
  color: var(--text-disabled);
}

.doc-expand-icon svg {
  transition: transform 0.2s;
}

.doc-expand-icon svg.rotated {
  transform: rotate(180deg);
}

/* ============================================
   EXPANDED DETAIL VIEW
   ============================================ */
.doc-detail {
  padding: 0 1rem 1rem;
  border-top: 1px solid var(--color-gray-100);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  padding-top: 1rem;
}

/* Preview section */
.detail-preview h4,
.detail-data h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.preview-container {
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  overflow: hidden;
  margin-bottom: 1rem;
}

.preview-image {
  width: 100%;
  max-height: 20rem;
  object-fit: contain;
  display: block;
  background: var(--bg-secondary);
}

.preview-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
}

.preview-link:hover {
  background: var(--bg-secondary);
}

.no-file {
  padding: 2rem;
  text-align: center;
  color: var(--text-disabled);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

/* Verification level in detail */
.detail-level {
  margin-top: 1rem;
}

.level-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.progress-bar-container {
  flex: 1;
  height: 0.375rem;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-sm);
  overflow: hidden;
}

.progress-bar-container.large {
  height: 0.5rem;
  border-radius: var(--border-radius-sm);
}

.progress-bar-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.4s ease;
}

.progress-bar-fill.level-none {
  background: var(--color-gray-400);
  width: 0;
}

.progress-bar-fill.level-verified {
  background: var(--color-success);
}

.progress-bar-fill.level-extended {
  background: var(--color-info);
}

.progress-bar-fill.level-detailed {
  background: var(--color-violet-500);
}

.progress-bar-fill.level-audited {
  background: var(--color-warning);
}

.progress-bar-fill.level-certified {
  background: var(--color-teal-500);
}

.level-label {
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.level-label.level-none {
  color: var(--text-disabled);
}
.level-label.level-verified {
  color: var(--color-success);
}
.level-label.level-extended {
  color: var(--color-focus);
}
.level-label.level-detailed {
  color: var(--color-purple-600);
}
.level-label.level-audited {
  color: var(--color-warning);
}
.level-label.level-certified {
  color: var(--color-teal-600);
}

.other-docs {
  margin-top: 0.5rem;
}

.other-docs-label {
  font-size: 0.8rem;
  color: var(--text-auxiliary);
  display: block;
  margin-bottom: 0.375rem;
}

.other-docs-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.other-doc-chip {
  display: inline-block;
  padding: 0.1875rem 0.5rem;
  border-radius: var(--border-radius-sm);
  font-size: 0.7rem;
  font-weight: 500;
}

.other-doc-chip.status-pending {
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning-text);
}

.other-doc-chip.status-verified {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-success);
}

.other-doc-chip.status-rejected {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}

/* Vehicle data section */
.data-list {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.data-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-gray-100);
}

.data-row:last-child {
  border-bottom: none;
}

.data-row dt {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-auxiliary);
  flex-shrink: 0;
}

.data-row dd {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-primary);
  font-weight: 500;
  text-align: right;
}

.data-row.full {
  flex-direction: column;
  gap: 0.25rem;
}

.data-row.full dd {
  text-align: left;
  font-weight: 400;
}

.data-row.rejection dt {
  color: var(--color-error);
}

.data-row.rejection dd {
  color: var(--color-error);
}

/* Actions section */
.detail-actions {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-gray-200);
}

.rejection-input {
  margin-bottom: 0.75rem;
}

.rejection-input label {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.375rem;
}

.rejection-input textarea {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 3.75rem;
}

.rejection-input textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
}

.btn-approve,
.btn-reject {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition:
    background 0.2s,
    opacity 0.2s;
  min-height: 2.75rem;
  flex: 1;
}

.btn-approve {
  background: var(--color-success);
  color: white;
}

.btn-approve:hover {
  background: var(--color-green-700);
}

.btn-reject {
  background: var(--color-error);
  color: white;
}

.btn-reject:hover {
  background: var(--color-error);
}

.btn-approve:disabled,
.btn-reject:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Already reviewed */
.detail-reviewed {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.reviewed-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: var(--border-radius-md);
  font-size: 0.85rem;
  font-weight: 600;
}

.reviewed-badge.status-verified {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-success);
}

.reviewed-badge.status-rejected {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}

.reviewed-reason {
  font-size: 0.85rem;
  color: var(--text-auxiliary);
  font-style: italic;
}

/* ============================================
   RESPONSIVE
   ============================================ */

/* 30em+ : Show doc type column */
@media (min-width: 30em) {
  .doc-type-cell {
    display: flex;
    align-items: center;
  }
}

/* 48em+ : Tablet layout */
@media (min-width: 48em) {
  .doc-date-cell {
    display: block;
  }

  .doc-row {
    grid-template-columns: 1fr auto auto auto auto;
  }

  .detail-grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* 64em+ : Desktop layout */
@media (min-width: 64em) {
  .action-buttons {
    flex: none;
  }

  .btn-approve,
  .btn-reject {
    flex: none;
    padding: 0.625rem 1.5rem;
  }
}
</style>
