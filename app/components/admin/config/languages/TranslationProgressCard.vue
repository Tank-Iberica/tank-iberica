<script setup lang="ts">
import type { LocaleProgress } from '~/composables/admin/useAdminLanguages'

defineProps<{
  progress: LocaleProgress[]
  loadingProgress: boolean
  visible: boolean
}>()
</script>

<template>
  <div v-if="visible" class="config-card">
    <h3 class="card-title">Progreso de Traduccion</h3>
    <p class="card-description">
      Estado de las traducciones para cada idioma activo (excepto el idioma por defecto).
    </p>

    <div v-if="loadingProgress" class="progress-loading">Cargando progreso...</div>

    <div v-else-if="progress.length > 0" class="progress-list">
      <div v-for="prog in progress" :key="prog.locale" class="progress-item">
        <div class="progress-header">
          <span class="progress-locale">{{ prog.label }}</span>
          <span class="progress-count">{{ prog.existing }} / {{ prog.expected }} traducciones</span>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" :style="{ width: prog.percentage + '%' }" />
        </div>
        <span class="progress-percentage">{{ prog.percentage }}%</span>
      </div>
    </div>

    <div v-else class="progress-empty">No hay traducciones esperadas todavia.</div>
  </div>
</template>

<style scoped>
.config-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.card-title {
  margin: 0 0 8px;
  font-size: 1.125rem;
  color: #1f2937;
}

.card-description {
  margin: 0 0 16px;
  color: #6b7280;
  font-size: 0.875rem;
}

.progress-loading {
  color: #6b7280;
  font-size: 0.875rem;
  padding: 12px 0;
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.progress-locale {
  font-weight: 500;
  font-size: 0.95rem;
  color: #1f2937;
}

.progress-count {
  font-size: 0.8rem;
  color: #6b7280;
}

.progress-bar-track {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--color-primary, #23424a);
  border-radius: 4px;
  transition: width 0.3s ease;
  min-width: 0;
}

.progress-percentage {
  font-size: 0.8rem;
  font-weight: 500;
  color: #374151;
}

.progress-empty {
  color: #9ca3af;
  font-size: 0.875rem;
  padding: 8px 0;
}

@media (min-width: 768px) {
  .progress-item {
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }

  .progress-header {
    min-width: 240px;
    flex-shrink: 0;
  }

  .progress-bar-track {
    flex: 1;
  }

  .progress-percentage {
    min-width: 40px;
    text-align: right;
  }
}

@media (max-width: 767px) {
  .config-card {
    padding: 16px;
  }
}
</style>
