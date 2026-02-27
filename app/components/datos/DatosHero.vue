<script setup lang="ts">
defineProps<{
  lastUpdated: string
}>()
</script>

<template>
  <section class="datos-hero">
    <div class="datos-hero__container">
      <h1 class="datos-hero__title">{{ $t('data.heroTitle') }}</h1>
      <p class="datos-hero__subtitle">{{ $t('data.heroSubtitle') }}</p>
      <p v-if="lastUpdated" class="datos-hero__updated">
        {{ $t('data.updated') }}: {{ lastUpdated }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.datos-hero {
  background: var(--color-primary);
  color: var(--color-white);
  padding: var(--spacing-10) 0;
}

.datos-hero__container {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--spacing-4);
  text-align: center;
}

.datos-hero__title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-extrabold);
  line-height: var(--line-height-tight);
  margin-bottom: var(--spacing-3);
  color: var(--text-on-dark-primary);
}

.datos-hero__subtitle {
  font-size: var(--font-size-base);
  color: var(--text-on-dark-secondary);
  line-height: var(--line-height-relaxed);
  max-width: 640px;
  margin: 0 auto var(--spacing-4);
}

.datos-hero__updated {
  font-size: var(--font-size-sm);
  color: var(--text-on-dark-auxiliary);
}

@media (min-width: 768px) {
  .datos-hero {
    padding: var(--spacing-16) 0;
  }

  .datos-hero__title {
    font-size: var(--font-size-3xl);
  }

  .datos-hero__subtitle {
    font-size: var(--font-size-lg);
  }
}

@media (min-width: 1024px) {
  .datos-hero__title {
    font-size: var(--font-size-4xl);
  }
}
</style>
