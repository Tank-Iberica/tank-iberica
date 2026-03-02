<script setup lang="ts">
/**
 * ContratoUpgradeGate
 * Plan gate: shows an upgrade prompt to free-plan users.
 */

defineProps<{
  currentPlan: string
}>()

const { t } = useI18n()
</script>

<template>
  <div>
    <header class="page-header">
      <h1>{{ t('dashboard.tools.contract.title') }}</h1>
      <span class="plan-badge">{{ t(`dashboard.plans.${currentPlan}`) }}</span>
    </header>
    <div class="upgrade-card">
      <div class="upgrade-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      </div>
      <h2>{{ t('dashboard.tools.contract.upgradeTitle') }}</h2>
      <p>{{ t('dashboard.tools.contract.upgradeDesc') }}</p>
      <NuxtLink to="/dashboard/suscripcion" class="btn btn-primary btn-lg">
        {{ t('dashboard.tools.contract.upgradeCTA') }}
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.page-header h1 {
  margin: 0 0 4px;
  font-size: 1.5rem;
}

.plan-badge {
  background: var(--bg-tertiary);
  color: #374151;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.upgrade-card {
  background: var(--bg-primary);
  border: 2px solid var(--border-color-light);
  border-radius: 16px;
  padding: 48px 32px;
  text-align: center;
  max-width: 500px;
  margin: 32px auto;
}

.upgrade-icon {
  color: var(--color-primary);
  margin-bottom: 16px;
}

.upgrade-card h2 {
  margin: 0 0 8px;
  font-size: 1.25rem;
}

.upgrade-card p {
  margin: 0 0 24px;
  color: #6b7280;
  font-size: 0.9rem;
}

.btn {
  padding: 10px 20px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
  border: none;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-lg {
  padding: 14px 28px;
  font-size: 1rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .upgrade-card {
    padding: 32px 20px;
  }
}
</style>
