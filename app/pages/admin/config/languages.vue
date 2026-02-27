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
      <h2>Idiomas</h2>
      <p class="section-subtitle">
        Configura los idiomas activos y el motor de traduccion automatica.
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">Cargando configuracion...</div>

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
        :visible="translatableLocales.length > 0"
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
          {{ saving ? 'Guardando...' : 'Guardar cambios' }}
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
  margin-bottom: 32px;
}

.section-header h2 {
  margin: 0 0 8px;
  font-size: 1.75rem;
  color: var(--color-text);
}

.section-subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.error-banner {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.success-banner {
  background: #f0fdf4;
  color: #16a34a;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.save-section {
  margin-top: 8px;
  padding-top: 24px;
}

.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark, #1a3238);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 767px) {
  .section-header h2 {
    font-size: 1.5rem;
  }

  .btn-primary {
    width: 100%;
    text-align: center;
  }
}
</style>
