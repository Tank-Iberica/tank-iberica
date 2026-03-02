<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <header class="page-header">
    <div>
      <h1>{{ t('dashboard.adExport.title') }}</h1>
      <p class="subtitle">{{ t('dashboard.adExport.subtitle') }}</p>
    </div>
    <NuxtLink to="/dashboard" class="btn-back">
      {{ t('common.back') }}
    </NuxtLink>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.btn-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  background: var(--bg-primary);
  color: var(--color-primary);
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  align-self: flex-start;
}

.btn-back:hover {
  background: var(--bg-secondary);
}

@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
