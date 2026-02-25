<template>
  <div class="post-card" @click="$emit('select', post)">
    <!-- Image -->
    <div class="post-image">
      <img v-if="post.image_url" :src="post.image_url" :alt="vehicleTitle" >
      <div v-else class="post-image-placeholder">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          opacity="0.3"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>
      <!-- Platform badge -->
      <span class="platform-badge" :class="platformClass">
        {{ platformLabel }}
      </span>
    </div>

    <!-- Content -->
    <div class="post-body">
      <div class="post-vehicle-title">{{ vehicleTitle }}</div>
      <p class="post-preview">{{ preview }}</p>
      <div class="post-meta">
        <span class="status-badge" :class="statusClass">
          {{ statusLabel }}
        </span>
        <span class="post-date">{{ formattedDate }}</span>
      </div>
      <!-- Metrics for published -->
      <div v-if="post.status === 'posted'" class="post-metrics">
        <span class="metric">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {{ post.impressions }}
        </span>
        <span class="metric">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          {{ post.clicks }}
        </span>
      </div>
    </div>

    <!-- Actions -->
    <div class="post-actions">
      <button
        v-if="post.status === 'pending'"
        class="btn-action btn-approve"
        :title="t('admin.social.approve')"
        @click.stop="$emit('approve', post.id)"
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
      </button>
      <button
        v-if="post.status === 'approved'"
        class="btn-action btn-publish"
        :title="t('admin.social.publish')"
        @click.stop="$emit('publish', post.id)"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M22 2L11 13" />
          <path d="M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
      </button>
      <button
        class="btn-action btn-edit"
        :title="t('admin.social.edit')"
        @click.stop="$emit('select', post)"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SocialPostWithVehicle } from '~/composables/useSocialPublisher'

const { t } = useI18n()

defineProps<{
  post: SocialPostWithVehicle
  vehicleTitle: string
  preview: string
  platformLabel: string
  platformClass: string
  statusClass: string
  statusLabel: string
  formattedDate: string
}>()

defineEmits<{
  select: [post: SocialPostWithVehicle]
  approve: [postId: string]
  publish: [postId: string]
}>()
</script>

<style scoped>
@import './social-shared.css';

.post-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.post-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

/* Post image */
.post-image {
  position: relative;
  width: 100%;
  height: 160px;
  background: #f1f5f9;
  overflow: hidden;
}

.post-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.post-image .platform-badge {
  position: absolute;
  top: 8px;
  left: 8px;
}

/* Post body */
.post-body {
  padding: 12px 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.post-vehicle-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: #1e293b;
}

.post-preview {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
}

.post-date {
  font-size: 0.75rem;
  color: #94a3b8;
}

.post-metrics {
  display: flex;
  gap: 16px;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
}

.metric {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

/* Post actions */
.post-actions {
  display: flex;
  gap: 4px;
  padding: 8px 16px 12px;
  border-top: 1px solid #f1f5f9;
}

.btn-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.15s;
  color: #64748b;
}

.btn-action:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-action.btn-approve {
  color: #16a34a;
  border-color: #bbf7d0;
}

.btn-action.btn-approve:hover {
  background: #f0fdf4;
}

.btn-action.btn-publish {
  color: #2563eb;
  border-color: #bfdbfe;
}

.btn-action.btn-publish:hover {
  background: #eff6ff;
}

.btn-action.btn-edit {
  color: #64748b;
}
</style>
