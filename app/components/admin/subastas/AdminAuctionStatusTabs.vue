<script setup lang="ts">
import type { AuctionStatus } from '~/composables/useAuction'
import { STATUS_TABS } from '~/composables/admin/useAdminAuctionList'

defineProps<{
  activeTab: AuctionStatus | 'all'
}>()

const emit = defineEmits<{
  'update:activeTab': [value: AuctionStatus | 'all']
}>()

const { t } = useI18n()
</script>

<template>
  <div class="tabs-row">
    <button
      v-for="tab in STATUS_TABS"
      :key="tab.value"
      class="tab-btn"
      :class="{ active: activeTab === tab.value }"
      @click="emit('update:activeTab', tab.value)"
    >
      {{ t(tab.labelKey) }}
    </button>
  </div>
</template>

<style scoped>
.tabs-row {
  display: flex;
  gap: var(--spacing-1);
  background: var(--bg-primary);
  padding: 0.375rem;
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-btn {
  padding: 0.625rem 1.125rem;
  border: none;
  background: transparent;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-auxiliary);
  white-space: nowrap;
  min-height: 2.75rem;
  transition: all 0.15s;
}

.tab-btn:hover {
  background: var(--bg-secondary);
}

.tab-btn.active {
  background: var(--color-primary);
  color: white;
}
</style>
