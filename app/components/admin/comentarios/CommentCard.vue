<script setup lang="ts">
import type { Comment, CommentStatus } from '~/composables/admin/useAdminComentarios'
const { t } = useI18n()

defineProps<{
  comment: Comment
  isExpanded: boolean
  actionLoading: string | null
  statusColors: Record<CommentStatus, string>
  statusLabels: Record<CommentStatus, string>
}>()

const emit = defineEmits<{
  (e: 'updateStatus', commentId: string, status: CommentStatus): void
  (e: 'confirmDelete', comment: Comment): void
  (e: 'toggleExpand', commentId: string): void
}>()
</script>

<template>
  <div class="comment-card" :class="{ 'comment-pending': comment.status === 'pending' }">
    <!-- Card header -->
    <div class="comment-header">
      <div class="comment-author-info">
        <div class="author-avatar">
          {{ (comment.author_name || 'A').charAt(0).toUpperCase() }}
        </div>
        <div class="author-details">
          <span class="author-name">{{ comment.author_name || t('admin.comments.anonymous') }}</span>
          <span v-if="comment.author_email" class="author-email">{{ comment.author_email }}</span>
        </div>
      </div>
      <div class="comment-meta">
        <span
          class="status-badge"
          :style="{
            backgroundColor: statusColors[comment.status] + '1a',
            color: statusColors[comment.status],
          }"
        >
          {{ statusLabels[comment.status] }}
        </span>
        <slot name="date" />
      </div>
    </div>

    <!-- Reply indicator -->
    <div v-if="comment.parent_id" class="reply-indicator">
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
        <polyline points="9 14 4 9 9 4" />
        <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
      </svg>
      {{ t('admin.comments.replyTo') }}
    </div>

    <!-- Article link -->
    <div class="comment-article">
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
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
      <span class="article-title"><slot name="articleTitle" /></span>
    </div>

    <!-- Content -->
    <div class="comment-content" :class="{ 'content-expanded': isExpanded }">
      {{ comment.content }}
    </div>
    <button
      v-if="comment.content.length > 200"
      class="expand-btn"
      @click="emit('toggleExpand', comment.id)"
    >
      {{ isExpanded ? t('common.seeLess') : t('common.seeMore') }}
    </button>

    <!-- Actions -->
    <div class="comment-actions">
      <button
        v-if="comment.status !== 'approved'"
        class="action-btn action-approve"
        :disabled="actionLoading === comment.id"
        @click="emit('updateStatus', comment.id, 'approved')"
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
        {{ t('common.approve') }}
      </button>
      <button
        v-if="comment.status !== 'rejected'"
        class="action-btn action-reject"
        :disabled="actionLoading === comment.id"
        @click="emit('updateStatus', comment.id, 'rejected')"
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
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        {{ t('common.reject') }}
      </button>
      <button
        v-if="comment.status !== 'spam'"
        class="action-btn action-spam"
        :disabled="actionLoading === comment.id"
        @click="emit('updateStatus', comment.id, 'spam')"
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
          <path
            d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
          />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        {{ t('admin.comments.spam') }}
      </button>
      <button
        class="action-btn action-delete"
        :disabled="actionLoading === comment.id"
        @click="emit('confirmDelete', comment)"
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
        {{ t('common.delete') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.comment-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  padding: 1rem 1.25rem;
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.2s;
}

.comment-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.comment-card.comment-pending {
  border-left: 3px solid var(--color-warning);
}

/* Card header */
.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.625rem;
}

.comment-author-info {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-width: 0;
}

.author-avatar {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.author-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.author-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-gray-900);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.author-email {
  font-size: 0.75rem;
  color: var(--color-gray-500);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.status-badge {
  display: inline-block;
  padding: 0.1875rem 0.625rem;
  border-radius: var(--border-radius-md);
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

/* Reply indicator */
.reply-indicator {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--color-gray-500);
  margin-bottom: 0.5rem;
  padding: 0.25rem 0.625rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-sm);
  width: fit-content;
}

/* Article link */
.comment-article {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--color-gray-500);
  margin-bottom: 0.625rem;
}

.article-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Content */
.comment-content {
  font-size: 0.85rem;
  line-height: 1.6;
  color: var(--color-gray-700);
  margin-bottom: 0.25rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.comment-content.content-expanded {
  display: block;
  -webkit-line-clamp: unset;
  overflow: visible;
}

.expand-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.125rem 0;
  margin-bottom: 0.5rem;
}

.expand-btn:hover {
  text-decoration: underline;
}

/* Actions */
.comment-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--bg-secondary);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  padding: 0.4375rem 0.875rem;
  border-radius: var(--border-radius-sm);
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

.action-approve {
  background: var(--color-success-bg);
  color: var(--color-success);
  border-color: var(--color-success-border);
}

.action-approve:hover:not(:disabled) {
  background: var(--color-success-bg);
}

.action-reject {
  background: var(--color-error-bg);
  color: var(--color-error);
  border-color: var(--color-error-border);
}

.action-reject:hover:not(:disabled) {
  background: var(--color-error-bg);
}

.action-spam {
  background: var(--color-orange-bg);
  color: var(--color-orange-text);
  border-color: var(--color-orange-200);
}

.action-spam:hover:not(:disabled) {
  background: var(--color-orange-100);
}

.action-delete {
  background: var(--bg-primary);
  color: var(--color-error);
  border-color: var(--color-error-border);
}

.action-delete:hover:not(:disabled) {
  background: var(--color-error-bg);
}

/* Mobile responsive (30em) */
@media (min-width: 30em) {
  .comment-actions {
    flex-wrap: nowrap;
  }
}

/* Tablet (48em) */
@media (max-width: 48em) {
  .comment-header {
    flex-direction: column;
    gap: 0.5rem;
  }

  .comment-meta {
    align-self: flex-start;
  }

  .comment-actions {
    flex-wrap: wrap;
  }

  .action-btn {
    flex: 1;
    min-width: calc(50% - 0.25rem);
    justify-content: center;
  }
}

/* Desktop (64em) */
@media (min-width: 64em) {
  .comment-card {
    padding: 1.25rem 1.5rem;
  }

  .comment-actions {
    gap: 0.625rem;
  }
}
</style>
