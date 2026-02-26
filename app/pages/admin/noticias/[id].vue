<script setup lang="ts">
import { useAdminNewsForm } from '~/composables/admin/useAdminNewsForm'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const newsId = computed(() => route.params.id as string)

const {
  // State
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
  openDeleteModal,
  closeDeleteModal,
  executeDelete,
  handleSave,
  handleCancel,
  formatDate,
  getLevelLabel,
} = useAdminNewsForm(newsId)
</script>

<template>
  <div class="nf">
    <!-- Loading -->
    <div v-if="loading && !article" class="loading-state">
      <div class="spinner" />
      Cargando articulo...
    </div>

    <template v-else-if="article">
      <!-- Header -->
      <header class="nf-header">
        <div class="nf-left">
          <button class="btn-icon" @click="handleCancel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1>{{ article.title_es }}</h1>
        </div>
        <div class="nf-right">
          <a :href="`/noticias/${formData.slug}`" target="_blank" class="btn" title="Ver en web">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              style="width: 16px; height: 16px"
            >
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Ver
          </a>
          <button class="btn btn-delete-outline" @click="openDeleteModal">Eliminar</button>
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
          <div class="section">
            <div class="section-title">Publicacion</div>
            <div class="field" style="margin-bottom: 12px">
              <label>Seccion</label>
              <div class="estado-row">
                <label class="estado-opt" :class="{ active: formData.section === 'noticias' }">
                  <input v-model="formData.section" type="radio" value="noticias" >
                  Noticias
                </label>
                <label class="estado-opt" :class="{ active: formData.section === 'guia' }">
                  <input v-model="formData.section" type="radio" value="guia" >
                  Guia
                </label>
              </div>
            </div>
            <div class="row-2">
              <div class="field">
                <label>Estado</label>
                <div class="estado-row">
                  <label class="estado-opt" :class="{ active: formData.status === 'draft' }">
                    <input v-model="formData.status" type="radio" value="draft" >
                    Borrador
                  </label>
                  <label class="estado-opt" :class="{ active: formData.status === 'published' }">
                    <input v-model="formData.status" type="radio" value="published" >
                    Publicado
                  </label>
                  <label class="estado-opt" :class="{ active: formData.status === 'scheduled' }">
                    <input v-model="formData.status" type="radio" value="scheduled" >
                    Programado
                  </label>
                  <label class="estado-opt" :class="{ active: formData.status === 'archived' }">
                    <input v-model="formData.status" type="radio" value="archived" >
                    Archivado
                  </label>
                </div>
              </div>
              <div class="field">
                <label>Categoria</label>
                <select v-model="formData.category" class="input">
                  <option value="prensa">Prensa</option>
                  <option value="eventos">Eventos</option>
                  <option value="destacados">Destacados</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>
            <div v-if="formData.status === 'published'" class="field">
              <label>Fecha de publicacion</label>
              <input v-model="formData.published_at" type="datetime-local" class="input" >
            </div>
            <div v-if="formData.status === 'scheduled'" class="field">
              <label>Fecha de publicacion programada</label>
              <input v-model="formData.scheduled_at" type="datetime-local" class="input" >
              <span class="char-count">El articulo se publicara automaticamente en esta fecha</span>
            </div>
          </div>

          <!-- Title + Slug -->
          <div class="section">
            <div class="section-title">Titulo y URL</div>
            <div class="field">
              <label>Titulo (ES) *</label>
              <input
                v-model="formData.title_es"
                type="text"
                class="input"
                placeholder="Titulo de la noticia..."
              >
              <span class="char-count" :class="titleLengthClass">
                {{ formData.title_es.length }}/60 caracteres
              </span>
            </div>
            <div class="field">
              <label>URL (slug)</label>
              <div class="slug-input-wrapper">
                <span class="slug-prefix">/noticias/</span>
                <input
                  v-model="formData.slug"
                  type="text"
                  class="input slug-field"
                  placeholder="url-de-la-noticia"
                >
              </div>
            </div>
          </div>

          <!-- Image -->
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

          <!-- Meta Description -->
          <div class="section">
            <div class="section-title">Meta Descripcion (SEO)</div>
            <p class="section-hint">
              Este texto aparece en los resultados de Google debajo del titulo. Debe ser un resumen
              atractivo que invite a hacer clic.
            </p>
            <div class="field">
              <label>Descripcion (ES)</label>
              <textarea
                v-model="formData.description_es"
                rows="3"
                class="input textarea"
                maxlength="200"
                placeholder="Resumen atractivo de la noticia para Google (120-160 caracteres ideal)..."
              />
              <div class="count-row">
                <span class="char-count" :class="descLengthClass">
                  {{ (formData.description_es || '').length }}/160 caracteres
                </span>
                <span
                  v-if="(formData.description_es || '').length > 0"
                  class="char-count"
                  :class="descLengthClass"
                >
                  {{
                    (formData.description_es || '').length >= 120 &&
                    (formData.description_es || '').length <= 160
                      ? 'Longitud ideal'
                      : (formData.description_es || '').length < 120
                        ? 'Muy corta'
                        : 'Larga'
                  }}
                </span>
              </div>
            </div>
          </div>

          <!-- Excerpt -->
          <div class="section">
            <div class="section-title">Extracto</div>
            <p class="section-hint">
              Resumen corto del articulo que aparece en listados y tarjetas. Recomendado: 120-200
              caracteres.
            </p>
            <div class="field">
              <label>Extracto (ES)</label>
              <textarea
                v-model="formData.excerpt_es"
                rows="3"
                class="input textarea"
                maxlength="300"
                placeholder="Resumen breve del articulo para listados (120-200 caracteres recomendado)..."
              />
              <div class="count-row">
                <span class="char-count" :class="excerptLengthClass">
                  {{ (formData.excerpt_es || '').length }}/300 caracteres
                </span>
                <span
                  v-if="(formData.excerpt_es || '').length > 0"
                  class="char-count"
                  :class="excerptLengthClass"
                >
                  {{
                    (formData.excerpt_es || '').length >= 120 &&
                    (formData.excerpt_es || '').length <= 200
                      ? 'Longitud ideal'
                      : (formData.excerpt_es || '').length < 120
                        ? 'Muy corto'
                        : 'Largo'
                  }}
                </span>
              </div>
            </div>
          </div>

          <!-- FAQ Schema -->
          <AdminNewsFaqSection
            :faq-schema="formData.faq_schema"
            :open="sections.faq"
            @update:open="sections.faq = $event"
            @add="addFaqItem"
            @remove="removeFaqItem"
            @update:faq-schema="formData.faq_schema = $event"
          />

          <!-- Social Media -->
          <AdminNewsSocialSection
            :social-post-text="formData.social_post_text"
            :open="sections.social"
            @update:open="sections.social = $event"
            @update:social-post-text="formData.social_post_text = $event"
          />

          <!-- Related Categories -->
          <div class="section">
            <div class="section-title">Categorias relacionadas</div>
            <div class="hashtag-input-row">
              <input
                v-model="relatedCategoryInput"
                type="text"
                class="input"
                placeholder="Nombre de categoria y pulsa Enter"
                @keydown.enter.prevent="addRelatedCategory"
              >
              <button class="btn btn-sm" @click="addRelatedCategory">+ Anadir</button>
            </div>
            <div v-if="(formData.related_categories || []).length > 0" class="hashtag-list">
              <span v-for="cat in formData.related_categories" :key="cat" class="hashtag-chip">
                {{ cat }}
                <button class="chip-remove" @click="removeRelatedCategory(cat)">&times;</button>
              </span>
            </div>
          </div>

          <!-- Content ES -->
          <div class="section">
            <div class="section-title">Contenido (ES) *</div>
            <div class="field">
              <textarea
                v-model="formData.content_es"
                rows="14"
                class="input textarea"
                placeholder="Escribe el contenido de la noticia..."
              />
              <div class="count-row">
                <span class="char-count"> {{ formData.content_es.length }} caracteres </span>
                <span class="char-count word-count" :class="wordCountClass">
                  {{ contentWordCount }} palabras
                  <span v-if="contentWordCount > 0 && contentWordCount < 300" class="word-target"
                    >/ 300 recomendadas</span
                  >
                </span>
              </div>
            </div>
          </div>

          <!-- Hashtags -->
          <div class="section">
            <div class="section-title">Etiquetas</div>
            <div class="hashtag-input-row">
              <input
                v-model="hashtagInput"
                type="text"
                class="input"
                placeholder="Escribe y pulsa Enter"
                @keydown.enter.prevent="addHashtag"
              >
              <button class="btn btn-sm" @click="addHashtag">+ Anadir</button>
            </div>
            <div v-if="formData.hashtags.length > 0" class="hashtag-list">
              <span v-for="tag in formData.hashtags" :key="tag" class="hashtag-chip">
                #{{ tag }}
                <button class="chip-remove" @click="removeHashtag(tag)">&times;</button>
              </span>
            </div>
          </div>

          <!-- English content (collapsible) -->
          <div class="section">
            <button class="section-toggle" @click="sections.english = !sections.english">
              <span>Contenido en Ingles</span>
              <span class="toggle-icon">{{ sections.english ? '−' : '+' }}</span>
            </button>
            <div v-if="sections.english" class="section-body">
              <div class="field">
                <label>Titulo (EN)</label>
                <input
                  v-model="formData.title_en"
                  type="text"
                  class="input"
                  placeholder="English title..."
                >
              </div>
              <div class="field">
                <label>Meta Descripcion (EN)</label>
                <textarea
                  v-model="formData.description_en"
                  rows="2"
                  class="input textarea"
                  maxlength="200"
                  placeholder="English meta description (120-160 chars)..."
                />
              </div>
              <div class="field">
                <label>Contenido (EN)</label>
                <textarea
                  v-model="formData.content_en"
                  rows="8"
                  class="input textarea"
                  placeholder="English content..."
                />
              </div>
            </div>
          </div>

          <!-- Info (collapsible) -->
          <AdminNewsArticleInfo
            :article="article"
            :open="sections.info"
            :format-date="formatDate"
            @update:open="sections.info = $event"
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
    </template>

    <!-- Delete Modal -->
    <Teleport to="body">
      <div v-if="deleteModal" class="modal-overlay" @click.self="closeDeleteModal">
        <div class="modal-content">
          <h3>Eliminar noticia</h3>
          <p>Estas a punto de eliminar:</p>
          <p class="delete-title">{{ article?.title_es }}</p>
          <p class="delete-warning">
            Esta accion no se puede deshacer. Escribe <strong>borrar</strong> para confirmar.
          </p>
          <input
            v-model="deleteConfirmText"
            type="text"
            placeholder="Escribe 'borrar'"
            class="confirm-input"
            @keydown.enter="executeDelete"
          >
          <div class="modal-actions">
            <button class="btn" @click="closeDeleteModal">Cancelar</button>
            <button
              class="btn btn-danger"
              :disabled="deleteConfirmText !== 'borrar'"
              @click="executeDelete"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.nf {
  max-width: 1200px;
}

