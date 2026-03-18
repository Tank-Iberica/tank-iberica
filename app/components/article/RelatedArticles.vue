<template>
  <section v-if="articles.length" class="related-articles">
    <h3 class="related-articles-title">{{ $t('articles.relatedArticles', 'Artículos relacionados') }}</h3>
    <div class="related-articles-grid">
      <NuxtLink
        v-for="article in articles"
        :key="article.id"
        :to="`/noticias/${article.slug}`"
        class="related-article-card"
      >
        <NuxtImg
          v-if="article.cover_image_url"
          :src="article.cover_image_url!"
          :alt="localizedField(article, 'title', locale)"
          width="280"
          height="160"
          fit="cover"
          loading="lazy"
          decoding="async"
          format="webp"
          sizes="(max-width: 29.94em) 100vw, 33vw"
          class="related-article-img"
        />
        <div class="related-article-info">
          <span class="related-article-title">{{ localizedField(article, 'title', locale) }}</span>
          <span class="related-article-date">{{ formatDate(article.published_at) }}</span>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{
  /** Category keyword to match (e.g., brand name or subcategory) */
  keyword?: string
  /** Exclude this article ID (for article detail page) */
  excludeId?: string
  /** Max articles to show */
  limit?: number
}>()

interface RelatedArticle {
  id: string
  slug: string
  title: Record<string, string> | string
  cover_image_url: string | null
  published_at: string | null
}

const { locale } = useI18n()
const supabase = useSupabaseClient()
const articles = ref<RelatedArticle[]>([])

function localizedField(item: RelatedArticle, field: keyof RelatedArticle, loc: string): string {
  const val = item[field]
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    return (val as Record<string, string>)[loc] || (val as Record<string, string>).es || ''
  }
  return (val as string) || ''
}

function formatDate(dateStr: unknown): string {
  if (!dateStr || typeof dateStr !== 'string') return ''
  return new Date(dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

async function fetchArticles() {
  let query = supabase
    .from('articles')
    .select('id, slug, title, cover_image_url, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(props.limit || 3)

  if (props.excludeId) {
    query = query.neq('id', props.excludeId)
  }

  if (props.keyword) {
    query = query.contains('tags', [props.keyword])
  }

  const { data } = await query
  articles.value = (data as unknown as RelatedArticle[]) ?? []
}

onMounted(() => {
  fetchArticles()
})
</script>

<style scoped>
.related-articles {
  margin-top: var(--spacing-6);
  padding-top: var(--spacing-6);
  border-top: 1px solid var(--border-color-light);
}

.related-articles-title {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 var(--spacing-4);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.related-articles-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-3);
}

.related-article-card {
  display: flex;
  gap: var(--spacing-3);
  text-decoration: none;
  color: inherit;
  border-radius: var(--border-radius);
  overflow: hidden;
  border: 1px solid var(--border-color-light);
  transition: box-shadow var(--transition-fast);
}

.related-article-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.related-article-img {
  width: 5rem;
  height: 4rem;
  object-fit: cover;
  flex-shrink: 0;
}

.related-article-info {
  padding: var(--spacing-2) var(--spacing-2) var(--spacing-2) 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.related-article-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.related-article-date {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

@media (min-width: 48em) {
  .related-articles-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .related-article-card {
    flex-direction: column;
  }

  .related-article-img {
    width: 100%;
    height: 8rem;
  }

  .related-article-info {
    padding: var(--spacing-2) var(--spacing-3);
  }
}
</style>
