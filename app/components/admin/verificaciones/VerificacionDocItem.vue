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
          />
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
            />
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
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
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
  gap: 12px;
  padding: 12px 16px;
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  min-height: 64px;
  font-family: inherit;
}

.doc-row:hover {
  background: var(--bg-secondary);
}

/* Vehicle info cell */
.doc-vehicle {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.doc-thumb {
  width: 44px;
  height: 44px;
  border-radius: 6px;
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
  padding: 4px 10px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border-radius: 6px;
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

.status-badge.status-verified {
  background: var(--color-success-bg, #dcfce7);
  color: var(--color-success);
}

.status-badge.status-rejected {
  background: var(--color-error-bg, #fef2f2);
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
  padding: 0 16px 16px;
  border-top: 1px solid var(--color-gray-100);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  padding-top: 16px;
}

/* Preview section */
.detail-preview h4,
.detail-data h4 {
  margin: 0 0 12px 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.preview-container {
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}

.preview-image {
  width: 100%;
  max-height: 320px;
  object-fit: contain;
  display: block;
  background: var(--bg-secondary);
}

.preview-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
}

.preview-link:hover {
  background: var(--bg-secondary);
}

.no-file {
  padding: 32px;
  text-align: center;
  color: var(--text-disabled);
  background: var(--bg-secondary);
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 16px;
}

/* Verification level in detail */
.detail-level {
  margin-top: 16px;
}

.level-display {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.progress-bar-container {
  flex: 1;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-container.large {
  height: 8px;
  border-radius: 4px;
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
  background: #8b5cf6;
}

.progress-bar-fill.level-audited {
  background: var(--color-warning);
}

.progress-bar-fill.level-certified {
  background: #14b8a6;
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
  color: #2563eb;
}
.level-label.level-detailed {
  color: #7c3aed;
}
.level-label.level-audited {
  color: var(--color-warning);
}
.level-label.level-certified {
  color: #0d9488;
}

.other-docs {
  margin-top: 8px;
}

.other-docs-label {
  font-size: 0.8rem;
  color: var(--text-auxiliary);
  display: block;
  margin-bottom: 6px;
}

.other-docs-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.other-doc-chip {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
}

.other-doc-chip.status-pending {
  background: var(--color-warning-bg, #fef3c7);
  color: var(--color-warning-text);
}

.other-doc-chip.status-verified {
  background: var(--color-success-bg, #dcfce7);
  color: var(--color-success);
}

.other-doc-chip.status-rejected {
  background: var(--color-error-bg, #fef2f2);
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
  padding: 8px 0;
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
  gap: 4px;
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
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-gray-200);
}

.rejection-input {
  margin-bottom: 12px;
}

.rejection-input label {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.rejection-input textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
}

.rejection-input textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn-approve,
.btn-reject {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition:
    background 0.2s,
    opacity 0.2s;
  min-height: 44px;
  flex: 1;
}

.btn-approve {
  background: var(--color-success);
  color: white;
}

.btn-approve:hover {
  background: #15803d;
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
  margin-top: 16px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.reviewed-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.reviewed-badge.status-verified {
  background: var(--color-success-bg, #dcfce7);
  color: var(--color-success);
}

.reviewed-badge.status-rejected {
  background: var(--color-error-bg, #fef2f2);
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

/* 480px+ : Show doc type column */
@media (min-width: 480px) {
  .doc-type-cell {
    display: flex;
    align-items: center;
  }
}

/* 768px+ : Tablet layout */
@media (min-width: 768px) {
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

/* 1024px+ : Desktop layout */
@media (min-width: 1024px) {
  .action-buttons {
    flex: none;
  }

  .btn-approve,
  .btn-reject {
    flex: none;
    padding: 10px 24px;
  }
}
</style>
