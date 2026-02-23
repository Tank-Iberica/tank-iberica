<script setup lang="ts">
import { useAdminVerticalConfig } from '~/composables/admin/useAdminVerticalConfig'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { config, loading, saving, error, saved, loadConfig, saveFields } = useAdminVerticalConfig()

// Local form state
const form = ref({
  auto_publish_social: false,
  require_article_approval: false,
})

onMounted(async () => {
  const cfg = await loadConfig()
  if (cfg) {
    form.value.auto_publish_social = cfg.auto_publish_social ?? false
    form.value.require_article_approval = cfg.require_article_approval ?? false
  }
})

async function handleSave() {
  const changed: Record<string, boolean> = {}

  if (form.value.auto_publish_social !== (config.value?.auto_publish_social ?? false)) {
    changed.auto_publish_social = form.value.auto_publish_social
  }
  if (form.value.require_article_approval !== (config.value?.require_article_approval ?? false)) {
    changed.require_article_approval = form.value.require_article_approval
  }

  if (Object.keys(changed).length === 0) return
  await saveFields(changed)
}
</script>

<template>
  <div class="admin-editorial">
    <div class="section-header">
      <h2>Editorial</h2>
      <p class="section-subtitle">Opciones de publicacion de articulos y redes sociales.</p>
    </div>

    <div v-if="loading" class="loading-state">Cargando configuracion...</div>

    <template v-else>
      <!-- Success / Error feedback -->
      <div v-if="saved" class="success-banner">Cambios guardados correctamente.</div>
      <div v-if="error" class="error-banner">
        {{ error }}
      </div>

      <!-- Publicacion section -->
      <div class="config-card">
        <h3 class="card-title">Publicacion</h3>
        <p class="card-description">Controla el flujo de publicacion de contenido editorial.</p>

        <div class="toggle-group">
          <label class="toggle-label">
            <input v-model="form.require_article_approval" type="checkbox" >
            <span class="toggle-text">
              <strong>Requerir aprobacion de articulos</strong>
              <small>Los articulos nuevos necesitaran revision antes de publicarse.</small>
            </span>
          </label>
        </div>

        <div class="toggle-group">
          <label class="toggle-label">
            <input v-model="form.auto_publish_social" type="checkbox" >
            <span class="toggle-text">
              <strong>Auto-publicar en redes sociales</strong>
              <small
                >Los articulos publicados se compartiran automaticamente en las redes
                configuradas.</small
              >
            </span>
          </label>
        </div>
      </div>

      <!-- Articulos section -->
      <div class="config-card">
        <h3 class="card-title">Articulos</h3>
        <p class="card-description">Gestiona los articulos del blog y noticias del sitio.</p>

        <NuxtLink to="/admin/noticias" class="link-card">
          <div class="link-card-content">
            <strong>Gestionar articulos</strong>
            <small>Crear, editar y publicar articulos del blog</small>
          </div>
          <span class="link-card-arrow">&rarr;</span>
        </NuxtLink>
      </div>

      <!-- Calendario placeholder -->
      <div class="config-card config-card--muted">
        <h3 class="card-title">Calendario editorial</h3>
        <p class="card-description">Planifica y programa la publicacion de contenido.</p>
        <div class="placeholder-box">
          <span class="placeholder-text">Proximamente</span>
          <p class="placeholder-description">
            El calendario editorial permitira programar articulos, gestionar borradores y coordinar
            la publicacion de contenido en el sitio y redes sociales.
          </p>
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
.admin-editorial {
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

.config-card--muted {
  border: 1px dashed #d1d5db;
  box-shadow: none;
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

.toggle-group {
  margin-bottom: 16px;
}

.toggle-group:last-child {
  margin-bottom: 0;
}

.toggle-label {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: border-color 0.2s;
}

.toggle-label:hover {
  border-color: var(--color-primary, #23424a);
}

.toggle-label input[type='checkbox'] {
  width: 20px;
  height: 20px;
  margin-top: 2px;
  flex-shrink: 0;
  cursor: pointer;
  accent-color: var(--color-primary, #23424a);
}

.toggle-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toggle-text strong {
  font-size: 0.95rem;
  color: #1f2937;
}

.toggle-text small {
  font-size: 0.8rem;
  color: #6b7280;
}

.link-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
}

.link-card:hover {
  border-color: var(--color-primary, #23424a);
  background: #f9fafb;
}

.link-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.link-card-content strong {
  font-size: 0.95rem;
  color: #1f2937;
}

.link-card-content small {
  font-size: 0.8rem;
  color: #6b7280;
}

.link-card-arrow {
  font-size: 1.25rem;
  color: #9ca3af;
  transition: transform 0.2s;
}

.link-card:hover .link-card-arrow {
  transform: translateX(4px);
  color: var(--color-primary, #23424a);
}

.placeholder-box {
  text-align: center;
  padding: 32px 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.placeholder-text {
  display: inline-block;
  background: #e5e7eb;
  color: #6b7280;
  padding: 4px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.placeholder-description {
  margin: 0;
  color: #9ca3af;
  font-size: 0.85rem;
  max-width: 400px;
  margin: 0 auto;
  line-height: 1.5;
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
}
</style>
