<script setup lang="ts">
const props = defineProps<{
  views: number
  favorites: number
  leads: number
  period?: string
}>()

const { t } = useI18n()

const conversionRate = computed(() => {
  if (!props.views) return 0
  return Math.round((props.leads / props.views) * 1000) / 10 // one decimal
})

interface FunnelStep {
  key: string
  icon: string
  value: number
  label: string
  barWidth: string
}

const steps = computed((): FunnelStep[] => {
  const maxVal = Math.max(props.views, 1)
  return [
    {
      key: 'views',
      icon: '👁',
      value: props.views,
      label: t('dashboard.analytics.views'),
      barWidth: `${Math.round((props.views / maxVal) * 100)}%`,
    },
    {
      key: 'favorites',
      icon: '♡',
      value: props.favorites,
      label: t('dashboard.analytics.favorites'),
      barWidth: `${Math.round((props.favorites / maxVal) * 100)}%`,
    },
    {
      key: 'leads',
      icon: '✉',
      value: props.leads,
      label: t('dashboard.analytics.leads'),
      barWidth: `${Math.round((props.leads / maxVal) * 100)}%`,
    },
  ]
})
</script>

<template>
  <section class="analytics-funnel" :aria-label="t('dashboard.analytics.ariaLabel')">
    <div class="funnel-header">
      <h3 class="funnel-title">{{ t('dashboard.analytics.title') }}</h3>
      <span v-if="period" class="funnel-period">{{ period }}</span>
    </div>

    <div class="funnel-steps">
      <div v-for="step in steps" :key="step.key" class="funnel-step">
        <div class="step-meta">
          <span class="step-icon" aria-hidden="true">{{ step.icon }}</span>
          <span class="step-value">{{ step.value.toLocaleString() }}</span>
          <span class="step-label">{{ step.label }}</span>
        </div>
        <div class="step-bar-track" role="progressbar" :aria-valuenow="step.value" :aria-valuemin="0" :aria-valuemax="views">
          <div class="step-bar" :style="{ width: step.barWidth }" />
        </div>
      </div>
    </div>

    <div class="funnel-conversion">
      <span class="conversion-label">{{ t('dashboard.analytics.conversionRate') }}</span>
      <strong class="conversion-value">{{ conversionRate.toFixed(1) }}%</strong>
    </div>
  </section>
</template>

<style scoped>
.analytics-funnel {
  background: var(--bg-primary);
  border: 1px solid var(--color-gray-100);
  border-radius: var(--border-radius-md);
  padding: 1.25rem;
}

.funnel-header {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.funnel-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.funnel-period {
  font-size: 0.8rem;
  color: var(--text-auxiliary);
}

.funnel-steps {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.funnel-step {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.step-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.step-icon {
  font-size: 0.9rem;
  width: 1.25rem;
  text-align: center;
}

.step-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  min-width: 3rem;
}

.step-label {
  font-size: 0.85rem;
  color: var(--text-auxiliary);
}

.step-bar-track {
  height: 0.375rem;
  background: var(--bg-secondary);
  border-radius: 1rem;
  overflow: hidden;
}

.step-bar {
  height: 100%;
  background: var(--color-primary);
  border-radius: 1rem;
  transition: width 0.4s ease;
}

.funnel-steps .funnel-step:nth-child(2) .step-bar {
  background: var(--color-warning-text, #d97706);
}

.funnel-steps .funnel-step:nth-child(3) .step-bar {
  background: var(--color-success, #10b981);
}

.funnel-conversion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
  padding-top: 0.875rem;
  border-top: 1px solid var(--color-gray-100);
}

.conversion-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.conversion-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-primary);
}

@media (min-width: 30em) {
  .funnel-step {
    flex-direction: row;
    align-items: center;
    gap: 0.75rem;
  }

  .step-meta {
    min-width: 10rem;
  }

  .step-bar-track {
    flex: 1;
  }
}
</style>
