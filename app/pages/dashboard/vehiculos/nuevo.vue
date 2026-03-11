<script setup lang="ts">
import { useDashboardNuevoVehiculo } from '~/composables/dashboard/useDashboardNuevoVehiculo'
import {
  getDescriptionTemplate,
  applyPlaceholders,
} from '~/utils/descriptionTemplates'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const {
  categories,
  activeListingsCount,
  saving,
  generatingDesc,
  error,
  success,
  form,
  filteredSubcategories,
  canPublishVehicle,
  planLimits,
  maxPhotos,
  loadFormData,
  generateDescription,
  submitVehicle,
} = useDashboardNuevoVehiculo()

const showWizard = ref(true)
const draftVehicleId = ref<string | undefined>(undefined)
const photos = ref<{ id: string; url: string; publicId: string; width: number; height: number }[]>([])

/** Apply a description template for the selected category */
function applyTemplate() {
  const selectedCat = categories.value.find((c) => c.id === form.value.category_id)
  const slug = selectedCat?.slug || ''
  const tpl = getDescriptionTemplate(slug)
  const values = {
    marca: form.value.brand || undefined,
    modelo: form.value.model || undefined,
    año: form.value.year || undefined,
    km: form.value.km || undefined,
  }
  form.value.description_es = applyPlaceholders(tpl.es, values)
  form.value.description_en = applyPlaceholders(tpl.en, values)
}

onMounted(loadFormData)
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

      <form v-else class="vehicle-form" @submit.prevent="submitVehicle(photos)">
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
                autocomplete="off"
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
                autocomplete="off"
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
                autocomplete="off"
              >
            </div>
            <div class="form-group">
              <label for="km">{{ t('dashboard.vehicles.km') }}</label>
              <input id="km" v-model.number="form.km" type="number" min="0" autocomplete="off" >
            </div>
            <div class="form-group">
              <label for="price">{{ t('dashboard.vehicles.price') }}</label>
              <input id="price" v-model.number="form.price" type="number" min="0" step="100" autocomplete="off" >
            </div>
            <div class="form-group">
              <label for="location">{{ t('dashboard.vehicles.location') }}</label>
              <input
                id="location"
                v-model="form.location"
                type="text"
                autocomplete="off"
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
              <div class="label-actions">
                <button
                  type="button"
                  class="btn-template"
                  @click="applyTemplate"
                >
                  {{ t('dashboard.vehicles.useTemplate') }}
                </button>
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

        <!-- Photos -->
        <section class="form-section">
          <h2>{{ t('dashboard.vehicles.sectionPhotos') }}</h2>
          <DashboardPhotoUpload v-model="photos" :max-photos="maxPhotos" />
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
  max-width: 50rem;
  margin: 0 auto;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.back-link {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.limit-banner {
  text-align: center;
  padding: var(--spacing-10) var(--spacing-5);
  background: var(--color-warning-bg, var(--color-warning-bg));
  border: 1px solid var(--color-warning);
  border-radius: var(--border-radius-md);
  color: var(--color-warning-text);
}

.limit-banner p {
  margin: 0 0 var(--spacing-3) 0;
}

.btn-upgrade {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  padding: 0.625rem var(--spacing-6);
  background: var(--color-warning);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  text-decoration: none;
}

.vehicle-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.alert-error {
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-error-bg, var(--color-error-bg));
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  color: var(--color-error);
}

.alert-success {
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-success-bg, var(--color-success-bg));
  border: 1px solid var(--color-success-border);
  border-radius: var(--border-radius);
  color: var(--color-success);
}

.form-section {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-5);
  box-shadow: var(--shadow-card);
}

.form-section h2 {
  margin: 0 0 var(--spacing-4) 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
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
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  font-family: inherit;
  min-height: 2.75rem;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.form-group textarea {
  resize: vertical;
  min-height: 6.25rem;
}

.label-actions {
  display: flex;
  gap: 0.375rem;
  align-items: center;
}

.btn-template {
  min-height: 2.25rem;
  padding: 0.375rem 0.75rem;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-template:hover {
  background: var(--bg-tertiary);
}

.btn-ai {
  min-height: 2.25rem;
  padding: 0.375rem 0.875rem;
  background: var(--color-purple-text);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-ai:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  gap: var(--spacing-3);
  justify-content: flex-end;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem var(--spacing-6);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem var(--spacing-6);
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
}

@media (min-width: 30em) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 48em) {
  .publish-page {
    padding: var(--spacing-6);
  }
}
</style>
