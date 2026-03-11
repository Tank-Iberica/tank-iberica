<template>
  <div class="disclaimer-footer">
    <p class="disclaimer-text">
      {{ $t('disclaimer.footerText') }}
    </p>
    <NuxtLink to="/legal" class="disclaimer-link">
      {{ $t('disclaimer.moreInfo') }}
    </NuxtLink>
  </div>
</template>

<style scoped>
.disclaimer-footer {
  max-width: 56.25em;
  margin: 0 auto;
  padding: 1.5rem 1rem;
  text-align: center;
}

.disclaimer-text {
  font-size: 0.6875rem;
  line-height: 1.6;
  color: var(--text-on-dark-secondary, rgba(255, 255, 255, 0.6));
  margin: 0 0 var(--spacing-2);
}

.disclaimer-link {
  font-size: 0.6875rem;
  color: var(--text-on-dark-secondary, rgba(255, 255, 255, 0.6));
  text-decoration: underline;
  transition: color 0.2s;
}

.disclaimer-link:hover {
  color: var(--text-on-dark-primary, rgba(255, 255, 255, 0.95));
}

@media (min-width: 48em) {
  .disclaimer-footer {
    padding: 1.5rem 2rem;
  }

  .disclaimer-text {
    font-size: var(--font-size-xs);
  }
}
</style>
