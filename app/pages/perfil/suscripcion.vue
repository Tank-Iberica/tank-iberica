<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

const { t } = useI18n()
const { userId } = useAuth()
const { currentPlan, subscription, loading, fetchSubscription } = useSubscriptionPlan()

/** Plan comparison data */
interface PlanInfo {
  key: string
  nameKey: string
  priceKey: string
  features: string[]
  highlighted: boolean
}

const plans: PlanInfo[] = [
  {
    key: 'free',
    nameKey: 'profile.subscription.planFree',
    priceKey: 'profile.subscription.priceFree',
    features: [
      'profile.subscription.featureBasicAccess',
      'profile.subscription.featureSaveFavorites',
      'profile.subscription.featureSearchAlerts',
      'profile.subscription.featureContactDealers',
    ],
    highlighted: false,
  },
  {
    key: 'pro_monthly',
    nameKey: 'profile.subscription.planProMonthly',
    priceKey: 'profile.subscription.priceProMonthly',
    features: [
      'profile.subscription.featureEverythingFree',
      'profile.subscription.featurePrioritySupport',
      'profile.subscription.featureAdvancedAlerts',
      'profile.subscription.featureMarketInsights',
    ],
    highlighted: true,
  },
  {
    key: 'pro_annual',
    nameKey: 'profile.subscription.planProAnnual',
    priceKey: 'profile.subscription.priceProAnnual',
    features: [
      'profile.subscription.featureEverythingPro',
      'profile.subscription.featureAnnualSavings',
    ],
    highlighted: false,
  },
]

const expiresAt = computed(() => {
  if (!subscription.value?.expires_at) return null
  return new Date(subscription.value.expires_at).toLocaleDateString()
})

const isPaid = computed(() => {
  return currentPlan.value !== 'free'
})

useHead({
  title: t('profile.subscription.title'),
})

onMounted(() => {
  if (userId.value) {
    fetchSubscription(userId.value)
  }
})
</script>

<template>
  <div class="subscription-page">
    <div class="subscription-container">
      <h1 class="page-title">
        {{ $t('profile.subscription.title') }}
      </h1>
      <p class="page-subtitle">
        {{ $t('profile.subscription.subtitle') }}
      </p>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        {{ $t('common.loading') }}
      </div>

      <template v-else>
        <!-- Current plan card -->
        <div class="current-plan-card">
          <div class="current-plan-header">
            <h2 class="current-plan-label">{{ $t('profile.subscription.currentPlan') }}</h2>
            <span class="current-plan-name">{{ currentPlan }}</span>
          </div>

          <template v-if="isPaid">
            <div class="current-plan-details">
              <div v-if="expiresAt" class="plan-detail">
                <span class="plan-detail-label">{{ $t('profile.subscription.expiresAt') }}</span>
                <span class="plan-detail-value">{{ expiresAt }}</span>
              </div>
              <div v-if="subscription?.stripe_subscription_id" class="plan-detail">
                <span class="plan-detail-label">{{ $t('profile.subscription.managedVia') }}</span>
                <span class="plan-detail-value">Stripe</span>
              </div>
            </div>
            <button class="btn-outline">
              {{ $t('profile.subscription.managePlan') }}
            </button>
          </template>

          <p v-else class="current-plan-free-note">
            {{ $t('profile.subscription.freeNote') }}
          </p>
        </div>

        <!-- Plan comparison -->
        <section class="plans-section">
          <h2 class="section-title">
            {{ $t('profile.subscription.comparePlans') }}
          </h2>

          <div class="plans-grid">
            <div
              v-for="plan in plans"
              :key="plan.key"
              class="plan-card"
              :class="{ 'plan-card--highlighted': plan.highlighted }"
            >
              <div v-if="plan.highlighted" class="plan-badge">
                {{ $t('profile.subscription.recommended') }}
              </div>
              <h3 class="plan-name">{{ $t(plan.nameKey) }}</h3>
              <p class="plan-price">{{ $t(plan.priceKey) }}</p>
              <ul class="plan-features">
                <li v-for="feature in plan.features" :key="feature" class="plan-feature">
                  <svg
                    class="check-icon"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    width="16"
                    height="16"
                    aria-hidden="true"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  {{ $t(feature) }}
                </li>
              </ul>
              <button
                class="plan-cta"
                :class="{
                  'plan-cta--primary': plan.highlighted,
                  'plan-cta--outline': !plan.highlighted,
                }"
                :disabled="currentPlan === plan.key"
              >
                <template v-if="currentPlan === plan.key">
                  {{ $t('profile.subscription.currentPlanLabel') }}
                </template>
                <template v-else>
                  {{ $t('profile.subscription.upgrade') }}
                </template>
              </button>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.subscription-page {
  min-height: 60vh;
  padding: 1.5rem 0 3rem;
}

.subscription-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: 0.25rem;
}

.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

/* Loading */
.loading-state {
  text-align: center;
  padding: 3rem 1rem;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* Current plan card */
.current-plan-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  padding: 1.25rem 1rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-sm);
}

.current-plan-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.current-plan-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.current-plan-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  text-transform: capitalize;
}

.current-plan-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.plan-detail {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-sm);
}

.plan-detail-label {
  color: var(--text-auxiliary);
}

.plan-detail-value {
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.current-plan-free-note {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}

.btn-outline {
  display: inline-block;
  padding: 0.625rem 1.25rem;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  background: transparent;
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
  min-height: 44px;
}

.btn-outline:hover {
  background: var(--color-primary);
  color: var(--color-white);
}

/* Plans section */
.plans-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  margin-bottom: 1rem;
}

/* Plans grid — stacked on mobile */
.plans-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.plan-card {
  position: relative;
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  padding: 1.25rem 1rem;
  box-shadow: var(--shadow-sm);
}

.plan-card--highlighted {
  border-color: var(--color-primary);
  border-width: 2px;
}

.plan-badge {
  position: absolute;
  top: -0.625rem;
  left: 1rem;
  padding: 0.125rem 0.625rem;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  background: var(--color-primary);
  border-radius: var(--border-radius-full);
}

.plan-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.plan-price {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.plan-features {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.plan-feature {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.check-icon {
  color: var(--color-success);
  flex-shrink: 0;
}

/* CTA buttons */
.plan-cta {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
  min-height: 44px;
}

.plan-cta--primary {
  color: var(--color-white);
  background: var(--color-primary);
  border: none;
}

.plan-cta--primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.plan-cta--outline {
  color: var(--color-primary);
  background: transparent;
  border: 2px solid var(--color-primary);
}

.plan-cta--outline:hover:not(:disabled) {
  background: var(--color-primary);
  color: var(--color-white);
}

.plan-cta:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ---- Tablet ---- */
@media (min-width: 768px) {
  .subscription-container {
    padding: 0 2rem;
  }

  .page-title {
    font-size: var(--font-size-3xl);
  }

  .page-subtitle {
    font-size: var(--font-size-base);
    margin-bottom: 2rem;
  }

  .current-plan-card {
    padding: 1.5rem;
  }

  .plans-grid {
    flex-direction: row;
  }

  .plan-card {
    flex: 1;
    padding: 1.5rem;
  }
}

/* ---- Desktop ---- */
@media (min-width: 1024px) {
  .plans-grid {
    gap: 1.25rem;
  }
}
</style>
