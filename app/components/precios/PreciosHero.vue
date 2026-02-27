<template>
  <section class="pricing-hero">
    <h1 class="pricing-title">{{ $t('pricing.title') }}</h1>
    <p class="pricing-subtitle">{{ $t('pricing.subtitle') }}</p>
  </section>
</template>

<style scoped>
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

@media (min-width: 768px) {
  .pricing-title {
    font-size: var(--font-size-3xl);
  }

  .pricing-subtitle {
    font-size: var(--font-size-lg);
  }
}

@media (min-width: 1024px) {
  .pricing-title {
    font-size: var(--font-size-4xl);
  }
}
</style>
