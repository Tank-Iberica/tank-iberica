<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { t } = useI18n()

usePageSeo({
  title: t('demo.seoTitle'),
  description: t('demo.seoDescription'),
  path: '/demo',
})

const brand = ref('')
const model = ref('')
const images = ref<Array<{ file: File; preview: string; data: string; mediaType: string }>>([])
const loading = ref(false)
const error = ref('')
const preview = ref<Record<string, unknown> | null>(null)

const MAX_IMAGES = 4
const MAX_SIZE_MB = 5

function handleFiles(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files) return

  error.value = ''

  for (const file of Array.from(input.files)) {
    if (images.value.length >= MAX_IMAGES) {
      error.value = t('demo.maxImages', { max: MAX_IMAGES })
      break
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      error.value = t('demo.imageTooLarge', { max: MAX_SIZE_MB })
      continue
    }
    if (!file.type.startsWith('image/')) continue

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1] || ''
      images.value.push({
        file,
        preview: result,
        data: base64,
        mediaType: file.type,
      })
    }
    reader.readAsDataURL(file)
  }

  input.value = ''
}

function removeImage(index: number) {
  images.value.splice(index, 1)
}

async function analyze() {
  if (images.value.length === 0) {
    error.value = t('demo.noImages')
    return
  }

  loading.value = true
  error.value = ''
  preview.value = null

  try {
    const result = await $fetch('/api/demo/try-vehicle', {
      method: 'POST',
      body: {
        images: images.value.map((img) => ({
          data: img.data,
          mediaType: img.mediaType,
        })),
        brand: brand.value || undefined,
        model: model.value || undefined,
      },
    })

    preview.value = (result as { preview: Record<string, unknown> }).preview
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('429')) {
      error.value = t('demo.rateLimited')
    } else {
      error.value = t('demo.analysisFailed')
    }
  } finally {
    loading.value = false
  }
}

function reset() {
  images.value = []
  brand.value = ''
  model.value = ''
  preview.value = null
  error.value = ''
}
</script>

<template>
  <div class="demo-page">
    <section class="demo-hero">
      <h1>{{ $t('demo.title') }}</h1>
      <p class="demo-subtitle">{{ $t('demo.subtitle') }}</p>
    </section>

    <!-- Upload form -->
    <section v-if="!preview" class="demo-form">
      <div class="demo-upload-area">
        <label class="demo-dropzone" :class="{ 'has-images': images.length > 0 }">
          <input type="file" accept="image/*" multiple class="sr-only" @change="handleFiles" >
          <div v-if="images.length === 0" class="dropzone-content">
            <span class="dropzone-icon">📷</span>
            <span>{{ $t('demo.dropPhotos') }}</span>
            <small>{{ $t('demo.maxImagesHint', { max: MAX_IMAGES }) }}</small>
          </div>
        </label>

        <div v-if="images.length > 0" class="demo-previews">
          <div v-for="(img, idx) in images" :key="idx" class="preview-thumb">
            <img :src="img.preview" :alt="`Photo ${idx + 1}`" >
            <button class="remove-btn" @click="removeImage(idx)">✕</button>
          </div>
          <label v-if="images.length < MAX_IMAGES" class="add-more-btn">
            <input type="file" accept="image/*" multiple class="sr-only" @change="handleFiles" >
            <span>+</span>
          </label>
        </div>
      </div>

      <div class="demo-fields">
        <div class="field">
          <label for="demo-brand">{{ $t('demo.brand') }}</label>
          <input
            id="demo-brand"
            v-model="brand"
            type="text"
            :placeholder="$t('demo.brandPlaceholder')"
          >
        </div>
        <div class="field">
          <label for="demo-model">{{ $t('demo.model') }}</label>
          <input
            id="demo-model"
            v-model="model"
            type="text"
            :placeholder="$t('demo.modelPlaceholder')"
          >
        </div>
      </div>

      <p v-if="error" class="demo-error">{{ error }}</p>

      <button class="demo-submit" :disabled="loading || images.length === 0" @click="analyze">
        <span v-if="loading" class="spinner" />
        {{ loading ? $t('demo.analyzing') : $t('demo.analyzeBtn') }}
      </button>
    </section>

    <!-- Preview result -->
    <section v-if="preview" class="demo-result">
      <h2>{{ preview.title }}</h2>

      <div class="result-meta">
        <span v-if="preview.category" class="tag">{{ preview.category }}</span>
        <span v-if="preview.subcategory" class="tag">{{ preview.subcategory }}</span>
        <span v-if="preview.year" class="tag">{{ preview.year }}</span>
      </div>

      <p class="result-description">{{ preview.description }}</p>

      <div v-if="preview.estimatedPrice" class="result-price">
        {{ $t('demo.estimatedPrice') }}: {{ preview.estimatedPrice }}
      </div>

      <ul v-if="(preview.highlights as string[])?.length" class="result-highlights">
        <li v-for="(h, i) in preview.highlights as string[]" :key="i">{{ h }}</li>
      </ul>

      <div class="result-images">
        <img
          v-for="(img, idx) in images"
          :key="idx"
          :src="img.preview"
          :alt="`Photo ${idx + 1}`"
          class="result-thumb"
        >
      </div>

      <div class="demo-ctas">
        <NuxtLink to="/registro" class="cta-primary">
          {{ $t('demo.ctaRegister') }}
        </NuxtLink>
        <button class="cta-secondary" @click="reset">
          {{ $t('demo.tryAgain') }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.demo-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 16px;
}

