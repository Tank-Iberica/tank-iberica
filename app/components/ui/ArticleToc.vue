<template>
  <nav
    v-if="tocItems.length > 0"
    class="article-toc"
    :aria-label="$t('article.tocLabel')"
  >
    <p class="toc-title">{{ $t('article.tocTitle') }}</p>
    <ol class="toc-list">
      <li
        v-for="item in tocItems"
        :key="item.id"
        :class="['toc-item', `toc-level-${item.level}`, { 'toc-item--active': activeId === item.id }]"
      >
        <a
          :href="`#${item.id}`"
          class="toc-link"
          :aria-current="activeId === item.id ? 'true' : undefined"
          @click.prevent="scrollToHeading(item.id)"
        >
          {{ item.text }}
        </a>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import type { TocItem } from '~/composables/useTableOfContents'

defineProps<{
  tocItems: TocItem[]
  activeId: string
  scrollToHeading: (id: string) => void
}>()
</script>

<style scoped>
.article-toc {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
}

.toc-title {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-auxiliary);
  margin: 0 0 0.75rem;
}

.toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.toc-item {
  line-height: 1.4;
}

.toc-level-3 { padding-left: 1rem; }
.toc-level-4 { padding-left: 2rem; }

.toc-link {
  display: block;
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-decoration: none;
  padding: 0.2rem 0;
  border-left: 2px solid transparent;
  padding-left: 0.5rem;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}

.toc-link:hover,
.toc-link:focus-visible {
  color: var(--color-primary);
  outline: none;
}

.toc-link:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
  border-radius: 2px;
}

.toc-item--active .toc-link {
  color: var(--color-primary);
  border-left-color: var(--color-primary);
  font-weight: 500;
}

@media (min-width: 1024px) {
  .article-toc {
    position: sticky;
    top: 5rem;
    max-height: calc(100vh - 6rem);
    overflow-y: auto;
    margin-bottom: 0;
  }
}
</style>
