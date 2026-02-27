<script setup lang="ts">
const localePath = useLocalePath()
</script>

<template>
  <section class="datos-section datos-cta">
    <h2 class="datos-cta__title">{{ $t('data.downloadReport') }}</h2>
    <NuxtLink
      :to="localePath('/datos')"
      class="datos-cta__button"
      href="https://tracciona.com/informes/indice-precios-trimestral.pdf"
      target="_blank"
      rel="noopener noreferrer"
    >
      {{ $t('data.downloadReport') }}
    </NuxtLink>
  </section>
</template>

<style scoped>
.datos-section {
  margin-bottom: var(--spacing-10);
}

.datos-cta {
  text-align: center;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-8) var(--spacing-4);
}

.datos-cta__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-4);
}

.datos-cta__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3) var(--spacing-6);
  background: var(--color-primary);
  color: var(--color-white);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--border-radius);
  text-decoration: none;
  min-height: 44px;
  min-width: 44px;
  transition: background var(--transition-fast);
}

.datos-cta__button:hover {
  background: var(--color-primary-dark);
}
</style>
