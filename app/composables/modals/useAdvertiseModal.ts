/**
 * useAdvertiseModal
 * Extracts all state and logic from AdvertiseModal.vue.
 */

import { localizedField } from '~/composables/useLocalized'

export interface AdvertiseFormData {
  brand: string
  model: string
  year: number | null
  kilometers: number | null
  price: number | null
  location: string
  description: string
  contactName: string
  contactEmail: string
  contactPhone: string
  contactPreference: string
  termsAccepted: boolean
}

export const CONTACT_PREFERENCES = [
  { value: 'email', label: 'advertise.prefEmail' },
  { value: 'phone', label: 'advertise.prefPhone' },
  { value: 'whatsapp', label: 'advertise.prefWhatsApp' },
]

export const MAX_PHOTOS = 6
export const MIN_PHOTOS = 3

export function useAdvertiseModal(
  isOpen: () => boolean,
  onClose: () => void,
  onOpenAuth: () => void,
) {
  const { t, locale } = useI18n()
  const user = useSupabaseUser()

  const {
    categories,
    linkedSubcategories,
    attributes,
    selectedCategoryId,
    selectedSubcategoryId,
    filterValues,
    loading: selectorLoading,
    filtersLoading,
    fetchInitialData,
    selectCategory,
    selectSubcategory,
    setFilterValue,
    getAttributesJson,
    getFilterLabel,
    getFilterOptions,
    getVehicleSubcategoryLabel,
    reset: resetSelector,
  } = useVehicleTypeSelector()

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const isSubmitting = ref(false)
  const isSuccess = ref(false)
  const validationErrors = ref<Record<string, string>>({})

  const photos = ref<File[]>([])
  const photoPreviews = ref<string[]>([])
  const techSheet = ref<File | null>(null)
  const techSheetPreview = ref('')

  const formData = ref<AdvertiseFormData>({
    brand: '',
    model: '',
    year: null,
    kilometers: null,
    price: null,
    location: '',
    description: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactPreference: 'email',
    termsAccepted: false,
  })

  const isAuthenticated = computed(() => !!user.value)
  const hasValidationErrors = computed(() => Object.keys(validationErrors.value).length > 0)

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function catName(item: {
    name_es: string
    name_en: string | null
    name?: Record<string, string> | null
  }) {
    return (
      localizedField(item.name, locale.value) ||
      (locale.value === 'en' && item.name_en ? item.name_en : item.name_es)
    )
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  function close() {
    onClose()
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) close()
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') close()
  }

  function handleLoginClick() {
    onOpenAuth()
    close()
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  function validateForm(): boolean {
    validationErrors.value = {}
    const req = t('validation.required')
    if (!formData.value.brand.trim()) validationErrors.value.brand = req
    if (!formData.value.model.trim()) validationErrors.value.model = req
    if (!formData.value.year) validationErrors.value.year = req
    if (!formData.value.price) validationErrors.value.price = req
    if (!formData.value.location.trim()) validationErrors.value.location = req
    if (!formData.value.description.trim()) validationErrors.value.description = req
    if (!formData.value.contactName.trim()) validationErrors.value.contactName = req
    if (!formData.value.contactEmail.trim()) {
      validationErrors.value.contactEmail = req
    } else if (!/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(formData.value.contactEmail)) {
      validationErrors.value.contactEmail = t('validation.invalidEmail')
    }
    if (!formData.value.contactPhone.trim()) validationErrors.value.contactPhone = req
    if (photos.value.length < MIN_PHOTOS) validationErrors.value.photos = req
    if (!techSheet.value) validationErrors.value.techSheet = req
    if (!formData.value.termsAccepted)
      validationErrors.value.termsAccepted = t('validation.termsRequired')
    return Object.keys(validationErrors.value).length === 0
  }

  // ---------------------------------------------------------------------------
  // Photo handlers
  // ---------------------------------------------------------------------------

  function handlePhotoSelect(e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files) return
    const files = Array.from(input.files).slice(0, MAX_PHOTOS - photos.value.length)
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) continue
      photos.value.push(file)
      photoPreviews.value.push(URL.createObjectURL(file))
    }
    input.value = ''
    if (validationErrors.value.photos && photos.value.length >= MIN_PHOTOS) {
      delete validationErrors.value.photos
    }
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(photoPreviews.value[index]!)
    photos.value.splice(index, 1)
    photoPreviews.value.splice(index, 1)
  }

  function handleTechSheetSelect(e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files || !input.files[0]) return
    const file = input.files[0]
    if (file.size > 10 * 1024 * 1024) return
    if (techSheetPreview.value) URL.revokeObjectURL(techSheetPreview.value)
    techSheet.value = file
    techSheetPreview.value = URL.createObjectURL(file)
    input.value = ''
    if (validationErrors.value.techSheet) {
      delete validationErrors.value.techSheet
    }
  }

  function removeTechSheet() {
    if (techSheetPreview.value) URL.revokeObjectURL(techSheetPreview.value)
    techSheet.value = null
    techSheetPreview.value = ''
  }

  // ---------------------------------------------------------------------------
  // Vehicle type selector wrappers
  // ---------------------------------------------------------------------------

  function handleCategoryChange(e: Event) {
    selectCategory((e.target as HTMLSelectElement).value || null)
  }

  async function handleSubcategoryChange(e: Event) {
    await selectSubcategory((e.target as HTMLSelectElement).value || null)
  }

  // ---------------------------------------------------------------------------
  // Reset & submit
  // ---------------------------------------------------------------------------

  function resetForm() {
    formData.value = {
      brand: '',
      model: '',
      year: null,
      kilometers: null,
      price: null,
      location: '',
      description: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      contactPreference: 'email',
      termsAccepted: false,
    }
    photoPreviews.value.forEach((url) => URL.revokeObjectURL(url))
    photos.value = []
    photoPreviews.value = []
    removeTechSheet()
    validationErrors.value = {}
    resetSelector()
  }

  async function handleSubmit() {
    if (!validateForm() || !isAuthenticated.value) return
    isSubmitting.value = true
    try {
      await $fetch('/api/advertisements', {
        method: 'POST',
        body: {
          vehicle_type: getVehicleSubcategoryLabel(locale.value),
          category_id: selectedCategoryId.value,
          subcategory_id: selectedSubcategoryId.value,
          attributes_json: getAttributesJson(),
          brand: formData.value.brand,
          model: formData.value.model,
          year: formData.value.year,
          kilometers: formData.value.kilometers,
          price: formData.value.price,
          location: formData.value.location,
          description: formData.value.description,
          photos: photos.value.map((f) => f.name),
          tech_sheet: techSheet.value?.name || null,
          contact_name: formData.value.contactName,
          contact_email: formData.value.contactEmail,
          contact_phone: formData.value.contactPhone,
          contact_preference: formData.value.contactPreference,
        },
      })
      isSuccess.value = true
      resetForm()
      setTimeout(() => {
        isSuccess.value = false
        close()
      }, 3000)
    } catch (err) {
      if (import.meta.dev) console.error('Error submitting advertisement:', err)
    } finally {
      isSubmitting.value = false
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  watch(isOpen, (open) => {
    if (open) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleKeyDown)
      fetchInitialData()
    } else {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
      if (!isSuccess.value) resetForm()
    }
  })

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    // Auth
    isAuthenticated,
    handleLoginClick,

    // Form state
    formData,
    isSubmitting,
    isSuccess,
    validationErrors,
    hasValidationErrors,

    // Photos
    photos,
    photoPreviews,
    techSheet,
    techSheetPreview,
    handlePhotoSelect,
    removePhoto,
    handleTechSheetSelect,
    removeTechSheet,

    // Vehicle type selector
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

    // Modal
    close,
    handleBackdropClick,
    handleSubmit,
  }
}
