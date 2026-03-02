<template>
  <div v-if="analysis" class="km-score-badge" :class="scoreClass">
    <div class="score-header">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
      <span class="score-title">{{ t('verification.kmScore.title') }}</span>
    </div>

    <div class="score-bar-container">
      <div class="score-bar">
        <div class="score-fill" :style="{ width: `${analysis.score}%` }" />
      </div>
      <span class="score-value">{{ analysis.score }}/100</span>
    </div>

    <span class="score-label">{{ t(analysis.labelKey) }}</span>

    <p class="score-explanation">
      {{ analysis.explanation }}
    </p>

    <div v-if="analysis.anomalies.length > 0" class="score-anomalies">
      <span
        v-for="(anomaly, idx) in analysis.anomalies.slice(0, 2)"
        :key="idx"
        class="anomaly-tag"
        :class="`anomaly-${anomaly.type}`"
      >
        {{ anomaly.type === 'decrease' ? '⚠' : '⚡' }} {{ anomaly.description }}
      </span>
    </div>

    <div v-if="showReportLink" class="score-report-link">
      <button class="report-btn" @click="$emit('requestReport')">
        {{ t('verification.kmScore.fullReport') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UsageAnalysis } from '~/utils/kmScore'

const props = defineProps<{
  analysis: UsageAnalysis | null
  showReportLink?: boolean
}>()

defineEmits<{
  requestReport: []
}>()

const { t } = useI18n()

const scoreClass = computed(() => {
  if (!props.analysis) return ''
  const s = props.analysis.score
  if (s >= 80) return 'score-excellent'
  if (s >= 60) return 'score-good'
  if (s >= 40) return 'score-moderate'
  if (s >= 20) return 'score-warning'
  return 'score-danger'
})
</script>

<style scoped>
.km-score-badge {
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.score-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--text-primary);
}

.score-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.score-bar-container {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.score-bar {
  flex: 1;
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease-out;
}

.score-excellent .score-fill {
  background: var(--color-success);
}
.score-good .score-fill {
  background: #34d399;
}
.score-moderate .score-fill {
  background: var(--color-warning);
}
.score-warning .score-fill {
  background: #f97316;
}
.score-danger .score-fill {
  background: var(--color-error);
}

.score-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  white-space: nowrap;
}

.score-excellent .score-value {
  color: var(--color-success);
}
.score-good .score-value {
  color: #34d399;
}
.score-moderate .score-value {
  color: var(--color-warning);
}
.score-warning .score-value {
  color: #f97316;
}
.score-danger .score-value {
  color: var(--color-error);
}

.score-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.score-excellent .score-label {
  color: var(--color-success);
}
.score-good .score-label {
  color: #34d399;
}
.score-moderate .score-label {
  color: var(--color-warning);
}
.score-warning .score-label {
  color: #f97316;
}
.score-danger .score-label {
  color: var(--color-error);
}

.score-explanation {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  margin: 0;
}

.score-anomalies {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-1);
}

.anomaly-tag {
  display: inline-block;
  padding: 2px 8px;
  font-size: var(--font-size-xs);
  border-radius: var(--border-radius-full);
}

.anomaly-decrease {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
}

.anomaly-spike {
  background: #fffbeb;
  color: var(--color-warning);
}

.score-report-link {
  padding-top: var(--spacing-2);
  border-top: 1px solid var(--border-color-light);
}

.report-btn {
  background: none;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  min-height: 44px;
  width: 100%;
  transition: all var(--transition-fast);
}

.report-btn:hover {
  background: var(--color-primary);
  color: var(--color-white);
}
</style>
