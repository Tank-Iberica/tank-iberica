<template>
  <div class="home">
    <section class="hero">
      <h1 class="hero-title">Tank Iberica</h1>
      <p class="hero-subtitle">{{ $t('site.description') }}</p>
      <p class="hero-coming">{{ $t('catalog.comingSoon') }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Tank Iberica',
  description: 'Plataforma de vehículos industriales',
  ogTitle: 'Tank Iberica',
  ogDescription: 'Plataforma de vehículos industriales',
})
</script>

<style scoped>
.home {
  min-height: calc(100vh - var(--header-height));
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: var(--spacing-8) var(--spacing-4);
  text-align: center;
}

.hero-title {
  font-family: var(--font-family-logo);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: var(--spacing-3);
}

.hero-subtitle {
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-6);
}

.hero-coming {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  background: var(--bg-tertiary);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius-full);
}

@media (min-width: 768px) {
  .hero-title {
    font-size: var(--font-size-4xl);
  }
}
</style>
