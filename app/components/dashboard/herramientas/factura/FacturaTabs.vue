<script setup lang="ts">
defineProps<{
  activeTab: 'new' | 'history'
  historyCount: number
}>()

const emit = defineEmits<{
  change: [tab: 'new' | 'history']
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
  border-bottom: 0.125rem solid var(--color-gray-200);
  margin-bottom: 1.5rem;
}

.tool-tabs__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0.75rem 1.25rem;
  background: none;
  border: none;
  border-bottom: 0.125rem solid transparent;
  margin-bottom: -0.125rem;
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
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.375rem;
  background: var(--primary, var(--color-primary));
  color: white;
  border-radius: var(--border-radius-md);
  font-size: 0.7rem;
  font-weight: 600;
}
</style>
