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
  background: white;
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
  background: #dcfce7;
  color: #166534;
}
.seo-score-mini.warning {
  background: #fef3c7;
  color: #92400e;
}
.seo-score-mini.bad {
  background: #fef2f2;
  color: #dc2626;
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
  color: #94a3b8;
}

/* Score circle */
.seo-score-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.score-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 5px solid;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.score-circle.good {
  border-color: #22c55e;
}
.score-circle.warning {
  border-color: #f59e0b;
}
.score-circle.bad {
  border-color: #ef4444;
}

.score-number {
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1;
  color: #1a1a1a;
}

.score-label {
  font-size: 0.6rem;
  color: #94a3b8;
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
  color: #22c55e;
}
.level-warning {
  color: #f59e0b;
}
.level-bad {
  color: #ef4444;
}

/* Snippet preview */
.snippet-preview {
  margin-bottom: 20px;
}

.snippet-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.snippet-box {
  background: #fafafa;
  border: 1px solid #e2e8f0;
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
  border-top: 1px solid #f1f5f9;
  padding-top: 12px;
}

.criterion-row {
  padding: 8px 0;
  border-bottom: 1px solid #f8fafc;
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
  background: #22c55e;
}
.criterion-dot.warning {
  background: #f59e0b;
}
.criterion-dot.bad {
  background: #ef4444;
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
  color: #94a3b8;
}

.criterion-desc {
  font-size: 0.7rem;
  color: #94a3b8;
  margin: 3px 0 0;
  padding-left: 16px;
  line-height: 1.4;
}
</style>
