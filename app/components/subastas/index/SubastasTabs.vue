<template>
  <div class="auctions-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      :class="['tab-btn', { active: activeTab === tab.key }]"
      @click="$emit('select-tab', tab.key)"
    >
      {{ tab.label }}
      <span v-if="!loading" class="tab-badge">{{ auctionCount }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { SubastasTab } from '~/composables/useSubastasIndex'

defineProps<{
  activeTab: SubastasTab
  loading: boolean
  auctionCount: number
}>()

defineEmits<{
  'select-tab': [tab: SubastasTab]
}>()

const { t } = useI18n()

const tabs = computed(() => [
  { key: 'live' as const, label: t('auction.tabLive') },
  { key: 'scheduled' as const, label: t('auction.tabScheduled') },
  { key: 'ended' as const, label: t('auction.tabEnded') },
])
</script>

<style scoped>
.auctions-tabs {
  display: flex;
  gap: var(--spacing-2);
  overflow-x: auto;
  padding-bottom: var(--spacing-2);
  margin-bottom: var(--spacing-6);
  -webkit-overflow-scrolling: touch;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-full);
  background: var(--bg-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  white-space: nowrap;
  min-height: 44px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.tab-btn.active {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 var(--spacing-1);
  border-radius: var(--border-radius-full);
  background: rgba(0, 0, 0, 0.1);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  line-height: 1;
}

.tab-btn.active .tab-badge {
  background: rgba(255, 255, 255, 0.25);
  color: var(--color-white);
}
</style>
