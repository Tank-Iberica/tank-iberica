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
  padding: 48px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.gate-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.plan-gate h2 {
  margin: 0 0 8px;
  font-size: 1.2rem;
  color: #1e293b;
}

.plan-gate p {
  margin: 0 0 20px;
  color: #64748b;
  font-size: 0.9rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 12px 24px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1a3238;
}
</style>
