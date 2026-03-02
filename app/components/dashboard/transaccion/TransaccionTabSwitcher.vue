<script setup lang="ts">
import type { TabKey } from '~/composables/dashboard/useDashboardTransaccion'

const { t } = useI18n()

defineProps<{
  activeTab: TabKey
}>()

const emit = defineEmits<{
  (e: 'select', tab: TabKey): void
}>()
</script>

<template>
  <div class="tab-switcher">
    <button
      type="button"
      class="tab-btn"
      :class="{ active: activeTab === 'rent' }"
      @click="emit('select', 'rent')"
    >
      {{ t('dashboard.transaction.tabs.rent') }}
    </button>
    <button
      type="button"
      class="tab-btn"
      :class="{ active: activeTab === 'sell' }"
      @click="emit('select', 'sell')"
    >
      {{ t('dashboard.transaction.tabs.sell') }}
    </button>
  </div>
</template>

<style scoped>
.tab-switcher {
  display: flex;
  gap: 0;
  background: var(--bg-secondary);
  border-radius: 10px;
  padding: 4px;
}

.tab-btn {
  flex: 1;
  min-height: 44px;
  padding: 10px 16px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-auxiliary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: var(--bg-primary);
  color: var(--color-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
