<script setup lang="ts">
import { useAdminBanner } from '~/composables/admin/useAdminBanner'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  // State
  formData,
  showPreview,
  previewLang,
  showEmojiPicker,
  userPanelForm,
  userPanelSaving,
  // Constants
  emojiCategories,
  quickEmojis,
  // From useAdminConfig
  loading,
  saving,
  error,
  // Computed
  previewHtml,
  statusText,
  statusClass,
  // Actions
  init,
  handleSave,
  togglePreview,
  openEmojiPicker,
  closeEmojiPicker,
  insertEmoji,
  updateFormField,
  updateUserPanelField,
  saveUserPanelBanner,
} = useAdminBanner()

onMounted(() => {
  init()
})
</script>

<template>
  <div class="admin-banner">
    <!-- Header -->
    <div class="section-header">
      <h2>{{ $t('admin.banner.title') }}</h2>
      <div class="header-status" :class="statusClass">
        {{ statusText }}
      </div>
    </div>

    <!-- Error message -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">{{ $t('common.loadingItems') }}</div>

    <!-- Form -->
    <div v-else class="banner-form">
      <AdminBannerForm
        :form-data="formData"
        :saving="saving"
        :show-preview="showPreview"
        :quick-emojis="quickEmojis"
        @save="handleSave"
        @toggle-preview="togglePreview"
        @open-emoji-picker="openEmojiPicker"
        @insert-emoji="insertEmoji"
        @update-field="updateFormField"
      />

      <!-- Preview Panel -->
      <Transition name="slide">
        <AdminBannerPreview
          v-if="showPreview"
          :preview-html="previewHtml"
          :preview-lang="previewLang"
          @update-lang="previewLang = $event"
        />
      </Transition>
    </div>

    <!-- User Panel Banner -->
    <AdminBannerUserPanel
      :form="userPanelForm"
      :saving="userPanelSaving"
      @save="saveUserPanelBanner"
      @update-field="updateUserPanelField"
    />

    <!-- Emoji Picker Modal -->
    <AdminBannerEmojiPicker
      :show="showEmojiPicker"
      :categories="emojiCategories"
      @close="closeEmojiPicker"
      @select="insertEmoji"
    />
  </div>
</template>

<style scoped>
.admin-banner {
  padding: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
  flex-wrap: wrap;
  gap: var(--spacing-3);
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-text);
}

.header-status {
  padding: 0.375rem var(--spacing-4);
  border-radius: var(--border-radius-full);
  font-size: 0.85rem;
  font-weight: 500;
}

.status-active {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-success);
}

.status-inactive {
  background: var(--bg-secondary);
  color: var(--color-gray-500);
}

.status-scheduled {
  background: var(--color-info-bg, var(--color-info-bg));
  color: var(--color-info);
}

.status-expired {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}

.error-banner {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
}

.loading-state {
  text-align: center;
  padding: var(--spacing-10);
  color: var(--color-gray-500);
}

.banner-form {
  display: grid;
  gap: var(--spacing-6);
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Mobile responsive */
@media (max-width: 48em) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
