<script setup lang="ts">
import type { PlanType } from '~/composables/useSubscriptionPlan'

const { t } = useI18n()
const user = useSupabaseUser()
const localePath = useLocalePath()

const billingInterval = ref<'month' | 'year'>('month')
const loading = ref(false)
const checkoutError = ref('')

useHead({
  title: t('pricing.seoTitle'),
  meta: [{ name: 'description', content: t('pricing.seoDescription') }],
})

/** Prices indexed by plan + interval */
const prices = computed(() => ({
  basic: {
    month: t('pricing.priceBasicMonth'),
    year: t('pricing.priceBasicYear'),
  },
  premium: {
    month: t('pricing.pricePremiumMonth'),
    year: t('pricing.pricePremiumYear'),
  },
}))

/** Feature list per plan card */
const planCards = computed(() => [
  {
    plan: 'free' as PlanType,
    name: t('pricing.planFree'),
    price: '0',
    suffix: '',
    highlighted: false,
    founding: false,
    features: [
      t('pricing.featureListings', { count: 3 }),
      t('pricing.featurePhotos', { count: 5 }),
      t('pricing.featureBasicProfile'),
      t('pricing.featureBasicStats'),
    ],
  },
  {
    plan: 'basic' as PlanType,
    name: t('pricing.planBasic'),
    price: prices.value.basic[billingInterval.value],
    suffix: billingInterval.value === 'month' ? t('pricing.month') : t('pricing.year'),
    highlighted: true,
    founding: false,
    features: [
      t('pricing.featureListings', { count: 20 }),
      t('pricing.featurePhotos', { count: 15 }),
      t('pricing.featureFullProfile'),
      t('pricing.featureStandardStats'),
      t('pricing.featureBadgeBasic'),
      t('pricing.featureWhatsapp'),
      t('pricing.featureExport'),
      t('pricing.featureAiListings', { count: 20 }),
    ],
  },
  {
    plan: 'premium' as PlanType,
    name: t('pricing.planPremium'),
    price: prices.value.premium[billingInterval.value],
    suffix: billingInterval.value === 'month' ? t('pricing.month') : t('pricing.year'),
    highlighted: false,
    founding: false,
    features: [
      t('pricing.featureListingsUnlimited'),
      t('pricing.featurePhotos', { count: 30 }),
      t('pricing.featureFullProfileCover'),
      t('pricing.featureFullStats'),
      t('pricing.featureBadgePremium'),
      t('pricing.featureWhatsapp'),
      t('pricing.featureWidget'),
      t('pricing.featureExport'),
      t('pricing.featureDemandAlerts'),
      t('pricing.featureAiListingsUnlimited'),
      t('pricing.featurePriority'),
    ],
  },
  {
    plan: 'founding' as PlanType,
    name: t('pricing.planFounding'),
    price: '0',
    suffix: '',
    highlighted: false,
    founding: true,
    features: [
      t('pricing.featureEverythingPremium'),
      t('pricing.featureBadgeFounding'),
      t('pricing.foundingForever'),
    ],
  },
])

/** Comparison table rows */
const comparisonRows = computed(() => [
  {
    label: t('pricing.compareActiveListings'),
    free: '3',
    basic: '20',
    premium: t('pricing.compareUnlimited'),
    founding: t('pricing.compareUnlimited'),
  },
  {
    label: t('pricing.comparePhotosPerListing'),
    free: '5',
    basic: '15',
    premium: '30',
    founding: '30',
  },
  {
    label: t('pricing.comparePublicProfile'),
    free: t('pricing.compareBasic'),
    basic: t('pricing.compareFull'),
    premium: t('pricing.compareFullCover'),
    founding: t('pricing.compareFullCover'),
  },
  {
    label: t('pricing.compareStats'),
    free: t('pricing.compareStatsBasic'),
    basic: t('pricing.compareStatsStandard'),
    premium: t('pricing.compareStatsFull'),
    founding: t('pricing.compareStatsFull'),
  },
  {
    label: t('pricing.compareBadge'),
    free: false,
    basic: true,
    premium: true,
    founding: true,
  },
  {
    label: t('pricing.compareWhatsapp'),
    free: false,
    basic: true,
    premium: true,
    founding: true,
  },
  {
    label: t('pricing.compareWidget'),
    free: false,
    basic: false,
    premium: true,
    founding: true,
  },
  {
    label: t('pricing.compareExport'),
    free: false,
    basic: true,
    premium: true,
    founding: true,
  },
  {
    label: t('pricing.compareDemandAlerts'),
    free: false,
    basic: false,
    premium: true,
    founding: true,
  },
  {
    label: t('pricing.compareAiListings'),
    free: '3' + t('pricing.comparePerMonth'),
    basic: '20' + t('pricing.comparePerMonth'),
    premium: t('pricing.compareUnlimited'),
    founding: t('pricing.compareUnlimited'),
  },
  {
    label: t('pricing.comparePriority'),
    free: false,
    basic: false,
    premium: true,
    founding: true,
  },
])

