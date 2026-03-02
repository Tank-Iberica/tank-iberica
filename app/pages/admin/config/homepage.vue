<script setup lang="ts">
import { useAdminHomepage, sectionDefinitions } from '~/composables/admin/useAdminHomepage'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  config,
  loading,
  saving,
  error,
  saved,
  heroTitle,
  heroSubtitle,
  heroCtaText,
  heroCtaUrl,
  heroImageUrl,
  homepageSections,
  banners,
  init,
  updateHeroTitle,
  updateHeroSubtitle,
  updateHeroCtaText,
  updateHeroCtaUrl,
  updateHeroImageUrl,
  toggleSection,
  addBanner,
  removeBanner,
  updateBannerField,
  handleSave,
} = useAdminHomepage()

onMounted(() => {
  init()
})
</script>

<template>
  <div class="admin-homepage">
    <div class="section-header">
      <div>
        <h2>{{ $t('admin.configHomepage.title') }}</h2>
        <p class="section-subtitle">
          Configura el hero, las secciones visibles y los banners promocionales
        </p>
      </div>
      <NuxtLink to="/admin/config" class="btn-back"> Volver </NuxtLink>
    </div>

    <!-- Feedback -->
    <div v-if="error" class="feedback-banner error-banner">
      {{ error }}
    </div>
    <div v-if="saved" class="feedback-banner success-banner">Cambios guardados correctamente</div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">{{ $t('admin.common.loadingConfig') }}</div>

    <template v-else-if="config">
      <!-- Hero section -->
      <AdminConfigHomepageHomepageHeroSection
        :hero-title="heroTitle"
        :hero-subtitle="heroSubtitle"
        :hero-cta-text="heroCtaText"
        :hero-cta-url="heroCtaUrl"
        :hero-image-url="heroImageUrl"
        @update-title="updateHeroTitle"
        @update-subtitle="updateHeroSubtitle"
        @update-cta-text="updateHeroCtaText"
        @update-cta-url="updateHeroCtaUrl"
        @update-image-url="updateHeroImageUrl"
      />

      <!-- Sections -->
      <AdminConfigHomepageHomepageSectionsCard
        :sections="homepageSections"
        :section-definitions="sectionDefinitions"
        @toggle-section="toggleSection"
      />

      <!-- Banners -->
      <AdminConfigHomepageHomepageBannersCard
        :banners="banners"
        @add="addBanner"
        @remove="removeBanner"
        @update-field="updateBannerField"
      />

      <!-- Save button -->
      <div class="save-bar">
        <button class="btn-primary" :disabled="saving" @click="handleSave">
          {{ saving ? $t('admin.common.saving') : $t('admin.common.saveChanges') }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.admin-homepage {
  padding: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}

.section-header h2 {
  margin: 0 0 4px;
  font-size: 1.75rem;
  color: var(--color-text);
}

.section-subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
}

.btn-back {
  background: var(--bg-tertiary);
  color: #374151;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  font-size: 0.875rem;
  white-space: nowrap;
}

.btn-back:hover {
  background: #d1d5db;
}

.feedback-banner {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 0.95rem;
}

.error-banner {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
}

.success-banner {
  background: var(--color-success-bg, #dcfce7);
  color: var(--color-success);
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.save-bar {
  padding: 20px 0;
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
