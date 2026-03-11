<script setup lang="ts">
import { useDashboardIndex } from '~/composables/dashboard/useDashboardIndex'
import { useOnboardingTour } from '~/composables/useOnboardingTour'

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

// ---------------------------------------------------------------------------
// Guided tour — shown once to new dealers before checklist is completed
// ---------------------------------------------------------------------------

const tourSteps = computed(() => [
  {
    key: 'welcome',
    title: t('tour.dealer.step1.title'),
    description: t('tour.dealer.step1.desc'),
  },
  {
    key: 'publish',
    title: t('tour.dealer.step2.title'),
    description: t('tour.dealer.step2.desc'),
    actionLabel: t('tour.dealer.step2.action'),
    actionRoute: '/dashboard/vehiculos/nuevo',
  },
  {
    key: 'leads',
    title: t('tour.dealer.step3.title'),
    description: t('tour.dealer.step3.desc'),
  },
  {
    key: 'profile',
    title: t('tour.dealer.step4.title'),
    description: t('tour.dealer.step4.desc'),
    actionLabel: t('tour.dealer.step4.action'),
    actionRoute: '/dashboard/portal',
  },
])

const tour = useOnboardingTour(tourSteps.value)

// Start tour once dealer profile loads and onboarding is not yet complete
watch(
  dealerProfile,
  (profile) => {
    if (profile && !profile.onboarding_completed) {
      tour.startTour()
    }
  },
  { once: true },
)

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

    <!-- Loading skeleton -->
    <div v-if="loading" class="dashboard-skeleton" aria-busy="true">
      <div class="dashboard-skeleton__kpis">
        <UiSkeletonCard v-for="n in 4" :key="n" :lines="2" />
      </div>
      <div class="dashboard-skeleton__sections">
        <UiSkeletonCard :lines="5" />
        <UiSkeletonCard :lines="5" />
      </div>
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

    <!-- Guided onboarding tour (fixed bottom card, shown once) -->
    <UiOnboardingTour
      :visible="tour.visible.value"
      :current-step="tour.currentStep.value"
      :step-number="tour.stepNumber.value"
      :total-steps="tour.totalSteps"
      :is-first="tour.isFirst.value"
      :is-last="tour.isLast.value"
      @next="tour.nextStep()"
      @prev="tour.prevStep()"
      @skip="tour.skipTour()"
    />
  </div>
</template>

<style scoped>
.dashboard-page {
  max-width: 75rem;
  margin: 0 auto;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.alert-error {
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-error-bg, var(--color-error-bg));
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  color: var(--color-error);
}

.dashboard-skeleton__kpis {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.dashboard-skeleton__sections {
  display: grid;
  gap: 1rem;
}

@media (min-width: 48em) {
  .dashboard-skeleton__kpis {
    grid-template-columns: repeat(4, 1fr);
  }

  .dashboard-skeleton__sections {
    grid-template-columns: repeat(2, 1fr);
  }
}

.content-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
}

@media (min-width: 48em) {
  .dashboard-page {
    padding: var(--spacing-6);
  }

  .content-grid {
    flex-direction: row;
  }

  .content-grid :deep(> *) {
    flex: 1;
  }
}
</style>
