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

defineProps<{
  items: BreadcrumbItem[]
}>()
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
  gap: 4px;
  flex-wrap: nowrap;
  white-space: nowrap;
  font-size: 0.85rem;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.breadcrumb-link {
  color: var(--color-primary);
  text-decoration: none;
  min-height: 44px;
  display: flex;
  align-items: center;
  font-weight: 500;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-current {
  color: var(--text-auxiliary, #9ca3af);
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.breadcrumb-separator {
  color: var(--text-auxiliary, #9ca3af);
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .breadcrumb-current {
    max-width: none;
  }
}
</style>
