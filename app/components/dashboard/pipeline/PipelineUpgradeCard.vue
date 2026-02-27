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
  padding: 48px 24px;
  background: linear-gradient(135deg, #f0f9ff, #eff6ff);
  border: 1px solid #bfdbfe;
  border-radius: 12px;
}

.upgrade-icon {
  font-size: 2.5rem;
  color: #f59e0b;
  margin-bottom: 12px;
}

.upgrade-card h2 {
  margin: 0 0 8px;
  font-size: 1.25rem;
  color: #1e293b;
}

.upgrade-card p {
  margin: 0 0 20px;
  color: #64748b;
  font-size: 0.95rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1a3238;
}
</style>
