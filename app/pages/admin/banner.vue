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
    <div v-if="loading" class="loading-state">Cargando configuracion...</div>

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
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-text);
}

.header-status {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-active {
  background: var(--color-success-bg, #dcfce7);
  color: var(--color-success);
}

.status-inactive {
  background: var(--bg-secondary);
  color: #6b7280;
}

.status-scheduled {
  background: var(--color-info-bg, #dbeafe);
  color: var(--color-info);
}

.status-expired {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
}

.error-banner {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.banner-form {
  display: grid;
  gap: 24px;
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
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
