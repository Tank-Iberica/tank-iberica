<script setup lang="ts">
import type { SectionDefinition } from '~/composables/admin/useAdminHomepage'

defineProps<{
  sections: Record<string, boolean>
  sectionDefinitions: SectionDefinition[]
}>()

const emit = defineEmits<{
  'toggle-section': [key: string, value: boolean]
}>()
</script>

<template>
  <div class="config-card">
    <h3 class="card-title">Secciones</h3>
    <p class="card-subtitle">Activa o desactiva las secciones de la pagina de inicio</p>

    <div class="sections-grid">
      <label
        v-for="section in sectionDefinitions"
        :key="section.key"
        class="section-toggle-card"
        :class="{ active: sections[section.key] }"
      >
        <div class="section-toggle-content">
          <span class="section-toggle-label">{{ section.label }}</span>
          <span class="section-toggle-desc">{{ section.description }}</span>
        </div>
        <input
          :checked="sections[section.key]"
          type="checkbox"
          class="section-checkbox"
          @change="emit('toggle-section', section.key, ($event.target as HTMLInputElement).checked)"
        />
      </label>
    </div>
  </div>
</template>

<style scoped>
.config-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  margin-bottom: var(--spacing-5);
  box-shadow: var(--shadow-card);
}

.card-title {
  margin: 0 0 var(--spacing-1);
  font-size: 1.25rem;
  color: var(--color-gray-800);
}

.card-subtitle {
  margin: 0 0 var(--spacing-5);
  color: var(--color-gray-500);
  font-size: 0.875rem;
}

.sections-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.625rem;
}

.section-toggle-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  padding: 0.875rem var(--spacing-4);
  border: 2px solid var(--border-color-light);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
}

.section-toggle-card:hover {
  border-color: var(--text-disabled);
}

.section-toggle-card.active {
  border-color: var(--color-primary);
  background: var(--color-teal-50);
}

.section-toggle-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.section-toggle-label {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-gray-800);
}

.section-toggle-desc {
  font-size: 0.8rem;
  color: var(--color-gray-500);
}

.section-checkbox {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
  flex-shrink: 0;
  accent-color: var(--color-primary);
}

@media (min-width: 30em) {
  .sections-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
