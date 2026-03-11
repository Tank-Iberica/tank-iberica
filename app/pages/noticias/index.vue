<template>
  <div class="news-page">
    <div class="news-container">
      <UiBreadcrumbNav :items="[{ label: $t('nav.home'), to: '/' }, { label: $t('news.title') }]" />
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
        <p class="news-empty-title">{{ $t('news.noResults') }}</p>
        <p class="news-empty-hint">{{ $t('news.noResultsHint') }}</p>
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
            <NuxtImg v-if="item.image_url" :src="item.image_url" :alt="getTitle(item)" loading="lazy" width="400" height="225" decoding="async" sizes="(max-width: 48rem) 100vw, 400px" />
            <div v-else class="news-card-placeholder">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
            <span class="news-card-category">{{ $t(`news.${item.category}`) }}</span>
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
        <button class="btn-load-more" :disabled="loadingMore" @click="handleLoadMore">
          {{ loadingMore ? $t('common.loading') : $t('news.loadMore') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { News } from '~/composables/useNews'

const { locale, t } = useI18n()
const supabase = useSupabaseClient()
const { news, loading, loadingMore, hasMore, total, fetchNews, fetchMore } = useNews()

const activeCategory = ref('')

const categories = [
  { value: '', label: 'news.allCategories' },
  { value: 'prensa', label: 'news.prensa' },
  { value: 'eventos', label: 'news.eventos' },
  { value: 'destacados', label: 'news.destacados' },
  { value: 'general', label: 'news.general' },
]

// SSR-compatible initial load — data arrives in HTML, no client-only flash
const { data: ssrNews } = await useAsyncData('news-index', async () => {
  const { data, count } = await supabase
    .from('news')
    .select('id, title_es, title_en, slug, category, image_url, description_es, description_en, content_es, content_en, hashtags, views, status, published_at, created_at, updated_at', { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(0, 11)
  return { items: data || [], count: count || 0 }
})

news.value = (ssrNews.value?.items as News[]) || []
total.value = ssrNews.value?.count || 0
hasMore.value = news.value.length < total.value

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
</script>

<style scoped>
.news-page {
  min-height: 60vh;
  padding: 1.5rem 0 3rem;
}

.news-container {
  max-width: 75rem;
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
  gap: var(--spacing-2);
  overflow-x: auto;
  padding-bottom: var(--spacing-2);
  margin-bottom: 1.5rem;
  -webkit-overflow-scrolling: touch;
}

.category-btn {
  padding: var(--spacing-2) var(--spacing-4);
  border: 1px solid var(--border-color, var(--color-gray-200));
  border-radius: var(--border-radius-full);
  background: var(--bg-primary);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  min-height: 2.75rem;
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
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  text-decoration: none;
  color: inherit;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.news-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.news-card-image {
  position: relative;
  aspect-ratio: 16 / 9;
  background: var(--bg-secondary, var(--color-skeleton-bg));
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
  top: 0.5rem;
  left: 0.5rem;
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-1) 0.625rem;
  border-radius: var(--border-radius-md);
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
  border-radius: var(--border-radius-md);
  overflow: hidden;
  background: var(--bg-primary);
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
  gap: var(--spacing-2);
}

.skeleton-line {
  height: 1rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-sm);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-line.wide {
  width: 80%;
}
.skeleton-line.medium {
  width: 50%;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Empty */
.news-empty {
  text-align: center;
  padding: 3rem 0;
  color: var(--text-auxiliary);
}

.news-empty-title {
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.news-empty-hint {
  font-size: 0.875rem;
  color: var(--text-auxiliary);
}

/* Load more */
.news-load-more {
  text-align: center;
  margin-top: 2rem;
}

.btn-load-more {
  padding: var(--spacing-3) var(--spacing-8);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  min-height: 2.75rem;
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
@media (min-width: 30em) {
  .news-grid,
  .news-loading {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 48em) {
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

@media (min-width: 64em) {
  .news-container {
    padding: 0 2rem;
  }
}
</style>
