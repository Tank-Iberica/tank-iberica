<script setup lang="ts">
import type { LocaleProgress } from '~/composables/admin/useAdminLanguages'
const { t } = useI18n()

defineProps<{
  progress: LocaleProgress[]
  loadingProgress: boolean
  visible: boolean
}>()
</script>

<template>
  <div v-if="visible" class="config-card">
    <h3 class="card-title">{{ t('admin.configLanguages.progressTitle') }}</h3>
    <p class="card-description">{{ t('admin.configLanguages.progressDesc') }}</p>

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
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-card);
  margin-bottom: var(--spacing-5);
}

.card-title {
  margin: 0 0 var(--spacing-2);
  font-size: 1.125rem;
  color: var(--color-gray-800);
}

.card-description {
  margin: 0 0 var(--spacing-4);
  color: var(--color-gray-500);
  font-size: 0.875rem;
}

.progress-loading {
  color: var(--color-gray-500);
  font-size: 0.875rem;
  padding: var(--spacing-3) 0;
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-1);
}

.progress-locale {
  font-weight: 500;
  font-size: 0.95rem;
  color: var(--color-gray-800);
}

.progress-count {
  font-size: 0.8rem;
  color: var(--color-gray-500);
}

.progress-bar-track {
  width: 100%;
  height: 0.5rem;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-sm);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--border-radius-sm);
  transition: width 0.3s ease;
  min-width: 0;
}

.progress-percentage {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-gray-700);
}

.progress-empty {
  color: var(--text-disabled);
  font-size: 0.875rem;
  padding: var(--spacing-2) 0;
}

@media (min-width: 48em) {
  .progress-item {
    flex-direction: row;
    align-items: center;
    gap: var(--spacing-3);
  }

  .progress-header {
    min-width: 15rem;
    flex-shrink: 0;
  }

  .progress-bar-track {
    flex: 1;
  }

  .progress-percentage {
    min-width: 2.5rem;
    text-align: right;
  }
}

(@media ()max-width: 47.9375em())) {
  .config-card {
    padding: var(--spacing-4);
  }
}
</style>