/** FAQ items */
const faqs = computed(() => [
  { question: t('pricing.faq1Question'), answer: t('pricing.faq1Answer') },
  { question: t('pricing.faq2Question'), answer: t('pricing.faq2Answer') },
  { question: t('pricing.faq3Question'), answer: t('pricing.faq3Answer') },
  { question: t('pricing.faq4Question'), answer: t('pricing.faq4Answer') },
])

const openFaq = ref<number | null>(null)

function toggleFaq(index: number) {
  openFaq.value = openFaq.value === index ? null : index
}

async function startCheckout(plan: 'basic' | 'premium') {
  if (!user.value) {
    navigateTo(localePath('/login'))
    return
  }

  loading.value = true
  checkoutError.value = ''

  try {
    const response = await $fetch<{ url: string }>('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'x-requested-with': 'XMLHttpRequest' },
      body: {
        plan,
        interval: billingInterval.value,
        userId: user.value.id,
        successUrl: `${window.location.origin}${localePath('/admin/productos')}?checkout=success`,
        cancelUrl: `${window.location.origin}${localePath('/precios')}?checkout=cancelled`,
      },
    })

    if (response.url) {
      window.location.href = response.url
    }
  } catch {
    checkoutError.value = t('pricing.checkoutError')
  } finally {
    loading.value = false
  }
}

function handleCta(plan: PlanType) {
  if (plan === 'free') {
    navigateTo(localePath(user.value ? '/admin/productos' : '/login'))
  } else if (plan === 'founding') {
    window.location.href = 'mailto:tankiberica@gmail.com?subject=Solicitud%20Founding%20Dealer'
  } else {
    startCheckout(plan as 'basic' | 'premium')
  }
}
</script>

