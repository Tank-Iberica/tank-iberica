<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show && post" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-panel">
          <div class="modal-header">
            <h2>{{ t('admin.social.postDetail') }}</h2>
            <button class="modal-close" @click="$emit('close')">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <!-- Platform + Vehicle -->
            <div class="modal-meta">
              <span class="platform-badge large" :class="platformClass">
                {{ platformLabel }}
              </span>
              <span class="modal-vehicle">{{ vehicleTitle }}</span>
              <span class="status-badge" :class="statusClass">
                {{ statusLabel }}
              </span>
            </div>

            <!-- Image preview -->
            <div v-if="post.image_url" class="modal-image">
              <img :src="post.image_url" :alt="vehicleTitle" >
            </div>

            <!-- Locale tabs -->
            <div class="locale-tabs">
              <button
                class="locale-tab"
                :class="{ active: editLocale === 'es' }"
                @click="$emit('switchLocale', 'es')"
              >
                ES
              </button>
              <button
                class="locale-tab"
                :class="{ active: editLocale === 'en' }"
                @click="$emit('switchLocale', 'en')"
              >
                EN
              </button>
            </div>

            <!-- Content textarea -->
            <textarea
              :value="editContent"
              class="content-textarea"
              rows="8"
              :disabled="post.status === 'posted'"
              @input="$emit('update:editContent', ($event.target as HTMLTextAreaElement).value)"
            />

            <!-- Status history -->
            <div class="status-history">
              <div class="history-item">
                <span class="history-label">{{ t('admin.social.createdAt') }}:</span>
                <span>{{ formatDate(post.created_at) }}</span>
              </div>
              <div v-if="post.approved_at" class="history-item">
                <span class="history-label">{{ t('admin.social.approvedAt') }}:</span>
                <span>{{ formatDate(post.approved_at) }}</span>
              </div>
              <div v-if="post.posted_at" class="history-item">
                <span class="history-label">{{ t('admin.social.postedAt') }}:</span>
                <span>{{ formatDate(post.posted_at) }}</span>
              </div>
              <div v-if="post.external_post_id" class="history-item">
                <span class="history-label">{{ t('admin.social.externalId') }}:</span>
                <span class="external-id">{{ post.external_post_id }}</span>
              </div>
              <div v-if="post.rejection_reason" class="history-item rejection">
                <span class="history-label">{{ t('admin.social.rejectionReason') }}:</span>
                <span>{{ post.rejection_reason }}</span>
              </div>
            </div>

            <!-- Metrics (published posts) -->
            <div v-if="post.status === 'posted'" class="modal-metrics">
              <div class="metric-card">
                <span class="metric-value">{{ post.impressions }}</span>
                <span class="metric-label">{{ t('admin.social.impressions') }}</span>
              </div>
              <div class="metric-card">
                <span class="metric-value">{{ post.clicks }}</span>
                <span class="metric-label">{{ t('admin.social.clicks') }}</span>
              </div>
            </div>

            <!-- Rejection input (pending posts) -->
            <div v-if="post.status === 'pending'" class="rejection-input">
              <label>{{ t('admin.social.rejectionReasonLabel') }}</label>
              <input
                :value="rejectionReason"
                type="text"
                :placeholder="t('admin.social.rejectionReasonPlaceholder')"
                @input="$emit('update:rejectionReason', ($event.target as HTMLInputElement).value)"
              >
            </div>
          </div>

          <!-- Modal actions -->
          <div class="modal-footer">
            <!-- Save content -->
            <button
              v-if="post.status !== 'posted'"
              class="btn-save"
              :disabled="actionLoading"
              @click="$emit('saveContent')"
            >
              {{ t('admin.social.saveContent') }}
            </button>

            <!-- Approve -->
            <button
              v-if="post.status === 'pending'"
              class="btn-approve-lg"
              :disabled="actionLoading"
              @click="$emit('approve', post.id)"
            >
              {{ t('admin.social.approve') }}
            </button>

            <!-- Reject -->
            <button
              v-if="post.status === 'pending'"
              class="btn-reject-lg"
              :disabled="actionLoading || !rejectionReason.trim()"
              @click="$emit('reject', post.id)"
            >
              {{ t('admin.social.reject') }}
            </button>

            <!-- Publish -->
            <button
              v-if="post.status === 'approved'"
              class="btn-publish-lg"
              :disabled="actionLoading"
              @click="$emit('publish', post.id)"
            >
              {{ t('admin.social.publish') }}
            </button>

            <button class="btn-cancel" @click="$emit('close')">
              {{ t('common.close') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { SocialPostWithVehicle } from '~/composables/useSocialPublisher'

const { t } = useI18n()

defineProps<{
  show: boolean
  post: SocialPostWithVehicle | null
  vehicleTitle: string
  platformLabel: string
  platformClass: string
  statusClass: string
  statusLabel: string
  editLocale: 'es' | 'en'
  editContent: string
  rejectionReason: string
  actionLoading: boolean
  formatDate: (dateStr: string | null) => string
}>()

defineEmits<{
  close: []
  switchLocale: [locale: 'es' | 'en']
  'update:editContent': [value: string]
  'update:rejectionReason': [value: string]
  saveContent: []
  approve: [postId: string]
  reject: [postId: string]
  publish: [postId: string]
}>()
</script>

<style scoped>
@import './social-shared.css';

.modal-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.modal-vehicle {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-primary);
}

.modal-image {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-gray-200);
}

.modal-image img {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  display: block;
}

/* Locale tabs */
.locale-tabs {
  display: flex;
  gap: 4px;
}

.locale-tab {
  padding: 8px 16px;
  border: 1px solid var(--color-gray-200);
  border-radius: 6px;
  background: var(--bg-primary);
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--text-auxiliary);
  cursor: pointer;
  min-height: 44px;
}

.locale-tab.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

/* Content textarea */
.content-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
  min-height: 120px;
  line-height: 1.5;
}

.content-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.content-textarea:disabled {
  background: var(--bg-secondary);
  color: var(--text-auxiliary);
}

/* Status history */
.status-history {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.history-item {
  display: flex;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.history-label {
  font-weight: 600;
  white-space: nowrap;
}

.history-item.rejection {
  color: var(--color-error);
}

.external-id {
  font-family: monospace;
  font-size: 0.75rem;
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
}

/* Modal metrics */
.modal-metrics {
  display: flex;
  gap: 12px;
}

.metric-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.metric-label {
  font-size: 0.75rem;
  color: var(--text-auxiliary);
}

/* Rejection input */
.rejection-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rejection-input label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.rejection-input input {
  padding: 10px 12px;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-size: 0.9rem;
  min-height: 44px;
}

.rejection-input input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}
</style>
