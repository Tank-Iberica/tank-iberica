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
  padding: 24px;
}

.upgrade-card {
  text-align: center;
  max-width: 420px;
  padding: 48px 32px;
  background: var(--bg-primary);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.upgrade-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
  opacity: 0.6;
}

.upgrade-card h2 {
  margin: 0 0 12px;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.upgrade-card p {
  margin: 0 0 24px;
  color: var(--text-auxiliary);
  font-size: 0.95rem;
  line-height: 1.5;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s;
  white-space: nowrap;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}
</style>
