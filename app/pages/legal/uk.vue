<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { t } = useI18n()

useHead({ title: t('legalUk.pageTitle') })
</script>

<template>
  <div class="legal-uk-page">
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
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}

.legal-uk-page h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
  margin-bottom: 24px;
}

.legal-section {
  background: var(--bg-primary, white);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.legal-section h2 {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary, #1e293b);
  margin: 0 0 10px 0;
}

.legal-section p {
  font-size: 0.9rem;
  color: var(--text-secondary, #475569);
  line-height: 1.6;
  margin: 0;
}

@media (min-width: 768px) {
  .legal-uk-page {
    padding: 32px 16px;
  }

  .legal-uk-page h1 {
    font-size: 1.75rem;
  }
}
</style>
