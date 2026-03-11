<script setup lang="ts">
/**
 * CRM toolbar with search input and contact type filter buttons.
 * Does NOT use v-model on props — emits changes upward.
 */
import type { ContactFilters, ContactTypeConfig } from '~/composables/dashboard/useDashboardCrm'

const props = defineProps<{
  filters: ContactFilters
  contactTypes: ContactTypeConfig[]
}>()

const emit = defineEmits<{
  'update:filters': [value: ContactFilters]
}>()

const { t } = useI18n()

function onSearchInput(event: Event): void {
  const value = (event.target as HTMLInputElement).value
  emit('update:filters', { ...props.filters, search: value })
}

function clearSearch(): void {
  emit('update:filters', { ...props.filters, search: '' })
}

function setContactType(type: ContactFilters['contact_type']): void {
  emit('update:filters', { ...props.filters, contact_type: type })
}
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-row">
      <div class="search-box">
        <span class="search-icon">&#128269;</span>
        <input
          type="text"
          :value="filters.search"
          :placeholder="t('dashboard.crm.searchPlaceholder')"
          @input="onSearchInput"
        />
        <button v-if="filters.search" class="clear-btn" @click="clearSearch">&#215;</button>
      </div>

      <div class="filter-group">
        <label class="filter-label">{{ t('dashboard.crm.filterType') }}</label>
        <div class="segment-control">
          <button :class="{ active: !filters.contact_type }" @click="setContactType(null)">
            {{ t('dashboard.crm.filterAll') }}
          </button>
          <button
            v-for="ct in contactTypes"
            :key="ct.value"
            :class="{ active: filters.contact_type === ct.value }"
            @click="setContactType(ct.value)"
          >
            {{ t(ct.labelKey) }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
}

.toolbar-row {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.search-box {
  position: relative;
  width: 100%;
}

.search-box .search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--font-size-sm);
  opacity: 0.5;
}

.search-box input {
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 2.25rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  min-height: 2.75rem;
}

.search-box input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.search-box .clear-btn {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: var(--bg-tertiary);
  border: none;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: var(--border-radius-full);
  cursor: pointer;
  font-size: var(--font-size-sm);
  line-height: 1;
  min-width: 2.75rem;
  min-height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-auxiliary);
  white-space: nowrap;
}

.segment-control {
  display: flex;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  overflow: hidden;
  flex-wrap: wrap;
}

.segment-control button {
  padding: 0.4375rem 0.75rem;
  border: none;
  background: var(--bg-primary);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-auxiliary);
  cursor: pointer;
  transition: all 0.15s;
  min-height: 2.75rem;
}

.segment-control button:not(:last-child) {
  border-right: 1px solid var(--color-gray-200);
}

.segment-control button.active {
  background: var(--color-primary);
  color: white;
}

.segment-control button:hover:not(.active) {
  background: var(--bg-secondary);
}

@media (min-width: 48em) {
  .toolbar-row {
    flex-direction: row;
    align-items: center;
  }

  .search-box {
    max-width: 20rem;
  }
}
</style>
