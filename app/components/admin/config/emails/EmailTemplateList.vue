<script setup lang="ts">
import type { TemplateDefinition, TemplateData } from '~/composables/admin/useAdminEmails'

defineProps<{
  filteredTemplates: TemplateDefinition[]
  templates: Record<string, TemplateData>
  selectedTemplateKey: string
}>()

const emit = defineEmits<{
  select: [key: string]
}>()
</script>

<template>
  <div class="template-list">
    <div class="template-list__header">
      {{ $t('admin.emails.templates') }}
    </div>
    <button
      v-for="td in filteredTemplates"
      :key="td.key"
      class="template-item"
      :class="{
        'template-item--active': selectedTemplateKey === td.key,
        'template-item--disabled': !templates[td.key]?.active,
      }"
      @click="emit('select', td.key)"
    >
      <div class="template-item__info">
        <span class="template-item__name">{{ $t(`admin.emails.tpl.${td.key}`) }}</span>
        <span class="template-item__key">{{ td.key }}</span>
      </div>
      <div class="template-item__status">
        <span
          class="status-dot"
          :class="templates[td.key]?.active ? 'status-dot--on' : 'status-dot--off'"
        />
      </div>
    </button>
  </div>
</template>

<style scoped>
.template-list {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.template-list__header {
  padding: var(--spacing-3) var(--spacing-4);
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--color-gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-gray-100);
}

.template-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  border: none;
  border-bottom: 1px solid var(--color-gray-100);
  background: var(--bg-primary);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
  min-height: 2.75rem;
}

.template-item:last-child {
  border-bottom: none;
}

.template-item:hover {
  background: var(--color-gray-50);
}

.template-item--active {
  background: var(--color-blue-50);
  border-left: 3px solid var(--color-primary);
}

.template-item--disabled {
  opacity: 0.5;
}

.template-item__info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.template-item__name {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-gray-800);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.template-item__key {
  font-size: 0.75rem;
  color: var(--text-disabled);
  font-family: monospace;
}

.template-item__status {
  flex-shrink: 0;
  margin-left: var(--spacing-2);
}

.status-dot {
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
}

.status-dot--on {
  background: var(--color-success);
}

.status-dot--off {
  background: var(--color-gray-300);
}

@media (min-width: 64em) {
  .template-list {
    width: 17.5rem;
    flex-shrink: 0;
    position: sticky;
    top: 1rem;
    max-height: calc(100vh - 200px);
    overflow-y: auto;
  }
}

@media (min-width: 80em) {
  .template-list {
    width: 20rem;
  }
}
</style>
