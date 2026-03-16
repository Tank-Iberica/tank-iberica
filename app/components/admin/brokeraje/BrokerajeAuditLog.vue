<script setup lang="ts">
import {
  type BrokerageAuditEntry,
  getActionLabel,
  getActorLabel,
} from '~/composables/admin/useAdminBrokerageDeal'

defineProps<{
  entries: readonly BrokerageAuditEntry[]
}>()

const expanded = ref(false)

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="audit-section">
    <button class="audit-toggle" @click="expanded = !expanded">
      <span>Audit Log ({{ entries.length }})</span>
      <svg
        class="toggle-icon"
        :class="{ expanded }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>

    <div v-if="expanded" class="audit-timeline">
      <div v-if="entries.length === 0" class="audit-empty">Sin entradas de audit.</div>
      <div v-for="entry in entries" :key="entry.id" class="audit-entry">
        <div class="entry-dot" />
        <div class="entry-content">
          <div class="entry-header">
            <span class="entry-action">{{ getActionLabel(entry.action) }}</span>
            <span class="entry-time">{{ formatTime(entry.created_at) }}</span>
          </div>
          <div class="entry-actor">{{ getActorLabel(entry.actor) }}</div>
          <div v-if="entry.details && Object.keys(entry.details).length" class="entry-details">
            <template v-if="entry.details.from && entry.details.to">
              {{ entry.details.from }} → {{ entry.details.to }}
              <template v-if="entry.details.reason"> ({{ entry.details.reason }}) </template>
            </template>
            <template v-else-if="entry.details.fields_updated">
              Campos: {{ (entry.details.fields_updated as string[]).join(', ') }}
            </template>
          </div>
          <div v-if="entry.human_override" class="entry-override">
            Override humano: {{ entry.override_reason || 'Sin motivo' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.audit-section {
  border-top: 1px solid var(--border-color);
}

.audit-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--spacing-3) 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  text-align: left;
}

.toggle-icon {
  width: 1rem;
  height: 1rem;
  transition: transform var(--transition-fast);
}

.toggle-icon.expanded {
  transform: rotate(180deg);
}

.audit-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-bottom: var(--spacing-3);
}

.audit-empty {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  padding: var(--spacing-2) 0;
}

.audit-entry {
  display: flex;
  gap: var(--spacing-3);
  padding: var(--spacing-2) 0;
  position: relative;
}

.audit-entry::before {
  content: '';
  position: absolute;
  left: 0.25rem;
  top: 1.25rem;
  bottom: -0.5rem;
  width: 0.0625rem;
  background: var(--border-color);
}

.audit-entry:last-child::before {
  display: none;
}

.entry-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--text-secondary);
  flex-shrink: 0;
  margin-top: 0.375rem;
}

.entry-content {
  flex: 1;
  min-width: 0;
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--spacing-2);
}

.entry-action {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.entry-time {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  white-space: nowrap;
}

.entry-actor {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.entry-details {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: 0.125rem;
}

.entry-override {
  font-size: var(--font-size-xs);
  color: var(--color-warning, var(--color-warning));
  font-style: italic;
  margin-top: 0.125rem;
}
</style>
