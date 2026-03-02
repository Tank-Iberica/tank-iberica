<script setup lang="ts">
import type { StatusFilter } from '~/composables/admin/useAdminWhatsApp'

defineProps<{
  statusFilter: StatusFilter
  search: string
  statusCounts: {
    all: number
    received: number
    processing: number
    processed: number
    published: number
    failed: number
  }
}>()

const emit = defineEmits<{
  'update:statusFilter': [value: StatusFilter]
  'update:search': [value: string]
  clearFilters: []
}>()

const { t } = useI18n()

const tabs: StatusFilter[] = ['all', 'received', 'processing', 'processed', 'published', 'failed']
</script>

<template>
  <div class="filters-bar">
    <div class="status-pills">
      <button
        v-for="tab in tabs"
        :key="tab"
        class="status-pill"
        :class="{ active: statusFilter === tab }"
        @click="emit('update:statusFilter', tab)"
      >
        {{ t(`admin.whatsapp.tabs.${tab}`) }}
        <span class="pill-count">{{ statusCounts[tab] }}</span>
      </button>
    </div>
    <div class="search-box">
      <span class="search-icon">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        :value="search"
        type="text"
        :placeholder="t('admin.whatsapp.searchPlaceholder')"
        @input="emit('update:search', ($event.target as HTMLInputElement).value)"
      >
      <button v-if="search" class="clear-btn" @click="emit('update:search', '')">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.filters-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.status-pills {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
  overflow-x: auto;
  min-width: max-content;
  -webkit-overflow-scrolling: touch;
}

.status-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border: 1px solid var(--color-gray-200);
  border-radius: 20px;
  background: var(--bg-primary);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-auxiliary);
  transition: all 0.15s;
  min-height: 44px;
  white-space: nowrap;
}

.status-pill:hover {
  background: var(--bg-secondary);
  border-color: var(--color-gray-300);
}

.status-pill.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.pill-count {
  font-size: 0.7rem;
  opacity: 0.7;
}

.status-pill.active .pill-count {
  opacity: 0.9;
}

.search-box {
  position: relative;
  width: 100%;
}

.search-box .search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-disabled);
  display: flex;
  align-items: center;
}

.search-box input {
  width: 100%;
  padding: 10px 36px 10px 38px;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-size: 0.9rem;
  min-height: 44px;
}

.search-box input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.search-box .clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--bg-tertiary);
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-auxiliary);
}

.search-box .clear-btn:hover {
  background: var(--bg-tertiary);
}

/* 768px+ */
@media (min-width: 768px) {
  .filters-bar {
    flex-direction: row;
    align-items: center;
  }

  .search-box {
    max-width: 280px;
  }
}
</style>
