<template>
  <div class="about-page">
    <div class="about-container">
      <UiBreadcrumbNav :items="[{ label: $t('nav.home'), to: '/' }, { label: $t('about.title') }]" />
      <h1 class="about-title">{{ $t('about.title') }}</h1>

      <section id="quienes-somos" class="about-section">
        <h2>{{ $t('about.whoWeAre') }}</h2>
        <p>{{ $t('about.whoWeAreText') }}</p>
      </section>

      <section id="mision" class="about-section">
        <h2>{{ $t('about.ourMission') }}</h2>
        <p>{{ $t('about.ourMissionText') }}</p>
      </section>

      <section id="equipo" class="about-section">
        <h2>{{ $t('about.team') }}</h2>
        <p>{{ $t('about.teamText') }}</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

usePageSeo({
  title: t('seo.aboutTitle'),
  description: t('seo.aboutDescription'),
  path: '/sobre-nosotros',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: t('site.title'),
    url: 'https://tracciona.com',
    description: t('seo.aboutDescription'),
    logo: 'https://tracciona.com/og-default.png',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'tankiberica@gmail.com',
    },
  },
})
</script>

<style scoped>
.about-page {
  min-height: 60vh;
  padding: 1.5rem 0 3rem;
}

.about-container {
  max-width: 50rem;
  margin: 0 auto;
  padding: 0 1rem;
}

.about-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 2rem;
}

.about-section {
  margin-bottom: 2.5rem;
  scroll-margin-top: var(--header-offset, 5rem);
}

.about-section h2 {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-primary);
  display: inline-block;
}

.about-section p {
  font-size: var(--font-size-sm);
  line-height: 1.7;
  color: var(--text-secondary);
}

@media (min-width: 30em) {
  .about-container {
    padding: 0 1.5rem;
  }
}

@media (min-width: 48em) {
  .about-title {
    font-size: 1.75rem;
  }

  .about-section h2 {
    font-size: 1.3rem;
  }

  .about-section p {
    font-size: var(--font-size-base);
  }
}
</style>
