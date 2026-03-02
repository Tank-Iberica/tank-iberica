<script setup lang="ts">
/**
 * Edit Vehicle
 * Same form as nuevo but pre-filled. Verifies vehicle belongs to dealer.
 */
import { useDashboardVehiculoDetail } from '~/composables/dashboard/useDashboardVehiculoDetail'
import type { VehicleFormData } from '~/composables/dashboard/useDashboardVehiculoDetail'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const route = useRoute()
const vehicleId = route.params.id as string

const {
  form,
  categories,
  filteredSubcategories,
  loading,
  saving,
  generatingDesc,
  error,
  success,
  favoritesCount,
  maxPhotos,
  verificationDocs,
  verificationError,
  currentLevel,
  uploadForm,
  uploadSuccess,
  cloudinaryUploading,
  nextLevel,
  missingDocuments,
  progressPercentage,
  init,
  saveVehicle,
  generateDescription,
  getLevelColor,
  getLevelDefinition,
  handleFileSelect,
  handleUploadDocument,
  updateFormField,
} = useDashboardVehiculoDetail(vehicleId)

onMounted(init)

function onBasicInfoUpdate(field: keyof VehicleFormData, value: string | number): void {
  updateFormField(field, value as never)
}

function onCategoryUpdate(field: 'category_id' | 'subcategory_id', value: string): void {
  updateFormField(field, value)
}

function onDescriptionUpdate(field: 'description_es' | 'description_en', value: string): void {
  updateFormField(field, value)
}

function onUploadDocTypeUpdate(value: string): void {
  uploadForm.value.docType = value
}
</script>

<template>
  <div class="edit-page">
    <header class="page-header">
      <NuxtLink to="/dashboard/vehiculos" class="back-link">
        {{ t('common.back') }}
      </NuxtLink>
      <div class="header-row">
        <h1>{{ t('dashboard.vehicles.editTitle') }}</h1>
        <span v-if="!loading && favoritesCount > 0" class="favorites-stat">
          &#9829; {{ t('dashboard.vehicles.favoritesCount', { count: favoritesCount }) }}
        </span>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>{{ t('common.loading') }}...</span>
    </div>

    <form v-else class="vehicle-form" @submit.prevent="saveVehicle">
      <div v-if="error" class="alert-error">{{ error }}</div>
      <div v-if="success" class="alert-success">{{ t('dashboard.vehicles.saved') }}</div>

      <VehiculoBasicInfoForm
        :brand="form.brand"
        :model="form.model"
        :year="form.year"
        :km="form.km"
        :price="form.price"
        :location="form.location"
        @update="onBasicInfoUpdate"
      />

      <VehiculoCategoryForm
        :category-id="form.category_id"
        :subcategory-id="form.subcategory_id"
        :categories="categories"
        :filtered-subcategories="filteredSubcategories"
        @update="onCategoryUpdate"
      />

      <VehiculoDescriptionForm
        :description-es="form.description_es"
        :description-en="form.description_en"
        :generating-desc="generatingDesc"
        @update="onDescriptionUpdate"
        @generate="generateDescription"
      />

      <VehiculoPhotosSection :max-photos="maxPhotos" />

      <VehiculoVerificationSection
        :current-level="currentLevel"
        :progress-percentage="progressPercentage"
        :next-level="nextLevel"
        :missing-documents="missingDocuments"
        :verification-docs="verificationDocs"
        :verification-error="verificationError"
        :upload-doc-type="uploadForm.docType"
        :upload-file="uploadForm.file"
        :upload-success="uploadSuccess"
        :cloudinary-uploading="cloudinaryUploading"
        :get-level-color="getLevelColor"
        :get-level-definition="getLevelDefinition"
        @update:upload-doc-type="onUploadDocTypeUpdate"
        @file-select="handleFileSelect"
        @upload-document="handleUploadDocument"
      />

      <VehiculoFormActions :saving="saving" />
    </form>
  </div>
</template>

<style scoped>
.edit-page {
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
  color: var(--color-primary);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.header-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.favorites-stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--text-auxiliary);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-gray-200);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.vehicle-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.alert-error {
  padding: 12px 16px;
  background: var(--color-error-bg, #fef2f2);
  border: 1px solid var(--color-error-border);
  border-radius: 8px;
  color: var(--color-error);
}

.alert-success {
  padding: 12px 16px;
  background: var(--color-success-bg, #dcfce7);
  border: 1px solid var(--color-success-border);
  border-radius: 8px;
  color: var(--color-success);
}

@media (min-width: 768px) {
  .edit-page {
    padding: 24px;
  }
}
</style>
