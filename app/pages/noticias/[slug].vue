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
      <p>{{ $t('news.notFound') }}</p>
      <NuxtLink to="/noticias" class="back-link">
        {{ $t('news.backToNews') }}
      </NuxtLink>
    </div>

    <!-- Article -->
    <template v-else>
      <div class="article-container">
        <UiBreadcrumbNav :items="breadcrumbItems" />

        <article class="article-content">
          <div class="article-meta">
            <span class="article-category">{{ article.category }}</span>
            <span v-if="article.published_at" class="article-date">
              {{ formatDate(article.published_at) }}
            </span>
          </div>

          <h1 class="article-title">{{ title }}</h1>

          <div v-if="article.image_url" class="article-image">
            <NuxtImg :src="article.image_url" :alt="title" width="800" height="450" fetchpriority="high" decoding="async" sizes="(max-width: 48rem) 100vw, 800px" />
          </div>

          <!-- Table of contents (auto-generated from headings) -->
          <UiArticleToc
            v-if="tocItems.length > 0"
            :toc-items="tocItems"
            :active-id="activeId"
            :scroll-to-heading="scrollToHeading"
          />

          <!-- eslint-disable-next-line vue/no-v-html -->
          <div ref="articleBodyRef" class="article-body" v-html="sanitizedContent" />

          <div v-if="article.hashtags?.length" class="article-tags">
            <span v-for="tag in article.hashtags" :key="tag" class="tag"> #{{ tag }} </span>
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
import { fetchTranslation } from '~/composables/useLocalized'

const route = useRoute()
const { locale, t } = useI18n()
const { fetchBySlug } = useNews()
const { sanitize } = useSanitize()
const { tocItems, activeId, buildToc, scrollToHeading } = useTableOfContents()

const articleBodyRef = ref<HTMLElement | null>(null)

// Fetch at setup level so SSR can render SEO meta
const { data: article, status } = await useAsyncData(`news-${route.params.slug}`, () =>
  fetchBySlug(route.params.slug as string),
)

const loading = computed(() => status.value === 'pending')

// Column-based getters for es/en (primary languages)
function getColumnTitle(): string {
  if (!article.value) return ''
  if (locale.value === 'en' && article.value.title_en) return article.value.title_en
  return article.value.title_es
}

function getColumnContent(): string {
  if (!article.value) return ''
  if (locale.value === 'en' && article.value.content_en) return article.value.content_en
  return article.value.content_es
}

function getColumnMetaDesc(): string {
  if (!article.value) return ''
  if (locale.value === 'en' && article.value.description_en) return article.value.description_en
  if (article.value.description_es) return article.value.description_es
  return getColumnTitle()
}

// Refs initialized with column data for SSR compatibility
const title = ref<string>(getColumnTitle())
const content = ref<string>(getColumnContent())
const metaDesc = ref<string>(getColumnMetaDesc())

// Watch locale changes to fetch translations for non-primary locales
watch(
  [locale, () => article.value?.id],
  async ([newLocale, articleId]) => {
    if (!article.value) {
      title.value = ''
      content.value = ''
      metaDesc.value = ''
      return
    }
    // Primary languages: read directly from columns
    if (newLocale === 'es' || newLocale === 'en') {
      title.value = getColumnTitle()
      content.value = getColumnContent()
      metaDesc.value = getColumnMetaDesc()
      return
    }
    // Other locales: fetch all 3 fields in parallel from content_translations
    const id = String(articleId)
    const [translatedTitle, translatedContent, translatedDesc] = await Promise.all([
      fetchTranslation('article', id, 'title', newLocale),
      fetchTranslation('article', id, 'content', newLocale),
      fetchTranslation('article', id, 'description', newLocale),
    ])
    title.value = translatedTitle || getColumnTitle()
    content.value = translatedContent || getColumnContent()
    metaDesc.value = translatedDesc || getColumnMetaDesc()
  },
  { immediate: true },
)

const breadcrumbItems = computed(() => {
  if (!article.value) return []
  return [
    { label: t('nav.home'), to: '/' },
    { label: t('news.title'), to: '/noticias' },
    { label: title.value },
  ]
})

