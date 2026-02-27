<script setup lang="ts">
import type { SectionDefinition } from '~/composables/admin/useAdminHomepage'

defineProps<{
  sections: Record<string, boolean>
  sectionDefinitions: SectionDefinition[]
}>()

const emit = defineEmits<{
  (e: 'toggle-section', key: string, value: boolean): void
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
        >
      </label>
    </div>
  </div>
</template>

<style scoped>
.config-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-title {
  margin: 0 0 4px;
  font-size: 1.25rem;
  color: #1f2937;
}

.card-subtitle {
  margin: 0 0 20px;
  color: #6b7280;
  font-size: 0.875rem;
}

.sections-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.section-toggle-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.section-toggle-card:hover {
  border-color: #9ca3af;
}

.section-toggle-card.active {
  border-color: var(--color-primary, #23424a);
  background: #f0fdfa;
}

.section-toggle-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.section-toggle-label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #1f2937;
}

.section-toggle-desc {
  font-size: 0.8rem;
  color: #6b7280;
}

.section-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  flex-shrink: 0;
  accent-color: var(--color-primary, #23424a);
}

@media (min-width: 480px) {
  .sections-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
