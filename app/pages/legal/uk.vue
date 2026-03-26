<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { t } = useI18n()

usePageSeo({
  title: t('legalUk.pageTitle'),
  description: t('legalUk.scopeText'),
  path: '/legal/uk',
})
</script>

<template>
  <div class="legal-uk-page">
    <UiBreadcrumbNav
      :items="[
        { label: $t('nav.home'), to: '/' },
        { label: $t('legal.title'), to: '/legal' },
        { label: t('legalUk.title') },
      ]"
    />
    <h1>{{ t('legalUk.title') }}</h1>

    <section class="legal-section">
      <h2>{{ t('legalUk.scopeTitle') }}</h2>
      <p>{{ t('legalUk.scopeText') }}</p>
    </section>

    <section class="legal-section">
      <h2>{{ t('legalUk.safetyTitle') }}</h2>
      <p>{{ t('legalUk.safetyText') }}</p>
    </section>

    <section class="legal-section">
      <h2>{{ t('legalUk.reportingTitle') }}</h2>
      <p>{{ t('legalUk.reportingText') }}</p>
    </section>

    <section class="legal-section">
      <h2>{{ t('legalUk.dataTitle') }}</h2>
      <p>{{ t('legalUk.dataText') }}</p>
    </section>

    <section class="legal-section">
      <h2>{{ t('legalUk.icoTitle') }}</h2>
      <p>{{ t('legalUk.icoText') }}</p>
    </section>

    <section class="legal-section">
      <h2>{{ t('legalUk.contactTitle') }}</h2>
      <p>{{ t('legalUk.contactText') }}</p>
    </section>
  </div>
</template>

<style scoped>
.legal-uk-page {
  max-width: 50rem;
  margin: 0 auto;
  padding: var(--spacing-4);
}

.legal-uk-page h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-6);
}

.legal-section {
  background: var(--bg-primary, white);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-5);
  margin-bottom: var(--spacing-4);
  box-shadow: var(--shadow-card);
}

.legal-section h2 {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary, var(--color-gray-800));
  margin: 0 0 0.625rem 0;
}

.legal-section p {
  font-size: 0.9rem;
  color: var(--text-secondary, var(--color-gray-600));
  line-height: 1.6;
  margin: 0;
}

@media (min-width: 48em) {
  .legal-uk-page {
    padding: var(--spacing-8) var(--spacing-4);
  }

  .legal-uk-page h1 {
    font-size: 1.75rem;
  }
}
</style>
