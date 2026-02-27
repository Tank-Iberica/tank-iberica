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
  (e: 'navigate-back'): void
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
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.publish-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px 20px;
  text-align: center;
}

.publish-progress h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: #1e293b;
}

.progress-bar {
  width: 100%;
  max-width: 500px;
  height: 12px;
  background: #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary, #23424a), #16a34a);
  transition: width 0.3s ease;
}

.progress-text {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #475569;
}

.result-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 400px;
}

.result-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #f8fafc;
  border-radius: 8px;
}

.result-label {
  font-weight: 500;
  color: #64748b;
}

.result-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.result-value.success {
  color: #16a34a;
}

.result-value.error {
  color: #dc2626;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  background: #1a3238;
}
</style>