const shareText = computed(() => {
  if (!article.value) return ''
  const parts = [title.value]
  if (import.meta.client) parts.push(globalThis.location.href)
  parts.push(`- ${t('site.title')}`)
  return parts.join(' - ')
})

// SEO meta at setup level — works during SSR
if (article.value) {
  const seoTitle = `${title.value} — ${t('site.title')}`
  const articleSlug = route.params.slug as string

  // Build enhanced NewsArticle JSON-LD
  const articleJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title.value,
    description: metaDesc.value || undefined,
    image: article.value.image_url || undefined,
    datePublished: article.value.published_at || article.value.created_at,
    dateModified: article.value.updated_at,
    author: {
      '@type': 'Organization',
      name: t('site.title'),
      url: 'https://tracciona.com',
    },
    publisher: {
      '@type': 'Organization',
      name: t('site.title'),
      url: 'https://tracciona.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://tracciona.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://tracciona.com/noticias/${articleSlug}`,
    },
  }

  usePageSeo({
    title: seoTitle,
    description: metaDesc.value,
    image: article.value.image_url || undefined,
    type: 'article',
    path: `/noticias/${articleSlug}`,
    jsonLd: articleJsonLd,
  })

  // Build FAQ JSON-LD from faq_schema JSONB column (if present)
  const faqData = (article.value as unknown as Record<string, unknown>)?.faq_schema as
    | Array<{ question: string; answer: string }>
    | null
    | undefined

  const faqJsonLd =
    faqData != null && faqData.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqData.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        }
      : null

  // Breadcrumb JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('site.title'), item: 'https://tracciona.com' },
      {
        '@type': 'ListItem',
        position: 2,
        name: t('news.title'),
        item: 'https://tracciona.com/noticias',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: title.value,
        item: `https://tracciona.com/noticias/${articleSlug}`,
      },
    ],
  }

  // Inject BreadcrumbList + optional FAQ JSON-LD
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify(breadcrumbJsonLd),
      },
      ...(faqJsonLd
        ? [
            {
              type: 'application/ld+json',
              innerHTML: JSON.stringify(faqJsonLd),
            },
          ]
        : []),
    ],
  })
}

const sanitizedContent = computed(() => sanitize(content.value))

// Rebuild TOC whenever content changes (client-side only)
if (import.meta.client) {
  watch(
    sanitizedContent,
    () => {
      nextTick(() => buildToc(articleBodyRef.value))
    },
    { immediate: false },
  )
  onMounted(() => nextTick(() => buildToc(articleBodyRef.value)))
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString(locale.value === 'en' ? 'en-GB' : 'es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<style scoped>
.article-page {
  max-width: 50rem;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
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
  border-radius: var(--border-radius-md);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-line {
  height: 1.125rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-sm);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-line.wide {
  width: 80%;
}
.skeleton-line.medium {
  width: 55%;
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
  gap: var(--spacing-3);
  margin-bottom: 1rem;
}

.article-category {
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius-md);
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
  border-radius: var(--border-radius-md);
  overflow: hidden;
  aspect-ratio: 16 / 9;
  background: var(--bg-secondary, var(--color-skeleton-bg));
}

.article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.article-body {
  font-size: 1rem;
  line-height: 1.8;
  color: var(--text-secondary);
  white-space: pre-line;
  max-width: 65ch;
}

/* Tags */
.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color-light, #eee);
}

.tag {
  font-size: 0.8rem;
  color: var(--color-primary);
  background: rgba(35, 66, 74, 0.08);
  padding: var(--spacing-1) 0.625rem;
  border-radius: var(--border-radius-md);
}

/* Share */
.article-share {
  display: flex;
  gap: var(--spacing-3);
  margin-top: 2rem;
}

.share-btn {
  padding: 0.625rem var(--spacing-5);
  border-radius: var(--border-radius);
  font-size: 0.85rem;
  font-weight: 500;
  text-decoration: none;
  min-height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
}

.share-btn:hover {
  opacity: 0.9;
}

.share-whatsapp {
  background: var(--color-whatsapp);
  color: #052e16;
}

.share-email {
  background: var(--color-primary);
  color: white;
}

@media (min-width: 48em) {
  .article-title {
    font-size: 2rem;
  }

  .article-page {
    padding: 2rem 1.5rem 4rem;
  }
}
</style>
