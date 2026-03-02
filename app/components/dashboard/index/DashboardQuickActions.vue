<script setup lang="ts">
defineProps<{
  currentPlan: string
}>()

const { t } = useI18n()
</script>

<template>
  <div class="quick-actions">
    <NuxtLink to="/dashboard/vehiculos/nuevo" class="action-card">
      <span class="action-icon">+</span>
      <span>{{ t('dashboard.actions.publish') }}</span>
    </NuxtLink>
    <NuxtLink to="/dashboard/crm" class="action-card">
      <span class="action-icon">&#x1F4D2;</span>
      <span>{{ t('dashboard.crm.title') }}</span>
    </NuxtLink>
    <NuxtLink to="/dashboard/pipeline" class="action-card">
      <span class="action-icon">&#x1F4C8;</span>
      <span>{{ t('dashboard.pipeline.title') }}</span>
    </NuxtLink>
    <NuxtLink to="/dashboard/historico" class="action-card">
      <span class="action-icon">&#x1F4DC;</span>
      <span>{{ t('dashboard.historico.title') }}</span>
    </NuxtLink>
    <NuxtLink to="/dashboard/observatorio" class="action-card">
      <span class="action-icon">&#x1F441;</span>
      <span>{{ t('dashboard.observatory.title') }}</span>
    </NuxtLink>
    <NuxtLink to="/dashboard/estadisticas" class="action-card">
      <span class="action-icon">&#x2630;</span>
      <span>{{ t('dashboard.actions.stats') }}</span>
    </NuxtLink>
    <NuxtLink to="/dashboard/portal" class="action-card">
      <span class="action-icon">&#x2699;</span>
      <span>{{ t('dashboard.actions.portal') }}</span>
    </NuxtLink>
    <NuxtLink to="/dashboard/suscripcion" class="action-card">
      <span class="action-icon">&#x2605;</span>
      <span>{{ t('dashboard.actions.plan') }} ({{ t(`dashboard.plans.${currentPlan}`) }})</span>
    </NuxtLink>
  </div>
</template>

<style scoped>
.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px;
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  text-decoration: none;
  color: #334155;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: center;
  transition: box-shadow 0.2s;
  min-height: 44px;
}

@media (hover: hover) {
  .action-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
}

.action-icon {
  font-size: 1.5rem;
  color: var(--color-primary);
}

@media (min-width: 768px) {
  .quick-actions {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
