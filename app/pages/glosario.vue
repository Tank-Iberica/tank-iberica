<script setup lang="ts">
import { useGlossary } from '~/composables/useGlossary'
import { localizedField } from '~/composables/useLocalized'

definePageMeta({ layout: 'default' })

const { t, locale } = useI18n()
const {
  loading,
  error,
  searchQuery,
  selectedCategory,
  categories,
  filteredTerms,
  groupedByLetter,
  fetchTerms,
} = useGlossary()

await fetchTerms()

// --- SEO with JSON-LD DefinedTermSet ---
const SITE_URL = useSiteUrl()

const jsonLdTerms = computed(() =>
  filteredTerms.value.map((term) => ({
    '@type': 'DefinedTerm',
    name: localizedField(term.term, locale.value),
    description: localizedField(term.definition, locale.value),
    url: `${SITE_URL}/glosario#term-${term.slug}`,
    inDefinedTermSet: `${SITE_URL}/glosario`,
  })),
)

usePageSeo({
  title: t('glossary.title'),
  description: t('glossary.seoDescription'),
  path: '/glosario',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: t('glossary.title'),
    description: t('glossary.seoDescription'),
    url: `${SITE_URL}/glosario`,
    inLanguage: locale.value,
    hasDefinedTerm: jsonLdTerms.value,
  },
})
</script>

<template>
  <div class="glossary-page">
    <UiBreadcrumbNav
      :items="[{ label: $t('nav.home'), to: '/' }, { label: $t('glossary.title') }]"
    />

    <header class="glossary-header">
      <h1>{{ t('glossary.title') }}</h1>
      <p class="glossary-subtitle">{{ t('glossary.subtitle') }}</p>
    </header>

    <!-- Search & Filter -->
    <div class="glossary-controls">
      <label for="glossary-search" class="sr-only">{{ t('glossary.searchPlaceholder') }}</label>
      <input
        id="glossary-search"
        v-model="searchQuery"
        type="search"
        :placeholder="t('glossary.searchPlaceholder')"
        class="glossary-search"
        autocomplete="off"
      >
      <label for="glossary-category" class="sr-only">{{ t('glossary.allCategories') }}</label>
      <select id="glossary-category" v-model="selectedCategory" class="glossary-category-select">
        <option :value="null">{{ t('glossary.allCategories') }}</option>
        <option v-for="cat in categories" :key="cat" :value="cat">
          {{ cat }}
        </option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="glossary-loading">
      <p>{{ t('common.loading') }}...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="glossary-error">
      <p>{{ error }}</p>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredTerms.length === 0" class="glossary-empty">
      <p>{{ t('glossary.noResults') }}</p>
    </div>

    <!-- Terms grouped by letter -->
    <div v-else class="glossary-content">
      <!-- Letter navigation -->
      <nav class="glossary-letters" aria-label="Glossary alphabetical navigation">
        <a
          v-for="letter in Object.keys(groupedByLetter).sort()"
          :key="letter"
          :href="`#letter-${letter}`"
          class="glossary-letter-link"
        >
          {{ letter }}
        </a>
      </nav>

      <!-- Term groups -->
      <section
        v-for="(group, letter) in groupedByLetter"
        :id="`letter-${letter}`"
        :key="letter"
        class="glossary-group"
      >
        <h2 class="glossary-group-letter">{{ letter }}</h2>
        <dl class="glossary-terms">
          <div
            v-for="term in group"
            :id="`term-${term.slug}`"
            :key="term.id"
            class="glossary-term-item"
          >
            <dt class="glossary-term-name">
              {{ localizedField(term.term, locale) }}
              <span v-if="term.category" class="glossary-term-category">
                {{ term.category }}
              </span>
            </dt>
            <dd class="glossary-term-definition">
              {{ localizedField(term.definition, locale) }}
            </dd>
            <dd v-if="term.related_terms.length" class="glossary-related">
              <span class="glossary-related-label">{{ t('glossary.relatedTerms') }}:</span>
              <span v-for="(rel, i) in term.related_terms" :key="rel">
                <a :href="`#term-${rel}`" class="glossary-related-link">{{ rel }}</a>
                <span v-if="i < term.related_terms.length - 1">, </span>
              </span>
            </dd>
          </div>
        </dl>
      </section>
    </div>
  </div>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.glossary-page {
  max-width: 52rem;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

.glossary-header {
  margin-bottom: 1.5rem;
}

.glossary-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.25rem;
}

.glossary-subtitle {
  color: var(--text-secondary);
  margin: 0;
}

.glossary-controls {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.glossary-search {
  flex: 1;
  min-width: 12rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.glossary-category-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.glossary-letters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  background: var(--bg-secondary, #f9fafb);
  border-radius: 0.5rem;
}

.glossary-letter-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.25rem;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-primary, #23424a);
  text-decoration: none;
  transition: background 0.15s;
}

.glossary-letter-link:hover,
.glossary-letter-link:focus {
  background: var(--color-primary, #23424a);
  color: white;
}

.glossary-group {
  margin-bottom: 2rem;
  scroll-margin-top: var(--header-offset, 5rem);
}

.glossary-group-letter {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
  border-bottom: 2px solid var(--color-primary, #23424a);
  padding-bottom: 0.25rem;
  margin-bottom: 1rem;
}

.glossary-terms {
  margin: 0;
  padding: 0;
}

.glossary-term-item {
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  scroll-margin-top: var(--header-offset, 5rem);
}

.glossary-term-item:last-child {
  border-bottom: none;
}

.glossary-term-name {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.glossary-term-category {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 400;
  padding: 0.125rem 0.5rem;
  background: var(--bg-secondary, #f3f4f6);
  border-radius: 1rem;
  color: var(--text-secondary);
  margin-left: 0.5rem;
  vertical-align: middle;
}

.glossary-term-definition {
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
}

.glossary-related {
  margin-top: 0.25rem;
  font-size: 0.8125rem;
}

.glossary-related-label {
  color: var(--text-tertiary, #9ca3af);
  font-style: italic;
}

.glossary-related-link {
  color: var(--color-primary, #23424a);
}

.glossary-loading,
.glossary-empty,
.glossary-error {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-secondary);
}

@media (min-width: 30em) {
  .glossary-page {
    padding: 2rem 1.5rem;
  }

  .glossary-header h1 {
    font-size: 2rem;
  }

  .glossary-letter-link {
    width: 2rem;
    height: 2rem;
  }
}
</style>
