<template>
  <div class="legal-page">
    <div class="legal-container">
      <h1 class="legal-title">{{ $t('legal.title') }}</h1>

      <section id="aviso-legal" class="legal-section">
        <h2>{{ $t('legal.legalNotice') }}</h2>
        <p>{{ $t('legal.legalNoticeText') }}</p>
      </section>

      <section id="terminos" class="legal-section">
        <h2>{{ $t('legal.terms') }}</h2>
        <p>{{ $t('legal.termsText') }}</p>
      </section>

      <section id="privacidad" class="legal-section">
        <h2>{{ $t('legal.privacy') }}</h2>
        <p>{{ $t('legal.privacyText') }}</p>
      </section>

      <section id="cookies" class="legal-section">
        <h2>{{ $t('legal.cookies') }}</h2>
        <p>{{ $t('legal.cookiesText') }}</p>
      </section>

      <section id="disclaimer" class="legal-section">
        <h2>{{ $t('legal.disclaimer') }}</h2>
        <p>{{ $t('disclaimer.footerText') }}</p>
      </section>

      <section id="ia" class="legal-section">
        <h2>{{ $t('legal.aiTitle') }}</h2>
        <p>{{ $t('legal.aiText') }}</p>
      </section>

      <div class="legal-links">
        <NuxtLink to="/legal/privacidad" class="legal-link">{{ $t('legal.privacyLink') }}</NuxtLink>
        <NuxtLink to="/legal/cookies" class="legal-link">{{ $t('legal.cookiesLink') }}</NuxtLink>
        <NuxtLink to="/legal/condiciones" class="legal-link">{{ $t('legal.termsLink') }}</NuxtLink>
        <NuxtLink to="/transparencia" class="legal-link">{{
          $t('legal.transparencyLink')
        }}</NuxtLink>
        <NuxtLink to="/legal/uk" class="legal-link">{{ $t('legal.ukTermsLink') }}</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

usePageSeo({
  title: t('seo.legalTitle'),
  description: t('seo.legalDescription'),
  path: '/legal',
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

.legal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 2rem;
}

.legal-section {
  margin-bottom: 2.5rem;
  scroll-margin-top: 80px;
}

.legal-section h2 {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-primary);
  display: inline-block;
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

.legal-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color-light, var(--color-gray-200));
}

.legal-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 10px 16px;
  background: var(--bg-secondary, var(--color-gray-50));
  color: var(--color-primary);
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  text-decoration: none;
  transition: background 0.2s;
}

.legal-link:hover {
  background: var(--border-color-light, var(--color-gray-200));
}

@media (min-width: 768px) {
  .legal-title {
    font-size: 1.75rem;
  }

  .legal-section h2 {
    font-size: 1.3rem;
  }

  .legal-section p {
    font-size: 16px;
  }
}
</style>
