<script setup lang="ts">
import type { HealthScoreBreakdown } from '~/composables/useDealerHealthScore'

defineProps<{
  total: number
  scoreClass: string
  breakdown?: HealthScoreBreakdown | null
}>()

const { t } = useI18n()

interface CriterionRow {
  key: keyof HealthScoreBreakdown
  labelKey: string
  max: number
  tip: string
}

const CRITERIA: CriterionRow[] = [
  {
    key: 'photosScore',
    labelKey: 'dashboard.healthScore.photos',
    max: 10,
    tip: 'dashboard.healthScore.tipsPhotos',
  },
  {
    key: 'descriptionScore',
    labelKey: 'dashboard.healthScore.descriptions',
    max: 10,
    tip: 'dashboard.healthScore.tipsDescriptions',
  },
  {
    key: 'responseScore',
    labelKey: 'dashboard.healthScore.responseTime',
    max: 20,
    tip: 'dashboard.healthScore.tipsResponse',
  },
  {
    key: 'priceUpdateScore',
    labelKey: 'dashboard.healthScore.priceUpdates',
    max: 10,
    tip: 'dashboard.healthScore.tipsPriceUpdates',
  },
  {
    key: 'profileScore',
    labelKey: 'dashboard.healthScore.profileComplete',
    max: 10,
    tip: 'dashboard.healthScore.tipsProfile',
  },
  {
    key: 'vehiclesScore',
    labelKey: 'dashboard.healthScore.activeVehicles',
    max: 40,
    tip: 'dashboard.healthScore.tipsVehicles',
  },
]
</script>

<template>
  <div class="health-score-card">
    <div class="health-score-header">
      <h3>{{ t('dashboard.healthScore.title') }}</h3>
      <span class="health-score-value" :class="scoreClass">{{ total }}/100</span>
    </div>

    <!-- Summary bar -->
    <div
      class="health-bar"
      role="progressbar"
      :aria-valuenow="total"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div class="health-bar-fill" :style="{ width: total + '%' }" :class="scoreClass" />
    </div>

    <!-- Badge eligible message -->
    <div v-if="total >= 80" class="health-message health-message--good">
      <span aria-hidden="true">⭐</span> {{ t('dashboard.healthScore.badgeEligible') }}
    </div>
    <div v-else class="health-message health-message--hint">
      {{ t('dashboard.healthScore.notEligible') }}
    </div>

    <!-- Breakdown (shown when full data available) -->
    <template v-if="breakdown">
      <div class="breakdown-list">
        <div v-for="c in CRITERIA" :key="c.key" class="breakdown-item">
          <div class="breakdown-item__header">
            <span class="breakdown-item__label">{{ t(c.labelKey) }}</span>
            <span
              class="breakdown-item__score"
              :class="(breakdown[c.key] as number) === c.max ? 'perfect' : ''"
            >
              {{ breakdown[c.key] }}/{{ c.max }}
            </span>
          </div>
          <div class="breakdown-bar">
            <div
              class="breakdown-bar-fill"
              :style="{ width: ((breakdown[c.key] as number) / c.max) * 100 + '%' }"
              :class="(breakdown[c.key] as number) === c.max ? 'perfect' : ''"
            />
          </div>
          <!-- Improvement tip if not at max -->
          <p v-if="(breakdown[c.key] as number) < c.max" class="breakdown-item__tip">
            {{ t(c.tip) }}
          </p>
        </div>
      </div>

      <NuxtLink to="/dashboard/mercado" class="market-link">
        {{ t('dashboard.healthScore.viewMarket') }} →
      </NuxtLink>
    </template>
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

.health-message {
  font-size: var(--font-size-sm);
  margin-bottom: 1rem;
}

.health-message--good {
  color: var(--color-success);
  font-weight: 500;
}
.health-message--hint {
  color: var(--text-secondary);
}

/* --- Breakdown --- */
.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  margin-top: 1rem;
  border-top: 1px solid var(--border-light);
  padding-top: 1rem;
}

.breakdown-item__header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  font-size: var(--font-size-sm);
}

.breakdown-item__label {
  color: var(--text-secondary);
}

.breakdown-item__score {
  font-weight: 600;
  color: var(--text-primary);
}

.breakdown-item__score.perfect {
  color: var(--color-success);
}

.breakdown-bar {
  height: 0.3125rem;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-sm);
  overflow: hidden;
}

.breakdown-bar-fill {
  height: 100%;
  background: var(--color-primary, #23424a);
  border-radius: var(--border-radius-sm);
  transition: width 0.4s;
}

.breakdown-bar-fill.perfect {
  background: var(--color-success);
}

.breakdown-item__tip {
  font-size: 0.6875rem;
  color: var(--text-tertiary, var(--text-secondary));
  margin: 0.25rem 0 0;
  line-height: 1.4;
}

.market-link {
  display: inline-block;
  margin-top: 1rem;
  font-size: var(--font-size-sm);
  color: var(--color-primary, #23424a);
  text-decoration: none;
  font-weight: 500;
}

.market-link:hover {
  text-decoration: underline;
}
</style>
