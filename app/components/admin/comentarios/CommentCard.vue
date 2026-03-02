<script setup lang="ts">
import type { Comment, CommentStatus } from '~/composables/admin/useAdminComentarios'

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
          <span class="author-name">{{ comment.author_name || 'Anonimo' }}</span>
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
      Respuesta a otro comentario
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
      {{ isExpanded ? 'Ver menos' : 'Ver mas...' }}
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
        Aprobar
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
        Rechazar
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
        Spam
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
        Eliminar
      </button>
    </div>
  </div>
</template>

<style scoped>
.comment-card {
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
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
  gap: 12px;
  margin-bottom: 10px;
}

.comment-author-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.author-avatar {
  width: 36px;
  height: 36px;
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
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.author-email {
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

/* Reply indicator */
.reply-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 8px;
  padding: 4px 10px;
  background: var(--bg-secondary);
  border-radius: 4px;
  width: fit-content;
}

/* Article link */
.comment-article {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 10px;
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
  color: #374151;
  margin-bottom: 4px;
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
  padding: 2px 0;
  margin-bottom: 8px;
}

.expand-btn:hover {
  text-decoration: underline;
}

/* Actions */
.comment-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
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

.action-approve {
  background: var(--color-success-bg, #dcfce7);
  color: var(--color-success);
  border-color: var(--color-success-border);
}

.action-approve:hover:not(:disabled) {
  background: var(--color-success-bg, #dcfce7);
}

.action-reject {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
  border-color: var(--color-error-border);
}

.action-reject:hover:not(:disabled) {
  background: var(--color-error-bg, #fef2f2);
}

.action-spam {
  background: #fff7ed;
  color: #ea580c;
  border-color: #fed7aa;
}

.action-spam:hover:not(:disabled) {
  background: #ffedd5;
}

.action-delete {
  background: var(--bg-primary);
  color: var(--color-error);
  border-color: var(--color-error-border);
}

.action-delete:hover:not(:disabled) {
  background: var(--color-error-bg, #fef2f2);
}

/* Mobile responsive (480px) */
@media (min-width: 480px) {
  .comment-actions {
    flex-wrap: nowrap;
  }
}

/* Tablet (768px) */
@media (max-width: 768px) {
  .comment-header {
    flex-direction: column;
    gap: 8px;
  }

  .comment-meta {
    align-self: flex-start;
  }

  .comment-actions {
    flex-wrap: wrap;
  }

  .action-btn {
    flex: 1;
    min-width: calc(50% - 4px);
    justify-content: center;
  }
}

/* Desktop (1024px) */
@media (min-width: 1024px) {
  .comment-card {
    padding: 20px 24px;
  }

  .comment-actions {
    gap: 10px;
  }
}
</style>
