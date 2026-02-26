<script setup lang="ts">
import type { WhatsAppSubmission } from '~/composables/admin/useAdminWhatsApp'

defineProps<{
  submission: WhatsAppSubmission
  expanded: boolean
  actionLoading: boolean
  getDealerName: (sub: WhatsAppSubmission) => string
  getDealerPhone: (sub: WhatsAppSubmission) => string
  getTextPreview: (sub: WhatsAppSubmission, maxLen?: number) => string
  getImageCount: (sub: WhatsAppSubmission) => number
  formatDate: (dateStr: string | null) => string
  getStatusClass: (status: string) => string
  getStatusLabel: (status: string) => string
}>()

const emit = defineEmits<{
  toggle: [id: string]
  retry: [id: string]
  publish: [submission: WhatsAppSubmission]
  delete: [id: string]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="submission-item" :class="{ expanded }">
    <!-- Row summary -->
    <button class="submission-row" @click="emit('toggle', submission.id)">
      <div class="sub-dealer">
        <div class="sub-avatar">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path
              d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
            />
          </svg>
        </div>
        <div class="sub-dealer-info">
          <strong>{{ getDealerName(submission) }}</strong>
          <span class="sub-phone">{{ getDealerPhone(submission) }}</span>
        </div>
      </div>
      <div class="sub-date-cell">
        {{ formatDate(submission.created_at) }}
      </div>
      <div class="sub-status-cell">
        <span class="status-badge" :class="getStatusClass(submission.status)">
          {{ getStatusLabel(submission.status) }}
        </span>
      </div>
      <div class="sub-preview-cell">
        <span class="sub-text-preview">{{ getTextPreview(submission) }}</span>
      </div>
      <div class="sub-images-cell">
        <span v-if="getImageCount(submission) > 0" class="image-count">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          {{ getImageCount(submission) }}
        </span>
      </div>
      <div class="sub-vehicle-link-cell">
        <NuxtLink
          v-if="
            submission.vehicle_id &&
            (submission.status === 'processed' || submission.status === 'published')
          "
          :to="`/admin/productos/${submission.vehicle_id}`"
          class="vehicle-link"
          @click.stop
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </NuxtLink>
      </div>
      <div class="sub-expand-icon">
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

    <!-- Expanded detail -->
    <div v-if="expanded" class="submission-detail">
      <!-- Full text content -->
      <div class="detail-section">
        <h4>{{ t('admin.whatsapp.messageContent') }}</h4>
        <div class="message-content">
          {{ submission.message_text || t('admin.whatsapp.noMessage') }}
        </div>
      </div>

      <!-- Extracted data -->
      <div
        v-if="submission.extracted_data && Object.keys(submission.extracted_data).length > 0"
        class="detail-section"
      >
        <h4>{{ t('admin.whatsapp.extractedData') }}</h4>
        <dl class="data-list">
          <div
            v-for="(value, key) in submission.extracted_data"
            :key="String(key)"
            class="data-row"
          >
            <dt>{{ String(key) }}</dt>
            <dd>{{ String(value) }}</dd>
          </div>
        </dl>
      </div>

      <!-- Image thumbnails -->
      <div v-if="submission.image_urls && submission.image_urls.length > 0" class="detail-section">
        <h4>{{ t('admin.whatsapp.images') }} ({{ submission.image_urls.length }})</h4>
        <div class="image-grid">
          <a
            v-for="(url, idx) in submission.image_urls"
            :key="idx"
            :href="url"
            target="_blank"
            rel="noopener noreferrer"
            class="image-thumb"
          >
            <img :src="url" :alt="`${t('admin.whatsapp.image')} ${idx + 1}`" >
          </a>
        </div>
      </div>

      <!-- Error message -->
      <div v-if="submission.error_message" class="detail-section">
        <h4>{{ t('admin.whatsapp.errorDetail') }}</h4>
        <div class="error-content">
          {{ submission.error_message }}
        </div>
      </div>

      <!-- Actions -->
      <div class="detail-actions">
        <button
          v-if="submission.status === 'failed' || submission.status === 'received'"
          class="btn-retry"
          :disabled="actionLoading"
          @click="emit('retry', submission.id)"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
          </svg>
          {{ t('admin.whatsapp.retry') }}
        </button>
        <NuxtLink
          v-if="
            submission.vehicle_id &&
            (submission.status === 'processed' || submission.status === 'published')
          "
          :to="`/admin/productos/${submission.vehicle_id}`"
          class="btn-view"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {{ t('admin.whatsapp.viewVehicle') }}
        </NuxtLink>
        <button
          v-if="submission.status === 'processed' && submission.vehicle_id"
          class="btn-publish"
          :disabled="actionLoading"
          @click="emit('publish', submission)"
        >
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
          {{ t('admin.whatsapp.publish') }}
        </button>
        <button class="btn-delete" :disabled="actionLoading" @click="emit('delete', submission.id)">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
          {{ t('common.delete') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.submission-item {
  background: white;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.submission-item:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.submission-item.expanded {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Row summary */
.submission-row {
  display: flex;
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

.submission-row:hover {
  background: #f8fafc;
}

/* Dealer info cell */
.sub-dealer {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.sub-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #dcfce7;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #16a34a;
}

.sub-dealer-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sub-dealer-info strong {
  font-size: 0.9rem;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub-phone {
  font-size: 0.8rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Date cell */
.sub-date-cell {
  display: none;
  font-size: 0.85rem;
  color: #64748b;
  white-space: nowrap;
}

/* Status cell */
.sub-status-cell {
  display: flex;
  align-items: center;
}

/* Preview cell */
.sub-preview-cell {
  display: none;
  min-width: 0;
  flex: 1;
}

.sub-text-preview {
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Images cell */
.sub-images-cell {
  display: none;
}

.image-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
  white-space: nowrap;
}

/* Vehicle link cell */
.sub-vehicle-link-cell {
  display: flex;
  align-items: center;
}

.vehicle-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  color: var(--color-primary, #23424a);
  transition: background 0.15s;
}

.vehicle-link:hover {
  background: rgba(35, 66, 74, 0.08);
}

/* Expand icon */
.sub-expand-icon {
  display: flex;
  align-items: center;
  color: #94a3b8;
}

.sub-expand-icon svg {
  transition: transform 0.2s;
}

.sub-expand-icon svg.rotated {
  transform: rotate(180deg);
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

.status-received {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-processing {
  background: #fef3c7;
  color: #92400e;
}

.status-processed {
  background: #e0e7ff;
  color: #4338ca;
}

.status-published {
  background: #dcfce7;
  color: #16a34a;
}

.status-failed {
  background: #fee2e2;
  color: #dc2626;
}

/* ============================================
   EXPANDED DETAIL VIEW
   ============================================ */
.submission-detail {
  padding: 0 16px 16px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 16px;
}

.detail-section h4 {
  margin: 0 0 8px 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.message-content {
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #334155;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Extracted data */
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
  border-bottom: 1px solid #f1f5f9;
}

.data-row:last-child {
  border-bottom: none;
}

.data-row dt {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  flex-shrink: 0;
  text-transform: capitalize;
}

.data-row dd {
  margin: 0;
  font-size: 0.9rem;
  color: #1e293b;
  font-weight: 500;
  text-align: right;
}

/* Image grid */
.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.image-thumb {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  display: block;
}

.image-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-thumb:hover {
  border-color: var(--color-primary, #23424a);
}

/* Error content */
.error-content {
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #dc2626;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Detail actions */
.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.btn-retry,
.btn-view,
.btn-publish,
.btn-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition:
    background 0.2s,
    opacity 0.2s;
  min-height: 44px;
  text-decoration: none;
}

.btn-retry {
  background: #475569;
  color: white;
}

.btn-retry:hover {
  background: #334155;
}

.btn-view {
  background: var(--color-primary, #23424a);
  color: white;
}

.btn-view:hover {
  background: #1a3238;
}

.btn-publish {
  background: #16a34a;
  color: white;
}

.btn-publish:hover {
  background: #15803d;
}

.btn-delete {
  background: #fee2e2;
  color: #dc2626;
}

.btn-delete:hover {
  background: #fecaca;
}

.btn-retry:disabled,
.btn-publish:disabled,
.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 480px+ */
@media (min-width: 480px) {
  .sub-images-cell {
    display: flex;
    align-items: center;
  }

  .image-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 768px+ */
@media (min-width: 768px) {
  .sub-date-cell {
    display: block;
  }

  .sub-preview-cell {
    display: block;
  }

  .image-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

/* 1024px+ */
@media (min-width: 1024px) {
  .sub-images-cell {
    display: flex;
  }

  .detail-actions {
    flex-wrap: nowrap;
  }

  .btn-retry,
  .btn-view,
  .btn-publish,
  .btn-delete {
    flex: none;
    padding: 10px 20px;
  }

  .image-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

/* 1280px+ */
@media (min-width: 1280px) {
  .image-grid {
    grid-template-columns: repeat(8, 1fr);
  }
}
</style>
