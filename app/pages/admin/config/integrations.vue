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
      <h2>SEO e Integraciones</h2>
      <p class="section-subtitle">
        Configura las integraciones con servicios externos de Google y Cloudinary.
      </p>
    </div>

    <div v-if="loading" class="loading-state">Cargando configuracion...</div>

    <template v-else>
      <!-- Success / Error feedback -->
      <div v-if="saved" class="success-banner">Cambios guardados correctamente.</div>
      <div v-if="error" class="error-banner">
        {{ error }}
      </div>

      <!-- Google section -->
      <div class="config-card">
        <h3 class="card-title">Google</h3>
        <p class="card-description">Identificadores para Analytics, Search Console y AdSense.</p>

        <div class="form-group">
          <label for="ga-id">Google Analytics ID</label>
          <input
            id="ga-id"
            v-model="form.google_analytics_id"
            type="text"
            placeholder="G-XXXXXXXXXX"
          >
        </div>

        <div class="form-group">
          <label for="gsc">Google Search Console</label>
          <input
            id="gsc"
            v-model="form.google_search_console"
            type="text"
            placeholder="Codigo de verificacion"
          >
        </div>

        <div class="form-group">
          <label for="adsense">Google AdSense ID</label>
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
        <h3 class="card-title">Cloudinary</h3>
        <p class="card-description">Servicio de gestion y optimizacion de imagenes.</p>

        <div class="form-group">
          <label for="cloudinary">Cloud Name</label>
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
          {{ saving ? 'Guardando...' : 'Guardar cambios' }}
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

.success-banner {
  background: #f0fdf4;
  color: #16a34a;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-weight: 500;
}

.error-banner {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.config-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.card-title {
  margin: 0 0 4px;
  font-size: 1.25rem;
  color: #1f2937;
}

.card-description {
  margin: 0 0 20px;
  color: #6b7280;
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 6px;
  color: #374151;
  font-size: 0.9rem;
}

.form-group input[type='text'] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.actions-bar {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
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
  min-height: 44px;
}

.btn-primary:hover {
  background: var(--color-primary-dark, #1a3238);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (min-width: 768px) {
  .config-card {
    padding: 32px;
  }

  .form-group input[type='text'] {
    max-width: 480px;
  }
}
</style>
