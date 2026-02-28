<script setup lang="ts">
import { useDashboardIndex } from '~/composables/dashboard/useDashboardIndex'

/**
 * Dealer Dashboard Home
 * Shows KPI cards, recent leads, top vehicles, and onboarding progress.
 */
const {
  dealerProfile,
  stats,
  recentLeads,
  topVehicles,
  loading,
  error,
  healthScore,
  currentPlan,
  planLimits,
  onboardingComplete,
  onboardingSteps,
  onboardingProgress,
  healthScoreClass,
  formatDate,
  getStatusColor,
  init,
} = useDashboardIndex()

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()

onMounted(() => init())
</script>

<template>
  <div class="dashboard-page">
    <DashboardIndexDashboardHeader :company-name="dealerProfile?.company_name || ''" />

    <!-- Onboarding CTA -->
    <DashboardIndexDashboardOnboarding
      v-if="!onboardingComplete && dealerProfile"
      :progress="onboardingProgress"
      :steps="onboardingSteps"
    />

    <!-- Error -->
    <div v-if="error" class="alert-error">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>{{ t('common.loading') }}...</span>
    </div>

    <template v-else>
      <!-- KPI Cards -->
      <DashboardIndexDashboardKpiGrid
        :active-listings="stats.activeListings"
        :total-views="stats.totalViews"
        :leads-this-month="stats.leadsThisMonth"
        :response-rate="stats.responseRate"
        :plan-limits="planLimits"
      />

      <!-- Content Grid -->
      <div class="content-grid">
        <DashboardIndexDashboardRecentLeads
          :leads="recentLeads"
          :get-status-color="getStatusColor"
          :format-date="formatDate"
        />

        <DashboardIndexDashboardTopVehicles :vehicles="topVehicles" />
      </div>

      <!-- WhatsApp Publishing Widget -->
      <DashboardWhatsAppPublishWidget />

      <!-- Health Score -->
      <DashboardIndexDashboardHealthScore
        v-if="healthScore"
        :total="healthScore.total"
        :score-class="healthScoreClass"
      />

      <!-- Quick Actions -->
      <DashboardIndexDashboardQuickActions :current-plan="currentPlan" />
    </template>
  </div>
</template>

<style scoped>
.dashboard-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: #64748b;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.content-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (min-width: 768px) {
  .dashboard-page {
    padding: 24px;
  }

  .content-grid {
    flex-direction: row;
  }

  .content-grid :deep(> *) {
    flex: 1;
  }
}
</style>
