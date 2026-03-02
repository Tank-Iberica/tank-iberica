<template>
  <div class="guides-page">
    <div class="guides-container">
      <h1 class="guides-title">{{ $t('guide.title') }}</h1>
      <p class="guides-subtitle">{{ $t('guide.subtitle') }}</p>

      <!-- Category filters -->
      <div class="guides-categories">
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
      <div v-if="loading" class="guides-loading">
        <div v-for="i in 6" :key="i" class="skeleton-card">
          <div class="skeleton-img" />
          <div class="skeleton-text">
            <div class="skeleton-line wide" />
            <div class="skeleton-line medium" />
          </div>
        </div>
      </div>

      <!-- No results -->
      <div v-else-if="guides.length === 0" class="guides-empty">
        <p>{{ $t('guide.noResults') }}</p>
      </div>

      <!-- Guides grid -->
      <div v-else class="guides-grid">
        <NuxtLink
          v-for="item in guides"
          :key="item.id"
          :to="`/guia/${item.slug}`"
          class="guide-card"
        >
          <div class="guide-card-image">
            <img v-if="item.image_url" :src="item.image_url" :alt="getTitle(item)" loading="lazy" />
            <div v-else class="guide-card-placeholder">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
            </div>
            <span v-if="item.category" class="guide-card-category">{{
              $t(`guide.${item.category}`)
            }}</span>
          </div>
          <div class="guide-card-content">
            <h2 class="guide-card-title">{{ getTitle(item) }}</h2>
            <p v-if="getDescription(item)" class="guide-card-desc">{{ getDescription(item) }}</p>
            <p v-if="item.published_at" class="guide-card-date">
              {{ formatDate(item.published_at) }}
            </p>
          </div>
        </NuxtLink>
      </div>

      <!-- Load more -->
      <div v-if="hasMore && !loading" class="guides-load-more">
        <button class="btn-load-more" :disabled="loadingMore" @click="handleLoadMore">
          {{ loadingMore ? $t('common.loading') : $t('guide.loadMore') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface GuideItem {
  id: string
  slug: string | null
  title_es: string | null
  title_en: string | null
  description_es: string | null
  description_en: string | null
  image_url: string | null
  published_at: string | null
  category: string | null
}

const { locale, t } = useI18n()
const supabase = useSupabaseClient()

const guides = ref<GuideItem[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const page = ref(0)
const total = ref(0)
const activeCategory = ref('')
const PAGE_SIZE = 12

const categories = [
  { value: '', label: 'guide.allGuides' },
  { value: 'normativa', label: 'guide.normativa' },
  { value: 'comparativas', label: 'guide.comparativas' },
  { value: 'compra', label: 'guide.compra' },
]

function getTitle(item: GuideItem): string {
  if (locale.value === 'en' && item.title_en) return item.title_en
  return item.title_es || ''
}

function getDescription(item: GuideItem): string {
  if (locale.value === 'en' && item.description_en) return item.description_en
  return item.description_es || ''
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString(locale.value === 'en' ? 'en-GB' : 'es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildQuery(category?: string): any {
  let query = supabase
    .from('news')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .eq('section', 'guia')
    .order('published_at', { ascending: false })

  if (category) {
    query = query.eq('category', category)
  }

  return query
}

async function fetchGuides(category?: string) {
  loading.value = true
  page.value = 0

  try {
    const { data, error, count } = await buildQuery(category).range(0, PAGE_SIZE - 1)
    if (error) throw error
    guides.value = (data as unknown as GuideItem[]) || []
    total.value = count || 0
    hasMore.value = guides.value.length < total.value
  } catch {
    guides.value = []
  } finally {
    loading.value = false
  }
}

async function handleLoadMore() {
  if (!hasMore.value || loadingMore.value) return
  loadingMore.value = true

  try {
    page.value++
    const from = page.value * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data, error } = await buildQuery(activeCategory.value || undefined).range(from, to)
    if (error) throw error
    const newItems = (data as unknown as GuideItem[]) || []
    guides.value = [...guides.value, ...newItems]
    hasMore.value = guides.value.length < total.value
  } catch {
    page.value--
  } finally {
    loadingMore.value = false
  }
}

function selectCategory(cat: string) {
  activeCategory.value = cat
  fetchGuides(cat || undefined)
}

usePageSeo({
  title: t('seo.guidesTitle'),
  description: t('seo.guidesDescription'),
  path: '/guia',
})

onMounted(() => {
  fetchGuides()
})
</script>

<style scoped>
.guides-page {
  min-height: 60vh;
  padding: 1.5rem 0 3rem;
}

.guides-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.guides-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.guides-subtitle {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

/* Categories */
.guides-categories {
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
  background: var(--bg-primary);
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
.guides-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.guide-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  text-decoration: none;
  color: inherit;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.guide-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.guide-card-image {
  position: relative;
  aspect-ratio: 16 / 9;
  background: var(--bg-secondary, #f5f5f5);
  overflow: hidden;
}

.guide-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.guide-card-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-auxiliary);
}

.guide-card-category {
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

.guide-card-content {
  padding: 1rem;
}

.guide-card-title {
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

.guide-card-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.guide-card-date {
  font-size: 0.8rem;
  color: var(--text-auxiliary);
}

/* Loading */
.guides-loading {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.skeleton-card {
  border-radius: 12px;
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
  gap: 8px;
}

.skeleton-line {
  height: 16px;
  background: var(--bg-secondary);
  border-radius: 4px;
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
.guides-empty {
  text-align: center;
  padding: 3rem 0;
  color: var(--text-auxiliary);
}

/* Load more */
.guides-load-more {
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
  .guides-grid,
  .guides-loading {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 768px) {
  .guides-title {
    font-size: 1.75rem;
  }

  .guides-grid,
  .guides-loading {
    grid-template-columns: repeat(3, 1fr);
  }

  .guide-card-title {
    font-size: 1.05rem;
  }
}

@media (min-width: 1024px) {
  .guides-container {
    padding: 0 2rem;
  }
}
</style>