<template>
  <div class="pricing-page">
    <div class="pricing-container">
      <!-- Hero -->
      <section class="pricing-hero">
        <h1 class="pricing-title">{{ $t('pricing.title') }}</h1>
        <p class="pricing-subtitle">{{ $t('pricing.subtitle') }}</p>
      </section>

      <!-- Billing toggle -->
      <div class="billing-toggle">
        <button
          class="toggle-btn"
          :class="{ 'toggle-btn--active': billingInterval === 'month' }"
          @click="billingInterval = 'month'"
        >
          {{ $t('pricing.monthly') }}
        </button>
        <button
          class="toggle-btn"
          :class="{ 'toggle-btn--active': billingInterval === 'year' }"
          @click="billingInterval = 'year'"
        >
          {{ $t('pricing.annual') }}
          <span class="save-badge">{{ $t('pricing.savePercent') }}</span>
        </button>
      </div>

      <!-- Error -->
      <p v-if="checkoutError" class="checkout-error">{{ checkoutError }}</p>

      <!-- Loading overlay -->
      <p v-if="loading" class="checkout-loading">{{ $t('pricing.loadingCheckout') }}</p>

      <!-- Plan cards -->
      <div class="plans-grid">
        <div
          v-for="card in planCards"
          :key="card.plan"
          class="plan-card"
          :class="{
            'plan-card--popular': card.highlighted,
            'plan-card--founding': card.founding,
          }"
        >
          <!-- Popular badge -->
          <span v-if="card.highlighted" class="popular-badge">
            {{ $t('pricing.popular') }}
          </span>

          <!-- Founding label -->
          <span v-if="card.founding" class="founding-label">
            {{ $t('pricing.foundingSlots') }}
          </span>

          <h2 class="plan-name">{{ card.name }}</h2>

          <div class="plan-price">
            <span class="price-amount"
              >{{ card.price }}<span class="price-currency">&euro;</span></span
            >
            <span v-if="card.suffix" class="price-suffix">/{{ card.suffix }}</span>
          </div>

          <ul class="plan-features">
            <li v-for="(feature, idx) in card.features" :key="idx" class="plan-feature">
              <span class="feature-check" aria-hidden="true">&#10003;</span>
              {{ feature }}
            </li>
          </ul>

          <button
            class="plan-cta"
            :class="{
              'plan-cta--primary': card.highlighted,
              'plan-cta--founding': card.founding,
              'plan-cta--outline': !card.highlighted && !card.founding,
            }"
            :disabled="loading"
            @click="handleCta(card.plan)"
          >
            <template v-if="card.plan === 'free'">{{ $t('pricing.startFree') }}</template>
            <template v-else-if="card.founding">{{ $t('pricing.requestSlot') }}</template>
            <template v-else>{{ $t('pricing.subscribe') }}</template>
          </button>
        </div>
      </div>

      <!-- Feature comparison table -->
      <section class="comparison-section">
        <h2 class="comparison-title">{{ $t('pricing.compareTitle') }}</h2>
        <div class="comparison-table-wrapper">
          <table class="comparison-table">
            <thead>
              <tr>
                <th class="comparison-feature-header">&nbsp;</th>
                <th>{{ $t('pricing.planFree') }}</th>
                <th>{{ $t('pricing.planBasic') }}</th>
                <th>{{ $t('pricing.planPremium') }}</th>
                <th>{{ $t('pricing.planFounding') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in comparisonRows" :key="idx">
                <td class="comparison-feature-cell">{{ row.label }}</td>
                <td
                  v-for="plan in ['free', 'basic', 'premium', 'founding'] as const"
                  :key="plan"
                  class="comparison-value-cell"
                >
                  <template v-if="typeof row[plan] === 'boolean'">
                    <span v-if="row[plan]" class="check-icon" aria-label="Yes">&#10003;</span>
                    <span v-else class="cross-icon" aria-label="No">&#10007;</span>
                  </template>
                  <template v-else>
                    {{ row[plan] }}
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- FAQ -->
      <section class="faq-section">
        <h2 class="faq-title">{{ $t('pricing.faqTitle') }}</h2>
        <div class="faq-list">
          <div
            v-for="(faq, idx) in faqs"
            :key="idx"
            class="faq-item"
            :class="{ 'faq-item--open': openFaq === idx }"
          >
            <button class="faq-question" @click="toggleFaq(idx)">
              <span>{{ faq.question }}</span>
              <span class="faq-icon" aria-hidden="true">{{ openFaq === idx ? '−' : '+' }}</span>
            </button>
            <div v-if="openFaq === idx" class="faq-answer">
              <p>{{ faq.answer }}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* ================================================
   Pricing Page — Mobile-first (360px base)
   ================================================ */

.pricing-page {
  min-height: 60vh;
  padding: var(--spacing-6) 0 var(--spacing-16);
  background: var(--bg-secondary);
}

.pricing-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

/* ---- Hero ---- */
.pricing-hero {
  text-align: center;
  margin-bottom: var(--spacing-8);
}

.pricing-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-3);
  line-height: var(--line-height-tight);
}

.pricing-subtitle {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  max-width: 600px;
  margin: 0 auto;
}

/* ---- Billing toggle ---- */
.billing-toggle {
  display: flex;
  justify-content: center;
  gap: var(--spacing-1);
  margin-bottom: var(--spacing-8);
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-full);
  padding: var(--spacing-1);
  max-width: 320px;
  margin-left: auto;
  margin-right: auto;
}

.toggle-btn {
  flex: 1;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  background: transparent;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  min-height: 44px;
  min-width: auto;
}

.toggle-btn--active {
  background: var(--bg-primary);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  box-shadow: var(--shadow-sm);
}

.save-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-success);
  background: rgba(16, 185, 129, 0.1);
  padding: 2px 6px;
  border-radius: var(--border-radius-full);
  white-space: nowrap;
}

/* ---- Checkout feedback ---- */
.checkout-error {
  text-align: center;
  color: var(--color-error);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-4);
}

.checkout-loading {
  text-align: center;
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-4);
}

/* ---- Plans grid ---- */
.plans-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-16);
}

.plan-card {
  position: relative;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  transition: box-shadow var(--transition-fast);
}

.plan-card:hover {
  box-shadow: var(--shadow-md);
}

.plan-card--popular {
  border: 2px solid var(--color-primary);
  box-shadow: var(--shadow-md);
}

.plan-card--founding {
  border: 2px solid var(--color-gold);
  background: linear-gradient(135deg, var(--bg-primary) 0%, rgba(212, 160, 23, 0.04) 100%);
}

