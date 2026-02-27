/**
 * Composable for the dealer dashboard index page.
 * Orchestrates data loading, formatting helpers, and derived state.
 */
import { formatPrice } from '~/composables/shared/useListingUtils'

export interface OnboardingStep {
  key: string
  done: boolean
  label: string
}

export interface DashboardKpiStats {
  activeListings: number
  totalViews: number
  leadsThisMonth: number
  responseRate: number
}

export interface DashboardLead {
  id: string
  buyer_name: string | null
  buyer_email: string | null
  vehicle_brand: string | null
  vehicle_model: string | null
  status: string
  created_at: string | null
}

export interface DashboardVehicle {
  id: string
  brand: string
  model: string
  price: number | null
  views: number
}

export { formatPrice }

export function useDashboardIndex() {
  const { t } = useI18n()
  const { dealerProfile, stats, recentLeads, topVehicles, loading, error, loadDashboardData } =
    useDealerDashboard()
  const { userId } = useAuth()
  const { currentPlan, planLimits, fetchSubscription } = useSubscriptionPlan(
    userId.value || undefined,
  )
  const healthScore = ref<{ total: number } | null>(null)

  // ---------------------------------------------------------------------------
  // Formatting helpers
  // ---------------------------------------------------------------------------

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    })
  }

  function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      new: '#3B82F6',
      viewed: '#8B5CF6',
      contacted: '#F59E0B',
      negotiating: '#F97316',
      won: '#22C55E',
      lost: '#EF4444',
    }
    return colors[status] || '#64748B'
  }

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const onboardingComplete = computed(() => dealerProfile.value?.onboarding_completed ?? false)

  const onboardingSteps = computed<OnboardingStep[]>(() => {
    const dealer = dealerProfile.value
    if (!dealer) return []
    return [
      { key: 'email', done: true, label: t('dashboard.onboarding.verifyEmail') },
      {
        key: 'profile',
        done: !!(dealer.company_name && (dealer.phone || dealer.email)),
        label: t('dashboard.onboarding.companyProfile'),
      },
      {
        key: 'vehicle',
        done: (stats.value.activeListings || 0) > 0,
        label: t('dashboard.onboarding.firstVehicle'),
      },
      {
        key: 'portal',
        done: !!(dealer.logo_url && dealer.theme_primary),
        label: t('dashboard.onboarding.customizePortal'),
      },
      {
        key: 'publish',
        done: dealer.onboarding_completed ?? false,
        label: t('dashboard.onboarding.publish'),
      },
    ]
  })

  const onboardingProgress = computed(() => {
    const steps = onboardingSteps.value
    if (!steps.length) return 0
    return Math.round((steps.filter((s) => s.done).length / steps.length) * 100)
  })

  const healthScoreClass = computed(() => {
    const total = healthScore.value?.total ?? 0
    if (total >= 80) return 'score-high'
    if (total >= 50) return 'score-mid'
    return 'score-low'
  })

  // ---------------------------------------------------------------------------
  // Initialization (replaces onMounted)
  // ---------------------------------------------------------------------------

  async function init(): Promise<void> {
    await Promise.all([loadDashboardData(), fetchSubscription()])
    if (dealerProfile.value?.id) {
      const { score, calculateScore } = useDealerHealthScore(dealerProfile.value.id)
      await calculateScore()
      healthScore.value = score.value
    }
  }

  return {
    // State
    dealerProfile,
    stats,
    recentLeads,
    topVehicles,
    loading,
    error,
    healthScore,
    currentPlan,
    planLimits,

    // Derived
    onboardingComplete,
    onboardingSteps,
    onboardingProgress,
    healthScoreClass,

    // Helpers
    formatDate,
    getStatusColor,

    // Lifecycle
    init,
  }
}
