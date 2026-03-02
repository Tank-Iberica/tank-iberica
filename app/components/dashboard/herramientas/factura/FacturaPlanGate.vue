<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div class="plan-gate">
    <div class="plan-gate__icon">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    </div>
    <h2 class="plan-gate__title">{{ t('dashboard.tools.invoice.upgradeTitle') }}</h2>
    <p class="plan-gate__text">{{ t('dashboard.tools.invoice.upgradeText') }}</p>
    <NuxtLink to="/dashboard/suscripcion" class="plan-gate__cta">
      {{ t('dashboard.tools.invoice.upgradeCTA') }}
    </NuxtLink>
  </div>
</template>

<style scoped>
.plan-gate {
  text-align: center;
  padding: 3rem 1.5rem;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 2px dashed var(--color-gray-300);
  margin-top: 2rem;
}

.plan-gate__icon {
  color: var(--text-disabled);
  margin-bottom: 1rem;
}

.plan-gate__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary, var(--color-primary));
  margin-bottom: 0.5rem;
}

.plan-gate__text {
  color: var(--text-auxiliary);
  margin-bottom: 1.5rem;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.plan-gate__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0.75rem 2rem;
  background: var(--primary, var(--color-primary));
  color: white;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.2s;
}

.plan-gate__cta:hover {
  opacity: 0.9;
}
</style>
