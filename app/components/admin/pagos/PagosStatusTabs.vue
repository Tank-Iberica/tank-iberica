<script setup lang="ts">
import type { StatusFilter, TabCounts } from '~/composables/admin/useAdminPagos'

const STATUS_TABS: StatusFilter[] = ['all', 'succeeded', 'pending', 'failed', 'refunded']

defineProps<{
  activeTab: StatusFilter
  tabCounts: TabCounts
}>()

const emit = defineEmits<{
  change: [tab: StatusFilter]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="tabs-row">
    <button
      v-for="tab in STATUS_TABS"
      :key="tab"
      class="tab-btn"
      :class="{ active: activeTab === tab }"
      @click="emit('change', tab)"
    >
      {{ t(`admin.pagos.tab.${tab}`) }}
      <span class="tab-count">{{ tabCounts[tab] }}</span>
    </button>
  </div>
</template>

<style scoped>
.tabs-row {
  display: flex;
  gap: var(--spacing-2);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: var(--spacing-1);
}

.tabs-row::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem var(--spacing-4);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius-full);
  background: var(--bg-primary);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-auxiliary);
  transition: all 0.15s;
  min-height: 2.75rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.tab-btn:hover {
  background: var(--bg-secondary);
  border-color: var(--color-gray-300);
}

.tab-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.tab-count {
  font-size: 0.75rem;
  opacity: 0.7;
}

.tab-btn.active .tab-count {
  opacity: 0.9;
}
</style>
