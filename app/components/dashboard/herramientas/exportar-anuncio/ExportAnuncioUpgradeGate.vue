<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div class="upgrade-card">
    <h2>{{ t('dashboard.adExport.upgradeTitle') }}</h2>
    <p>{{ t('dashboard.adExport.upgradeDesc') }}</p>
    <NuxtLink to="/dashboard/suscripcion" class="btn-upgrade">
      {{ t('dashboard.adExport.upgradeCta') }}
    </NuxtLink>
  </div>
</template>

<style scoped>
.upgrade-card {
  background: linear-gradient(135deg, var(--color-amber-50), var(--color-warning-bg));
  border: 1px solid var(--color-amber-200);
  border-radius: var(--border-radius-md);
  padding: 1.5rem;
  text-align: center;
}

.upgrade-card h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-warning-text);
}

.upgrade-card p {
  margin: 0 0 1rem 0;
  color: var(--color-amber-700);
  font-size: 0.95rem;
}

.btn-upgrade {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem 1.5rem;
  background: var(--color-warning);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.btn-upgrade:hover {
  background: var(--color-warning);
}
</style>
