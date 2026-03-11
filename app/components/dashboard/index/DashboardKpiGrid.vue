<script setup lang="ts">
import type { PlanLimitsConfig } from '~/composables/useSubscriptionPlan'

defineProps<{
  activeListings: number
  totalViews: number
  leadsThisMonth: number
  responseRate: number
  planLimits: PlanLimitsConfig
}>()

const { t } = useI18n()
</script>

<template>
  <div class="kpi-grid">
    <div class="kpi-card">
      <span class="kpi-value">{{ activeListings }}</span>
      <span class="kpi-label">{{ t('dashboard.kpi.activeVehicles') }}</span>
      <span class="kpi-limit">
        {{ activeListings }}/{{
          planLimits.maxActiveListings === Infinity ? '\u221E' : planLimits.maxActiveListings
        }}
        {{ t('dashboard.kpi.planLimit') }}
      </span>
    </div>
    <div class="kpi-card">
      <span class="kpi-value">{{ totalViews }}</span>
      <span class="kpi-label">{{ t('dashboard.kpi.totalViews') }}</span>
    </div>
    <div class="kpi-card">
      <span class="kpi-value">{{ leadsThisMonth }}</span>
      <span class="kpi-label">{{ t('dashboard.kpi.leadsMonth') }}</span>
    </div>
    <div class="kpi-card">
      <span class="kpi-value">{{ responseRate }}%</span>
      <span class="kpi-label">{{ t('dashboard.kpi.responseRate') }}</span>
    </div>
  </div>
</template>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.kpi-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: 1.25rem 1rem;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.kpi-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1;
}

.kpi-label {
  font-size: 0.85rem;
  color: var(--text-auxiliary);
}

.kpi-limit {
  font-size: var(--font-size-xs);
  color: var(--text-disabled);
}

@media (min-width: 48em) {
  .kpi-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
