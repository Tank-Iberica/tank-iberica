<template>
  <div class="legal-page">
    <div class="legal-container">
      <NuxtLink to="/legal" class="legal-back"> &larr; {{ $t('legal.backToLegal') }} </NuxtLink>

      <h1 class="legal-title">{{ $t('legal.cookies') }}</h1>

      <section class="legal-section">
        <p>{{ $t('legal.cookiesText') }}</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

usePageSeo({
  title: t('legal.cookiesSeoTitle'),
  description: t('legal.cookiesSeoDescription'),
  path: '/legal/cookies',
})
</script>

<style scoped>
.legal-page {
  min-height: 60vh;
  padding: 1.5rem 0 3rem;
}

.legal-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

.legal-back {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 8px 0;
  color: var(--color-primary);
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  margin-bottom: 1rem;
  transition: opacity 0.2s;
}

.legal-back:hover {
  opacity: 0.7;
}

.legal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 2rem;
}

.legal-section {
  margin-bottom: 2.5rem;
}

.legal-section p {
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-secondary);
}

@media (min-width: 480px) {
  .legal-container {
    padding: 0 1.5rem;
  }
}

@media (min-width: 768px) {
  .legal-title {
    font-size: 1.75rem;
  }

  .legal-section p {
    font-size: 16px;
  }
}
</style>
