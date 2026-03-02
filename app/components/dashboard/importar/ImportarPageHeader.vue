<script setup lang="ts">
/**
 * ImportarPageHeader — Title bar with back-to-vehicles link.
 */
const { t } = useI18n()
</script>

<template>
  <header class="page-header">
    <NuxtLink to="/dashboard/vehiculos" class="back-link">
      {{ t('common.back') }}
    </NuxtLink>
    <h1>{{ t('dashboard.import.title') }}</h1>
    <p class="subtitle">{{ t('dashboard.import.subtitle') }}</p>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.back-link {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.subtitle {
  margin: 0;
  color: var(--text-auxiliary);
  font-size: 0.95rem;
}
</style>
