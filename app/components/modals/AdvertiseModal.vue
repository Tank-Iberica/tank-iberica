<script setup lang="ts">
import { useAdvertiseModal } from '~/composables/modals/useAdvertiseModal'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'open-auth': []
}>()

const { t } = useI18n()

const {
  isAuthenticated,
  handleLoginClick,
  formData,
  isSubmitting,
  isSuccess,
  validationErrors,
  hasValidationErrors,
  photos,
  photoPreviews,
  techSheet,
  techSheetPreview,
  handlePhotoSelect,
  removePhoto,
  handleTechSheetSelect,
  removeTechSheet,
  categories,
  linkedSubcategories,
  attributes,
  selectedCategoryId,
  selectedSubcategoryId,
  filterValues,
  selectorLoading,
  filtersLoading,
  catName,
  handleCategoryChange,
  handleSubcategoryChange,
  setFilterValue,
  getFilterLabel,
  getFilterOptions,
  close,
  handleBackdropClick,
  handleSubmit,
} = useAdvertiseModal(
  () => props.modelValue,
  () => emit('update:modelValue', false),
  () => emit('open-auth'),
)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click="handleBackdropClick">
        <div class="modal-container">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">{{ t('advertise.title') }}</h2>
              <p class="modal-subtitle">{{ t('advertise.subtitle') }}</p>
            </div>
            <button
              type="button"
              class="close-button"
              :aria-label="t('common.close')"
              @click="close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <div v-if="!isAuthenticated" class="auth-required">
            <p>{{ t('advertise.loginRequired') }}</p>
            <button type="button" class="btn btn-primary" @click="handleLoginClick">
              {{ t('auth.login') }}
            </button>
          </div>

          <div v-else-if="isSuccess" class="success-message">
            <div class="success-icon">&#x2713;</div>
            <h3>{{ t('advertise.successTitle') }}</h3>
            <p>{{ t('advertise.successMessage') }}</p>
          </div>

          <form v-else class="modal-body" @submit.prevent="handleSubmit">
            <!-- Section 1: Vehicle Type -->
            <div class="form-section">
              <h3 class="form-section-title">{{ t('advertise.sectionVehicleType') }}</h3>
              <AdvertiseVehicleTypeSection
                :categories="categories"
                :linked-subcategories="linkedSubcategories"
                :attributes="attributes"
                :selected-category-id="selectedCategoryId"
                :selected-subcategory-id="selectedSubcategoryId"
                :filter-values="filterValues"
                :selector-loading="selectorLoading"
                :filters-loading="filtersLoading"
                :cat-name="catName"
                :get-filter-label="getFilterLabel"
                :get-filter-options="getFilterOptions"
                @category-change="handleCategoryChange"
                @subcategory-change="handleSubcategoryChange"
                @filter-change="setFilterValue"
              />
            </div>

            <!-- Section 2: Vehicle Data -->
            <div class="form-section">
              <h3 class="form-section-title">{{ t('advertise.sectionVehicleData') }}</h3>
              <AdvertiseVehicleDataSection v-model:form="formData" :errors="validationErrors" />
            </div>

            <!-- Section 3: Images -->
            <div class="form-section">
              <h3 class="form-section-title">{{ t('advertise.sectionImages') }}</h3>
              <AdvertiseImagesSection
                :photos="photos"
                :photo-previews="photoPreviews"
                :tech-sheet="techSheet"
                :tech-sheet-preview="techSheetPreview"
                :errors="validationErrors"
                @photo-select="handlePhotoSelect"
                @remove-photo="removePhoto"
                @tech-sheet-select="handleTechSheetSelect"
                @remove-tech-sheet="removeTechSheet"
              />
            </div>

            <!-- Section 4: Contact -->
            <div class="form-section">
              <h3 class="form-section-title">{{ t('advertise.sectionContact') }}</h3>
              <AdvertiseContactSection v-model:form="formData" :errors="validationErrors" />
            </div>

            <p v-if="hasValidationErrors" class="validation-summary">
              {{ t('advertise.requiredField') }}
            </p>

            <div class="modal-footer">
              <button type="submit" class="btn btn-primary btn-submit" :disabled="isSubmitting">
                {{ isSubmitting ? t('advertise.sending') : t('advertise.submit') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 9999;
  overflow-y: auto;
}

.modal-container {
  background: white;
  width: 100%;
  max-height: 92vh;
  overflow-y: auto;
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--spacing-3) var(--spacing-4);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.modal-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: var(--spacing-1) 0 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 28px;
  line-height: 1;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 0.2s;
}

.close-button:hover {
  color: var(--color-text);
}

.auth-required {
  padding: var(--spacing-8);
  text-align: center;
}

.auth-required p {
  margin-bottom: var(--spacing-4);
  color: var(--color-text-secondary);
}

.success-message {
  padding: var(--spacing-12) var(--spacing-6);
  text-align: center;
}

.success-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #10b981;
  color: white;
  font-size: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-4);
}

.success-message h3 {
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-2);
  color: var(--color-text);
}

.success-message p {
  color: var(--color-text-secondary);
}

.modal-body {
  padding: var(--spacing-3);
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.form-section {
  background: #f9fafb;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: var(--spacing-3);
}

.form-section-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-primary);
  margin: 0 0 var(--spacing-3);
  padding-bottom: var(--spacing-2);
  border-bottom: 2px solid rgba(35, 66, 74, 0.2);
}

.validation-summary {
  font-size: 0.8rem;
  color: #ef4444;
  text-align: center;
  margin: 0;
  padding: var(--spacing-2);
  background: #fef2f2;
  border-radius: 6px;
}

.modal-footer {
  padding: var(--spacing-3) var(--spacing-4);
  border-top: 1px solid var(--border-color);
  background: white;
  position: sticky;
  bottom: 0;
}

.btn {
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
  padding: var(--spacing-2) var(--spacing-6);
}

.btn-primary {
  background: linear-gradient(135deg, var(--color-primary) 0%, #2d5560 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(35, 66, 74, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-submit {
  width: 100%;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .modal-backdrop {
    align-items: center;
    padding: var(--spacing-6);
  }

  .modal-container {
    max-width: 700px;
    max-height: 88vh;
    border-radius: var(--border-radius);
  }

  .modal-header {
    padding: var(--spacing-4) var(--spacing-5);
  }

  .modal-body {
    padding: var(--spacing-4) var(--spacing-5);
    gap: var(--spacing-4);
  }

  .form-section {
    padding: var(--spacing-4);
  }

  .modal-footer {
    padding: var(--spacing-4) var(--spacing-5);
  }

  .btn-submit {
    width: auto;
    min-width: 200px;
  }

  .modal-enter-from .modal-container,
  .modal-leave-to .modal-container {
    transform: scale(0.95);
  }
}
</style>
