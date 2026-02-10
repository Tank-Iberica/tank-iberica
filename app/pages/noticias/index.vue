<template>
  <div class="news-page">
    <div class="news-container">
      <h1 class="news-title">{{ $t('news.title') }}</h1>

      <!-- Category filters -->
      <div class="news-categories">
        <button
          v-for="cat in categories"
          :key="cat.value"
          :class="['category-btn', { active: activeCategory === cat.value }]"
          @click="selectCategory(cat.value)"
        >
          {{ $t(cat.label) }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="news-loading">
        <div v-for="i in 6" :key="i" class="skeleton-card">
          <div class="skeleton-img" />
          <div class="skeleton-text">
            <div class="skeleton-line wide" />
            <div class="skeleton-line medium" />
          </div>
        </div>
      </div>

      <!-- No results -->
      <div v-else-if="news.length === 0" class="news-empty">
        <p>{{ $t('news.noResults') }}</p>
      </div>

      <!-- News grid -->
      <div v-else class="news-grid">
        <NuxtLink
          v-for="item in news"
          :key="item.id"
          :to="`/noticias/${item.slug}`"
          class="news-card"
        >
          <div class="news-card-image">
            <img
              v-if="item.image_url"
              :src="item.image_url"
              :alt="getTitle(item)"
              loading="lazy"
            >
            <div v-else class="news-card-placeholder">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
            <span class="news-card-category">{{ item.category }}</span>
          </div>
          <div class="news-card-content">
            <h2 class="news-card-title">{{ getTitle(item) }}</h2>
            <p v-if="item.published_at" class="news-card-date">
              {{ $t('news.publishedAt') }} {{ formatDate(item.published_at) }}
            </p>
          </div>
        </NuxtLink>
      </div>

      <!-- Load more -->
      <div v-if="hasMore && !loading" class="news-load-more">
        <button
          class="btn-load-more"
          :disabled="loadingMore"
          @click="handleLoadMore"
        >
          {{ loadingMore ? $t('common.loading') : $t('news.loadMore') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { News } from '~/composables/useNews'

const { locale, t } = useI18n()
const { news, loading, loadingMore, hasMore, fetchNews, fetchMore } = useNews()

const activeCategory = ref('')

const categories = [
  { value: '', label: 'news.allCategories' },
  { value: 'prensa', label: 'news.prensa' },
  { value: 'eventos', label: 'news.eventos' },
  { value: 'destacados', label: 'news.destacados' },
  { value: 'general', label: 'news.general' },
]

function getTitle(item: News): string {
  if (locale.value === 'en' && item.title_en) return item.title_en
  return item.title_es
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString(locale.value === 'en' ? 'en-GB' : 'es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function selectCategory(cat: string) {
  activeCategory.value = cat
  fetchNews(cat || undefined)
}

function handleLoadMore() {
  fetchMore(activeCategory.value || undefined)
}

usePageSeo({
  title: t('seo.newsTitle'),
  description: t('seo.newsDescription'),
  path: '/noticias',
})

onMounted(() => {
  fetchNews()
})
</script>

<style scoped>
.news-page {
  min-height: 60vh;
  padding: 1.5rem 0 3rem;
}

.news-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.news-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 1.5rem;
}

/* Categories */
.news-categories {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 1.5rem;
  -webkit-overflow-scrolling: touch;
}

.category-btn {
  padding: 8px 16px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 20px;
  background: white;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  min-height: 44px;
  transition: all 0.2s;
}

.category-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

/* Grid */
.news-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.news-card {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s, box-shadow 0.2s;
}

.news-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.news-card-image {
  position: relative;
  aspect-ratio: 16 / 9;
  background: var(--bg-secondary, #f5f5f5);
  overflow: hidden;
}

.news-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.news-card-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-auxiliary);
}

.news-card-category {
  position: absolute;
  top: 8px;
  left: 8px;
  background: var(--color-primary);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.news-card-content {
  padding: 1rem;
}

.news-card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
  margin-bottom: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-card-date {
  font-size: 0.8rem;
  color: var(--text-auxiliary);
}

/* Loading */
.news-loading {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.skeleton-card {
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.skeleton-img {
  aspect-ratio: 16 / 9;
  background: var(--bg-secondary);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-text {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 16px;
  background: var(--bg-secondary);
  border-radius: 4px;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-line.wide { width: 80%; }
.skeleton-line.medium { width: 50%; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Empty */
.news-empty {
  text-align: center;
  padding: 3rem 0;
  color: var(--text-auxiliary);
}

/* Load more */
.news-load-more {
  text-align: center;
  margin-top: 2rem;
}

.btn-load-more {
  padding: 12px 32px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
  transition: opacity 0.2s;
}

.btn-load-more:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-load-more:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Tablet */
@media (min-width: 480px) {
  .news-grid,
  .news-loading {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 768px) {
  .news-title {
    font-size: 1.75rem;
  }

  .news-grid,
  .news-loading {
    grid-template-columns: repeat(3, 1fr);
  }

  .news-card-title {
    font-size: 1.05rem;
  }
}

@media (min-width: 1024px) {
  .news-container {
    padding: 0 2rem;
  }
}
</style>
