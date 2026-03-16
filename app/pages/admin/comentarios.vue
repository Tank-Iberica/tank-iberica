<script setup lang="ts">
import {
  useAdminComentarios,
  STATUS_TABS,
  STATUS_COLORS,
  STATUS_LABELS,
} from '~/composables/admin/useAdminComentarios'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  loading,
  error,
  activeFilter,
  searchQuery,
  hasMore,
  loadingMore,
  totalCount,
  expandedComments,
  actionLoading,
  deleteModal,
  filteredComments,
  fetchComments,
  loadMore,
  updateStatus,
  confirmDelete,
  closeDeleteModal,
  executeDelete,
  toggleExpand,
  relativeDate,
  getArticleTitle,
} = useAdminComentarios()

onMounted(() => {
  fetchComments()
})
</script>

<template>
  <div class="admin-comentarios">
    <!-- Header -->
    <div class="section-header">
      <div class="header-left">
        <h2>{{ $t('admin.comentarios.title') }}</h2>
        <span class="total-badge">{{ totalCount }} total</span>
      </div>
    </div>

    <!-- Filter tabs -->
    <AdminComentariosFiltersBar
      :active-filter="activeFilter"
      :search-query="searchQuery"
      :status-tabs="STATUS_TABS"
      @update:active-filter="activeFilter = $event"
      @update:search-query="searchQuery = $event"
    />

    <!-- Error -->
    <div v-if="error" class="error-banner">
      {{ error }}
      <button class="error-dismiss" @click="error = null">x</button>
    </div>

    <!-- Loading skeleton -->
    <AdminComentariosLoadingSkeleton v-if="loading" />

    <!-- Comments list -->
    <div v-else-if="filteredComments.length" class="comments-list">
      <AdminComentariosCommentCard
        v-for="comment in filteredComments"
        :key="comment.id"
        :comment="comment"
        :is-expanded="expandedComments.has(comment.id)"
        :action-loading="actionLoading"
        :status-colors="STATUS_COLORS"
        :status-labels="STATUS_LABELS"
        @update-status="(id, status) => updateStatus(id, status)"
        @confirm-delete="(c) => confirmDelete(c)"
        @toggle-expand="(id) => toggleExpand(id)"
      >
        <template #date>
          <span class="comment-date">{{ relativeDate(comment.created_at) }}</span>
        </template>
        <template #articleTitle>{{ getArticleTitle(comment) }}</template>
      </AdminComentariosCommentCard>

      <!-- Load more -->
      <div v-if="hasMore && !searchQuery.trim()" class="load-more-container">
        <button class="btn-load-more" :disabled="loadingMore" @click="loadMore">
          {{ loadingMore ? $t('admin.comentarios.loadingMore') : $t('admin.comentarios.loadMore') }}
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <AdminComentariosEmptyState
      v-else
      :active-filter="activeFilter"
      :search-query="searchQuery"
      :status-labels="STATUS_LABELS"
    />

    <!-- Delete Confirmation Modal -->
    <AdminComentariosDeleteModal
      :show="deleteModal.show"
      :comment="deleteModal.comment"
      :action-loading="actionLoading"
      @confirm="executeDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<style scoped>
.admin-comentarios {
  padding: 0;
}

/* Header */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-5);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-gray-900);
}

.total-badge {
  background: var(--bg-secondary);
  color: var(--color-gray-500);
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius-lg);
  font-size: 0.85rem;
  font-weight: 500;
}

/* Error */
.error-banner {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-dismiss {
  background: none;
  border: none;
  color: var(--color-error);
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;
  padding: var(--spacing-1) var(--spacing-2);
  line-height: 1;
}

/* Comments list layout */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.comment-date {
  font-size: 0.75rem;
  color: var(--text-disabled);
  white-space: nowrap;
}

/* Load more */
.load-more-container {
  display: flex;
  justify-content: center;
  padding: var(--spacing-5) 0;
}

.btn-load-more {
  background: var(--bg-primary);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  padding: 0.625rem var(--spacing-6);
  border-radius: var(--border-radius);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  min-height: 2.75rem;
  transition: background 0.2s;
}

.btn-load-more:hover:not(:disabled) {
  background: var(--color-gray-50);
}

.btn-load-more:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 48em) {
  .section-header {
    flex-direction: column;
    gap: var(--spacing-2);
    align-items: stretch;
  }

  .header-left {
    justify-content: space-between;
  }
}
</style>
