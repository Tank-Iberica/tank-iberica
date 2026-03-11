<script setup lang="ts">
import { useAdminVerticalConfig } from '~/composables/admin/useAdminVerticalConfig'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { config, loading, saving, error, saved, loadConfig, saveFields } = useAdminVerticalConfig()

// Local form state
const form = ref({
  google_analytics_id: '',
  google_search_console: '',
  google_adsense_id: '',
  cloudinary_cloud_name: '',
})

onMounted(async () => {
  const cfg = await loadConfig()
  if (cfg) {
    form.value.google_analytics_id = cfg.google_analytics_id || ''
    form.value.google_search_console = cfg.google_search_console || ''
    form.value.google_adsense_id = cfg.google_adsense_id || ''
    form.value.cloudinary_cloud_name = cfg.cloudinary_cloud_name || ''
  }
})

async function handleSave() {
  const changed: Record<string, string | null> = {}

  if (form.value.google_analytics_id !== (config.value?.google_analytics_id || '')) {
    changed.google_analytics_id = form.value.google_analytics_id || null
  }
  if (form.value.google_search_console !== (config.value?.google_search_console || '')) {
    changed.google_search_console = form.value.google_search_console || null
  }
  if (form.value.google_adsense_id !== (config.value?.google_adsense_id || '')) {
    changed.google_adsense_id = form.value.google_adsense_id || null
  }
  if (form.value.cloudinary_cloud_name !== (config.value?.cloudinary_cloud_name || '')) {
    changed.cloudinary_cloud_name = form.value.cloudinary_cloud_name || null
  }

  if (Object.keys(changed).length === 0) return
  await saveFields(changed)
}
</script>

<template>
  <div class="admin-integrations">
    <div class="section-header">
      <h2>{{ $t('admin.configIntegrations.title') }}</h2>
      <p class="section-subtitle">{{ $t('admin.configIntegrations.subtitle') }}</p>
    </div>

    <div v-if="loading" class="loading-state">{{ $t('admin.common.loadingConfig') }}</div>

    <template v-else>
      <!-- Success / Error feedback -->
      <div v-if="saved" class="success-banner">{{ $t('admin.common.savedOk') }}</div>
      <div v-if="error" class="error-banner">
        {{ error }}
      </div>

      <!-- Google section -->
      <div class="config-card">
        <h3 class="card-title">{{ $t('admin.configIntegrations.googleSection') }}</h3>
        <p class="card-description">{{ $t('admin.configIntegrations.googleDesc') }}</p>

        <div class="form-group">
          <label for="ga-id">{{ $t('admin.configIntegrations.gaId') }}</label>
          <input
            id="ga-id"
            v-model="form.google_analytics_id"
            type="text"
            placeholder="G-XXXXXXXXXX"
          >
        </div>

        <div class="form-group">
          <label for="gsc">{{ $t('admin.configIntegrations.gsc') }}</label>
          <input
            id="gsc"
            v-model="form.google_search_console"
            type="text"
            placeholder="Codigo de verificacion"
          >
        </div>

        <div class="form-group">
          <label for="adsense">{{ $t('admin.configIntegrations.adsenseId') }}</label>
          <input
            id="adsense"
            v-model="form.google_adsense_id"
            type="text"
            placeholder="ca-pub-XXXXXXXX"
          >
        </div>
      </div>

      <!-- Cloudinary section -->
      <div class="config-card">
        <h3 class="card-title">{{ $t('admin.configIntegrations.cloudinarySection') }}</h3>
        <p class="card-description">{{ $t('admin.configIntegrations.cloudinaryDesc') }}</p>

        <div class="form-group">
          <label for="cloudinary">{{ $t('admin.configIntegrations.cloudName') }}</label>
          <input
            id="cloudinary"
            v-model="form.cloudinary_cloud_name"
            type="text"
            placeholder="mi-cloud-name"
          >
        </div>
      </div>

      <!-- Save button -->
      <div class="actions-bar">
        <button class="btn-primary" :disabled="saving" @click="handleSave">
          {{ saving ? $t('admin.common.saving') : $t('admin.common.saveChanges') }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.admin-integrations {
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

.success-banner {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-success);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
  font-weight: 500;
}

.error-banner {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
}

.config-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-card);
  margin-bottom: var(--spacing-5);
}

.card-title {
  margin: 0 0 var(--spacing-1);
  font-size: 1.25rem;
  color: var(--color-gray-800);
}

.card-description {
  margin: 0 0 var(--spacing-5);
  color: var(--color-gray-500);
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: var(--spacing-4);
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.375rem;
  color: var(--color-gray-700);
  font-size: 0.9rem;
}

.form-group input[type='text'] {
  width: 100%;
  padding: 0.625rem var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.actions-bar {
  margin-top: var(--spacing-6);
  display: flex;
  justify-content: flex-end;
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
  min-height: 2.75rem;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (min-width: 48em) {
  .config-card {
    padding: var(--spacing-8);
  }

  .form-group input[type='text'] {
    max-width: 30em;
  }
}
</style>