/* Loading */
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
  min-width: 0;
  flex: 1;
}

.nf-left h1 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nf-right {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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
  flex-shrink: 0;
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
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
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

.btn-delete-outline {
  color: #dc2626;
  border-color: #fecaca;
}

.btn-delete-outline:hover {
  background: #fef2f2;
}

.btn-danger {
  background: #dc2626;
  color: white;
  border-color: #dc2626;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-sm {
  padding: 4px 12px;
  font-size: 0.8rem;
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

.section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: #374151;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
}

.section-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-weight: 600;
  font-size: 0.9rem;
  color: #374151;
  cursor: pointer;
  border: none;
  background: none;
  padding: 0;
}

.toggle-icon {
  font-size: 1.2rem;
  color: #94a3b8;
}

.section-body {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
}

.input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  width: 100%;
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
}

.textarea {
  resize: vertical;
  font-family: inherit;
  line-height: 1.6;
}

.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 600px) {
  .row-2 {
    grid-template-columns: 1fr;
  }
}

/* Section hint */
.section-hint {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: -8px 0 12px;
  line-height: 1.4;
}

/* Character count */
.char-count {
  font-size: 0.7rem;
  color: #94a3b8;
  text-align: right;
}

.count-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.word-count {
  font-weight: 500;
}

.word-target {
  color: #94a3b8;
  font-weight: 400;
}

