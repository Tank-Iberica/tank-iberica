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
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.template-list__header {
  padding: 12px 16px;
  font-weight: 600;
  font-size: 0.85rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #f3f4f6;
}

.template-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-bottom: 1px solid #f3f4f6;
  background: white;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
  min-height: 44px;
}

.template-item:last-child {
  border-bottom: none;
}

.template-item:hover {
  background: #f9fafb;
}

.template-item--active {
  background: #eff6ff;
  border-left: 3px solid var(--color-primary, #23424a);
}

.template-item--disabled {
  opacity: 0.5;
}

.template-item__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.template-item__name {
  font-size: 0.9rem;
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.template-item__key {
  font-size: 0.75rem;
  color: #9ca3af;
  font-family: monospace;
}

.template-item__status {
  flex-shrink: 0;
  margin-left: 8px;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot--on {
  background: #10b981;
}

.status-dot--off {
  background: #d1d5db;
}

@media (min-width: 1024px) {
  .template-list {
    width: 280px;
    flex-shrink: 0;
    position: sticky;
    top: 16px;
    max-height: calc(100vh - 200px);
    overflow-y: auto;
  }
}

@media (min-width: 1280px) {
  .template-list {
    width: 320px;
  }
}
</style>
