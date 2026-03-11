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
  border-radius: var(--border-radius-md);
  padding: 1.25rem;
  box-shadow: var(--shadow-card);
}

.health-score-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.health-score-header h3 {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
}

.health-score-value {
  font-size: var(--font-size-xl);
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
  height: 0.5rem;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.health-bar-fill {
  height: 100%;
  border-radius: var(--border-radius-sm);
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
  font-size: var(--font-size-sm);
  color: var(--color-success);
  font-weight: 500;
}
</style>
