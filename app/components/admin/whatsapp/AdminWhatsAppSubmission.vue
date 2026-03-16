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
        v-if="submission.extracted_data && Object.keys(submission.extracted_data).length"
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
      <div
        v-if="submission.image_urls != null && submission.image_urls.length"
        class="detail-section"
      >
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
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
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
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  min-height: 4rem;
  font-family: inherit;
}

.submission-row:hover {
  background: var(--bg-secondary);
}

/* Dealer info cell */
.sub-dealer {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  min-width: 0;
  flex: 1;
}

.sub-avatar {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  background: var(--color-success-bg, var(--color-success-bg));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-success);
}

.sub-dealer-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sub-dealer-info strong {
  font-size: 0.9rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub-phone {
  font-size: 0.8rem;
  color: var(--text-auxiliary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Date cell */
.sub-date-cell {
  display: none;
  font-size: 0.85rem;
  color: var(--text-auxiliary);
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
  color: var(--text-auxiliary);
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
  gap: var(--spacing-1);
  font-size: 0.8rem;
  color: var(--text-auxiliary);
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
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--border-radius-sm);
  color: var(--color-primary);
  transition: background 0.15s;
}

.vehicle-link:hover {
  background: rgba(35, 66, 74, 0.08);
}

/* Expand icon */
.sub-expand-icon {
  display: flex;
  align-items: center;
  color: var(--text-disabled);
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
  padding: 0.25rem 0.75rem;
  border-radius: var(--border-radius-md);
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-received {
  background: var(--color-info-bg, var(--color-info-bg));
  color: var(--color-info);
}

.status-processing {
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning-text);
}

.status-processed {
  background: var(--color-indigo-100);
  color: var(--color-indigo-700);
}

.status-published {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-success);
}

.status-failed {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}

/* ============================================
   EXPANDED DETAIL VIEW
   ============================================ */
.submission-detail {
  padding: 0 var(--spacing-4) var(--spacing-4);
  border-top: 1px solid var(--color-gray-100);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding-top: var(--spacing-4);
}

.detail-section h4 {
  margin: 0 0 var(--spacing-2) 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.message-content {
  padding: var(--spacing-3);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  color: var(--color-gray-700);
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
  padding: var(--spacing-2) 0;
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
  text-transform: capitalize;
}

.data-row dd {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-primary);
  font-weight: 500;
  text-align: right;
}

/* Image grid */
.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-2);
}

.image-thumb {
  aspect-ratio: 1;
  border-radius: var(--border-radius);
  overflow: hidden;
  border: 1px solid var(--color-gray-200);
  display: block;
}

.image-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-thumb:hover {
  border-color: var(--color-primary);
}

/* Error content */
.error-content {
  padding: var(--spacing-3);
  background: var(--color-error-bg, var(--color-error-bg));
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  font-size: 0.85rem;
  color: var(--color-error);
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Detail actions */
.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  padding-top: var(--spacing-3);
  border-top: 1px solid var(--color-gray-200);
}

.btn-retry,
.btn-view,
.btn-publish,
.btn-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.625rem var(--spacing-4);
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition:
    background 0.2s,
    opacity 0.2s;
  min-height: 2.75rem;
  text-decoration: none;
}

.btn-retry {
  background: var(--color-gray-600);
  color: white;
}

.btn-retry:hover {
  background: var(--color-gray-700);
}

.btn-view {
  background: var(--color-primary);
  color: white;
}

.btn-view:hover {
  background: var(--color-primary-dark);
}

.btn-publish {
  background: var(--color-success);
  color: white;
}

.btn-publish:hover {
  background: var(--color-green-700);
}

.btn-delete {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}

.btn-delete:hover {
  background: var(--color-error-border);
}

.btn-retry:disabled,
.btn-publish:disabled,
.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 30em+ */
@media (min-width: 30em) {
  .sub-images-cell {
    display: flex;
    align-items: center;
  }

  .image-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 48em+ */
@media (min-width: 48em) {
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

/* 64em+ */
@media (min-width: 64em) {
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
    padding: 0.625rem var(--spacing-5);
  }

  .image-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

/* 80em+ */
@media (min-width: 80em) {
  .image-grid {
    grid-template-columns: repeat(8, 1fr);
  }
}
</style>
