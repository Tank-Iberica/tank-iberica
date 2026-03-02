<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { t } = useI18n()

useHead({ title: t('transparency.pageTitle') })
</script>

<template>
  <div class="transparency-page">
    <h1>{{ t('transparency.title') }}</h1>
    <p class="transparency-subtitle">{{ t('transparency.subtitle') }}</p>

    <!-- DSA Contact Point -->
    <section class="transparency-section">
      <h2>{{ t('transparency.contactTitle') }}</h2>
      <p>{{ t('transparency.contactDescription') }}</p>
      <div class="contact-info">
        <div class="contact-item">
          <strong>{{ t('transparency.contactEmail') }}:</strong>
          <a href="mailto:legal@tracciona.com">legal@tracciona.com</a>
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
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}

.transparency-page h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 8px;
}

.transparency-subtitle {
  color: var(--text-auxiliary, var(--color-gray-500));
  font-size: 0.95rem;
  margin-bottom: 32px;
}

.transparency-section {
  background: var(--bg-primary, white);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.transparency-section h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary, var(--color-gray-800));
  margin: 0 0 12px 0;
}

.transparency-section p {
  font-size: 0.9rem;
  color: var(--text-secondary, var(--color-gray-600));
  line-height: 1.6;
  margin: 0 0 12px 0;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contact-item {
  font-size: 0.9rem;
  color: var(--text-secondary, var(--color-gray-600));
}

.contact-item a {
  color: var(--color-primary);
  font-weight: 500;
}

.transparency-list {
  margin: 0;
  padding-left: 20px;
  list-style: disc;
}

.transparency-list li {
  font-size: 0.9rem;
  color: var(--text-secondary, var(--color-gray-600));
  line-height: 1.6;
  margin-bottom: 4px;
}

.report-categories {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.report-category-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px;
  background: var(--bg-secondary, var(--color-gray-50));
  border-radius: 8px;
}

.report-category-item strong {
  font-size: 0.9rem;
  color: var(--text-primary, var(--color-gray-800));
}

.report-category-desc {
  font-size: 0.8rem;
  color: var(--text-auxiliary, var(--color-gray-400));
}

.report-next-date {
  margin-top: 12px;
  font-size: 0.85rem;
  font-style: italic;
  color: var(--text-auxiliary, var(--color-gray-400));
}

@media (min-width: 768px) {
  .transparency-page {
    padding: 32px 16px;
  }

  .transparency-page h1 {
    font-size: 1.75rem;
  }
}
</style>
