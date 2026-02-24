<script setup lang="ts">
/**
 * Embeddable Widget Configurator for dealer websites.
 * Plan gate: Premium/Founding (canUseWidget).
 */
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const supabase = useSupabaseClient()
const { userId } = useAuth()
const { dealerProfile, loadDealer } = useDealerDashboard()
const { canUseWidget, fetchSubscription } = useSubscriptionPlan(userId.value || undefined)

interface CategoryOption {
  id: string
  slug: string
  name_es: string
  name_en: string | null
}

const categories = ref<CategoryOption[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const copySuccess = ref(false)

// Widget configuration
const vehicleCount = ref<number>(6)
const theme = ref<'light' | 'dark'>('light')
const selectedCategory = ref<string>('')
const widgetWidth = ref<string>('100%')
const widgetHeight = ref<string>('600')
const useAutoHeight = ref(true)

const VEHICLE_COUNT_OPTIONS = [3, 6, 9, 12]

const dealerSlug = computed<string>(() => {
  return dealerProfile.value?.slug || ''
})

const embedUrl = computed<string>(() => {
  if (!dealerSlug.value) return ''

  const params = new URLSearchParams()
  params.set('limit', String(vehicleCount.value))
  params.set('theme', theme.value)
  if (selectedCategory.value) {
    params.set('category', selectedCategory.value)
  }

  return `https://tracciona.com/embed/${dealerSlug.value}?${params.toString()}`
})

const iframeHeight = computed<string>(() => {
  if (useAutoHeight.value) return '600'
  return widgetHeight.value || '600'
})

const iframeWidth = computed<string>(() => {
  return widgetWidth.value || '100%'
})

const embedCode = computed<string>(() => {
  if (!embedUrl.value) return ''
  const width = iframeWidth.value
  const height = iframeHeight.value
  return `<iframe src="${embedUrl.value}" width="${width}" height="${height}" frameborder="0" title="${t('dashboard.widget.iframeTitle')}"></iframe>`
})

const previewUrl = computed<string>(() => {
  if (!dealerSlug.value) return ''
  const params = new URLSearchParams()
  params.set('limit', String(vehicleCount.value))
  params.set('theme', theme.value)
  if (selectedCategory.value) {
    params.set('category', selectedCategory.value)
  }
  return `/embed/${dealerSlug.value}?${params.toString()}`
})

async function loadCategories(): Promise<void> {
  try {
    const { data, error: err } = await supabase
      .from('categories')
      .select('id, slug, name_es, name_en')
      .order('sort_order', { ascending: true })

    if (err) throw err
    categories.value = (data || []) as CategoryOption[]
  } catch {
    // Silent failure for categories — not critical
    categories.value = []
  }
}

async function loadData(): Promise<void> {
  loading.value = true
  error.value = null

  try {
    await Promise.all([loadDealer(), loadCategories(), fetchSubscription()])
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : t('dashboard.widget.errorLoading')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

async function handleCopyCode(): Promise<void> {
  if (!embedCode.value) return

  try {
    await navigator.clipboard.writeText(embedCode.value)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2500)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = embedCode.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2500)
  }
}
</script>

<template>
  <div class="widget-page">
    <header class="page-header">
      <div>
        <h1>{{ t('dashboard.widget.title') }}</h1>
        <p class="subtitle">{{ t('dashboard.widget.subtitle') }}</p>
      </div>
      <NuxtLink to="/dashboard" class="btn-back">
        {{ t('common.back') }}
      </NuxtLink>
    </header>

    <!-- Plan gate -->
    <div v-if="!canUseWidget" class="upgrade-card">
      <h2>{{ t('dashboard.widget.upgradeTitle') }}</h2>
      <p>{{ t('dashboard.widget.upgradeDesc') }}</p>
      <NuxtLink to="/dashboard/suscripcion" class="btn-upgrade">
        {{ t('dashboard.widget.upgradeCta') }}
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Error -->
      <div v-if="error" class="alert-error">{{ error }}</div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner" />
        <span>{{ t('common.loading') }}...</span>
      </div>

      <template v-else>
        <div class="config-layout">
          <!-- Configuration Form -->
          <section class="card config-card">
            <h2 class="card-title">{{ t('dashboard.widget.configTitle') }}</h2>

            <!-- Vehicle count -->
            <div class="form-group">
              <label class="form-label">{{ t('dashboard.widget.vehicleCount') }}</label>
              <div class="count-options">
                <button
                  v-for="count in VEHICLE_COUNT_OPTIONS"
                  :key="count"
                  class="count-btn"
                  :class="{ active: vehicleCount === count }"
                  @click="vehicleCount = count"
                >
                  {{ count }}
                </button>
              </div>
            </div>

            <!-- Theme -->
            <div class="form-group">
              <label class="form-label">{{ t('dashboard.widget.theme') }}</label>
              <div class="theme-options">
                <button
                  class="theme-btn theme-light"
                  :class="{ active: theme === 'light' }"
                  @click="theme = 'light'"
                >
                  {{ t('dashboard.widget.themeLight') }}
                </button>
                <button
                  class="theme-btn theme-dark"
                  :class="{ active: theme === 'dark' }"
                  @click="theme = 'dark'"
                >
                  {{ t('dashboard.widget.themeDark') }}
                </button>
              </div>
            </div>

            <!-- Category filter -->
            <div class="form-group">
              <label class="form-label">{{ t('dashboard.widget.categoryFilter') }}</label>
              <select v-model="selectedCategory" class="form-select">
                <option value="">{{ t('dashboard.widget.allCategories') }}</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.slug">
                  {{ cat.name?.es || cat.name_es || '' }}
                </option>
              </select>
            </div>

            <!-- Width -->
            <div class="form-group">
              <label class="form-label">{{ t('dashboard.widget.width') }}</label>
              <input v-model="widgetWidth" type="text" class="form-input" placeholder="100%" >
            </div>

            <!-- Height -->
            <div class="form-group">
              <label class="form-label">{{ t('dashboard.widget.height') }}</label>
              <div class="height-controls">
                <label class="checkbox-label">
                  <input v-model="useAutoHeight" type="checkbox" class="form-checkbox" >
                  <span>{{ t('dashboard.widget.autoHeight') }}</span>
                </label>
                <input
                  v-if="!useAutoHeight"
                  v-model="widgetHeight"
                  type="text"
                  class="form-input"
                  placeholder="600"
                >
              </div>
            </div>
          </section>

          <!-- Preview -->
          <section class="card preview-card">
            <h2 class="card-title">{{ t('dashboard.widget.preview') }}</h2>
            <div class="preview-container" :class="{ 'dark-preview': theme === 'dark' }">
              <iframe
                v-if="previewUrl"
                :src="previewUrl"
                :width="iframeWidth"
                height="400"
                frameborder="0"
                :title="t('dashboard.widget.iframeTitle')"
                class="preview-iframe"
              />
              <div v-else class="preview-placeholder">
                <p>{{ t('dashboard.widget.previewPlaceholder') }}</p>
              </div>
            </div>
          </section>
        </div>

        <!-- Embed code -->
        <section v-if="embedCode" class="card">
          <h2 class="card-title">{{ t('dashboard.widget.embedCode') }}</h2>

          <textarea :value="embedCode" readonly class="code-textarea" rows="4" />

          <div class="code-footer">
            <button class="btn-copy" :class="{ success: copySuccess }" @click="handleCopyCode">
              {{ copySuccess ? t('dashboard.widget.copied') : t('dashboard.widget.copyCode') }}
            </button>
          </div>

          <div class="instructions">
            <h3>{{ t('dashboard.widget.instructionsTitle') }}</h3>
            <ol>
              <li>{{ t('dashboard.widget.step1') }}</li>
              <li>{{ t('dashboard.widget.step2') }}</li>
              <li>{{ t('dashboard.widget.step3') }}</li>
            </ol>
          </div>
        </section>
      </template>
    </template>
  </div>
</template>

<style scoped>
.widget-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.subtitle {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  background: white;
  color: var(--color-primary, #23424a);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  align-self: flex-start;
}

.btn-back:hover {
  background: #f8fafc;
}

/* Upgrade prompt */
.upgrade-card {
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  border: 1px solid #fde68a;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
}

.upgrade-card h2 {
  margin: 0 0 8px 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #92400e;
}

.upgrade-card p {
  margin: 0 0 16px 0;
  color: #a16207;
  font-size: 0.95rem;
}

.btn-upgrade {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.btn-upgrade:hover {
  background: #d97706;
}

/* Cards */
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.card-title {
  margin: 0 0 16px 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #1e293b;
}

/* Error & Loading */
.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: #64748b;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Config layout */
.config-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Form controls */
.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
}

.form-select,
.form-input {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #1e293b;
  background: white;
  box-sizing: border-box;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.15);
}

.count-options {
  display: flex;
  gap: 8px;
}

.count-btn {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 0.95rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background 0.2s;
}

.count-btn:hover {
  border-color: #cbd5e1;
}

.count-btn.active {
  border-color: var(--color-primary, #23424a);
  background: var(--color-primary, #23424a);
  color: white;
}

.theme-options {
  display: flex;
  gap: 8px;
}

.theme-btn {
  flex: 1;
  min-height: 44px;
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s;
}

.theme-btn.theme-light {
  background: #ffffff;
  color: #1e293b;
}

.theme-btn.theme-dark {
  background: #1e293b;
  color: #f1f5f9;
}

.theme-btn.active {
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.2);
}

.height-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #475569;
}

.form-checkbox {
  width: 20px;
  height: 20px;
  accent-color: var(--color-primary, #23424a);
  cursor: pointer;
}

/* Preview */
.preview-container {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  min-height: 300px;
}

.preview-container.dark-preview {
  border-color: #334155;
}

.preview-iframe {
  display: block;
  width: 100%;
  border: none;
}

.preview-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #94a3b8;
  text-align: center;
  padding: 20px;
}

.preview-placeholder p {
  margin: 0;
}

/* Embed code */
.code-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.85rem;
  color: #1e293b;
  background: #f8fafc;
  resize: vertical;
  box-sizing: border-box;
  line-height: 1.5;
}

.code-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.btn-copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-copy:hover {
  background: #1a3238;
}

.btn-copy.success {
  background: #16a34a;
}

/* Instructions */
.instructions {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}

.instructions h3 {
  margin: 0 0 12px 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
}

.instructions ol {
  margin: 0;
  padding-left: 20px;
  color: #475569;
  font-size: 0.9rem;
  line-height: 1.8;
}

/* Responsive */
@media (min-width: 768px) {
  .widget-page {
    padding: 24px;
  }

  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .config-layout {
    flex-direction: row;
  }

  .config-card {
    flex: 0 0 360px;
  }

  .preview-card {
    flex: 1;
    min-width: 0;
  }
}
</style>
