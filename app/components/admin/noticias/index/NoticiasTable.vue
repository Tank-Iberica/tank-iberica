<script setup lang="ts">
import type { News } from '~/composables/useNews'
import type { SortField } from '~/composables/admin/useAdminNoticiasIndex'
import type { SeoLevel } from '~/composables/admin/useSeoScore'

defineProps<{
  sortedNews: News[]
  hasActiveFilters: boolean
  categoryLabels: Record<string, string>
  getSortIcon: (field: SortField) => string
  getSeoScore: (item: News) => { score: number; level: SeoLevel }
  formatDate: (dateStr: string | null) => string
}>()

const emit = defineEmits<{
  (e: 'toggle-sort', field: SortField): void
  (e: 'navigate', id: string): void
  (e: 'status-change', item: { id: string; status: string }, event: Event): void
  (e: 'delete', item: { id: string; title_es: string }): void
}>()
</script>

<template>
  <div class="table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th class="col-title" @click="emit('toggle-sort', 'title_es')">
            Titulo {{ getSortIcon('title_es') }}
          </th>
          <th class="col-category">Categoria</th>
          <th class="col-status">{{ $t('common.status') }}</th>
          <th class="col-views" @click="emit('toggle-sort', 'views')">
            Visitas {{ getSortIcon('views') }}
          </th>
          <th class="col-date" @click="emit('toggle-sort', 'published_at')">
            Fecha {{ getSortIcon('published_at') }}
          </th>
          <th class="col-seo">SEO</th>
          <th class="col-actions">{{ $t('common.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="sortedNews.length === 0">
          <td colspan="7" class="empty-state">
            <div class="empty-content">
              <span class="empty-icon">&#x1F4F0;</span>
              <p>{{ $t('common.noResults') }}</p>
              <NuxtLink
                v-if="!hasActiveFilters"
                to="/admin/noticias/nuevo"
                class="btn btn-primary btn-sm"
              >
                {{ $t('admin.noticias.createFirst') }}
              </NuxtLink>
            </div>
          </td>
        </tr>
        <tr
          v-for="item in sortedNews"
          :key="item.id"
          class="news-row"
          @click="emit('navigate', item.id)"
        >
          <td class="col-title">
            <div class="title-cell">
              <strong class="news-title">{{ item.title_es }}</strong>
              <span class="slug-text">/noticias/{{ item.slug }}</span>
            </div>
          </td>
          <td class="col-category">
            <span class="cat-pill" :class="'cat-' + item.category">
              {{ categoryLabels[item.category] || item.category }}
            </span>
          </td>
          <td class="col-status" @click.stop>
            <select
              :value="item.status"
              class="status-select"
              :class="'status-' + item.status"
              @change="emit('status-change', item, $event)"
            >
              <option value="draft">{{ $t('common.draft') }}</option>
              <option value="published">{{ $t('common.published') }}</option>
              <option value="archived">{{ $t('common.archived') }}</option>
            </select>
          </td>
          <td class="col-views">{{ item.views || 0 }}</td>
          <td class="col-date">{{ formatDate(item.published_at || item.created_at) }}</td>
          <td class="col-seo" @click.stop>
            <span class="seo-badge" :class="'seo-' + getSeoScore(item).level">
              {{ getSeoScore(item).score }}
            </span>
          </td>
          <td class="col-actions" @click.stop>
            <div class="action-btns">
              <NuxtLink :to="`/admin/noticias/${item.id}`" class="action-btn" title="Editar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </NuxtLink>
              <a
                :href="`/noticias/${item.slug}`"
                target="_blank"
                class="action-btn"
                title="Ver en web"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
              <button
                class="action-btn action-delete"
                title="Eliminar"
                @click="emit('delete', item)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path
                    d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                  />
                </svg>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-container {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-card);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table thead th {
  background: var(--bg-secondary);
  padding: 0.625rem var(--spacing-3);
  text-align: left;
  font-weight: 600;
  color: var(--text-auxiliary);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--color-gray-200);
  white-space: nowrap;
  cursor: default;
  user-select: none;
}

.data-table thead th:first-child {
  padding-left: var(--spacing-4);
}

.col-title {
  min-width: 15.625rem;
  cursor: pointer !important;
}
.col-category {
  width: 6.25rem;
}
.col-status {
  width: 7.5rem;
}
.col-views {
  width: 5rem;
  text-align: center;
}
.col-date {
  width: 7.5rem;
  cursor: pointer !important;
}
.col-seo {
  width: 3.75rem;
  text-align: center;
}
.col-actions {
  width: 6.875rem;
}

.data-table tbody td {
  padding: var(--spacing-3);
  border-bottom: 1px solid var(--color-gray-100);
  vertical-align: middle;
}

.data-table tbody td:first-child {
  padding-left: var(--spacing-4);
}

.news-row {
  cursor: pointer;
  transition: background 0.15s;
}

.news-row:hover {
  background: var(--bg-secondary);
}

/* Title cell */
.title-cell {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.news-title {
  font-weight: 500;
  color: var(--color-near-black);
  line-height: 1.3;
}

.slug-text {
  font-size: 0.7rem;
  color: var(--text-disabled);
  font-family: monospace;
}

/* Category pill */
.cat-pill {
  display: inline-block;
  padding: 0.125rem var(--spacing-2);
  border-radius: var(--border-radius-md);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.cat-prensa {
  background: var(--color-info-bg, var(--color-info-bg));
  color: var(--color-info);
}
.cat-eventos {
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning-text);
}
.cat-destacados {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--badge-success-bg);
}
.cat-general {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

/* Status select */
.status-select {
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius-sm);
  font-size: 0.8rem;
  cursor: pointer;
  background: var(--bg-primary);
}

.status-draft {
  color: var(--color-warning-text);
  border-color: var(--color-amber-400);
}
.status-published {
  color: var(--badge-success-bg);
  border-color: var(--color-success);
}
.status-archived {
  color: var(--text-auxiliary);
  border-color: var(--text-disabled);
}

/* SEO badge */
.seo-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 1.5rem;
  border-radius: var(--border-radius-md);
  font-size: 0.7rem;
  font-weight: 700;
}

.seo-good {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--badge-success-bg);
}
.seo-warning {
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning-text);
}
.seo-bad {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}

/* Actions */
.action-btns {
  display: flex;
  gap: var(--spacing-1);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--border-radius);
  color: var(--text-auxiliary);
  transition: all 0.15s;
  cursor: pointer;
  border: none;
  background: none;
  text-decoration: none;
}

.action-btn:hover {
  background: var(--bg-secondary);
  color: var(--color-near-black);
}
.action-btn svg {
  width: 1rem;
  height: 1rem;
}
.action-delete:hover {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 2.5rem 1.25rem !important;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
}

.empty-icon {
  font-size: 2rem;
}
.empty-content p {
  color: var(--text-auxiliary);
  margin: 0;
}

.btn {
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--color-gray-200);
  background: var(--bg-primary);
  color: var(--color-gray-700);
  transition: all 0.15s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.btn-primary:hover {
  opacity: 0.9;
}
.btn-sm {
  padding: var(--spacing-1) var(--spacing-3);
  font-size: 0.8rem;
}

(@media ()max-width: 47.9375em())) {
  .col-views,
  .col-seo,
  .col-date {
    display: none;
  }
}
</style>
