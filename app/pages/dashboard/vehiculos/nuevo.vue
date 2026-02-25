<script setup lang="ts">
/**
 * Publish New Vehicle
 * Full vehicle creation form with AI description generation.
 */
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const supabase = useSupabaseClient()
const router = useRouter()
const { userId } = useAuth()
const { dealerProfile, loadDealer } = useDealerDashboard()
const { planLimits, canPublish, maxPhotos, fetchSubscription } = useSubscriptionPlan(
  userId.value || undefined,
)

interface CategoryOption {
  id: string
  name: Record<string, string>
  slug: string
}

interface SubcategoryOption {
  id: string
  name: Record<string, string>
  slug: string
  category_id: string
}

const showWizard = ref(true)
const draftVehicleId = ref<string | undefined>(undefined)

const categories = ref<CategoryOption[]>([])
const subcategories = ref<SubcategoryOption[]>([])
const activeListingsCount = ref(0)
const saving = ref(false)
const generatingDesc = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

const form = ref({
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  km: 0,
  price: 0,
  category_id: '',
  subcategory_id: '',
  description_es: '',
  description_en: '',
  location: '',
})

const filteredSubcategories = computed(() => {
  if (!form.value.category_id) return subcategories.value
  return subcategories.value.filter((s) => s.category_id === form.value.category_id)
})

const canPublishVehicle = computed(() => canPublish(activeListingsCount.value))

async function loadFormData(): Promise<void> {
  const dealer = dealerProfile.value || (await loadDealer())
  if (!dealer) return

  await fetchSubscription()

  const [catRes, subRes, countRes] = await Promise.all([
    supabase.from('categories').select('id, name, slug').order('slug'),
    supabase.from('subcategories').select('id, name, slug, category_id').order('slug'),
    supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('dealer_id', dealer.id)
      .eq('status', 'published'),
  ])

  categories.value = (catRes.data || []) as CategoryOption[]
  subcategories.value = (subRes.data || []) as SubcategoryOption[]
  activeListingsCount.value = countRes.count || 0
}

onMounted(loadFormData)

