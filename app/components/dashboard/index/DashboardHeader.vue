<script setup lang="ts">
defineProps<{
  companyName: string
}>()

const { t } = useI18n()
</script>

<template>
  <header class="page-header">
    <div>
      <h1>{{ t('dashboard.title') }}</h1>
      <p class="subtitle">
        {{ t('dashboard.welcome', { name: companyName }) }}
      </p>
    </div>
    <NuxtLink to="/dashboard/vehiculos/nuevo" class="btn-primary">
      {{ t('dashboard.publishNew') }}
    </NuxtLink>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.page-header h1 {
  margin: 0;
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-primary);
}

.subtitle {
  margin: 0;
  color: var(--text-auxiliary);
  font-size: 0.95rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem 1.25rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

@media (min-width: 48em) {
  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