.count-good {
  color: #22c55e;
}
.count-warning {
  color: #f59e0b;
}
.count-bad {
  color: #ef4444;
}

/* Status radio */
.estado-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.estado-opt {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}

.estado-opt input {
  display: none;
}

.estado-opt.active {
  background: var(--color-primary, #23424a);
  color: white;
  border-color: var(--color-primary, #23424a);
}

/* Slug input */
.slug-input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}

.slug-prefix {
  padding: 8px 0 8px 12px;
  color: #94a3b8;
  font-size: 0.85rem;
  white-space: nowrap;
  background: #f8fafc;
}

.slug-field {
  border: none !important;
  border-radius: 0 !important;
  padding-left: 4px !important;
}

.slug-field:focus {
  border: none !important;
  box-shadow: none !important;
}

/* Hashtags */
.hashtag-input-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.hashtag-input-row .input {
  flex: 1;
}

.hashtag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.hashtag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #f1f5f9;
  border-radius: 16px;
  font-size: 0.8rem;
  color: #475569;
}

.chip-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: none;
  background: none;
  color: #94a3b8;
  font-size: 1rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.chip-remove:hover {
  color: #ef4444;
}

/* Delete Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 420px;
  width: 100%;
}

.modal-content h3 {
  margin: 0 0 12px;
  font-size: 1.1rem;
  color: #1a1a1a;
}

.modal-content p {
  margin: 0 0 8px;
  color: #64748b;
  font-size: 0.9rem;
}

.delete-title {
  font-weight: 600;
  color: #1a1a1a !important;
}

.delete-warning {
  margin-top: 12px !important;
  color: #dc2626 !important;
  font-size: 0.85rem !important;
}

.confirm-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin: 12px 0;
  box-sizing: border-box;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

/* Mobile responsive */
@media (max-width: 767px) {
  .nf-right {
    width: 100%;
    justify-content: flex-end;
  }

  .nf-left h1 {
    font-size: 1.1rem;
  }
}
</style>