async function generateDescription(): Promise<void> {
  if (!form.value.brand || !form.value.model) {
    error.value = t('dashboard.vehicles.fillBrandModel')
    return
  }

  generatingDesc.value = true
  error.value = null

  try {
    const { data } = await useFetch('/api/generate-description', {
      method: 'POST',
      body: {
        brand: form.value.brand,
        model: form.value.model,
        year: form.value.year,
        km: form.value.km,
        category: categories.value.find((c) => c.id === form.value.category_id)?.slug || '',
        subcategory:
          subcategories.value.find((s) => s.id === form.value.subcategory_id)?.slug || '',
      },
    })

    if (data.value && typeof data.value === 'object' && 'description' in data.value) {
      form.value.description_es = (data.value as { description: string }).description
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Error generating description'
  } finally {
    generatingDesc.value = false
  }
}

async function submitVehicle(): Promise<void> {
  const dealer = dealerProfile.value
  if (!dealer) return

  if (!canPublishVehicle.value) {
    error.value = t('dashboard.vehicles.limitReached')
    return
  }

  if (!form.value.brand || !form.value.model) {
    error.value = t('dashboard.vehicles.requiredFields')
    return
  }

  saving.value = true
  error.value = null

  try {
    // Generate slug
    const slug = `${form.value.brand}-${form.value.model}-${form.value.year}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036F]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const { error: err } = await supabase.from('vehicles').insert({
      dealer_id: dealer.id,
      brand: form.value.brand,
      model: form.value.model,
      year: form.value.year || null,
      km: form.value.km || null,
      price: form.value.price || null,
      category_id: form.value.category_id || null,
      subcategory_id: form.value.subcategory_id || null,
      description_es: form.value.description_es || null,
      description_en: form.value.description_en || null,
      location: form.value.location || null,
      slug,
      status: 'published',
      views: 0,
      is_online: true,
      vertical: getVerticalSlug(),
    })

    if (err) throw err

    success.value = true
    setTimeout(() => {
      router.push('/dashboard/vehiculos')
    }, 1500)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Error publishing vehicle'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <OnboardingVehicleUploadWizard v-if="showWizard" :vehicle-id="draftVehicleId" />
    <div class="publish-page">
      <header class="page-header">
        <NuxtLink to="/dashboard/vehiculos" class="back-link">
          {{ t('common.back') }}
        </NuxtLink>
        <h1>{{ t('dashboard.vehicles.publishNew') }}</h1>
      </header>

      <!-- Plan limit reached -->
      <div v-if="!canPublishVehicle" class="limit-banner">
        <p>{{ t('dashboard.vehicles.limitReached') }}</p>
        <p>
          {{ activeListingsCount }}/{{
            planLimits.maxActiveListings === Infinity ? '&infin;' : planLimits.maxActiveListings
          }}
          {{ t('dashboard.vehicles.used') }}
        </p>
        <NuxtLink to="/dashboard/suscripcion" class="btn-upgrade">
          {{ t('dashboard.vehicles.upgradePlan') }}
        </NuxtLink>
      </div>

      <form v-else class="vehicle-form" @submit.prevent="submitVehicle">
        <div v-if="error" class="alert-error">{{ error }}</div>
        <div v-if="success" class="alert-success">{{ t('dashboard.vehicles.published') }}</div>

        <!-- Basic Info -->
        <section class="form-section">
          <h2>{{ t('dashboard.vehicles.sectionBasic') }}</h2>
          <div class="form-grid">
            <div class="form-group">
              <label for="brand">{{ t('dashboard.vehicles.brand') }} *</label>
              <input
                id="brand"
                v-model="form.brand"
                type="text"
                required
                :placeholder="t('dashboard.vehicles.brandPlaceholder')"
              >
            </div>
            <div class="form-group">
              <label for="model">{{ t('dashboard.vehicles.model') }} *</label>
              <input
                id="model"
                v-model="form.model"
                type="text"
                required
                :placeholder="t('dashboard.vehicles.modelPlaceholder')"
              >
            </div>
            <div class="form-group">
              <label for="year">{{ t('dashboard.vehicles.year') }}</label>
              <input
                id="year"
                v-model.number="form.year"
                type="number"
                min="1950"
                :max="new Date().getFullYear() + 1"
              >
            </div>
            <div class="form-group">
              <label for="km">{{ t('dashboard.vehicles.km') }}</label>
              <input id="km" v-model.number="form.km" type="number" min="0" >
            </div>
            <div class="form-group">
              <label for="price">{{ t('dashboard.vehicles.price') }}</label>
              <input id="price" v-model.number="form.price" type="number" min="0" step="100" >
            </div>
            <div class="form-group">
              <label for="location">{{ t('dashboard.vehicles.location') }}</label>
              <input
                id="location"
                v-model="form.location"
                type="text"
                :placeholder="t('dashboard.vehicles.locationPlaceholder')"
              >
            </div>
          </div>
        </section>

        <!-- Category -->
        <section class="form-section">
          <h2>{{ t('dashboard.vehicles.sectionCategory') }}</h2>
          <div class="form-grid">
            <div class="form-group">
              <label for="category">{{ t('dashboard.vehicles.category') }}</label>
              <select id="category" v-model="form.category_id">
                <option value="">{{ t('dashboard.vehicles.selectCategory') }}</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.name.es || cat.slug }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="subcategory">{{ t('dashboard.vehicles.subcategory') }}</label>
              <select id="subcategory" v-model="form.subcategory_id">
                <option value="">{{ t('dashboard.vehicles.selectSubcategory') }}</option>
                <option v-for="sub in filteredSubcategories" :key="sub.id" :value="sub.id">
                  {{ sub.name.es || sub.slug }}
                </option>
              </select>
            </div>
          </div>
        </section>

        <!-- Description -->
        <section class="form-section">
          <h2>{{ t('dashboard.vehicles.sectionDescription') }}</h2>
          <div class="form-group">
            <div class="label-row">
              <label for="description_es">{{ t('dashboard.vehicles.descriptionEs') }}</label>
              <button
                type="button"
                class="btn-ai"
                :disabled="generatingDesc"
                @click="generateDescription"
              >
                {{
                  generatingDesc
                    ? t('dashboard.vehicles.generating')
                    : t('dashboard.vehicles.generateAI')
                }}
              </button>
            </div>
            <textarea
              id="description_es"
              v-model="form.description_es"
              rows="6"
              :placeholder="t('dashboard.vehicles.descriptionPlaceholder')"
            />
          </div>
          <div class="form-group">
            <label for="description_en">{{ t('dashboard.vehicles.descriptionEn') }}</label>
            <textarea
              id="description_en"
              v-model="form.description_en"
              rows="4"
              :placeholder="t('dashboard.vehicles.descriptionEnPlaceholder')"
            />
          </div>
        </section>

        <!-- Photos Placeholder -->
        <section class="form-section">
          <h2>{{ t('dashboard.vehicles.sectionPhotos') }}</h2>
          <div class="photo-placeholder">
            <p>{{ t('dashboard.vehicles.photosComingSoon') }}</p>
            <span class="photo-limit">{{
              t('dashboard.vehicles.maxPhotos', { max: maxPhotos })
            }}</span>
          </div>
        </section>

        <!-- Submit -->
        <div class="form-actions">
          <NuxtLink to="/dashboard/vehiculos" class="btn-secondary">
            {{ t('common.cancel') }}
          </NuxtLink>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? t('common.loading') : t('dashboard.vehicles.publish') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.publish-page {
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
  gap: 8px;
}

.back-link {
  color: var(--color-primary, #23424a);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.limit-banner {
  text-align: center;
  padding: 40px 20px;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 12px;
  color: #92400e;
}

.limit-banner p {
  margin: 0 0 12px 0;
}

.btn-upgrade {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 10px 24px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
}

.vehicle-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
}

.alert-success {
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  color: #16a34a;
}

.form-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.form-section h2 {
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  min-height: 44px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.btn-ai {
  min-height: 36px;
  padding: 6px 14px;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-ai:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.photo-placeholder {
  padding: 32px 20px;
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  text-align: center;
  color: #64748b;
}

.photo-placeholder p {
  margin: 0 0 8px 0;
}
.photo-limit {
  font-size: 0.8rem;
  color: #94a3b8;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-primary {
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
  cursor: pointer;
}

.btn-primary:hover {
  background: #1a3238;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
}

@media (min-width: 480px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .publish-page {
    padding: 24px;
  }
}
</style>
