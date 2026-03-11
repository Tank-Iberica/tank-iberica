<script setup lang="ts">
import { useAdminNavigation } from '~/composables/admin/useAdminNavigation'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  // State from vertical config
  config,
  loading,
  saving,
  error,
  saved,

  // Local form state
  headerLinks,
  footerText,
  footerLinks,
  socialLinks,

  // Init
  init,

  // Header links
  addHeaderLink,
  removeHeaderLink,
  moveHeaderLink,
  updateHeaderLinkField,

  // Footer links
  addFooterLink,
  removeFooterLink,
  moveFooterLink,
  updateFooterLinkField,

  // Footer text
  updateFooterText,

  // Social links
  updateSocialLink,

  // Save
  handleSave,
} = useAdminNavigation()

onMounted(() => {
  init()
})
</script>

<template>
  <div class="admin-navigation">
    <div class="section-header">
      <div>
        <h2>{{ $t('admin.configNavigation.title') }}</h2>
        <p class="section-subtitle">Configura los enlaces del header, footer y redes sociales</p>
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
      <!-- Header Links -->
      <AdminConfigNavigationHeaderLinks
        :links="headerLinks"
        @add="addHeaderLink"
        @move="moveHeaderLink"
        @remove="removeHeaderLink"
        @update-field="updateHeaderLinkField"
      />

      <!-- Footer section -->
      <AdminConfigNavigationFooterSection
        :footer-text="footerText"
        :links="footerLinks"
        @add-link="addFooterLink"
        @move-link="moveFooterLink"
        @remove-link="removeFooterLink"
        @update-link-field="updateFooterLinkField"
        @update-footer-text="updateFooterText"
      />

      <!-- Social links -->
      <AdminConfigNavigationSocialLinks
        :social-links="socialLinks"
        @update-field="updateSocialLink"
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
.admin-navigation {
  padding: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.section-header h2 {
  margin: 0 0 var(--spacing-1);
  font-size: 1.75rem;
  color: var(--color-text);
}

.section-subtitle {
  margin: 0;
  color: var(--color-gray-500);
  font-size: 1rem;
}

.btn-back {
  background: var(--bg-tertiary);
  color: var(--color-gray-700);
  border: none;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  font-size: 0.875rem;
  white-space: nowrap;
}

.btn-back:hover {
  background: var(--color-gray-300);
}

.feedback-banner {
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
  font-size: 0.95rem;
}

.error-banner {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}

.success-banner {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-success);
}

.loading-state {
  text-align: center;
  padding: var(--spacing-10);
  color: var(--color-gray-500);
}

.save-bar {
  padding: var(--spacing-5) 0;
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-3) 1.75rem;
  border-radius: var(--border-radius);
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
