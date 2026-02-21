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
      <div class="report-placeholder">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        <p>{{ t('transparency.reportComingSoon') }}</p>
      </div>
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
  color: var(--color-primary, #23424a);
  margin-bottom: 8px;
}

.transparency-subtitle {
  color: var(--text-auxiliary, #64748b);
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
  color: var(--text-primary, #1e293b);
  margin: 0 0 12px 0;
}

.transparency-section p {
  font-size: 0.9rem;
  color: var(--text-secondary, #475569);
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
  color: var(--text-secondary, #475569);
}

.contact-item a {
  color: var(--color-primary, #23424a);
  font-weight: 500;
}

.transparency-list {
  margin: 0;
  padding-left: 20px;
  list-style: disc;
}

.transparency-list li {
  font-size: 0.9rem;
  color: var(--text-secondary, #475569);
  line-height: 1.6;
  margin-bottom: 4px;
}

.report-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px;
  border: 2px dashed var(--border-color, #e2e8f0);
  border-radius: 8px;
  color: var(--text-auxiliary, #94a3b8);
  text-align: center;
}

.report-placeholder p {
  color: var(--text-auxiliary, #94a3b8);
  margin: 0;
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
