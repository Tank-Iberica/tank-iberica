<script setup lang="ts">
/**
 * Plan Management
 * Current plan, comparison table, upgrade CTAs, subscription info.
 */
import { PLAN_LIMITS, type PlanType } from '~/composables/useSubscriptionPlan'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const { userId } = useAuth()
const { currentPlan, subscription, planLimits, fetchSubscription } = useSubscriptionPlan(
  userId.value || undefined,
)

const loading = ref(true)

onMounted(async () => {
  await fetchSubscription()
  loading.value = false
})

const plans: PlanType[] = ['free', 'basic', 'premium', 'founding']

function getPlanPrice(plan: PlanType): string {
  const prices: Record<PlanType, string> = {
    free: '0',
    basic: '29',
    premium: '79',
    founding: '0',
  }
  return prices[plan]
}

function isCurrentPlan(plan: PlanType): boolean {
  return currentPlan.value === plan
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatListings(count: number): string {
  if (count === Infinity) return t('dashboard.subscription.unlimited')
  return String(count)
}
</script>

<template>
  <div class="subscription-page">
    <header class="page-header">
      <h1>{{ t('dashboard.subscription.title') }}</h1>
    </header>

    <div v-if="loading" class="loading-state" aria-busy="true">
      <UiSkeletonCard :lines="4" />
    </div>

    <template v-else>
      <!-- Current Plan -->
      <div class="current-plan-card">
        <div class="plan-info">
          <span class="plan-label">{{ t('dashboard.subscription.currentPlan') }}</span>
          <span class="plan-name">{{ t(`dashboard.plans.${currentPlan}`) }}</span>
        </div>
        <div class="plan-details">
          <span
            >{{ t('dashboard.subscription.listings') }}:
            {{ formatListings(planLimits.maxActiveListings) }}</span
          >
          <span
            >{{ t('dashboard.subscription.photos') }}: {{ planLimits.maxPhotosPerListing }}/{{
              t('dashboard.subscription.perListing')
            }}</span
          >
        </div>
        <div v-if="subscription?.expires_at" class="plan-expiry">
          {{ t('dashboard.subscription.expiresOn') }}: {{ formatDate(subscription.expires_at) }}
        </div>
      </div>

      <!-- Plan Comparison -->
      <section class="comparison-section">
        <h2>{{ t('dashboard.subscription.comparePlans') }}</h2>
        <div class="plans-grid">
          <div
            v-for="plan in plans"
            :key="plan"
            class="plan-card"
            :class="{ current: isCurrentPlan(plan), featured: plan === 'premium' }"
          >
            <div v-if="plan === 'premium'" class="popular-tag">
              {{ t('dashboard.subscription.popular') }}
            </div>
            <h3>{{ t(`dashboard.plans.${plan}`) }}</h3>
            <div class="plan-price">
              <span class="price-amount">{{ getPlanPrice(plan) }}&euro;</span>
              <span v-if="plan !== 'founding'" class="price-period"
                >/{{ t('dashboard.subscription.month') }}</span
              >
              <span v-else class="price-period">{{ t('dashboard.subscription.forever') }}</span>
            </div>

            <ul class="plan-features">
              <li>
                {{ formatListings(PLAN_LIMITS[plan].maxActiveListings) }}
                {{ t('dashboard.subscription.listings') }}
              </li>
              <li>
                {{ PLAN_LIMITS[plan].maxPhotosPerListing }}
                {{ t('dashboard.subscription.photosPerAd') }}
              </li>
              <li v-if="PLAN_LIMITS[plan].badge !== 'none'">Badge {{ PLAN_LIMITS[plan].badge }}</li>
              <li v-if="PLAN_LIMITS[plan].whatsappPublishing">WhatsApp</li>
              <li v-if="PLAN_LIMITS[plan].embeddableWidget">Widget</li>
              <li v-if="PLAN_LIMITS[plan].catalogExport">
                {{ t('dashboard.subscription.export') }}
              </li>
              <li v-if="PLAN_LIMITS[plan].demandAlerts">
                {{ t('dashboard.subscription.alerts') }}
              </li>
            </ul>

            <div v-if="isCurrentPlan(plan)" class="current-badge">
              {{ t('dashboard.subscription.currentPlan') }}
            </div>
            <NuxtLink
              v-else
              to="/precios"
              class="btn-plan"
              :class="{ primary: plan === 'premium' }"
            >
              {{
                plan === 'founding'
                  ? t('dashboard.subscription.requestSlot')
                  : t('dashboard.subscription.upgrade')
              }}
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- Cancel Option -->
      <div
        v-if="subscription?.status === 'active' && currentPlan !== 'free'"
        class="cancel-section"
      >
        <p>{{ t('dashboard.subscription.cancelInfo') }}</p>
        <NuxtLink to="/precios" class="btn-text">
          {{ t('dashboard.subscription.manageBilling') }}
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<style scoped>
.subscription-page {
  max-width: 62.5rem;
  margin: 0 auto;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: var(--spacing-10);
}

.spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 3px solid var(--color-gray-200);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Current Plan Card */
.current-plan-card {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: white;
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
}

.plan-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-3);
}

.plan-label {
  font-size: 0.85rem;
  opacity: 0.8;
}

.plan-name {
  font-size: 1.25rem;
  font-weight: 700;
}

.plan-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  font-size: 0.9rem;
  opacity: 0.9;
}

.plan-expiry {
  margin-top: var(--spacing-3);
  padding-top: var(--spacing-3);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 0.85rem;
  opacity: 0.8;
}

/* Comparison */
.comparison-section h2 {
  margin: 0 0 var(--spacing-4) 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.plans-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
}

.plan-card {
  background: var(--bg-primary);
  border: 2px solid var(--color-gray-200);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.plan-card.current {
  border-color: var(--color-primary);
}

.plan-card.featured {
  border-color: var(--color-info);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.popular-tag {
  position: absolute;
  top: -12px;
  right: 1rem;
  background: var(--color-info);
  color: white;
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius-md);
  font-size: 0.75rem;
  font-weight: 600;
}

.plan-card h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
}

.plan-price {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-1);
}

.price-amount {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-primary);
}

.price-period {
  font-size: 0.85rem;
  color: var(--text-auxiliary);
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.plan-features li {
  font-size: 0.85rem;
  color: var(--text-secondary);
  padding-left: var(--spacing-5);
  position: relative;
}

.plan-features li::before {
  content: '\2713';
  position: absolute;
  left: 0;
  color: var(--color-success);
  font-weight: 700;
}

.current-badge {
  padding: 0.625rem;
  background: var(--color-success-bg, var(--color-success-bg));
  border: 1px solid var(--color-success-border);
  border-radius: var(--border-radius);
  text-align: center;
  font-weight: 600;
  color: var(--color-success);
  font-size: 0.9rem;
}

.btn-plan {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem var(--spacing-5);
  border: 2px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-plan:hover {
  background: var(--bg-secondary);
}

.btn-plan.primary {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.btn-plan.primary:hover {
  background: var(--color-primary-dark);
}

.cancel-section {
  text-align: center;
  padding: var(--spacing-5);
  color: var(--text-auxiliary);
  font-size: 0.9rem;
}

.cancel-section p {
  margin: 0 0 var(--spacing-2) 0;
}

.btn-text {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
}

.btn-text:hover {
  text-decoration: underline;
}

@media (min-width: 48em) {
  .subscription-page {
    padding: var(--spacing-6);
  }
  .plans-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .plan-details {
    flex-direction: row;
    gap: var(--spacing-6);
  }
}

@media (min-width: 64em) {
  .plans-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
