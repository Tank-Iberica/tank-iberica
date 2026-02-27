<script setup lang="ts">
import { useAdminProductoNuevo } from '~/composables/admin/useAdminProductoNuevo'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  saving,
  error,
  cloudinaryUploading,
  cloudinaryProgress,
  selectedSubcategoryId,
  formData,
  characteristics,
  documents,
  pendingImages,
  uploadingImages,
  sections,
  dynamicFilters,
  publishedSubcategories,
  publishedTypes,
  showRentalPrice,
  isValid,
  totalMaint,
  totalRental,
  totalCost,
  init,
  updateFilterValue,
  getFilterValue,
  toggleCategory,
  addCharacteristic,
  removeCharacteristic,
  handleImageSelect,
  removePendingImage,
  movePendingImage,
  handleDocUpload,
  removeDocument,
  addMaint,
  removeMaint,
  addRental,
  removeRental,
  handleSave,
  handleCancel,
  fmt,
  countryFlag,
  onUpdateMinPrice,
  onUpdateAcquisitionCost,
  onUpdateAcquisitionDate,
  onUpdateMaint,
  onUpdateRental,
} = useAdminProductoNuevo()

onMounted(async () => {
  await init()
})
</script>

<template>
  <div class="pf">
    <AdminProductosNuevoNuevoHeader
      :saving="saving"
      :uploading-images="uploadingImages"
      :is-valid="isValid"
      @save="handleSave"
      @cancel="handleCancel"
    />
    <div v-if="error" class="error-msg">{{ error }}</div>
    <div class="pf-body">
      <AdminProductosNuevoNuevoStatus
        :status="formData.status"
        @update:status="formData.status = $event"
      />
      <AdminProductosNuevoNuevoVisibility
        :is-online="formData.is_online"
        :owner-name="formData.owner_name ?? null"
        :owner-contact="formData.owner_contact ?? null"
        :owner-notes="formData.owner_notes ?? null"
        @update:is-online="formData.is_online = $event"
        @update:owner-name="formData.owner_name = $event"
        @update:owner-contact="formData.owner_contact = $event"
        @update:owner-notes="formData.owner_notes = $event"
      />
      <AdminProductImageSection
        :pending-images="pendingImages"
        :uploading-images="uploadingImages"
        :cloudinary-uploading="cloudinaryUploading"
        :cloudinary-progress="cloudinaryProgress"
        @select="handleImageSelect"
        @remove="removePendingImage"
        @move="movePendingImage"
      />
      <AdminProductosNuevoNuevoCategories
        :categories="formData.categories || []"
        :featured="formData.featured"
        @toggle-category="toggleCategory"
        @update:featured="formData.featured = $event"
      />
      <AdminProductosNuevoNuevoBasicData
        :selected-subcategory-id="selectedSubcategoryId"
        :subcategories="publishedSubcategories"
        :type-id="formData.type_id"
        :types="publishedTypes"
        :brand="formData.brand"
        :model="formData.model"
        :year="formData.year"
        :plate="formData.plate ?? null"
        :price="formData.price"
        :rental-price="formData.rental_price"
        :show-rental-price="showRentalPrice"
        :location="formData.location"
        :location-en="formData.location_en"
        :location-country="formData.location_country"
        :location-province="formData.location_province"
        :location-region="formData.location_region"
        :country-flag-fn="countryFlag"
        @update:selected-subcategory-id="selectedSubcategoryId = $event"
        @update:type-id="formData.type_id = $event"
        @update:brand="formData.brand = $event"
        @update:model="formData.model = $event"
        @update:year="formData.year = $event"
        @update:plate="formData.plate = $event"
        @update:price="formData.price = $event"
        @update:rental-price="formData.rental_price = $event"
        @update:location="formData.location = $event"
        @update:location-en="formData.location_en = $event"
      />
      <AdminProductosNuevoNuevoDescription
        :open="sections.description"
        :description-es="formData.description_es"
        :description-en="formData.description_en"
        @update:open="sections.description = $event"
        @update:description-es="formData.description_es = $event"
        @update:description-en="formData.description_en = $event"
      />
      <AdminProductosNuevoNuevoFilters
        :open="sections.filters"
        :dynamic-filters="dynamicFilters"
        :get-filter-value="getFilterValue"
        @update:open="sections.filters = $event"
        @update-filter="updateFilterValue"
      />
      <AdminProductosNuevoNuevoCharacteristics
        :open="sections.characteristics"
        :characteristics="characteristics"
        @update:open="sections.characteristics = $event"
        @add="addCharacteristic"
        @remove="removeCharacteristic"
      />
      <AdminProductosNuevoNuevoDocuments
        :open="sections.documents"
        :documents="documents"
        @update:open="sections.documents = $event"
        @upload="handleDocUpload"
        @remove="removeDocument"
      />
      <AdminProductosNuevoNuevoFinancial
        :open="sections.financial"
        :min-price="formData.min_price"
        :acquisition-cost="formData.acquisition_cost"
        :acquisition-date="formData.acquisition_date"
        :maintenance-records="formData.maintenance_records || []"
        :rental-records="formData.rental_records || []"
        :total-maint="totalMaint"
        :total-rental="totalRental"
        :total-cost="totalCost"
        :fmt="fmt"
        @update:open="sections.financial = $event"
        @add-maint="addMaint"
        @remove-maint="removeMaint"
        @update-maint="onUpdateMaint"
        @add-rental="addRental"
        @remove-rental="removeRental"
        @update-rental="onUpdateRental"
        @update:min-price="onUpdateMinPrice"
        @update:acquisition-cost="onUpdateAcquisitionCost"
        @update:acquisition-date="onUpdateAcquisitionDate"
      />
    </div>
  </div>
</template>

<style scoped>
.pf {
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: 40px;
}
.error-msg {
  background: #fef2f2;
  color: #dc2626;
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
