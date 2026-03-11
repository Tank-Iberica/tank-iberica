<script setup lang="ts">
/**
 * Upgrade prompt shown when dealer does not have Premium/Founding plan.
 * Pure presentational — no props or emits needed.
 */
const { t } = useI18n()
</script>

<template>
  <div class="upgrade-card">
    <div class="upgrade-icon">&#9733;</div>
    <h2>{{ t('dashboard.pipeline.upgradeTitle') }}</h2>
    <p>{{ t('dashboard.pipeline.upgradeDesc') }}</p>
    <NuxtLink to="/dashboard/suscripcion" class="btn-primary">
      {{ t('dashboard.pipeline.upgradeCta') }}
    </NuxtLink>
  </div>
</template>

<style scoped>
.upgrade-card {
  text-align: center;
  padding: 3rem 1.5rem;
  background: linear-gradient(135deg, var(--color-sky-50), var(--color-blue-50));
  border: 1px solid var(--color-info-border);
  border-radius: var(--border-radius-md);
}

.upgrade-icon {
  font-size: 2.5rem;
  color: var(--color-warning);
  margin-bottom: 0.75rem;
}

.upgrade-card h2 {
  margin: 0 0 0.5rem;
  font-size: var(--font-size-xl);
  color: var(--text-primary);
}

.upgrade-card p {
  margin: 0 0 1.25rem;
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
</style>
