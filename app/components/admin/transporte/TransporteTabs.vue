<script setup lang="ts">
import type { TabFilter } from '~/composables/admin/useAdminTransporte'

defineProps<{
  activeTab: TabFilter
  tabCounts: Record<TabFilter, number>
}>()

const emit = defineEmits<{
  (e: 'update:activeTab', value: TabFilter): void
}>()

const { t } = useI18n()

const tabs: TabFilter[] = ['all', 'pending', 'inProgress', 'completed', 'cancelled']

function onTabClick(tab: TabFilter) {
  emit('update:activeTab', tab)
}
</script>

<template>
  <div class="tabs-row">
    <button
      v-for="tab in tabs"
      :key="tab"
      class="tab-btn"
      :class="{ active: activeTab === tab }"
      @click="onTabClick(tab)"
    >
      {{ t(`admin.transporte.${tab}`) }}
      <span class="tab-count">{{ tabCounts[tab] }}</span>
    </button>
  </div>
</template>

<style scoped>
.tabs-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 4px;
}

.tabs-row::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: 1px solid var(--color-gray-200);
  border-radius: 20px;
  background: var(--bg-primary);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-auxiliary);
  transition: all 0.15s;
  min-height: 44px;
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
