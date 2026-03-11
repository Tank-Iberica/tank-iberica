<script setup lang="ts">
import type { OnboardingStep } from '~/composables/dashboard/useDashboardIndex'

defineProps<{
  progress: number
  steps: OnboardingStep[]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="onboarding-card">
    <div class="onboarding-header">
      <h3>{{ t('dashboard.onboarding.title') }}</h3>
      <span class="progress-text">{{ progress }}%</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: progress + '%' }" />
    </div>
    <div class="onboarding-steps">
      <div v-for="step in steps" :key="step.key" class="step" :class="{ done: step.done }">
        <span class="step-check">{{ step.done ? '\u2713' : '' }}</span>
        <span>{{ step.label }}</span>
      </div>
    </div>
    <NuxtLink to="/dashboard/portal" class="btn-secondary">
      {{ t('dashboard.onboarding.complete') }}
    </NuxtLink>
  </div>
</template>

<style scoped>
.onboarding-card {
  background: linear-gradient(135deg, var(--color-sky-50), var(--color-blue-50));
  border: 1px solid var(--color-info-border);
  border-radius: var(--border-radius-md);
  padding: 1.25rem;
}

.onboarding-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.onboarding-header h3 {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--badge-info-bg);
}

.progress-text {
  font-weight: 700;
  color: var(--badge-info-bg);
  font-size: 0.95rem;
}

.progress-bar {
  height: 0.5rem;
  background: var(--color-info-bg, var(--color-info-bg));
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  margin-bottom: 1rem;
}

.progress-fill {
  height: 100%;
  background: var(--color-info);
  border-radius: var(--border-radius-sm);
  transition: width 0.4s;
}

.onboarding-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.step {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  font-size: 0.85rem;
  color: var(--text-auxiliary);
}

.step.done {
  color: var(--color-success);
  background: var(--color-success-bg, var(--color-success-bg));
}

.step-check {
  width: 1.125rem;
  height: 1.125rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  border: 1px solid var(--color-gray-200);
}

.step.done .step-check {
  background: var(--color-success);
  color: white;
  border-color: var(--color-success);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem 1.25rem;
  background: var(--bg-primary);
  color: var(--color-primary);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
}

.btn-secondary:hover {
  background: var(--bg-secondary);
}
</style>
