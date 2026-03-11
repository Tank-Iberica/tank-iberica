<script setup lang="ts">
/**
 * CRM upgrade gate shown when dealer is on the free plan.
 * Prompts to upgrade to a paid plan.
 */
// No props or emits

const { t } = useI18n()
</script>

<template>
  <div class="upgrade-gate">
    <div class="upgrade-card">
      <span class="upgrade-icon">&#128274;</span>
      <h2>{{ t('dashboard.crm.upgradeTitle') }}</h2>
      <p>{{ t('dashboard.crm.upgradeDesc') }}</p>
      <NuxtLink to="/dashboard/suscripcion" class="btn-primary">
        {{ t('dashboard.crm.upgradeCta') }}
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.upgrade-gate {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 1.5rem;
}

.upgrade-card {
  text-align: center;
  max-width: 26.25rem;
  padding: 3rem 2rem;
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-card);
}

.upgrade-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.upgrade-card h2 {
  margin: 0 0 0.75rem;
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
}

.upgrade-card p {
  margin: 0 0 1.5rem;
  color: var(--text-auxiliary);
  font-size: 0.95rem;
  line-height: 1.5;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.625rem 1.125rem;
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s;
  white-space: nowrap;
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}
</style>
