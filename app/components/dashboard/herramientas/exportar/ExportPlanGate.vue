<script setup lang="ts">
/**
 * ExportPlanGate — Shown when the dealer plan does not include catalog export.
 */
const { t } = useI18n()
</script>

<template>
  <div class="plan-gate">
    <div class="gate-icon">&#128274;</div>
    <h2>{{ t('dashboard.tools.export.planRequired') }}</h2>
    <p>{{ t('dashboard.tools.export.planRequiredDesc') }}</p>
    <NuxtLink to="/dashboard/suscripcion" class="btn-primary">
      {{ t('dashboard.tools.export.upgradePlan') }}
    </NuxtLink>
  </div>
</template>

<style scoped>
.plan-gate {
  text-align: center;
  padding: 3rem 1.25rem;
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
}

.gate-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.plan-gate h2 {
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
  color: var(--text-primary);
}

.plan-gate p {
  margin: 0 0 1.25rem;
  color: var(--text-auxiliary);
  font-size: 0.9rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: var(--font-size-base);
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}
</style>
