<script setup lang="ts">
const { t } = useI18n()

useHead({
  title: t('security.disclosure.title'),
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
          <a href="mailto:security@tracciona.com">security@tracciona.com</a>
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
  padding: 24px 16px;
  max-width: 800px;
  margin: 0 auto;
}

.disclosure-container h1 {
  font-size: 1.75rem;
  margin-bottom: 24px;
  color: var(--color-primary, #23424a);
}

.disclosure-container h2 {
  font-size: 1.25rem;
  margin: 24px 0 12px;
  color: #1e293b;
}

.disclosure-container p {
  line-height: 1.6;
  color: #475569;
  margin-bottom: 12px;
}

.disclosure-container ul {
  padding-left: 24px;
  margin-bottom: 16px;
}

.disclosure-container li {
  line-height: 1.6;
  color: #475569;
  margin-bottom: 8px;
}

.email-contact {
  font-size: 1.1rem;
  font-weight: 600;
}

.email-contact a {
  color: var(--color-primary, #23424a);
  text-decoration: underline;
}

section {
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 20px;
}

section:last-child {
  border-bottom: none;
}
</style>
