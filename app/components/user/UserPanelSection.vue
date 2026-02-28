<script setup lang="ts">
defineProps<{
  sectionId: string
  title: string
  activeSection: string | null
  badge?: number
  danger?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle', id: string): void
}>()
</script>

<template>
  <div class="panel-section" :class="{ 'panel-section--danger': danger }">
    <button
      class="section-header"
      :class="{ active: activeSection === sectionId, 'section-header--danger': danger }"
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
        class="section-content"
        :class="{ 'section-content--danger': danger }"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.panel-section {
  border-bottom: 1px solid #f0f0f0;
}

.panel-section--danger {
  border-bottom: none;
}

.section-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  transition: background 0.15s;
}

.section-header:hover {
  background: #f9f9f9;
}

.section-header.active {
  background: #f5f5f5;
}

.section-header--danger {
  color: #dc2626;
}

.section-header--danger:hover {
  background: #fef2f2;
}

.section-arrow {
  font-size: 0.75rem;
  color: #999;
}

.section-content {
  padding: 16px 20px;
  background: #fafafa;
  border-top: 1px solid #eee;
}

.section-content--danger {
  background: #fef2f2;
  border-top: 1px solid #fecaca;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #ef4444;
  color: white;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 8px;
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
