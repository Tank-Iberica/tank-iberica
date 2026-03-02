<script setup lang="ts">
import { useAdminProductoDetail } from '~/composables/admin/useAdminProductoDetail'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const {
  loading,
  saving,
  error,
  vehicle,
  formData,
  images,
  uploadingImage,
  cloudinaryUploading,
  cloudinaryProgress,
  characteristics,
  documents,
  selectedSubcategoryId,
  showDeleteModal,
  deleteConfirm,
  canDelete,
  showSellModal,
  sellData,
  sections,
  verifDocTypes,
  verifDocType,
  verifDocs,
  verifLoading,
  verifError,
  verifCurrentLevel,
  verifLevelBadge,
  docTypeToUpload,
  docTypeOptions,
  fileNamingData,
  driveConnected,
  driveLoading,
  driveError,
  driveSection,
  connectDrive,
  openVehicleFolder,
  openDocumentsFolder,
  publishedSubcategories,
  publishedTypes,
  dynamicFilters,
  showRentalPrice,
  isValid,
  totalMaint,
  totalRental,
  totalCost,
  finalProfit,
  init,
  handleSave,
  handleCancel,
  executeDelete,
  executeSell,
  handleImageUpload,
  handleDeleteImage,
  setAsPortada,
  moveImage,
  addCharacteristic,
  removeCharacteristic,
  updateCharacteristic,
  handleDocUpload,
  removeDocument,
  handleMaintInvoiceUpload,
  handleRentalInvoiceUpload,
  addMaint,
  removeMaint,
  updateMaint,
  addRental,
  removeRental,
  updateRental,
  handleVerifUpload,
  updateFilterValue,
} = useAdminProductoDetail()

onMounted(() => init())
</script>

<template>
  <div class="pf">
    <div v-if="loading && !vehicle" class="loading">Cargando...</div>

    <template v-else-if="vehicle">
      <AdminProductoHeader
        :vehicle="vehicle"
        :featured="formData.featured"
        :saving="saving"
        :is-valid="isValid"
        :drive-connected="driveConnected"
        :drive-loading="driveLoading"
        :file-naming-data="fileNamingData"
        :drive-section="driveSection"
        @back="handleCancel"
        @drive-connect="connectDrive"
        @drive-open="openVehicleFolder(fileNamingData, driveSection)"
        @sell="showSellModal = true"
        @delete="showDeleteModal = true"
        @cancel="handleCancel"
        @save="handleSave"
      />

      <div v-if="error" class="error-msg">{{ error }}</div>

      <div class="pf-body">
        <AdminProductoStatus v-model="formData.status" />

        <AdminProductoVisibilidad
          v-model:is-online="formData.is_online"
          v-model:owner-name="formData.owner_name"
          v-model:owner-contact="formData.owner_contact"
          v-model:owner-notes="formData.owner_notes"
        />

        <AdminProductoImages
          :images="images"
          :uploading="uploadingImage"
          :cloudinary-uploading="cloudinaryUploading"
          :cloudinary-progress="cloudinaryProgress"
          @upload="handleImageUpload"
          @delete="handleDeleteImage"
          @set-portada="setAsPortada"
          @move="moveImage"
        />

        <AdminProductoBasicInfo
          v-model:categories="formData.categories"
          v-model:featured="formData.featured"
          v-model:selected-subcategory-id="selectedSubcategoryId"
          v-model:type-id="formData.type_id"
          v-model:brand="formData.brand"
          v-model:model="formData.model"
          v-model:year="formData.year"
          v-model:plate="formData.plate"
          v-model:price="formData.price"
          v-model:rental-price="formData.rental_price"
          v-model:location="formData.location"
          v-model:location-en="formData.location_en"
          :subcategories="publishedSubcategories"
          :types="publishedTypes"
          :show-rental-price="showRentalPrice"
          :location-country="formData.location_country"
          :location-province="formData.location_province"
          :location-region="formData.location_region"
        />

        <AdminProductoDescription
          v-model:open="sections.description"
          v-model:description-es="formData.description_es"
          v-model:description-en="formData.description_en"
        />

        <AdminProductoFilters
          v-model:open="sections.filters"
          :filters="dynamicFilters"
          :attributes-json="formData.attributes_json"
          @update-filter="updateFilterValue"
        />

        <AdminProductoCharacteristics
          v-model:open="sections.characteristics"
          :characteristics="characteristics"
          @add="addCharacteristic"
          @remove="removeCharacteristic"
          @update="updateCharacteristic"
        />

        <AdminProductoDocuments
          v-model:open="sections.documents"
          v-model:doc-type-to-upload="docTypeToUpload"
          :documents="documents"
          :doc-type-options="docTypeOptions"
          :drive-connected="driveConnected"
          :drive-loading="driveLoading"
          :drive-error="driveError"
          :file-naming-data="fileNamingData"
          :drive-section="driveSection"
          @upload="handleDocUpload"
          @remove="removeDocument"
          @open-folder="openDocumentsFolder(fileNamingData, driveSection)"
        />

        <AdminProductoFinancial
          v-model:open="sections.financial"
          v-model:acquisition-cost="formData.acquisition_cost"
          v-model:acquisition-date="formData.acquisition_date"
          v-model:min-price="formData.min_price"
          :maintenance-records="formData.maintenance_records || []"
          :rental-records="formData.rental_records || []"
          :total-maint="totalMaint"
          :total-rental="totalRental"
          :total-cost="totalCost"
          :drive-loading="driveLoading"
          :file-naming-data="fileNamingData"
          :drive-section="driveSection"
          @add-maint="addMaint"
          @remove-maint="removeMaint"
          @update-maint="updateMaint"
          @add-rental="addRental"
          @remove-rental="removeRental"
          @update-rental="updateRental"
          @upload-maint-invoice="handleMaintInvoiceUpload"
          @upload-rental-invoice="handleRentalInvoiceUpload"
        />

        <AdminProductoVerification
          v-model:open="sections.verification"
          v-model:doc-type="verifDocType"
          :current-level="verifCurrentLevel"
          :level-badge="verifLevelBadge"
          :documents="verifDocs"
          :doc-types="verifDocTypes"
          :loading="verifLoading"
          :error="verifError"
          @upload="handleVerifUpload"
        />
      </div>
    </template>

    <AdminProductosDetailDetailModals
      v-model:show-delete-modal="showDeleteModal"
      v-model:delete-confirm="deleteConfirm"
      v-model:show-sell-modal="showSellModal"
      v-model:sell-data="sellData"
      :vehicle-brand="vehicle?.brand || ''"
      :vehicle-model="vehicle?.model || ''"
      :can-delete="canDelete"
      :total-cost="totalCost"
      :final-profit="finalProfit"
      @delete="executeDelete"
      @sell="executeSell"
    />
  </div>
</template>

<style scoped>
.pf {
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: 40px;
}
.loading {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}
.error-msg {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
  padding: 10px 14px;
  border-radius: 6px;
  margin-bottom: 12px;
}
.pf-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
