<script setup lang="ts">
import { useAdminNewsCreate } from '~/composables/admin/useAdminNewsCreate'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  // State
  saving,
  error,
  formData,
  hashtagInput,
  relatedCategoryInput,
  sections,
  analysis,
  isValid,
  imagePreviewUrl,
  uploadingImage,
  uploadProgress,
  uploadError,

  // Computed
  titleLengthClass,
  descLengthClass,
  contentWordCount,
  wordCountClass,
  excerptLengthClass,

  // Methods
  addFaqItem,
  removeFaqItem,
  addRelatedCategory,
  removeRelatedCategory,
  addHashtag,
  removeHashtag,
  handleImageFile,
  removeImage,
  handleSave,
  handleCancel,
  getLevelLabel,
} = useAdminNewsCreate()

function onUpdateImageUrl(url: string | null) {
  formData.value.image_url = url
}

function onUpdateFaqSchema(schema: Array<{ question: string; answer: string }> | null) {
  formData.value.faq_schema = schema
}

function onUpdateSocialPostText(value: Record<string, string> | null) {
  formData.value.social_post_text = value
}

// A7 — AI-generated article draft: pre-fill form fields
function onAiGenerated(result: {
  title_es: string
  title_en: string
  meta_description_es: string
  meta_description_en: string
  content_es: string
  content_en: string
}) {
  if (result.title_es) formData.value.title_es = result.title_es
  if (result.title_en) formData.value.title_en = result.title_en
  if (result.meta_description_es) formData.value.description_es = result.meta_description_es
  if (result.content_es) formData.value.content_es = result.content_es
  if (result.content_en) formData.value.content_en = result.content_en
}
</script>

<template>
  <div class="nf">
    <!-- Header -->
    <header class="nf-header">
      <div class="nf-left">
        <button class="btn-icon" @click="handleCancel">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1>{{ $t('admin.noticias.newTitle') }}</h1>
      </div>
      <div class="nf-right">
        <AdminNewsAiGenerate @generated="onAiGenerated" />
        <button class="btn" @click="handleCancel">{{ $t('common.cancel') }}</button>
        <button class="btn btn-primary" :disabled="saving || !isValid" @click="handleSave">
          {{ saving ? $t('admin.common.saving') : $t('admin.common.save') }}
        </button>
      </div>
    </header>

    <div v-if="error" class="error-msg">{{ error }}</div>

    <!-- Two-column layout -->
    <div class="nf-grid">
      <!-- LEFT: Form -->
      <div class="nf-form">
        <!-- Publication -->
        <AdminNewsPublicationSection
          :section="formData.section"
          :status="formData.status"
          :category="formData.category"
          :published-at="formData.published_at"
          :scheduled-at="formData.scheduled_at"
          @update:section="formData.section = $event"
          @update:status="formData.status = $event"
          @update:category="formData.category = $event"
          @update:published-at="formData.published_at = $event"
          @update:scheduled-at="formData.scheduled_at = $event"
        />

        <!-- Title + Slug -->
        <AdminNewsTitleSlug
          :title-es="formData.title_es"
          :slug="formData.slug"
          :title-length-class="titleLengthClass"
          @update:title-es="formData.title_es = $event"
          @update:slug="formData.slug = $event"
        />

        <!-- Image -->
        <AdminNewsImageUpload
          :image-url="formData.image_url"
          :image-preview-url="imagePreviewUrl"
          :uploading-image="uploadingImage"
          :upload-progress="uploadProgress"
          :upload-error="uploadError"
          @file-change="handleImageFile"
          @remove-image="removeImage"
          @update:image-url="onUpdateImageUrl"
        />

        <!-- Meta Description -->
        <AdminNewsMetaDescription
          :description-es="formData.description_es"
          :desc-length-class="descLengthClass"
          @update:description-es="formData.description_es = $event"
        />

        <!-- Excerpt -->
        <AdminNewsExcerpt
          :excerpt-es="formData.excerpt_es"
          :excerpt-length-class="excerptLengthClass"
          @update:excerpt-es="formData.excerpt_es = $event"
        />

        <!-- FAQ Schema -->
        <AdminNewsFaqSection
          :faq-schema="formData.faq_schema"
          :open="sections.faq"
          @update:open="sections.faq = $event"
          @update:faq-schema="onUpdateFaqSchema"
          @add="addFaqItem"
          @remove="removeFaqItem"
        />

        <!-- Social Media -->
        <AdminNewsSocialSection
          :social-post-text="formData.social_post_text"
          :open="sections.social"
          @update:open="sections.social = $event"
          @update:social-post-text="onUpdateSocialPostText"
        />

        <!-- Related Categories -->
        <AdminNewsRelatedCategories
          :related-categories="formData.related_categories"
          :related-category-input="relatedCategoryInput"
          @update:related-category-input="relatedCategoryInput = $event"
          @add-category="addRelatedCategory"
          @remove-category="removeRelatedCategory"
        />

        <!-- Content ES -->
        <AdminNewsContentEditor
          :content-es="formData.content_es"
          :content-word-count="contentWordCount"
          :word-count-class="wordCountClass"
          @update:content-es="formData.content_es = $event"
        />

        <!-- Hashtags -->
        <AdminNewsHashtags
          :hashtags="formData.hashtags"
          :hashtag-input="hashtagInput"
          @update:hashtag-input="hashtagInput = $event"
          @add-hashtag="addHashtag"
          @remove-hashtag="removeHashtag"
        />

        <!-- English content (collapsible) -->
        <AdminNewsEnglishContent
          :title-en="formData.title_en"
          :description-en="formData.description_en"
          :content-en="formData.content_en"
          :open="sections.english"
          @update:open="sections.english = $event"
          @update:title-en="formData.title_en = $event"
          @update:description-en="formData.description_en = $event"
          @update:content-en="formData.content_en = $event"
        />
      </div>

      <!-- RIGHT: SEO Panel -->
      <AdminNewsSeoPanel
        :analysis="analysis"
        :seo-panel="sections.seoPanel"
        :get-level-label="getLevelLabel"
        @update:seo-panel="sections.seoPanel = $event"
      />
    </div>
  </div>
</template>

<style scoped>
.nf {
  max-width: 75rem;
}

/* Header */
.nf-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
  flex-wrap: wrap;
  gap: var(--spacing-3);
}

.nf-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.nf-left h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-near-black);
}

.nf-right {
  display: flex;
  gap: var(--spacing-2);
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--border-radius);
  color: var(--text-auxiliary);
  transition: all 0.15s;
  border: none;
  background: none;
  cursor: pointer;
}

.btn-icon:hover {
  background: var(--bg-secondary);
  color: var(--color-near-black);
}
.btn-icon svg {
  width: 1.25rem;
  height: 1.25rem;
}

/* Buttons */
.btn {
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--color-gray-200);
  background: var(--bg-primary);
  color: var(--color-gray-700);
  transition: all 0.15s;
}

.btn:hover {
  background: var(--bg-secondary);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.btn-primary:hover {
  opacity: 0.9;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Error */
.error-msg {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
  font-size: 0.875rem;
}

/* Grid layout */
.nf-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

@media (min-width: 64em) {
  .nf-grid {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: var(--spacing-6);
    align-items: start;
  }
}

/* Form */
.nf-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
}
</style>
