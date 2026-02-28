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

export function useDashboardNuevoVehiculo() {
  const { t } = useI18n()
  const supabase = useSupabaseClient()
  const router = useRouter()
  const { userId } = useAuth()
  const { dealerProfile, loadDealer } = useDealerDashboard()
  const { planLimits, canPublish, maxPhotos, fetchSubscription } = useSubscriptionPlan(
    userId.value || undefined,
  )

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

  return {
    categories,
    subcategories,
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
  }
}
