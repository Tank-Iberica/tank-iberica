<script setup lang="ts">
import type { PlanType } from '~/composables/useSubscriptionPlan'
import type { PlanCardData } from '~/composables/usePrecios'

defineProps<{
  card: PlanCardData
  isTrialEligible: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'cta', plan: PlanType): void
}>()
</script>

<template>
  <div
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

    <!-- Trial badge -->
    <span
      v-if="isTrialEligible && (card.plan === 'basic' || card.plan === 'premium')"
      class="trial-badge"
    >
      {{ $t('pricing.trialBadge') }}
    </span>

    <!-- Founding label -->
    <span v-if="card.founding" class="founding-label">
      {{ $t('pricing.foundingSlots') }}
    </span>

    <h2 class="plan-name">{{ card.name }}</h2>

    <div class="plan-price">
      <span class="price-amount">{{ card.price }}<span class="price-currency">&euro;</span></span>
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
      @click="emit('cta', card.plan)"
    >
      <template v-if="card.plan === 'free'">{{ $t('pricing.startFree') }}</template>
      <template v-else-if="card.founding">{{ $t('pricing.requestSlot') }}</template>
      <template v-else>{{ $t('pricing.subscribe') }}</template>
    </button>
  </div>
</template>

<style scoped>
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

/* ---- Trial badge ---- */
.trial-badge {
  display: inline-block;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-success);
  background: rgba(16, 185, 129, 0.1);
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius-full);
  margin-bottom: var(--spacing-2);
  align-self: flex-start;
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

@media (min-width: 1024px) {
  .plan-card--popular {
    transform: scale(1.03);
    z-index: 1;
  }
}
</style>
