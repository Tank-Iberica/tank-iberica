<script setup lang="ts">
const {
  billingInterval,
  loading,
  checkoutError,
  isTrialEligible,
  openFaq,
  planCards,
  comparisonRows,
  faqs,
  toggleFaq,
  handleCta,
  init,
} = usePrecios()

onMounted(init)
</script>

<template>
  <div class="pricing-page">
    <div class="pricing-container">
      <PreciosHero />

      <PreciosBillingToggle :interval="billingInterval" @update="billingInterval = $event" />

      <!-- Trial note -->
      <p v-if="isTrialEligible" class="trial-note">{{ $t('pricing.trialNote') }}</p>

      <!-- Error -->
      <p v-if="checkoutError" class="checkout-error">{{ checkoutError }}</p>

      <!-- Loading overlay -->
      <p v-if="loading" class="checkout-loading">{{ $t('pricing.loadingCheckout') }}</p>

      <!-- Plan cards -->
      <div class="plans-grid">
        <PreciosPlanCard
          v-for="card in planCards"
          :key="card.plan"
          :card="card"
          :is-trial-eligible="isTrialEligible"
          :loading="loading"
          @cta="handleCta"
        />
      </div>

      <PreciosComparisonTable :rows="comparisonRows" />

      <PreciosFaq :faqs="faqs" :open-index="openFaq" @toggle="toggleFaq" />
    </div>
  </div>
</template>

<style scoped>
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

.trial-note {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-success);
  margin-bottom: var(--spacing-4);
}

/* ---- Plans grid ---- */
.plans-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-16);
}

@media (min-width: 480px) {
  .pricing-container {
    padding: 0 var(--spacing-6);
  }
}

@media (min-width: 768px) {
  .plans-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-5);
  }
}

@media (min-width: 1024px) {
  .plans-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-5);
  }
}
</style>
