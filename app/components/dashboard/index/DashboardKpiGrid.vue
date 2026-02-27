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
  gap: 12px;
}

.kpi-card {
  background: white;
  border-radius: 12px;
  padding: 20px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kpi-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
  line-height: 1;
}

.kpi-label {
  font-size: 0.85rem;
  color: #64748b;
}

.kpi-limit {
  font-size: 0.75rem;
  color: #94a3b8;
}

@media (min-width: 768px) {
  .kpi-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
