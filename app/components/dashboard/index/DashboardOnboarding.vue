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
  background: linear-gradient(135deg, #f0f9ff, #eff6ff);
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  padding: 20px;
}

.onboarding-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.onboarding-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #1e40af;
}

.progress-text {
  font-weight: 700;
  color: #1e40af;
  font-size: 0.95rem;
}

.progress-bar {
  height: 8px;
  background: var(--color-info-bg, #dbeafe);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 16px;
}

.progress-fill {
  height: 100%;
  background: var(--color-info);
  border-radius: 4px;
  transition: width 0.4s;
}

.onboarding-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.step {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--bg-primary);
  border-radius: 6px;
  font-size: 0.85rem;
  color: var(--text-auxiliary);
}

.step.done {
  color: var(--color-success);
  background: var(--color-success-bg, #dcfce7);
}

.step-check {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 12px;
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
  min-height: 44px;
  padding: 10px 20px;
  background: var(--bg-primary);
  color: var(--color-primary);
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
}

.btn-secondary:hover {
  background: var(--bg-secondary);
}
</style>
