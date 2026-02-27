<script setup lang="ts">
/**
 * Hero section for the valuation page.
 * Pure presentational — only uses i18n keys.
 */
</script>

<template>
  <section class="valuation-hero">
    <div class="hero-content">
      <h1 class="hero-title">{{ $t('valuation.heroTitle') }}</h1>
      <p class="hero-subtitle">{{ $t('valuation.heroSubtitle') }}</p>
    </div>
  </section>
</template>

<style scoped>
.valuation-hero {
  background: var(--color-primary);
  padding: var(--spacing-10) var(--spacing-4) var(--spacing-8);
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.hero-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-white);
  margin-bottom: var(--spacing-3);
  line-height: var(--line-height-tight);
}

.hero-subtitle {
  font-size: var(--font-size-base);
  color: var(--text-on-dark-secondary);
  line-height: var(--line-height-relaxed);
  max-width: 560px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .valuation-hero {
    padding: var(--spacing-16) var(--spacing-6) var(--spacing-12);
  }

  .hero-title {
    font-size: var(--font-size-3xl);
  }

  .hero-subtitle {
    font-size: var(--font-size-lg);
  }
}

@media (min-width: 1024px) {
  .hero-title {
    font-size: var(--font-size-4xl);
  }
}
</style>
