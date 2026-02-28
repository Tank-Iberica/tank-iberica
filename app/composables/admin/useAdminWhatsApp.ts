export interface DealerInfo {
  company_name: Record<string, string> | null
  phone: string | null
  whatsapp: string | null
}

export interface WhatsAppSubmission {
  id: string
  dealer_id: string | null
  sender_phone: string | null
  sender_name: string | null
  message_text: string | null
  image_urls: string[] | null
  extracted_data: Record<string, unknown> | null
  vehicle_id: string | null
  status: 'received' | 'processing' | 'processed' | 'published' | 'failed'
  error_message: string | null
  created_at: string
  updated_at: string | null
  dealers: DealerInfo | null
}

export type StatusFilter = 'all' | 'received' | 'processing' | 'processed' | 'published' | 'failed'

const PAGE_SIZE = 20

export function useAdminWhatsApp() {
  const { t } = useI18n()
  const supabase = useSupabaseClient()

  // ============================================
  // STATE
  // ============================================
  const submissions = ref<WhatsAppSubmission[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)
  const statusFilter = ref<StatusFilter>('all')
  const search = ref('')
  const expandedId = ref<string | null>(null)
  const actionLoading = ref(false)
  const successMessage = ref<string | null>(null)
  const page = ref(0)
  const hasMore = ref(true)

  // Delete confirmation
  const showDeleteConfirm = ref(false)
  const deleteTargetId = ref<string | null>(null)

  // ============================================
  // COMPUTED
  // ============================================
  const filteredSubmissions = computed(() => {
    let result = submissions.value

    if (statusFilter.value !== 'all') {
      result = result.filter((s) => s.status === statusFilter.value)
    }

    if (search.value.trim()) {
      const q = search.value.toLowerCase().trim()
      result = result.filter((s) => {
        const dealerName = s.sender_name?.toLowerCase() || ''
        const dealerPhone = s.sender_phone?.toLowerCase() || ''
        const companyName = s.dealers?.company_name
          ? Object.values(s.dealers.company_name).join(' ').toLowerCase()
          : ''
        return dealerName.includes(q) || dealerPhone.includes(q) || companyName.includes(q)
      })
    }

    return result
  })

  const statusCounts = computed(() => {
    const all = submissions.value
    return {
      all: all.length,
      received: all.filter((s) => s.status === 'received').length,
      processing: all.filter((s) => s.status === 'processing').length,
      processed: all.filter((s) => s.status === 'processed').length,
      published: all.filter((s) => s.status === 'published').length,
      failed: all.filter((s) => s.status === 'failed').length,
    }
  })

  const pendingCount = computed(() => statusCounts.value.received + statusCounts.value.processing)

  // ============================================
  // FILTERS
  // ============================================
  function clearFilters() {
    statusFilter.value = 'all'
    search.value = ''
  }

  // ============================================
  // DATA LOADING
  // ============================================
  async function fetchSubmissions(reset = true) {
    if (reset) {
      page.value = 0
      submissions.value = []
      hasMore.value = true
    }

    loading.value = true
    error.value = null

    try {
      const from = page.value * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data, error: fetchError } = await supabase
        .from('whatsapp_submissions')
        .select('*, dealers(company_name, phone, whatsapp)')
        .order('created_at', { ascending: false })
        .range(from, to)

      if (fetchError) {
        error.value = fetchError.message
        return
      }

      const newItems = (data as unknown as WhatsAppSubmission[]) || []

      if (reset) {
        submissions.value = newItems
      } else {
        submissions.value = [...submissions.value, ...newItems]
      }

      hasMore.value = newItems.length === PAGE_SIZE
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
    }
  }

  async function loadMore() {
    page.value++
    await fetchSubmissions(false)
  }

  // ============================================
  // ACTIONS
  // ============================================
  function toggleExpand(id: string) {
    expandedId.value = expandedId.value === id ? null : id
  }

  function showSuccess(msg: string) {
    successMessage.value = msg
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  }

  async function retryProcessing(submissionId: string) {
    actionLoading.value = true
    try {
      const response = await $fetch('/api/whatsapp/process', {
        method: 'POST',
        body: { submissionId },
      })

      if (response) {
        showSuccess(t('admin.whatsapp.retrySuccess'))
        await fetchSubmissions()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : t('admin.whatsapp.retryError')
    } finally {
      actionLoading.value = false
    }
  }

  async function publishVehicle(submission: WhatsAppSubmission) {
    if (!submission.vehicle_id) return

    actionLoading.value = true
    try {
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({ status: 'published' })
        .eq('id', submission.vehicle_id)

      if (updateError) {
        error.value = updateError.message
        return
      }

      // Update submission status to published
      const { error: subError } = await supabase
        .from('whatsapp_submissions')
        .update({ status: 'published' })
        .eq('id', submission.id)

      if (subError) {
        error.value = subError.message
        return
      }

      showSuccess(t('admin.whatsapp.publishSuccess'))
      await fetchSubmissions()
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      actionLoading.value = false
    }
  }

  function confirmDelete(id: string) {
    deleteTargetId.value = id
    showDeleteConfirm.value = true
  }

  function cancelDelete() {
    showDeleteConfirm.value = false
    deleteTargetId.value = null
  }

  async function executeDelete() {
    if (!deleteTargetId.value) return

    actionLoading.value = true
    try {
      const { error: deleteError } = await supabase
        .from('whatsapp_submissions')
        .delete()
        .eq('id', deleteTargetId.value)

      if (deleteError) {
        error.value = deleteError.message
        return
      }

      showSuccess(t('admin.whatsapp.deleteSuccess'))
      cancelDelete()
      expandedId.value = null
      await fetchSubmissions()
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      actionLoading.value = false
    }
  }

  // ============================================
  // HELPERS
  // ============================================
  function getDealerName(sub: WhatsAppSubmission): string {
    if (sub.sender_name) return sub.sender_name
    if (sub.dealers?.company_name) {
      const names = Object.values(sub.dealers.company_name)
      return names[0] || '-'
    }
    return '-'
  }

  function getDealerPhone(sub: WhatsAppSubmission): string {
    return sub.sender_phone || sub.dealers?.phone || sub.dealers?.whatsapp || '-'
  }

  function getTextPreview(sub: WhatsAppSubmission, maxLen = 100): string {
    const text = sub.message_text || ''
    if (text.length <= maxLen) return text
    return text.slice(0, maxLen) + '...'
  }

  function getImageCount(sub: WhatsAppSubmission): number {
    return sub.image_urls?.length || 0
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

  function getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      received: 'status-received',
      processing: 'status-processing',
      processed: 'status-processed',
      published: 'status-published',
      failed: 'status-failed',
    }
    return classes[status] || 'status-received'
  }

  function getStatusLabel(status: string): string {
    return t(`admin.whatsapp.status.${status}`)
  }

  // ============================================
  // LIFECYCLE
  // ============================================
  onMounted(() => {
    fetchSubmissions()
  })

  return {
    // State
    submissions,
    loading,
    error,
    statusFilter,
    search,
    expandedId,
    actionLoading,
    successMessage,
    hasMore,
    showDeleteConfirm,
    deleteTargetId,

    // Computed
    filteredSubmissions,
    statusCounts,
    pendingCount,

    // Filters
    clearFilters,

    // Data loading
    fetchSubmissions,
    loadMore,

    // Actions
    toggleExpand,
    retryProcessing,
    publishVehicle,
    confirmDelete,
    cancelDelete,
    executeDelete,

    // Helpers
    getDealerName,
    getDealerPhone,
    getTextPreview,
    getImageCount,
    formatDate,
    getStatusClass,
    getStatusLabel,
  }
}