.demo-hero {
  text-align: center;
  margin-bottom: 32px;
}

.demo-hero h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--primary, #23424a);
  margin-bottom: 8px;
}

.demo-subtitle {
  color: #666;
  font-size: 1rem;
}

.demo-dropzone {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  border: 2px dashed #ccc;
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.demo-dropzone:hover {
  border-color: var(--primary, #23424a);
}

.demo-dropzone.has-images {
  display: none;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #888;
}

.dropzone-icon {
  font-size: 2rem;
}

.demo-previews {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}

.preview-thumb {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
}

.preview-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-more-btn {
  width: 100px;
  height: 100px;
  border: 2px dashed #ccc;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #ccc;
  cursor: pointer;
}

.add-more-btn:hover {
  border-color: var(--primary, #23424a);
  color: var(--primary, #23424a);
}

.demo-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 20px;
}

.field label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 4px;
  color: #333;
}

.field input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.field input:focus {
  outline: none;
  border-color: var(--primary, #23424a);
}

.demo-error {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 12px;
}

.demo-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  margin-top: 20px;
  background: var(--primary, #23424a);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  min-height: 48px;
}

.demo-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Result */
.demo-result h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary, #23424a);
  margin-bottom: 12px;
}

.result-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.tag {
  padding: 4px 10px;
  background: #f0f0f0;
  border-radius: 16px;
  font-size: 0.8rem;
  color: #555;
}

.result-description {
  line-height: 1.6;
  color: #444;
  margin-bottom: 16px;
  white-space: pre-line;
}

.result-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary, #23424a);
  margin-bottom: 16px;
}

.result-highlights {
  list-style: disc;
  padding-left: 20px;
  margin-bottom: 20px;
  color: #555;
}

.result-highlights li {
  margin-bottom: 4px;
}

.result-images {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin-bottom: 24px;
}

.result-thumb {
  width: 120px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.demo-ctas {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cta-primary {
  display: block;
  text-align: center;
  padding: 14px;
  background: var(--primary, #23424a);
  color: white;
  border-radius: 10px;
  font-weight: 600;
  text-decoration: none;
  min-height: 48px;
  line-height: 1.4;
}

.cta-secondary {
  padding: 12px;
  background: transparent;
  border: 1px solid #ddd;
  border-radius: 10px;
  color: #666;
  cursor: pointer;
  font-size: 0.9rem;
}

@media (max-width: 480px) {
  .demo-fields {
    grid-template-columns: 1fr;
  }
}
</style>
