<script setup lang="ts">
/**
 * ImportarPublishStep — Step 3: publishing progress bar and result summary.
 */
const { t } = useI18n()

defineProps<{
  publishing: boolean
  progress: number
  publishedCount: number
  errorCount: number
}>()

const emit = defineEmits<{
  'navigate-back': []
}>()
</script>

<template>
  <section class="step-section">
    <div class="publish-progress">
      <h2 v-if="publishing">{{ t('dashboard.import.publishing') }}</h2>
      <h2 v-else>{{ t('dashboard.import.success') }}</h2>

      <div v-if="publishing" class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progress}%` }" />
      </div>
      <p v-if="publishing" class="progress-text">{{ progress }}%</p>

      <div v-if="!publishing" class="result-summary">
        <div class="result-stat">
          <span class="result-label">{{ t('dashboard.import.successCount') }}:</span>
          <span class="result-value success">{{ publishedCount }}</span>
        </div>
        <div v-if="errorCount > 0" class="result-stat">
          <span class="result-label">{{ t('dashboard.import.errorCount') }}:</span>
          <span class="result-value error">{{ errorCount }}</span>
        </div>
      </div>

      <button v-if="!publishing" type="button" class="btn-primary" @click="emit('navigate-back')">
        {{ t('dashboard.import.back') }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.step-section {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: 1.5rem;
  box-shadow: var(--shadow-card);
}

.publish-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  padding: 2.5rem 1.25rem;
  text-align: center;
}

.publish-progress h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--text-primary);
}

.progress-bar {
  width: 100%;
  max-width: 31.25rem;
  height: 0.75rem;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-success));
  transition: width 0.3s ease;
}

.progress-text {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.result-summary {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 25rem;
}

.result-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.25rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
}

.result-label {
  font-weight: 500;
  color: var(--text-auxiliary);
}

.result-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
}

.result-value.success {
  color: var(--color-success);
}

.result-value.error {
  color: var(--color-error);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}
</style>
