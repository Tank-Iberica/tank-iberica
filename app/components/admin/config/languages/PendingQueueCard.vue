<script setup lang="ts">
const { t } = useI18n()

defineProps<{
  pendingVehicles: number
  pendingArticles: number
  translating: boolean
  translateSuccess: boolean
  translateDisabled: boolean
  showApiKeyHint: boolean
}>()

const emit = defineEmits<{
  'translate-all': []
}>()
</script>

<template>
  <div class="config-card">
    <h3 class="card-title">{{ t('admin.configLanguages.pendingQueueTitle') }}</h3>
    <p class="card-description">{{ t('admin.configLanguages.pendingQueueDesc') }}</p>

    <div v-if="translateSuccess" class="success-banner">
      {{ t('admin.configLanguages.pendingQueueSuccess') }}
    </div>

    <div class="pending-list">
      <div class="pending-row">
        <span class="pending-label">{{ t('admin.configLanguages.pendingVehicles') }}</span>
        <span class="pending-count">{{ pendingVehicles }}</span>
      </div>
      <div class="pending-row">
        <span class="pending-label">{{ t('admin.configLanguages.pendingArticles') }}</span>
        <span class="pending-count">{{ pendingArticles }}</span>
      </div>
    </div>

    <button
      class="btn-translate"
      :disabled="translateDisabled || translating"
      @click="emit('translate-all')"
    >
      {{
        translating
          ? t('admin.configLanguages.translating')
          : t('admin.configLanguages.translateNow')
      }}
    </button>

    <p v-if="showApiKeyHint" class="hint-text">
      {{ t('admin.configLanguages.pendingQueueNoKey') }}
    </p>
  </div>
</template>

<style scoped>
.config-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-card);
  margin-bottom: var(--spacing-5);
}

.card-title {
  margin: 0 0 var(--spacing-2);
  font-size: 1.125rem;
  color: var(--color-gray-800);
}

.card-description {
  margin: 0 0 var(--spacing-4);
  color: var(--color-gray-500);
  font-size: 0.875rem;
}

.success-banner {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-success);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
}

.pending-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  background: var(--color-gray-50);
  margin-bottom: var(--spacing-4);
}

.pending-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 2.75rem;
}

.pending-label {
  font-size: 0.95rem;
  color: var(--color-gray-700);
}

.pending-count {
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-gray-800);
}

.btn-translate {
  background: var(--color-success);
  color: white;
  border: none;
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background 0.2s;
}

.btn-translate:hover {
  background: var(--color-success-dark);
}

.btn-translate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.hint-text {
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
  color: var(--text-disabled);
}

@media (max-width: 47.9375em) {
  .config-card {
    padding: var(--spacing-4);
  }

  .btn-translate {
    width: 100%;
    text-align: center;
  }
}
</style>
