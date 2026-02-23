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
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 1rem;
  text-align: center;
}

.disclaimer-text {
  font-size: 11px;
  line-height: 1.6;
  color: var(--text-on-dark-secondary, rgba(255, 255, 255, 0.6));
  margin: 0 0 8px;
}

.disclaimer-link {
  font-size: 11px;
  color: var(--text-on-dark-secondary, rgba(255, 255, 255, 0.6));
  text-decoration: underline;
  transition: color 0.2s;
}

.disclaimer-link:hover {
  color: var(--text-on-dark-primary, rgba(255, 255, 255, 0.95));
}

@media (min-width: 768px) {
  .disclaimer-footer {
    padding: 24px 2rem;
  }

  .disclaimer-text {
    font-size: 12px;
  }
}
</style>
