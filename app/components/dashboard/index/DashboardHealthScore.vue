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
  background: white;
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
  color: #1e293b;
}

.health-score-value {
  font-size: 1.25rem;
  font-weight: 700;
}

.health-score-value.score-high {
  color: #16a34a;
}

.health-score-value.score-mid {
  color: #f59e0b;
}

.health-score-value.score-low {
  color: #dc2626;
}

.health-bar {
  height: 8px;
  background: #e2e8f0;
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
  background: #22c55e;
}

.health-bar-fill.score-mid {
  background: #f59e0b;
}

.health-bar-fill.score-low {
  background: #ef4444;
}

.health-badge-eligible {
  font-size: 0.8rem;
  color: #16a34a;
  font-weight: 500;
}
</style>
