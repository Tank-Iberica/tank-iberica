<script setup lang="ts">
defineProps<{
  sectionId: string
  title: string
  activeSection: string | null
  badge?: number
  danger?: boolean
}>()

const emit = defineEmits<{
  toggle: [id: string]
}>()
</script>

<template>
  <div class="panel-section" :class="{ 'panel-section--danger': danger }">
    <button
      class="section-header"
      :class="{ active: activeSection === sectionId, 'section-header--danger': danger }"
      :aria-expanded="activeSection === sectionId"
      :aria-controls="`panel-${sectionId}`"
      @click="emit('toggle', sectionId)"
    >
      <span>
        {{ title }}
        <span v-if="badge && badge > 0" class="badge">{{ badge }}</span>
      </span>
      <span class="section-arrow">{{ activeSection === sectionId ? '▲' : '▼' }}</span>
    </button>
    <Transition name="accordion">
      <div
        v-if="activeSection === sectionId"
        :id="`panel-${sectionId}`"
        class="section-content"
        :class="{ 'section-content--danger': danger }"
        role="region"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.panel-section {
  border-bottom: 1px solid var(--border-color-light);
}

.panel-section--danger {
  border-bottom: none;
}

.section-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: none;
  border: none;
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.15s;
}

.section-header:hover {
  background: var(--bg-secondary);
}

.section-header.active {
  background: var(--bg-secondary);
  color: var(--color-primary);
}

.section-header--danger {
  color: var(--color-error);
}

.section-header--danger:hover {
  background: var(--color-error-bg);
}

.section-arrow {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

.section-content {
  padding: 1rem 1.25rem;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color-light);
}

.section-content--danger {
  background: var(--color-error-bg);
  border-top: 1px solid var(--color-error-border);
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.375rem;
  background: var(--color-error);
  color: var(--color-white);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-xs);
  font-weight: 600;
  margin-left: 0.5rem;
}

.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
</style>
