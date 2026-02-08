<template>
  <div class="article-page">
    <!-- Loading -->
    <div v-if="loading" class="article-loading">
      <div class="skeleton-line wide" />
      <div class="skeleton-img" />
      <div class="skeleton-line wide" />
      <div class="skeleton-line medium" />
      <div class="skeleton-line wide" />
    </div>

    <!-- Not found -->
    <div v-else-if="!article" class="article-not-found">
      <p>{{ $t('news.noResults') }}</p>
      <NuxtLink to="/noticias" class="back-link">
        {{ $t('news.backToNews') }}
      </NuxtLink>
    </div>

    <!-- Article -->
    <template v-else>
      <div class="article-container">
        <NuxtLink to="/noticias" class="back-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {{ $t('news.backToNews') }}
        </NuxtLink>

        <article class="article-content">
          <div class="article-meta">
            <span class="article-category">{{ article.category }}</span>
            <span v-if="article.published_at" class="article-date">
              {{ formatDate(article.published_at) }}
            </span>
          </div>

          <h1 class="article-title">{{ title }}</h1>

          <div v-if="article.image_url" class="article-image">
            <img :src="article.image_url" :alt="title">
          </div>

          <div class="article-body">
            {{ content }}
          </div>

          <div v-if="article.hashtags?.length" class="article-tags">
            <span v-for="tag in article.hashtags" :key="tag" class="tag">
              #{{ tag }}
            </span>
          </div>

          <!-- Share -->
          <div class="article-share">
            <a
              :href="`https://wa.me/?text=${encodeURIComponent(shareText)}`"
              target="_blank"
              rel="noopener"
              class="share-btn share-whatsapp"
            >
              WhatsApp
            </a>
            <a
              :href="`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareText)}`"
              class="share-btn share-email"
            >
              {{ $t('vehicle.email') }}
            </a>
          </div>
        </article>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { News } from '~/composables/useNews'

const route = useRoute()
const { locale, t: _t } = useI18n()
const { fetchBySlug } = useNews()

const article = ref<News | null>(null)
const loading = ref(true)

const title = computed(() => {
  if (!article.value) return ''
  if (locale.value === 'en' && article.value.title_en) return article.value.title_en
  return article.value.title_es
})

const content = computed(() => {
  if (!article.value) return ''
  if (locale.value === 'en' && article.value.content_en) return article.value.content_en
  return article.value.content_es
})

const shareText = computed(() => {
  if (!article.value) return ''
  const parts = [title.value]
  if (import.meta.client) parts.push(window.location.href)
  parts.push('- Tank Iberica')
  return parts.join(' - ')
})

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString(locale.value === 'en' ? 'en-GB' : 'es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

onMounted(async () => {
  const slug = route.params.slug as string
  article.value = await fetchBySlug(slug)
  loading.value = false

  if (article.value) {
    const metaDesc = computed(() => {
      if (!article.value) return ''
      if (locale.value === 'en' && article.value.description_en) return article.value.description_en
      if (article.value.description_es) return article.value.description_es
      return title.value
    })

    useSeoMeta({
      title: `${title.value} — Tank Iberica`,
      description: metaDesc.value,
      ogTitle: `${title.value} — Tank Iberica`,
      ogDescription: metaDesc.value,
      ogImage: article.value.image_url || '',
      ogType: 'article',
    })
  }
})
</script>

<style scoped>
.article-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-primary);
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  min-height: 44px;
  margin-bottom: 1rem;
}

/* Loading */
.article-loading {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-img {
  aspect-ratio: 16 / 9;
  background: var(--bg-secondary);
  border-radius: 12px;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-line {
  height: 18px;
  background: var(--bg-secondary);
  border-radius: 4px;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-line.wide { width: 80%; }
.skeleton-line.medium { width: 55%; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Not found */
.article-not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  gap: 1rem;
  color: var(--text-auxiliary);
}

/* Article */
.article-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1rem;
}

.article-category {
  background: var(--color-primary);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.article-date {
  font-size: 0.85rem;
  color: var(--text-auxiliary);
}

.article-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
  margin-bottom: 1.5rem;
}

.article-image {
  margin-bottom: 1.5rem;
  border-radius: 12px;
  overflow: hidden;
}

.article-image img {
  width: 100%;
  height: auto;
  display: block;
}

.article-body {
  font-size: 1rem;
  line-height: 1.8;
  color: var(--text-secondary);
  white-space: pre-line;
}

/* Tags */
.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color-light, #eee);
}

.tag {
  font-size: 0.8rem;
  color: var(--color-primary);
  background: rgba(35, 66, 74, 0.08);
  padding: 4px 10px;
  border-radius: 12px;
}

/* Share */
.article-share {
  display: flex;
  gap: 12px;
  margin-top: 2rem;
}

.share-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  text-decoration: none;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
}

.share-btn:hover {
  opacity: 0.9;
}

.share-whatsapp {
  background: #25D366;
  color: white;
}

.share-email {
  background: var(--color-primary);
  color: white;
}

@media (min-width: 768px) {
  .article-title {
    font-size: 2rem;
  }

  .article-page {
    padding: 2rem 1.5rem 4rem;
  }
}
</style>
