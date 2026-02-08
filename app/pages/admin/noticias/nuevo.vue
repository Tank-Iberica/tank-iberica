<script setup lang="ts">
import {
  useAdminNews,
  type NewsFormData,
} from '~/composables/admin/useAdminNews'
import { useSeoScore, type SeoInput } from '~/composables/admin/useSeoScore'
import { useCloudinaryUpload } from '~/composables/admin/useCloudinaryUpload'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const router = useRouter()
const { saving, error, createNews } = useAdminNews()
const { upload: uploadToCloudinary, uploading: uploadingImage, progress: uploadProgress, error: uploadError } = useCloudinaryUpload()

// Form data
const formData = ref<NewsFormData>({
  title_es: '',
  title_en: null,
  slug: '',
  category: 'general',
  image_url: null,
  content_es: '',
  content_en: null,
  hashtags: [],
  status: 'draft',
  published_at: null,
})

// Hashtag input
const hashtagInput = ref('')

// Collapsible sections
const sections = reactive({
  english: false,
  seoPanel: true,
})

// SEO scoring
const seoInput = computed<SeoInput>(() => ({
  title_es: formData.value.title_es,
  title_en: formData.value.title_en,
  slug: formData.value.slug,
  content_es: formData.value.content_es,
  content_en: formData.value.content_en,
  image_url: formData.value.image_url,
  hashtags: formData.value.hashtags,
}))

const { analysis } = useSeoScore(seoInput)

// Auto-generate slug from title
let previousAutoSlug = ''

function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

watch(() => formData.value.title_es, (title) => {
  if (!formData.value.slug || formData.value.slug === previousAutoSlug) {
    formData.value.slug = generateSlugFromTitle(title)
    previousAutoSlug = formData.value.slug
  }
})

// Validation
const isValid = computed(() =>
  formData.value.title_es.trim().length > 0
  && formData.value.content_es.trim().length > 0
  && formData.value.slug.trim().length > 0,
)

// Character counts
const titleLengthClass = computed(() => {
  const len = formData.value.title_es.length
  if (len >= 30 && len <= 60) return 'count-good'
  if (len >= 20 && len <= 70) return 'count-warning'
  return len > 0 ? 'count-bad' : ''
})

// Image upload
const imagePreviewUrl = ref<string | null>(null)

async function handleImageFile(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0] as File
  imagePreviewUrl.value = URL.createObjectURL(file as Blob)

  const result = await uploadToCloudinary(file)
  if (result) {
    formData.value.image_url = result.secure_url
  }
  else {
    // Keep preview but no URL set
  }

  input.value = ''
}

function removeImage() {
  formData.value.image_url = null
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
    imagePreviewUrl.value = null
  }
}

// Save
async function handleSave() {
  if (!isValid.value) return
  const id = await createNews(formData.value)
  if (id) router.push('/admin/noticias')
}

function handleCancel() {
  router.push('/admin/noticias')
}

