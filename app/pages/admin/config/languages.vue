<script setup lang="ts">
import { useAdminLanguages } from '~/composables/admin/useAdminLanguages'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  loading,
  saving,
  error,
  saved,
  activeLocales,
  defaultLocale,
  translationEngine,
  translationApiKey,
  autoTranslateOnPublish,
  translationProgress,
  loadingProgress,
  pendingVehicles,
  pendingArticles,
  translating,
  translateSuccess,
  defaultLocaleOptions,
  translatableLocales,
  translateAllDisabled,
  hasChanges,
  handleTranslateAll,
  handleSave,
  init,
} = useAdminLanguages()

onMounted(() => {
  init()
})
</script>

<template>
  <div class="admin-config-languages">
    <div class="section-header">
      <h2>{{ $t('admin.configLanguages.title') }}</h2>
      <p class="section-subtitle">{{ $t('admin.configLanguages.subtitle') }}</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">{{ $t('admin.common.loadingConfig') }}</div>

    <template v-else>
      <!-- Error banner -->
      <div v-if="error" class="error-banner">
        {{ error }}
      </div>

      <!-- Success banner -->
      <div v-if="saved" class="success-banner">Cambios guardados correctamente.</div>

      <!-- Active Locales -->
      <AdminConfigLanguagesActiveLocalesCard
        :active-locales="activeLocales"
        @update="activeLocales = $event"
      />

      <!-- Default Locale -->
      <AdminConfigLanguagesDefaultLocaleCard
        :default-locale="defaultLocale"
        :options="defaultLocaleOptions"
        @update="defaultLocale = $event"
      />

      <!-- Translation Engine -->
      <AdminConfigLanguagesTranslationEngineCard
        :engine="translationEngine"
        @update="translationEngine = $event"
      />

      <!-- API Key -->
      <AdminConfigLanguagesApiKeyCard
        :api-key="translationApiKey"
        @update="translationApiKey = $event"
      />

      <!-- Auto-translate Toggle -->
      <AdminConfigLanguagesAutoTranslateCard
        :enabled="autoTranslateOnPublish"
        @update="autoTranslateOnPublish = $event"
      />

      <!-- Translation Progress -->
      <AdminConfigLanguagesTranslationProgressCard
        :progress="translationProgress"
        :loading-progress="loadingProgress"
        :visible="!!translatableLocales.length"
      />

      <!-- Pending Translation Queue -->
      <AdminConfigLanguagesPendingQueueCard
        :pending-vehicles="pendingVehicles"
        :pending-articles="pendingArticles"
        :translating="translating"
        :translate-success="translateSuccess"
        :translate-disabled="translateAllDisabled"
        :show-api-key-hint="!translationApiKey"
        @translate-all="handleTranslateAll"
      />

      <!-- Save Button -->
      <div class="save-section">
        <button class="btn-primary" :disabled="saving || !hasChanges" @click="handleSave">
          {{ saving ? $t('admin.common.saving') : $t('admin.common.saveChanges') }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.admin-config-languages {
  padding: 0;
}

.section-header {
  margin-bottom: var(--spacing-8);
}

.section-header h2 {
  margin: 0 0 var(--spacing-2);
  font-size: 1.75rem;
  color: var(--color-text);
}

.section-subtitle {
  margin: 0;
  color: var(--color-gray-500);
  font-size: 1rem;
}

.loading-state {
  text-align: center;
  padding: var(--spacing-10);
  color: var(--color-gray-500);
}

.error-banner {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
}

.success-banner {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-success);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
}

.save-section {
  margin-top: var(--spacing-2);
  padding-top: var(--spacing-6);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 47.9375em) {
  .section-header h2 {
    font-size: 1.5rem;
  }

  .btn-primary {
    width: 100%;
    text-align: center;
  }
}
</style>
