<script setup lang="ts">
import { useAdminNoticiaForm } from '~/composables/admin/useAdminNoticiaForm'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const newsId = computed(() => route.params.id as string)

const {
  loading,
  saving,
  error,
  article,
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
  deleteModal,
  deleteConfirmText,
  titleLengthClass,
  descLengthClass,
  contentWordCount,
  wordCountClass,
  excerptLengthClass,
  init,
  addFaqItem,
  removeFaqItem,
  addRelatedCategory,
  removeRelatedCategory,
  addHashtag,
  removeHashtag,
  handleImageFile,
  removeImage,
  openDeleteModal,
  closeDeleteModal,
  executeDelete,
  handleSave,
  handleCancel,
  formatDate,
  getLevelLabel,
} = useAdminNoticiaForm(newsId)

onMounted(init)
</script>

<template>
  <div class="nf">
    <div v-if="loading && !article" class="loading-state">
      <div class="spinner" />
      Cargando articulo...
    </div>

    <template v-else-if="article">
      <AdminNewsFormHeader
        :title="article.title_es"
        :slug="formData.slug"
        :saving="saving"
        :is-valid="isValid"
        @cancel="handleCancel"
        @save="handleSave"
        @delete="openDeleteModal"
      />

      <div v-if="error" class="error-msg">{{ error }}</div>

      <div class="nf-grid">
        <div class="nf-form">
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

          <AdminNewsTitleSlug
            :title-es="formData.title_es"
            :slug="formData.slug"
            :title-length-class="titleLengthClass"
            @update:title-es="formData.title_es = $event"
            @update:slug="formData.slug = $event"
          />

          <AdminNewsImageUpload
            :image-url="formData.image_url"
            :image-preview-url="imagePreviewUrl"
            :uploading-image="uploadingImage"
            :upload-progress="uploadProgress"
            :upload-error="uploadError"
            @file-change="handleImageFile"
            @remove-image="removeImage"
            @update:image-url="formData.image_url = $event"
          />

          <AdminNewsMetaDescription
            :description-es="formData.description_es"
            :desc-length-class="descLengthClass"
            @update:description-es="formData.description_es = $event"
          />

          <AdminNewsExcerpt
            :excerpt-es="formData.excerpt_es"
            :excerpt-length-class="excerptLengthClass"
            @update:excerpt-es="formData.excerpt_es = $event"
          />

          <AdminNewsFaqSection
            :faq-schema="formData.faq_schema"
            :open="sections.faq"
            @update:open="sections.faq = $event"
            @add="addFaqItem"
            @remove="removeFaqItem"
            @update:faq-schema="formData.faq_schema = $event"
          />

          <AdminNewsSocialSection
            :social-post-text="formData.social_post_text"
            :open="sections.social"
            @update:open="sections.social = $event"
            @update:social-post-text="formData.social_post_text = $event"
          />

          <AdminNewsRelatedCategories
            :related-categories="formData.related_categories"
            :related-category-input="relatedCategoryInput"
            @update:related-category-input="relatedCategoryInput = $event"
            @add-category="addRelatedCategory"
            @remove-category="removeRelatedCategory"
          />

          <AdminNewsContentEditor
            :content-es="formData.content_es"
            :content-word-count="contentWordCount"
            :word-count-class="wordCountClass"
            @update:content-es="formData.content_es = $event"
          />

          <AdminNewsHashtags
            :hashtags="formData.hashtags"
            :hashtag-input="hashtagInput"
            @update:hashtag-input="hashtagInput = $event"
            @add-hashtag="addHashtag"
            @remove-hashtag="removeHashtag"
          />

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

          <AdminNewsArticleInfo
            :article="article"
            :open="sections.info"
            :format-date="formatDate"
            @update:open="sections.info = $event"
          />
        </div>

        <AdminNewsSeoPanel
          :analysis="analysis"
          :seo-panel="sections.seoPanel"
          :get-level-label="getLevelLabel"
          @update:seo-panel="sections.seoPanel = $event"
        />
      </div>
    </template>

    <AdminNewsDeleteModal
      :visible="deleteModal"
      :article-title="article?.title_es"
      :confirm-text="deleteConfirmText"
      @close="closeDeleteModal"
      @confirm="executeDelete"
      @update:confirm-text="deleteConfirmText = $event"
    />
  </div>
</template>

<style scoped>
.nf {
  max-width: 1200px;
}

.loading-state {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 40px 0;
  justify-content: center;
  color: #64748b;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-msg {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 0.875rem;
}

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

.nf-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
