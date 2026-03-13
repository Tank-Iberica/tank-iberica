<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { t } = useI18n()
const siteDomain = useSiteUrl().replace('https://', '').replace('http://', '')

usePageSeo({
  title: t('transparency.pageTitle'),
  description: t('transparency.seoDescription'),
  path: '/transparencia',
})
</script>

<template>
  <div class="transparency-page">
    <UiBreadcrumbNav
      :items="[{ label: $t('nav.home'), to: '/' }, { label: t('transparency.title') }]"
    />
    <h1>{{ t('transparency.title') }}</h1>
    <p class="transparency-subtitle">{{ t('transparency.subtitle') }}</p>

    <!-- DSA Contact Point -->
    <section class="transparency-section">
      <h2>{{ t('transparency.contactTitle') }}</h2>
      <p>{{ t('transparency.contactDescription') }}</p>
      <div class="contact-info">
        <div class="contact-item">
          <strong>{{ t('transparency.contactEmail') }}:</strong>
          <a :href="`mailto:legal@${siteDomain}`">legal@{{ siteDomain }}</a>
        </div>
        <div class="contact-item">
          <strong>{{ t('transparency.contactForm') }}:</strong>
          <span>{{ t('transparency.reportButton') }}</span>
        </div>
      </div>
    </section>

    <!-- Content Moderation -->
    <section class="transparency-section">
      <h2>{{ t('transparency.moderationTitle') }}</h2>
      <p>{{ t('transparency.moderationDescription') }}</p>
      <ul class="transparency-list">
        <li>{{ t('transparency.moderationItem1') }}</li>
        <li>{{ t('transparency.moderationItem2') }}</li>
        <li>{{ t('transparency.moderationItem3') }}</li>
        <li>{{ t('transparency.moderationItem4') }}</li>
      </ul>
    </section>

    <!-- Annual Report -->
    <section class="transparency-section">
      <h2>{{ t('transparency.reportTitle') }}</h2>
      <p>{{ t('transparency.reportDescription') }}</p>
      <div class="report-categories">
        <div class="report-category-item">
          <strong>{{ t('transparency.reportCatReports') }}</strong>
          <span class="report-category-desc">{{ t('transparency.reportCatReportsDesc') }}</span>
        </div>
        <div class="report-category-item">
          <strong>{{ t('transparency.reportCatActions') }}</strong>
          <span class="report-category-desc">{{ t('transparency.reportCatActionsDesc') }}</span>
        </div>
        <div class="report-category-item">
          <strong>{{ t('transparency.reportCatTimes') }}</strong>
          <span class="report-category-desc">{{ t('transparency.reportCatTimesDesc') }}</span>
        </div>
        <div class="report-category-item">
          <strong>{{ t('transparency.reportCatAppeals') }}</strong>
          <span class="report-category-desc">{{ t('transparency.reportCatAppealsDesc') }}</span>
        </div>
      </div>
      <p class="report-next-date">{{ t('transparency.reportNextDate') }}</p>
    </section>

    <!-- AI Usage -->
    <section class="transparency-section">
      <h2>{{ t('transparency.aiTitle') }}</h2>
      <p>{{ t('transparency.aiDescription') }}</p>
      <ul class="transparency-list">
        <li>{{ t('transparency.aiItem1') }}</li>
        <li>{{ t('transparency.aiItem2') }}</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.transparency-page {
  max-width: 50rem;
  margin: 0 auto;
  padding: var(--spacing-4);
}

.transparency-page h1 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-2);
}

.transparency-subtitle {
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-8);
}

.transparency-section {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-5);
  margin-bottom: var(--spacing-5);
  box-shadow: var(--shadow-sm);
}

.transparency-section h2 {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-3) 0;
}

.transparency-section p {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 var(--spacing-3) 0;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.contact-item {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.contact-item a {
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}

.transparency-list {
  margin: 0;
  padding-left: var(--spacing-5);
  list-style: disc;
}

.transparency-list li {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: var(--spacing-1);
}

.report-categories {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  margin-top: var(--spacing-3);
}

.report-category-item {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: var(--spacing-3);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
}

.report-category-item strong {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.report-category-desc {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

.report-next-date {
  margin-top: var(--spacing-3);
  font-size: var(--font-size-xs);
  font-style: italic;
  color: var(--text-auxiliary);
}

@media (min-width: 48em) {
  .transparency-page {
    padding: var(--spacing-8) var(--spacing-4);
  }

  .transparency-page h1 {
    font-size: var(--heading-2);
  }
}
</style>
