<script setup lang="ts">
import type { TabFilter } from '~/composables/admin/useAdminCaptacion'

defineProps<{
  activeTab: TabFilter
  tabCounts: Record<TabFilter, number>
  hasSelection: boolean
  selectedCount: number
  bulkProcessing: boolean
}>()

const emit = defineEmits<{
  'update:activeTab': [value: TabFilter]
  bulkMarkContacted: []
}>()

const { t } = useI18n()

const tabs: TabFilter[] = [
  'all',
  'new',
  'contacted',
  'interested',
  'onboarding',
  'active',
  'rejected',
]
</script>

<template>
  <div class="tabs-row">
    <button
      v-for="tab in tabs"
      :key="tab"
      class="tab-btn"
      :class="{ active: activeTab === tab }"
      @click="emit('update:activeTab', tab)"
    >
      {{ t(`admin.captacion.${tab}`) }}
      <span class="tab-count">{{ tabCounts[tab] }}</span>
    </button>
  </div>

  <!-- Bulk actions bar -->
  <div v-if="hasSelection" class="bulk-bar">
    <span class="bulk-count">{{
      t('admin.captacion.selectedCount', { count: selectedCount })
    }}</span>
    <button class="btn-bulk" :disabled="bulkProcessing" @click="emit('bulkMarkContacted')">
      {{ t('admin.captacion.bulkContact') }}
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

.bulk-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: 0.625rem var(--spacing-4);
  background: var(--color-blue-50);
  border: 1px solid var(--color-info-border);
  border-radius: var(--border-radius);
}

.bulk-count {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-info);
}

.btn-bulk {
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--color-focus);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 2.75rem;
  white-space: nowrap;
}

.btn-bulk:hover {
  background: var(--color-info);
}

.btn-bulk:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
