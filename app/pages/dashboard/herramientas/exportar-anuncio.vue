<script setup lang="ts">
/**
 * Ad Export Generator for external platforms.
 * Generates optimized ad text for Milanuncios, Wallapop, Facebook, LinkedIn, Instagram.
 * Plan gate: Basic+ (catalogExport).
 */
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const supabase = useSupabaseClient()
const { userId } = useAuth()
const { dealerProfile, loadDealer } = useDealerDashboard()
const { canExport, fetchSubscription } = useSubscriptionPlan(userId.value || undefined)

type PlatformKey = 'milanuncios' | 'wallapop' | 'facebook' | 'linkedin' | 'instagram'

interface PlatformConfig {
  key: PlatformKey
  label: string
  maxChars: number
}

const PLATFORMS: PlatformConfig[] = [
  { key: 'milanuncios', label: 'Milanuncios', maxChars: 4000 },
  { key: 'wallapop', label: 'Wallapop', maxChars: 640 },
  { key: 'facebook', label: 'Facebook Marketplace', maxChars: 2000 },
  { key: 'linkedin', label: 'LinkedIn', maxChars: 2000 },
  { key: 'instagram', label: 'Instagram', maxChars: 2200 },
]

interface DealerVehicleForExport {
  id: string
  brand: string
  model: string
  year: number | null
  price: number | null
  slug: string
  location: string | null
  description_es: string | null
  description_en: string | null
  category: string
  status: string
  vehicle_images: { url: string; position: number | null }[]
}

const vehicles = ref<DealerVehicleForExport[]>([])
const selectedVehicleId = ref<string | null>(null)
const selectedPlatform = ref<PlatformKey>('milanuncios')
const generatedText = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const copySuccess = ref(false)

const selectedVehicle = computed<DealerVehicleForExport | null>(() => {
  if (!selectedVehicleId.value) return null
  return vehicles.value.find((v) => v.id === selectedVehicleId.value) || null
})

const currentPlatformConfig = computed<PlatformConfig>(() => {
  return PLATFORMS.find((p) => p.key === selectedPlatform.value) || PLATFORMS[0]
})

const charCount = computed<number>(() => generatedText.value.length)

const charCountClass = computed<string>(() => {
  const max = currentPlatformConfig.value.maxChars
  const current = charCount.value
  if (current > max) return 'count-over'
  if (current > max * 0.9) return 'count-warning'
  return 'count-ok'
})

const thumbnail = computed<string | null>(() => {
  if (!selectedVehicle.value?.vehicle_images?.length) return null
  const sorted = [...selectedVehicle.value.vehicle_images].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  )
  return sorted[0]?.url || null
})

async function loadVehicles(): Promise<void> {
  const dealer = dealerProfile.value || (await loadDealer())
  if (!dealer) return

  loading.value = true
  error.value = null

  try {
    const { data, error: err } = await supabase
      .from('vehicles')
      .select(
        'id, brand, model, year, price, slug, location, description_es, description_en, category, status, vehicle_images(url, position)',
      )
      .eq('dealer_id', dealer.id as never)
      .eq('status', 'published' as never)
      .order('created_at', { ascending: false })

    if (err) throw err
    vehicles.value = (data || []) as DealerVehicleForExport[]
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : t('dashboard.adExport.errorLoading')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadVehicles(), fetchSubscription()])
})

