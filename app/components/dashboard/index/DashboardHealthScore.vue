<script setup lang="ts">
defineProps<{
  total: number
  scoreClass: string
}>()

const { t } = useI18n()
</script>

<template>
  <div class="health-score-card">
    <div class="health-score-header">
      <h3>{{ t('dashboard.healthScore.title') }}</h3>
      <span class="health-score-value" :class="scoreClass">{{ total }}/100</span>
    </div>
    <div class="health-bar">
      <div class="health-bar-fill" :style="{ width: total + '%' }" :class="scoreClass" />
    </div>
    <div v-if="total >= 80" class="health-badge-eligible">
      {{ t('dashboard.healthScore.badgeEligible') }}
    </div>
  </div>
</template>

<style scoped>
.health-score-card {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.health-score-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.health-score-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.health-score-value {
  font-size: 1.25rem;
  font-weight: 700;
}

.health-score-value.score-high {
  color: var(--color-success);
}

.health-score-value.score-mid {
  color: var(--color-warning);
}

.health-score-value.score-low {
  color: var(--color-error);
}

.health-bar {
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.health-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s;
}

.health-bar-fill.score-high {
  background: var(--color-success);
}

.health-bar-fill.score-mid {
  background: var(--color-warning);
}

.health-bar-fill.score-low {
  background: var(--color-error);
}

.health-badge-eligible {
  font-size: 0.8rem;
  color: var(--color-success);
  font-weight: 500;
}
</style>
