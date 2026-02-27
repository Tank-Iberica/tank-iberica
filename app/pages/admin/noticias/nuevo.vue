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
        <h1>Nueva Noticia</h1>
      </div>
      <div class="nf-right">
        <button class="btn" @click="handleCancel">Cancelar</button>
        <button class="btn btn-primary" :disabled="saving || !isValid" @click="handleSave">
          {{ saving ? 'Guardando...' : 'Guardar' }}
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
  max-width: 1200px;
}

/* Header */
.nf-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.nf-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nf-left h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
}

.nf-right {
  display: flex;
  gap: 8px;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  color: #64748b;
  transition: all 0.15s;
  border: none;
  background: none;
  cursor: pointer;
}

.btn-icon:hover {
  background: #f1f5f9;
  color: #1a1a1a;
}
.btn-icon svg {
  width: 20px;
  height: 20px;
}

/* Buttons */
.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid #e2e8f0;
  background: white;
  color: #374151;
  transition: all 0.15s;
}

.btn:hover {
  background: #f8fafc;
}

.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border-color: var(--color-primary, #23424a);
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
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 0.875rem;
}

/* Grid layout */
.nf-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

@media (min-width: 1024px) {
  .nf-grid {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 24px;
    align-items: start;
  }
}

/* Form */
.nf-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
