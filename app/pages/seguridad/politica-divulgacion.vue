<script setup lang="ts">
const { t } = useI18n()

usePageSeo({
  title: `${t('security.disclosure.title')} — ${t('site.title')}`,
  description: t('security.disclosure.seoDescription'),
  path: '/seguridad/politica-divulgacion',
})
</script>

<template>
  <div class="disclosure-page">
    <div class="disclosure-container">
      <h1>{{ t('security.disclosure.title') }}</h1>

      <section>
        <h2>{{ t('security.disclosure.whatToReport') }}</h2>
        <ul>
          <li>{{ t('security.disclosure.report1') }}</li>
          <li>{{ t('security.disclosure.report2') }}</li>
          <li>{{ t('security.disclosure.report3') }}</li>
          <li>{{ t('security.disclosure.report4') }}</li>
          <li>{{ t('security.disclosure.report5') }}</li>
        </ul>
      </section>

      <section>
        <h2>{{ t('security.disclosure.whatNotToReport') }}</h2>
        <ul>
          <li>{{ t('security.disclosure.notReport1') }}</li>
          <li>{{ t('security.disclosure.notReport2') }}</li>
          <li>{{ t('security.disclosure.notReport3') }}</li>
        </ul>
      </section>

      <section>
        <h2>{{ t('security.disclosure.howToReport') }}</h2>
        <p>{{ t('security.disclosure.howToReportText') }}</p>
        <p class="email-contact">
          <a :href="`mailto:security@${siteDomain}`">security@{{ siteDomain }}</a>
        </p>
        <p>{{ t('security.disclosure.includeInfo') }}</p>
        <ul>
          <li>{{ t('security.disclosure.info1') }}</li>
          <li>{{ t('security.disclosure.info2') }}</li>
          <li>{{ t('security.disclosure.info3') }}</li>
          <li>{{ t('security.disclosure.info4') }}</li>
        </ul>
      </section>

      <section>
        <h2>{{ t('security.disclosure.commitment') }}</h2>
        <ul>
          <li>{{ t('security.disclosure.commit1') }}</li>
          <li>{{ t('security.disclosure.commit2') }}</li>
          <li>{{ t('security.disclosure.commit3') }}</li>
        </ul>
      </section>

      <section>
        <h2>{{ t('security.disclosure.legalNotice') }}</h2>
        <p>{{ t('security.disclosure.legalText') }}</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.disclosure-page {
  padding: var(--spacing-6) var(--spacing-4);
  max-width: 50rem;
  margin: 0 auto;
}

.disclosure-container h1 {
  font-size: 1.75rem;
  margin-bottom: var(--spacing-6);
  color: var(--color-primary);
}

.disclosure-container h2 {
  font-size: 1.25rem;
  margin: 1.5rem 0 0.75rem;
  color: var(--text-primary);
}

.disclosure-container p {
  line-height: 1.6;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-3);
}

.disclosure-container ul {
  padding-left: var(--spacing-6);
  margin-bottom: var(--spacing-4);
}

.disclosure-container li {
  line-height: 1.6;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-2);
}

.email-contact {
  font-size: 1.1rem;
  font-weight: 600;
}

.email-contact a {
  color: var(--color-primary);
  text-decoration: underline;
}

section {
  border-bottom: 1px solid var(--color-gray-200);
  padding-bottom: var(--spacing-5);
}

section:last-child {
  border-bottom: none;
}
</style>
