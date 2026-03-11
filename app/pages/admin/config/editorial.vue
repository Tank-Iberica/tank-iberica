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

.config-card--muted {
  border: 1px dashed var(--border-color);
  box-shadow: none;
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

.toggle-group {
  margin-bottom: var(--spacing-4);
}

.toggle-group:last-child {
  margin-bottom: 0;
}

.toggle-label {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
  cursor: pointer;
  padding: var(--spacing-3);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  transition: border-color 0.2s;
}

.toggle-label:hover {
  border-color: var(--color-primary);
}

.toggle-label input[type='checkbox'] {
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.125rem;
  flex-shrink: 0;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.toggle-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.toggle-text strong {
  font-size: 0.95rem;
  color: var(--color-gray-800);
}

.toggle-text small {
  font-size: 0.8rem;
  color: var(--color-gray-500);
}

.link-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
}

.link-card:hover {
  border-color: var(--color-primary);
  background: var(--color-gray-50);
}

.link-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.link-card-content strong {
  font-size: 0.95rem;
  color: var(--color-gray-800);
}

.link-card-content small {
  font-size: 0.8rem;
  color: var(--color-gray-500);
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
  padding: var(--spacing-8) var(--spacing-4);
  background: var(--color-gray-50);
  border-radius: var(--border-radius);
}

.placeholder-text {
  display: inline-block;
  background: var(--bg-tertiary);
  color: var(--color-gray-500);
  padding: var(--spacing-1) var(--spacing-4);
  border-radius: var(--border-radius-full);
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: var(--spacing-3);
}

.placeholder-description {
  color: var(--text-disabled);
  font-size: 0.85rem;
  max-width: 25rem;
  margin: 0 auto;
  line-height: 1.5;
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
}
</style>
