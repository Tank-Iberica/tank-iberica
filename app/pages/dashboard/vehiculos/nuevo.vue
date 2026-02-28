<script setup lang="ts">
import { useDashboardNuevoVehiculo } from '~/composables/dashboard/useDashboardNuevoVehiculo'

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