// Hashtag management
function addHashtag() {
  const tag = hashtagInput.value.trim().replace(/^#/, '').toLowerCase()
  if (!tag) return
  if (!formData.value.hashtags.includes(tag)) {
    formData.value.hashtags = [...formData.value.hashtags, tag]
  }
  hashtagInput.value = ''
}

function removeHashtag(tag: string) {
  formData.value.hashtags = formData.value.hashtags.filter(t => t !== tag)
}

// SEO level labels
function getLevelLabel(level: string): string {
  switch (level) {
    case 'good': return 'Bueno'
    case 'warning': return 'Mejorable'
    case 'bad': return 'Necesita trabajo'
    default: return ''
  }
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
        <button
          class="btn btn-primary"
          :disabled="saving || !isValid"
          @click="handleSave"
        >
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
          <div class="row-2">
            <div class="field">
              <label>Estado</label>
              <div class="estado-row">
                <label class="estado-opt" :class="{ active: formData.status === 'draft' }">
                  <input v-model="formData.status" type="radio" value="draft">
                  Borrador
                </label>
                <label class="estado-opt" :class="{ active: formData.status === 'published' }">
                  <input v-model="formData.status" type="radio" value="published">
                  Publicado
                </label>
                <label class="estado-opt" :class="{ active: formData.status === 'archived' }">
                  <input v-model="formData.status" type="radio" value="archived">
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
            <input v-model="formData.published_at" type="datetime-local" class="input">
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
        <div class="section">
          <div class="section-title">Imagen destacada</div>

          <!-- Upload from file -->
          <div class="image-upload-area">
            <label class="upload-zone" :class="{ uploading: uploadingImage }">
              <input
                type="file"
                accept="image/*"
                class="file-input-hidden"
                :disabled="uploadingImage"
                @change="handleImageFile"
              >
              <template v-if="uploadingImage">
                <div class="upload-progress-bar">
                  <div class="upload-progress-fill" :style="{ width: uploadProgress + '%' }" />
                </div>
                <span class="upload-text">Subiendo... {{ uploadProgress }}%</span>
              </template>
              <template v-else>
                <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span class="upload-text">Seleccionar imagen</span>
                <span class="upload-hint">JPG, PNG, WebP (max 10MB)</span>
              </template>
            </label>
          </div>

          <!-- Or URL -->
          <div class="field">
            <label>O pegar URL</label>
            <input
              v-model="formData.image_url"
              type="url"
              class="input"
              placeholder="https://res.cloudinary.com/..."
            >
          </div>

          <!-- Upload error -->
          <div v-if="uploadError" class="upload-error">{{ uploadError }}</div>

          <!-- Preview -->
          <div v-if="formData.image_url || imagePreviewUrl" class="image-preview-container">
            <img :src="formData.image_url || imagePreviewUrl || ''" alt="Preview" @error="($event.target as HTMLImageElement).style.display='none'">
            <button class="remove-image-btn" title="Eliminar imagen" @click="removeImage">&times;</button>
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
              placeholder="Escribe el contenido de la noticia...&#10;&#10;Separa los parrafos con lineas en blanco para mejorar la estructura SEO."
            />
            <span class="char-count">
              {{ formData.content_es.length }} caracteres
            </span>
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
      </div>

      <!-- RIGHT: SEO Panel -->
      <div class="nf-seo">
        <!-- Mobile toggle -->
        <button class="seo-toggle-mobile" @click="sections.seoPanel = !sections.seoPanel">
          <span>Panel SEO</span>
          <span class="seo-score-mini" :class="analysis.level">{{ analysis.score }}</span>
          <span class="toggle-icon">{{ sections.seoPanel ? '−' : '+' }}</span>
        </button>

        <div v-show="sections.seoPanel" class="seo-panel">
          <!-- Score -->
          <div class="seo-score-header">
            <div class="score-circle" :class="analysis.level">
              <span class="score-number">{{ analysis.score }}</span>
              <span class="score-label">/100</span>
            </div>
            <div class="score-text">
              <strong>Puntuacion SEO</strong>
              <span class="level-text" :class="'level-' + analysis.level">
                {{ getLevelLabel(analysis.level) }}
              </span>
            </div>
          </div>

          <!-- Google Snippet Preview -->
          <div class="snippet-preview">
            <div class="snippet-label">Vista previa en Google</div>
            <div class="snippet-box">
              <div class="snippet-title">{{ analysis.snippetPreview.title }}</div>
              <div class="snippet-url">{{ analysis.snippetPreview.url }}</div>
              <div class="snippet-desc">{{ analysis.snippetPreview.description || 'Sin descripcion...' }}</div>
            </div>
          </div>

          <!-- Criteria -->
          <div class="seo-criteria">
            <div v-for="c in analysis.criteria" :key="c.id" class="criterion-row">
              <div class="criterion-header">
                <span class="criterion-dot" :class="c.level" />
                <span class="criterion-label">{{ c.label }}</span>
                <span class="criterion-score">{{ c.score }}</span>
              </div>
              <p class="criterion-desc">{{ c.description }}</p>
            </div>
          </div>
        </div>
      </div>
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

.btn-icon:hover { background: #f1f5f9; color: #1a1a1a; }
.btn-icon svg { width: 20px; height: 20px; }

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

.btn:hover { background: #f8fafc; }

.btn-primary {
  background: var(--color-primary, #23424A);
  color: white;
  border-color: var(--color-primary, #23424A);
}

.btn-primary:hover { opacity: 0.9; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-sm { padding: 4px 12px; font-size: 0.8rem; }

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
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
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
  border-color: var(--color-primary, #23424A);
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
  .row-2 { grid-template-columns: 1fr; }
}

/* Character count */
.char-count {
  font-size: 0.7rem;
  color: #94a3b8;
  text-align: right;
}

.count-good { color: #22c55e; }
.count-warning { color: #f59e0b; }
.count-bad { color: #ef4444; }

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

.estado-opt input { display: none; }

.estado-opt.active {
  background: var(--color-primary, #23424A);
  color: white;
  border-color: var(--color-primary, #23424A);
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

/* Image upload */
.image-upload-area {
  margin-bottom: 12px;
}

.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}

.upload-zone:hover { border-color: var(--color-primary, #23424A); background: #f8fafc; }
.upload-zone.uploading { cursor: default; border-color: #94a3b8; }

.file-input-hidden { display: none; }

.upload-icon {
  width: 32px;
  height: 32px;
  color: #94a3b8;
}

.upload-text {
  font-size: 0.85rem;
  font-weight: 500;
  color: #64748b;
}

.upload-hint {
  font-size: 0.7rem;
  color: #94a3b8;
}

.upload-progress-bar {
  width: 100%;
  max-width: 200px;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.upload-progress-fill {
  height: 100%;
  background: var(--color-primary, #23424A);
  border-radius: 3px;
  transition: width 0.2s;
}

.upload-error {
  margin-top: 8px;
  padding: 8px 12px;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 6px;
  font-size: 0.8rem;
}

/* Image preview */
.image-preview-container {
  margin-top: 8px;
  border-radius: 8px;
  overflow: hidden;
  max-height: 200px;
  position: relative;
}

.image-preview-container img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
  max-height: 200px;
}

.remove-image-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0,0,0,0.6);
  color: white;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.remove-image-btn:hover { background: #dc2626; }

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

.chip-remove:hover { color: #ef4444; }

/* SEO Panel */
.nf-seo {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  overflow: hidden;
}

@media (min-width: 1024px) {
  .nf-seo {
    position: sticky;
    top: 80px;
  }

  .seo-toggle-mobile {
    display: none;
  }
}

.seo-toggle-mobile {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 16px 20px;
  font-weight: 600;
  font-size: 0.9rem;
  color: #374151;
  cursor: pointer;
  border: none;
  background: none;
  gap: 8px;
}

.seo-score-mini {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 22px;
  border-radius: 11px;
  font-size: 0.7rem;
  font-weight: 700;
  margin-left: auto;
}

.seo-score-mini.good { background: #dcfce7; color: #166534; }
.seo-score-mini.warning { background: #fef3c7; color: #92400e; }
.seo-score-mini.bad { background: #fef2f2; color: #dc2626; }

.seo-panel {
  padding: 20px;
}

@media (min-width: 1024px) {
  .seo-panel { padding-top: 20px; }
}

/* Score circle */
.seo-score-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.score-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 5px solid;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.score-circle.good { border-color: #22c55e; }
.score-circle.warning { border-color: #f59e0b; }
.score-circle.bad { border-color: #ef4444; }

.score-number {
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1;
  color: #1a1a1a;
}

.score-label {
  font-size: 0.6rem;
  color: #94a3b8;
}

.score-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.score-text strong {
  font-size: 0.9rem;
  color: #1a1a1a;
}

.level-text { font-size: 0.8rem; }
.level-good { color: #22c55e; }
.level-warning { color: #f59e0b; }
.level-bad { color: #ef4444; }

/* Snippet preview */
.snippet-preview {
  margin-bottom: 20px;
}

.snippet-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.snippet-box {
  background: #fafafa;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px;
  font-family: Arial, sans-serif;
}

.snippet-title {
  color: #1a0dab;
  font-size: 16px;
  line-height: 1.3;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.snippet-url {
  color: #006621;
  font-size: 12px;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.snippet-desc {
  color: #545454;
  font-size: 12px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Criteria */
.seo-criteria {
  border-top: 1px solid #f1f5f9;
  padding-top: 12px;
}

.criterion-row {
  padding: 8px 0;
  border-bottom: 1px solid #f8fafc;
}

.criterion-row:last-child { border-bottom: none; }

.criterion-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.criterion-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.criterion-dot.good { background: #22c55e; }
.criterion-dot.warning { background: #f59e0b; }
.criterion-dot.bad { background: #ef4444; }

.criterion-label {
  flex: 1;
  font-size: 0.8rem;
  font-weight: 500;
  color: #374151;
}

.criterion-score {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
}

.criterion-desc {
  font-size: 0.7rem;
  color: #94a3b8;
  margin: 3px 0 0;
  padding-left: 16px;
  line-height: 1.4;
}
</style>
