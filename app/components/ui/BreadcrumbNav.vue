<template>
  <nav aria-label="Breadcrumb" class="breadcrumb-nav">
    <ol class="breadcrumb-list">
      <li v-for="(item, index) in items" :key="index" class="breadcrumb-item">
        <NuxtLink v-if="item.to" :to="item.to" class="breadcrumb-link">
          {{ item.label }}
        </NuxtLink>
        <span v-else class="breadcrumb-current" aria-current="page">
          {{ item.label }}
        </span>
        <svg
          v-if="index < items.length - 1"
          class="breadcrumb-separator"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
interface BreadcrumbItem {
  label: string
  to?: string
}

const props = defineProps<{
  items: BreadcrumbItem[]
  /** Set to true to skip JSON-LD (e.g. when the page injects its own BreadcrumbList) */
  noSchema?: boolean
}>()

// Auto-emit BreadcrumbList JSON-LD unless noSchema is set
if (!props.noSchema && props.items.length) {
  const siteUrl = useSiteUrl()
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: props.items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.label,
            ...(item.to ? { item: `${siteUrl}${item.to}` } : {}),
          })),
        }),
      },
    ],
  })
}
</script>

<style scoped>
.breadcrumb-nav {
  padding: 0.5rem 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 0.25rem;
  flex-wrap: nowrap;
  white-space: nowrap;
  font-size: var(--font-size-base);
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.breadcrumb-link {
  color: var(--color-primary);
  text-decoration: none;
  min-height: 2.75rem;
  display: flex;
  align-items: center;
  font-weight: 500;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-current {
  color: var(--text-auxiliary, var(--color-gray-400));
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 12.5rem;
}

.breadcrumb-separator {
  color: var(--text-auxiliary, var(--color-gray-400));
  flex-shrink: 0;
}

@media (min-width: 48em) {
  .breadcrumb-current {
    max-width: none;
  }
}
</style>
