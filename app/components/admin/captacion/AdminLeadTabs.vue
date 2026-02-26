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
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  color: #64748b;
  transition: all 0.15s;
  min-height: 44px;
  white-space: nowrap;
  flex-shrink: 0;
}

.tab-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.tab-btn.active {
  background: var(--color-primary, #23424a);
  color: white;
  border-color: var(--color-primary, #23424a);
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
  gap: 12px;
  padding: 10px 16px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
}

.bulk-count {
  font-size: 0.85rem;
  font-weight: 500;
  color: #1d4ed8;
}

.btn-bulk {
  padding: 8px 16px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 44px;
  white-space: nowrap;
}

.btn-bulk:hover {
  background: #1d4ed8;
}

.btn-bulk:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
