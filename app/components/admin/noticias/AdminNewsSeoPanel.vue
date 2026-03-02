<script setup lang="ts">
import type { SeoAnalysis } from '~/composables/admin/useSeoScore'

defineProps<{
  analysis: SeoAnalysis
  seoPanel: boolean
  getLevelLabel: (level: string) => string
}>()

defineEmits<{
  'update:seoPanel': [value: boolean]
}>()
</script>

<template>
  <div class="nf-seo">
    <!-- Mobile toggle -->
    <button class="seo-toggle-mobile" @click="$emit('update:seoPanel', !seoPanel)">
      <span>Panel SEO</span>
      <span class="seo-score-mini" :class="analysis.level">{{ analysis.score }}</span>
      <span class="toggle-icon">{{ seoPanel ? '−' : '+' }}</span>
    </button>

    <div v-show="seoPanel" class="seo-panel">
      <!-- Score -->
      <div class="seo-score-header">
        <div class="score-circle" :class="analysis.level">
          <span class="score-number">{{ analysis.score }}</span>
          <span class="score-label">/100</span>
        </div>
        <div class="score-text">
          <strong>Puntuacion SEO</strong>
          <span class="level-text" :class="'level-' + analysis.level">
            {{ getLevelLabel(analysis.level) }}
          </span>
        </div>
      </div>

      <!-- Google Snippet Preview -->
      <div class="snippet-preview">
        <div class="snippet-label">Vista previa en Google</div>
        <div class="snippet-box">
          <div class="snippet-title">{{ analysis.snippetPreview.title }}</div>
          <div class="snippet-url">{{ analysis.snippetPreview.url }}</div>
          <div class="snippet-desc">
            {{ analysis.snippetPreview.description || 'Sin descripcion...' }}
          </div>
        </div>
      </div>

      <!-- Criteria -->
      <div class="seo-criteria">
        <div v-for="c in analysis.criteria" :key="c.id" class="criterion-row">
          <div class="criterion-header">
            <span class="criterion-dot" :class="c.level" />
            <span class="criterion-label">{{ c.label }}</span>
            <span class="criterion-score">{{ c.score }}</span>
          </div>
          <p class="criterion-desc">{{ c.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* SEO Panel */
.nf-seo {
  background: var(--bg-primary);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

@media (min-width: 1024px) {
  .nf-seo {
    position: sticky;
    top: 80px;
  }

  .seo-toggle-mobile {
    display: none;
  }
}

.seo-toggle-mobile {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 16px 20px;
  font-weight: 600;
  font-size: 0.9rem;
  color: #374151;
  cursor: pointer;
  border: none;
  background: none;
  gap: 8px;
}

.seo-score-mini {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 22px;
  border-radius: 11px;
  font-size: 0.7rem;
  font-weight: 700;
  margin-left: auto;
}

.seo-score-mini.good {
  background: var(--color-success-bg, #dcfce7);
  color: #166534;
}
.seo-score-mini.warning {
  background: var(--color-warning-bg, #fef3c7);
  color: var(--color-warning-text);
}
.seo-score-mini.bad {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
}

.seo-panel {
  padding: 20px;
}

@media (min-width: 1024px) {
  .seo-panel {
    padding-top: 20px;
  }
}

.toggle-icon {
  font-size: 1.2rem;
  color: var(--text-disabled);
}

/* Score circle */
.seo-score-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.score-circle {
  min-width: 72px;
  min-height: 72px;
  border-radius: 50%;
  border: 5px solid;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.score-circle.good {
  border-color: var(--color-success);
}
.score-circle.warning {
  border-color: var(--color-warning);
}
.score-circle.bad {
  border-color: var(--color-error);
}

.score-number {
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1;
  color: #1a1a1a;
}

.score-label {
  font-size: 0.6rem;
  color: var(--text-disabled);
}

.score-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.score-text strong {
  font-size: 0.9rem;
  color: #1a1a1a;
}

.level-text {
  font-size: 0.8rem;
}
.level-good {
  color: var(--color-success);
}
.level-warning {
  color: var(--color-warning);
}
.level-bad {
  color: var(--color-error);
}

/* Snippet preview */
.snippet-preview {
  margin-bottom: 20px;
}

.snippet-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-disabled);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.snippet-box {
  background: #fafafa;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  padding: 14px;
  font-family: Arial, sans-serif;
}

.snippet-title {
  color: #1a0dab;
  font-size: 16px;
  line-height: 1.3;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.snippet-url {
  color: #006621;
  font-size: 12px;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.snippet-desc {
  color: #545454;
  font-size: 12px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Criteria */
.seo-criteria {
  border-top: 1px solid var(--color-gray-100);
  padding-top: 12px;
}

.criterion-row {
  padding: 8px 0;
  border-bottom: 1px solid var(--color-gray-50);
}

.criterion-row:last-child {
  border-bottom: none;
}

.criterion-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.criterion-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.criterion-dot.good {
  background: var(--color-success);
}
.criterion-dot.warning {
  background: var(--color-warning);
}
.criterion-dot.bad {
  background: var(--color-error);
}

.criterion-label {
  flex: 1;
  font-size: 0.8rem;
  font-weight: 500;
  color: #374151;
}

.criterion-score {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-disabled);
}

.criterion-desc {
  font-size: 0.7rem;
  color: var(--text-disabled);
  margin: 3px 0 0;
  padding-left: 16px;
  line-height: 1.4;
}
</style>
