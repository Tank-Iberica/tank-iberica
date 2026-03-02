<script setup lang="ts">
defineProps<{
  activeTab: 'new' | 'history'
  historyCount: number
}>()

const emit = defineEmits<{
  (e: 'change', tab: 'new' | 'history'): void
}>()

const { t } = useI18n()
</script>

<template>
  <div class="tool-tabs">
    <button
      class="tool-tabs__btn"
      :class="{ 'tool-tabs__btn--active': activeTab === 'new' }"
      @click="emit('change', 'new')"
    >
      {{ t('dashboard.tools.invoice.tabNew') }}
    </button>
    <button
      class="tool-tabs__btn"
      :class="{ 'tool-tabs__btn--active': activeTab === 'history' }"
      @click="emit('change', 'history')"
    >
      {{ t('dashboard.tools.invoice.tabHistory') }}
      <span v-if="historyCount > 0" class="tool-tabs__badge">{{ historyCount }}</span>
    </button>
  </div>
</template>

<style scoped>
.tool-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--color-gray-200);
  margin-bottom: 1.5rem;
}

.tool-tabs__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0.75rem 1.25rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-auxiliary);
  cursor: pointer;
  transition:
    color 0.2s,
    border-color 0.2s;
}

.tool-tabs__btn:hover {
  color: var(--primary, var(--color-primary));
}

.tool-tabs__btn--active {
  color: var(--primary, var(--color-primary));
  border-bottom-color: var(--primary, var(--color-primary));
  font-weight: 600;
}

.tool-tabs__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--primary, var(--color-primary));
  color: white;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
}
</style>
