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
      <h2>{{ $t('admin.configEditorial.title') }}</h2>
      <p class="section-subtitle">{{ $t('admin.configEditorial.subtitle') }}</p>
    </div>

    <div v-if="loading" class="loading-state">{{ $t('admin.common.loadingConfig') }}</div>

    <template v-else>
      <!-- Success / Error feedback -->
      <div v-if="saved" class="success-banner">{{ $t('admin.common.savedOk') }}</div>
      <div v-if="error" class="error-banner">
        {{ error }}
      </div>

      <!-- Publicacion section -->
      <div class="config-card">
        <h3 class="card-title">{{ $t('admin.configEditorial.publicationSection') }}</h3>
        <p class="card-description">{{ $t('admin.configEditorial.publicationDesc') }}</p>

        <div class="toggle-group">
          <label class="toggle-label">
            <input v-model="form.require_article_approval" type="checkbox" >
            <span class="toggle-text">
              <strong>{{ $t('admin.configEditorial.requireArticleApproval') }}</strong>
              <small>{{ $t('admin.configEditorial.requireArticleApprovalDesc') }}</small>
            </span>
          </label>
        </div>

        <div class="toggle-group">
          <label class="toggle-label">
            <input v-model="form.auto_publish_social" type="checkbox" >
            <span class="toggle-text">
              <strong>{{ $t('admin.configEditorial.autoPublishSocial') }}</strong>
              <small>{{ $t('admin.configEditorial.autoPublishSocialDesc') }}</small>
            </span>
          </label>
        </div>
      </div>

      <!-- Articulos section -->
      <div class="config-card">
        <h3 class="card-title">{{ $t('admin.configEditorial.articlesSection') }}</h3>
        <p class="card-description">{{ $t('admin.configEditorial.articlesSectionDesc') }}</p>

        <NuxtLink to="/admin/noticias" class="link-card">
          <div class="link-card-content">
            <strong>{{ $t('admin.configEditorial.manageArticles') }}</strong>
            <small>{{ $t('admin.configEditorial.manageArticlesDesc') }}</small>
          </div>
          <span class="link-card-arrow">&rarr;</span>
        </NuxtLink>
      </div>

      <!-- Calendario placeholder -->
      <div class="config-card config-card--muted">
        <h3 class="card-title">{{ $t('admin.configEditorial.calendarSection') }}</h3>
        <p class="card-description">{{ $t('admin.configEditorial.calendarDesc') }}</p>
        <div class="placeholder-box">
          <span class="placeholder-text">{{ $t('admin.configEditorial.comingSoon') }}</span>
          <p class="placeholder-description">
            {{ $t('admin.configEditorial.calendarComingSoonDesc') }}
          </p>
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
  background: var(--color-success-bg, #dcfce7);
  color: var(--color-success);
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-weight: 500;
}

.error-banner {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.config-card {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.config-card--muted {
  border: 1px dashed var(--border-color);
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
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
  transition: border-color 0.2s;
}

.toggle-label:hover {
  border-color: var(--color-primary);
}

.toggle-label input[type='checkbox'] {
  width: 20px;
  height: 20px;
  margin-top: 2px;
  flex-shrink: 0;
  cursor: pointer;
  accent-color: var(--color-primary);
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
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
}

.link-card:hover {
  border-color: var(--color-primary);
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
  color: var(--text-disabled);
  transition: transform 0.2s;
}

.link-card:hover .link-card-arrow {
  transform: translateX(4px);
  color: var(--color-primary);
}

.placeholder-box {
  text-align: center;
  padding: 32px 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.placeholder-text {
  display: inline-block;
  background: var(--bg-tertiary);
  color: #6b7280;
  padding: 4px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.placeholder-description {
  margin: 0;
  color: var(--text-disabled);
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
  background: var(--color-primary);
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
  background: var(--color-primary-dark);
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
