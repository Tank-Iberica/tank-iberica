/**
 * Composable for the vehicle detail/edit page in the dealer dashboard.
 * Manages form state, verification, description generation, and save logic.
 */

import type { VerificationLevel } from '~/composables/useVehicleVerification'
import { useCloudinaryUpload } from '~/composables/admin/useCloudinaryUpload'

export interface CategoryOption {
  id: string
  name: Record<string, string>
  slug: string
}

export interface SubcategoryOption {
  id: string
  name: Record<string, string>
  slug: string
  category_id: string
}

export interface VehicleFormData {
  brand: string
  model: string
  year: number
  km: number
  price: number
  category_id: string
  subcategory_id: string
  description_es: string
  description_en: string
  location: string
  status: string
}

export interface UploadFormData {
  docType: string
  file: File | null
}

export function useDashboardVehiculoDetail(vehicleId: string) {
  const { t } = useI18n()
  const supabase = useSupabaseClient()
  const { userId } = useAuth()
  const { dealerProfile, loadDealer } = useDealerDashboard()
  const { maxPhotos, fetchSubscription } = useSubscriptionPlan(userId.value || undefined)

  const {
    documents: verificationDocs,
    error: verificationError,
    currentLevel,
    fetchDocuments,
    uploadDocument,
    getMissingDocs,
    getLevelDefinition,
    VERIFICATION_LEVELS,
    LEVEL_ORDER,
  } = useVehicleVerification(vehicleId)

  const { upload: uploadToCloudinary, uploading: cloudinaryUploading } = useCloudinaryUpload()

  // --- State ---
  const categories = ref<CategoryOption[]>([])
  const subcategories = ref<SubcategoryOption[]>([])
  const loading = ref(true)
  const saving = ref(false)
  const generatingDesc = ref(false)
  const error = ref<string | null>(null)
  const success = ref(false)
  const favoritesCount = ref(0)

  const form = ref<VehicleFormData>({
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
    status: 'published',
  })

  const uploadForm = ref<UploadFormData>({
    docType: '',
    file: null,
  })
  const uploadSuccess = ref(false)

  // --- Computed ---
  const filteredSubcategories = computed(() => {
    if (!form.value.category_id) return subcategories.value
    return subcategories.value.filter((s) => s.category_id === form.value.category_id)
  })

  const nextLevel = computed<VerificationLevel | null>(() => {
    const currentOrder = LEVEL_ORDER[currentLevel.value]
    const nextLevelDef = VERIFICATION_LEVELS.find((l) => LEVEL_ORDER[l.level] === currentOrder + 1)
    return nextLevelDef?.level || null
  })

  const missingDocuments = computed(() => {
    if (!nextLevel.value) return [] as string[]
    return getMissingDocs(nextLevel.value)
  })

  const progressPercentage = computed(() => {
    const currentOrder = LEVEL_ORDER[currentLevel.value]
    const maxOrder = Math.max(...Object.values(LEVEL_ORDER))
    return Math.round((currentOrder / maxOrder) * 100)
  })

  // --- Functions ---
  function getLevelColor(level: string): string {
    const colors: Record<string, string> = {
      none: '#94a3b8',
      verified: '#10b981',
      extended: '#3b82f6',
      detailed: '#8b5cf6',
      audited: '#f59e0b',
      certified: '#ef4444',
    }
    return colors[level] || '#64748b'
  }

  async function loadData(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const dealer = dealerProfile.value || (await loadDealer())
      if (!dealer) {
        error.value = 'Dealer not found'
        return
      }

      const [vehicleRes, catRes, subRes, , , favRes] = await Promise.all([
        supabase
          .from('vehicles')
          .select('*')
          .eq('id', vehicleId)
          .eq('dealer_id', dealer.id)
          .single(),
        supabase.from('categories').select('id, name, slug').order('slug'),
        supabase.from('subcategories').select('id, name, slug, category_id').order('slug'),
        fetchSubscription(),
        fetchDocuments(),
        supabase
          .from('favorites')
          .select('id', { count: 'exact', head: true })
          .eq('vehicle_id', vehicleId),
      ])

      if (vehicleRes.error || !vehicleRes.data) {
        error.value = t('dashboard.vehicles.notFound')
        return
      }

      favoritesCount.value = favRes.count || 0

      const v = vehicleRes.data as Record<string, unknown>
      form.value = {
        brand: (v.brand as string) || '',
        model: (v.model as string) || '',
        year: (v.year as number) || new Date().getFullYear(),
        km: (v.km as number) || 0,
        price: (v.price as number) || 0,
        category_id: (v.category_id as string) || '',
        subcategory_id: (v.subcategory_id as string) || '',
        description_es: (v.description_es as string) || '',
        description_en: (v.description_en as string) || '',
        location: (v.location as string) || '',
        status: (v.status as string) || 'published',
      }

      categories.value = (catRes.data || []) as CategoryOption[]
      subcategories.value = (subRes.data || []) as unknown as SubcategoryOption[]
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading vehicle'
    } finally {
      loading.value = false
    }
  }

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

  async function saveVehicle(): Promise<void> {
    if (!form.value.brand || !form.value.model) {
      error.value = t('dashboard.vehicles.requiredFields')
      return
    }

    saving.value = true
    error.value = null

    try {
      const { error: err } = await supabase
        .from('vehicles')
        .update({
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', vehicleId)

      if (err) throw err

      success.value = true
      setTimeout(() => {
        success.value = false
      }, 3000)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error saving vehicle'
    } finally {
      saving.value = false
    }
  }

  function handleFileSelect(event: Event): void {
    const target = event.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
      uploadForm.value.file = target.files[0] ?? null
    }
  }

  async function handleUploadDocument(): Promise<void> {
    if (!uploadForm.value.docType) {
      error.value = t('dashboard.verification.selectDocType')
      return
    }

    if (!uploadForm.value.file) {
      error.value = t('dashboard.verification.selectFileFirst')
      return
    }

    error.value = null
    uploadSuccess.value = false

    try {
      const cloudinaryResult = await uploadToCloudinary(uploadForm.value.file, {
        folder: 'tracciona/verification',
        tags: ['verification', vehicleId, uploadForm.value.docType],
      })

      if (!cloudinaryResult) {
        throw new Error('Failed to upload to Cloudinary')
      }

      const docId = await uploadDocument(
        uploadForm.value.docType as never,
        cloudinaryResult.secure_url,
        userId.value || undefined,
      )

      if (!docId) {
        throw new Error('Failed to save document')
      }

      uploadSuccess.value = true
      uploadForm.value.docType = ''
      uploadForm.value.file = null

      const fileInput = document.querySelector('#verification-file') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      setTimeout(() => {
        uploadSuccess.value = false
      }, 3000)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error uploading document'
    }
  }

  function updateFormField<K extends keyof VehicleFormData>(
    field: K,
    value: VehicleFormData[K],
  ): void {
    form.value[field] = value
  }

  return {
    // State
    form,
    categories,
    subcategories,
    filteredSubcategories,
    loading,
    saving,
    generatingDesc,
    error,
    success,
    favoritesCount,
    maxPhotos,

    // Verification state
    verificationDocs,
    verificationError,
    currentLevel,
    uploadForm,
    uploadSuccess,
    cloudinaryUploading,
    nextLevel,
    missingDocuments,
    progressPercentage,

    // Functions
    init: loadData,
    saveVehicle,
    generateDescription,
    getLevelColor,
    getLevelDefinition,
    handleFileSelect,
    handleUploadDocument,
    updateFormField,
  }
}