/* ---- Popular badge ---- */
.popular-badge {
  position: absolute;
  top: -12px;
  right: var(--spacing-4);
  background: var(--color-primary);
  color: var(--color-white);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius-full);
  letter-spacing: 0.02em;
}

/* ---- Founding label ---- */
.founding-label {
  display: inline-block;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gold-dark);
  background: rgba(212, 160, 23, 0.12);
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius-full);
  margin-bottom: var(--spacing-3);
  align-self: flex-start;
}

/* ---- Plan name & price ---- */
.plan-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-3);
}

.plan-price {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-1);
  margin-bottom: var(--spacing-5);
}

.price-amount {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-extrabold);
  color: var(--text-primary);
  line-height: 1;
}

.price-currency {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
}

.price-suffix {
  font-size: var(--font-size-base);
  color: var(--text-auxiliary);
  font-weight: var(--font-weight-normal);
}

/* ---- Features list ---- */
.plan-features {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--spacing-6) 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.plan-feature {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-normal);
}

.feature-check {
  color: var(--color-success);
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
  margin-top: 1px;
}

/* ---- CTA button ---- */
.plan-cta {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  min-height: 44px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.plan-cta--primary {
  background: var(--color-primary);
  color: var(--color-white);
  border: 2px solid var(--color-primary);
}

.plan-cta--primary:hover {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.plan-cta--outline {
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
}

.plan-cta--outline:hover {
  background: var(--color-primary);
  color: var(--color-white);
}

.plan-cta--founding {
  background: var(--color-gold);
  color: var(--color-white);
  border: 2px solid var(--color-gold);
}

.plan-cta--founding:hover {
  background: var(--color-gold-dark);
  border-color: var(--color-gold-dark);
}

.plan-cta:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ---- Comparison table ---- */
.comparison-section {
  margin-bottom: var(--spacing-16);
}

.comparison-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  text-align: center;
  margin-bottom: var(--spacing-6);
}

.comparison-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  background: var(--bg-primary);
}

.comparison-table {
  width: 100%;
  min-width: 600px;
  border-collapse: collapse;
}

.comparison-table thead {
  background: var(--color-primary);
}

.comparison-table th {
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  text-align: center;
  white-space: nowrap;
}

.comparison-feature-header {
  text-align: left !important;
  min-width: 160px;
}

.comparison-table td {
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  border-bottom: 1px solid var(--border-color-light);
  text-align: center;
}

.comparison-feature-cell {
  text-align: left !important;
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
}

.comparison-value-cell {
  color: var(--text-secondary);
}

.comparison-table tbody tr:last-child td {
  border-bottom: none;
}

.comparison-table tbody tr:hover {
  background: var(--color-gray-50);
}

.check-icon {
  color: var(--color-success);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-base);
}

.cross-icon {
  color: var(--color-gray-400);
  font-size: var(--font-size-base);
}

/* ---- FAQ ---- */
.faq-section {
  max-width: 800px;
  margin: 0 auto;
}

.faq-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  text-align: center;
  margin-bottom: var(--spacing-6);
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.faq-item {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  transition: border-color var(--transition-fast);
}

.faq-item--open {
  border-color: var(--color-primary);
}

.faq-question {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4) var(--spacing-5);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  text-align: left;
  background: transparent;
  cursor: pointer;
  min-height: 44px;
  min-width: auto;
  gap: var(--spacing-3);
  transition: background var(--transition-fast);
}

.faq-question:hover {
  background: var(--color-gray-50);
}

.faq-icon {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  flex-shrink: 0;
  line-height: 1;
}

.faq-answer {
  padding: 0 var(--spacing-5) var(--spacing-5);
}

.faq-answer p {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
}

/* ================================================
   Responsive — 480px (large mobile)
   ================================================ */
@media (min-width: 480px) {
  .pricing-container {
    padding: 0 var(--spacing-6);
  }
}

/* ================================================
   Responsive — 768px (tablet)
   ================================================ */
@media (min-width: 768px) {
  .pricing-title {
    font-size: var(--font-size-3xl);
  }

  .pricing-subtitle {
    font-size: var(--font-size-lg);
  }

  .plans-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-5);
  }

  .comparison-title,
  .faq-title {
    font-size: var(--font-size-2xl);
  }
}

/* ================================================
   Responsive — 1024px (desktop)
   ================================================ */
@media (min-width: 1024px) {
  .pricing-title {
    font-size: var(--font-size-4xl);
  }

  .plans-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-5);
  }

  .plan-card--popular {
    transform: scale(1.03);
    z-index: 1;
  }
}
</style>
