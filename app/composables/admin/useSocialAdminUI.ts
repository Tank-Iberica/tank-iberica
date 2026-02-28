import type { SocialPlatform, SocialPostWithVehicle } from '~/composables/useSocialPublisher'

// ─── Types ───────────────────────────────────────────────────
export type StatusFilter = 'all' | 'pending' | 'approved' | 'posted' | 'rejected' | 'failed'

export interface VehicleSearchResult {
  id: string
  brand: string
  model: string
  slug: string
  price: number | null
  location: string | null
  vehicle_images: { url: string }[]
}

// ─── Composable ──────────────────────────────────────────────
export function useSocialAdminUI() {
  const { t } = useI18n()
  const { locale } = useI18n()
  const supabase = useSupabaseClient()

  const {
    posts,
    loading,
    error,
    fetchPosts,
    approvePost,
    rejectPost,
    publishPost,
    updatePostContent,
    createPendingPosts,
  } = useSocialPublisher()

  // ─── State ───────────────────────────────────────────────
  const statusFilter = ref<StatusFilter>('all')
  const selectedPost = ref<SocialPostWithVehicle | null>(null)
  const showModal = ref(false)
  const showGenerateModal = ref(false)
  const rejectionReason = ref('')
  const editContent = ref('')
  const editLocale = ref<'es' | 'en'>('es')
  const actionLoading = ref(false)
  const successMessage = ref<string | null>(null)

  // Vehicle selector for generate
  const vehicleSearch = ref('')
  const vehicleResults = ref<VehicleSearchResult[]>([])
  const selectedVehicle = ref<VehicleSearchResult | null>(null)
  const vehicleSearchLoading = ref(false)

  // ─── Computed ────────────────────────────────────────────
  const filteredPosts = computed(() => {
    if (statusFilter.value === 'all') return posts.value
    return posts.value.filter((p) => p.status === statusFilter.value)
  })

  const statusCounts = computed(() => {
    const all = posts.value
    return {
      all: all.length,
      pending: all.filter((p) => p.status === 'pending').length,
      approved: all.filter((p) => p.status === 'approved').length,
      posted: all.filter((p) => p.status === 'posted').length,
      rejected: all.filter((p) => p.status === 'rejected').length,
      failed: all.filter((p) => p.status === 'failed').length,
    }
  })

  // ─── Data Loading ────────────────────────────────────────
  async function refreshPosts() {
    const filters: { status?: string } = {}
    if (statusFilter.value !== 'all') {
      filters.status = statusFilter.value
    }
    await fetchPosts(filters)
  }

  // ─── Actions ─────────────────────────────────────────────
  function openPostModal(post: SocialPostWithVehicle) {
    selectedPost.value = post
    editLocale.value = (locale.value as 'es' | 'en') || 'es'
    editContent.value = post.content?.[editLocale.value] || post.content?.es || ''
    rejectionReason.value = ''
    showModal.value = true
  }

  function closeModal() {
    showModal.value = false
    selectedPost.value = null
    rejectionReason.value = ''
    editContent.value = ''
  }

  function showSuccess(msg: string) {
    successMessage.value = msg
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  }

  async function handleApprove(postId: string) {
    actionLoading.value = true
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return
    const ok = await approvePost(postId, user.id)
    actionLoading.value = false
    if (ok) {
      showSuccess(t('admin.social.postApproved'))
      closeModal()
      await refreshPosts()
    }
  }

  async function handleReject(postId: string) {
    if (!rejectionReason.value.trim()) return
    actionLoading.value = true
    const ok = await rejectPost(postId, rejectionReason.value.trim())
    actionLoading.value = false
    if (ok) {
      showSuccess(t('admin.social.postRejected'))
      closeModal()
      await refreshPosts()
    }
  }

  async function handlePublish(postId: string) {
    actionLoading.value = true
    const ok = await publishPost(postId)
    actionLoading.value = false
    if (ok) {
      showSuccess(t('admin.social.postPublished'))
      closeModal()
      await refreshPosts()
    }
  }

  async function handleSaveContent() {
    if (!selectedPost.value) return
    actionLoading.value = true
    const newContent = { ...selectedPost.value.content, [editLocale.value]: editContent.value }
    const ok = await updatePostContent(selectedPost.value.id, newContent)
    actionLoading.value = false
    if (ok) {
      showSuccess(t('admin.social.contentSaved'))
      await refreshPosts()
    }
  }

  function switchEditLocale(loc: 'es' | 'en') {
    editLocale.value = loc
    if (selectedPost.value) {
      editContent.value = selectedPost.value.content?.[loc] || ''
    }
  }

  // ─── Generate Posts ──────────────────────────────────────
  function openGenerateModal() {
    showGenerateModal.value = true
    vehicleSearch.value = ''
    vehicleResults.value = []
    selectedVehicle.value = null
  }

  function closeGenerateModal() {
    showGenerateModal.value = false
    selectedVehicle.value = null
  }

  async function searchVehicles() {
    if (vehicleSearch.value.trim().length < 2) return
    vehicleSearchLoading.value = true
    try {
      const { data } = await supabase
        .from('vehicles')
        .select('id, brand, model, slug, price, location, vehicle_images(url)')
        .or(`brand.ilike.%${vehicleSearch.value}%,model.ilike.%${vehicleSearch.value}%`)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(10)

      vehicleResults.value = (data as unknown as VehicleSearchResult[]) || []
    } finally {
      vehicleSearchLoading.value = false
    }
  }

  async function handleGeneratePosts() {
    if (!selectedVehicle.value) return
    actionLoading.value = true
    const v = selectedVehicle.value
    const ids = await createPendingPosts(v.id, {
      title: `${v.brand} ${v.model}`,
      price_cents: (v.price || 0) * 100,
      location: v.location || '',
      slug: v.slug,
      images: v.vehicle_images,
    })
    actionLoading.value = false
    if (ids.length > 0) {
      showSuccess(t('admin.social.postsGenerated', { count: ids.length }))
      closeGenerateModal()
      await refreshPosts()
    }
  }

  // ─── Helpers ─────────────────────────────────────────────
  function getVehicleTitle(post: SocialPostWithVehicle): string {
    if (!post.vehicles) return '-'
    return `${post.vehicles.brand} ${post.vehicles.model}`
  }

  function truncateContent(post: SocialPostWithVehicle, maxLen: number = 100): string {
    const content = post.content?.[locale.value] || post.content?.es || ''
    if (content.length <= maxLen) return content
    return content.slice(0, maxLen) + '...'
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function getPlatformLabel(platform: SocialPlatform): string {
    const labels: Record<SocialPlatform, string> = {
      linkedin: 'LinkedIn',
      facebook: 'Facebook',
      instagram: 'Instagram',
      x: 'X',
    }
    return labels[platform] || platform
  }

  function getPlatformClass(platform: SocialPlatform): string {
    return `platform-${platform}`
  }

  function getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      pending: 'status-pending',
      approved: 'status-approved',
      posted: 'status-posted',
      rejected: 'status-rejected',
      failed: 'status-failed',
      draft: 'status-pending',
    }
    return classes[status] || 'status-pending'
  }

  function getStatusLabel(status: string): string {
    const key = `admin.social.status.${status}`
    return t(key)
  }

  return {
    // State
    statusFilter,
    selectedPost,
    showModal,
    showGenerateModal,
    rejectionReason,
    editContent,
    editLocale,
    actionLoading,
    successMessage,
    vehicleSearch,
    vehicleResults,
    selectedVehicle,
    vehicleSearchLoading,
    // From useSocialPublisher
    posts,
    loading,
    error,
    // Computed
    filteredPosts,
    statusCounts,
    // Data loading
    fetchPosts,
    refreshPosts,
    // Actions
    openPostModal,
    closeModal,
    handleApprove,
    handleReject,
    handlePublish,
    handleSaveContent,
    switchEditLocale,
    // Generate
    openGenerateModal,
    closeGenerateModal,
    searchVehicles,
    handleGeneratePosts,
    // Helpers
    getVehicleTitle,
    truncateContent,
    formatDate,
    getPlatformLabel,
    getPlatformClass,
    getStatusClass,
    getStatusLabel,
  }
}