function formatPrice(price: number | null | undefined): string {
  if (!price) return '-'
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

function generateAdText(vehicle: DealerVehicleForExport, platform: PlatformKey): string {
  const brand = vehicle.brand
  const model = vehicle.model
  const year = vehicle.year ? String(vehicle.year) : ''
  const price = vehicle.price ? formatPrice(vehicle.price) : ''
  const location = vehicle.location || ''
  const description = vehicle.description_es || ''
  const slug = vehicle.slug
  const backlink = `tracciona.com/vehiculo/${slug}`
  const maxChars = PLATFORMS.find((p) => p.key === platform)?.maxChars || 2000

  let text = ''

  switch (platform) {
    case 'milanuncios': {
      const header = `\u{1F69B} ${brand} ${model}${year ? ` ${year}` : ''}`
      const specs = [
        location ? `\u{1F4CD} Ubicacion: ${location}` : '',
        year ? `\u{1F4C6} Ano: ${year}` : '',
        price ? `\u{1F4B0} Precio: ${price}\u20AC` : '',
      ]
        .filter(Boolean)
        .join('\n')

      const descBlock = description ? `\n${description}` : ''
      const footer = `\n\n\u2705 Mas fotos y ficha completa: ${backlink}`

      text = `${header}\n\n${specs}${descBlock}${footer}`
      break
    }

    case 'wallapop': {
      const shortDesc = description ? description.substring(0, 200).replace(/\n/g, ' ').trim() : ''
      const parts = [`${brand} ${model}`, year ? year : '', price ? `${price}\u20AC` : '']
        .filter(Boolean)
        .join(' | ')

      text = shortDesc
        ? `${parts} \u2014 ${shortDesc} \u{1F449} ${backlink}`
        : `${parts} \u{1F449} ${backlink}`
      break
    }

    case 'facebook':
    case 'linkedin': {
      const header = `\u{1F525} ${brand} ${model}${year ? ` ${year}` : ''} en venta`
      const specs = [
        year ? `Ano: ${year}` : '',
        vehicle.category ? `Categoria: ${vehicle.category}` : '',
      ]
        .filter(Boolean)
        .join(' | ')

      const priceBlock = price ? `\n\n\u{1F4B0} ${price}\u20AC` : ''
      const locationBlock = location ? `\n\u{1F4CD} ${location}` : ''
      const descBlock = description ? `\n\n${description.substring(0, 500)}` : ''
      const footer = `\n\n\u{1F449} Ver ficha completa: ${backlink}`

      text = `${header}\n\n${specs}${priceBlock}${locationBlock}${descBlock}${footer}`
      break
    }

    case 'instagram': {
      const header = `${brand} ${model}${year ? ` ${year}` : ''} \u2728`
      const priceBlock = price ? `\n\n\u{1F4B0} ${price}\u20AC` : ''
      const locationBlock = location ? `\n\u{1F4CD} ${location}` : ''
      const linkLine = '\n\u{1F517} Link en bio'
      const brandTag = brand.toLowerCase().replace(/[^a-z0-9]/g, '')
      const tags = `\n\n#vehiculoindustrial #${brandTag} #tracciona #maquinariaindustrial`

      text = `${header}${priceBlock}${locationBlock}${linkLine}${tags}`
      break
    }
  }

  return truncateText(text, maxChars)
}

function handleGenerate(): void {
  if (!selectedVehicle.value) return
  generatedText.value = generateAdText(selectedVehicle.value, selectedPlatform.value)
}

async function handleCopy(): Promise<void> {
  if (!generatedText.value) return

  try {
    await navigator.clipboard.writeText(generatedText.value)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2500)
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea')
    textarea.value = generatedText.value
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

watch(selectedVehicleId, () => {
  generatedText.value = ''
})

watch(selectedPlatform, () => {
  if (selectedVehicle.value) {
    handleGenerate()
  }
})
</script>

<template>
  <div class="export-page">
    <header class="page-header">
      <div>
        <h1>{{ t('dashboard.adExport.title') }}</h1>
        <p class="subtitle">{{ t('dashboard.adExport.subtitle') }}</p>
      </div>
      <NuxtLink to="/dashboard" class="btn-back">
        {{ t('common.back') }}
      </NuxtLink>
    </header>

    <!-- Plan gate: Free users see upgrade prompt -->
    <div v-if="!canExport" class="upgrade-card">
      <h2>{{ t('dashboard.adExport.upgradeTitle') }}</h2>
      <p>{{ t('dashboard.adExport.upgradeDesc') }}</p>
      <NuxtLink to="/dashboard/suscripcion" class="btn-upgrade">
        {{ t('dashboard.adExport.upgradeCta') }}
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
        <!-- Step 1: Select vehicle -->
        <section class="card">
          <h2 class="card-title">{{ t('dashboard.adExport.selectVehicle') }}</h2>

          <div v-if="vehicles.length === 0" class="empty-state">
            <p>{{ t('dashboard.adExport.noVehicles') }}</p>
            <NuxtLink to="/dashboard/vehiculos/nuevo" class="btn-primary">
              {{ t('dashboard.vehicles.publishNew') }}
            </NuxtLink>
          </div>

          <select v-else v-model="selectedVehicleId" class="select-vehicle">
            <option :value="null" disabled>
              {{ t('dashboard.adExport.selectVehiclePlaceholder') }}
            </option>
            <option v-for="v in vehicles" :key="v.id" :value="v.id">
              {{ v.brand }} {{ v.model }}{{ v.year ? ` (${v.year})` : '' }}
              {{ v.price ? ` — ${formatPrice(v.price)}€` : '' }}
            </option>
          </select>
        </section>

        <!-- Vehicle preview -->
        <section v-if="selectedVehicle" class="card preview-card">
          <div class="preview-layout">
            <div class="preview-image">
              <img
                v-if="thumbnail"
                :src="thumbnail"
                :alt="`${selectedVehicle.brand} ${selectedVehicle.model}`"
              >
              <div v-else class="image-placeholder">
                <span>{{ t('dashboard.vehicles.noImage') }}</span>
              </div>
            </div>
            <div class="preview-info">
              <h3>{{ selectedVehicle.brand }} {{ selectedVehicle.model }}</h3>
              <div class="preview-specs">
                <span v-if="selectedVehicle.year" class="spec-item">
                  {{ selectedVehicle.year }}
                </span>
                <span v-if="selectedVehicle.price" class="spec-price">
                  {{ formatPrice(selectedVehicle.price) }}&euro;
                </span>
                <span v-if="selectedVehicle.location" class="spec-item">
                  {{ selectedVehicle.location }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- Step 2: Select platform -->
        <section v-if="selectedVehicle" class="card">
          <h2 class="card-title">{{ t('dashboard.adExport.selectPlatform') }}</h2>
          <div class="platform-grid">
            <button
              v-for="p in PLATFORMS"
              :key="p.key"
              class="platform-btn"
              :class="{ active: selectedPlatform === p.key }"
              @click="selectedPlatform = p.key"
            >
              <span class="platform-name">{{ p.label }}</span>
              <span class="platform-limit">{{
                t('dashboard.adExport.maxChars', { max: p.maxChars })
              }}</span>
            </button>
          </div>

          <button class="btn-generate" :disabled="!selectedVehicle" @click="handleGenerate">
            {{ t('dashboard.adExport.generate') }}
          </button>
        </section>

        <!-- Step 3: Generated text -->
        <section v-if="generatedText" class="card">
          <h2 class="card-title">{{ t('dashboard.adExport.result') }}</h2>

          <textarea v-model="generatedText" class="generated-textarea" rows="12" />

          <div class="textarea-footer">
            <span class="char-counter" :class="charCountClass">
              {{ charCount }}/{{ currentPlatformConfig.maxChars }}
            </span>
            <button class="btn-copy" :class="{ success: copySuccess }" @click="handleCopy">
              {{ copySuccess ? t('dashboard.adExport.copied') : t('dashboard.adExport.copy') }}
            </button>
          </div>
        </section>
      </template>
    </template>
  </div>
</template>

<style scoped>
.export-page {
  max-width: 800px;
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

.empty-state {
  text-align: center;
  padding: 24px;
  color: #64748b;
}

.empty-state p {
  margin: 0 0 12px 0;
}

/* Vehicle select */
.select-vehicle {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #1e293b;
  background: white;
  cursor: pointer;
}

.select-vehicle:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.15);
}

/* Preview card */
.preview-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-image {
  width: 100%;
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
  background: #f1f5f9;
}

.preview-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 0.85rem;
}

.preview-info h3 {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.preview-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.spec-item {
  font-size: 0.9rem;
  color: #64748b;
}

.spec-price {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

/* Platform grid */
.platform-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-bottom: 16px;
}

.platform-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-height: 44px;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background 0.2s;
}

.platform-btn:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.platform-btn.active {
  border-color: var(--color-primary, #23424a);
  background: #f0f9ff;
}

.platform-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: #1e293b;
}

.platform-limit {
  font-size: 0.8rem;
  color: #94a3b8;
}

.btn-generate {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 44px;
  padding: 12px 24px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-generate:hover:not(:disabled) {
  background: #1a3238;
}

.btn-generate:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Generated text */
.generated-textarea {
  width: 100%;
  min-height: 200px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  color: #1e293b;
  line-height: 1.5;
  resize: vertical;
  box-sizing: border-box;
}

.generated-textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.15);
}

.textarea-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  gap: 12px;
}

.char-counter {
  font-size: 0.85rem;
  font-weight: 500;
}

.count-ok {
  color: #64748b;
}

.count-warning {
  color: #f59e0b;
}

.count-over {
  color: #dc2626;
  font-weight: 700;
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

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.btn-primary:hover {
  background: #1a3238;
}

/* Responsive */
@media (min-width: 480px) {
  .platform-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .export-page {
    padding: 24px;
  }

  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .preview-layout {
    flex-direction: row;
  }

  .preview-image {
    width: 200px;
    height: 140px;
    flex-shrink: 0;
  }

  .platform-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
