import { localizedField } from '~/composables/useLocalized'
import { formatPrice } from '~/composables/shared/useListingUtils'

// ============================================
// TYPES
// ============================================
export interface VehicleImage {
  url: string
  position: number
}

export interface DealerInfo {
  company_name: Record<string, string> | null
}

export interface VehicleInfo {
  id: string
  brand: string
  model: string
  year: number | null
  slug: string
  price: number | null
  dealer_id: string | null
  verification_level: string | null
  vehicle_images: VehicleImage[]
  dealers: DealerInfo | null
}

export interface VerificationDocument {
  id: string
  vehicle_id: string
  doc_type: string
  file_url: string | null
  status: string | null
  level: number
  data: Record<string, unknown> | null
  generated_at: string | null
  expires_at: string | null
  notes: string | null
  rejection_reason: string | null
  submitted_by: string | null
  verified_by: string | null
  vehicles: VehicleInfo
}

export type StatusFilter = 'all' | 'pending' | 'verified' | 'rejected'

export interface VerificationLevelInfo {
  label: string
  icon: string
  progress: number
  cssClass: string
}

export interface VehicleVerificationEntry {
  vehicle: VehicleInfo
  docs: VerificationDocument[]
  verificationLevel: string
}

// Re-export formatPrice for subcomponents
export { formatPrice }

export function useAdminVerificaciones() {
  const { t } = useI18n()
  const { locale } = useI18n()
  const supabase = useSupabaseClient()

  // ============================================
  // STATE
  // ============================================
  const documents = ref<VerificationDocument[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)
  const search = ref('')
  const statusFilter = ref<StatusFilter>('all')
  const expandedDocId = ref<string | null>(null)
  const rejectionReason = ref('')
  const actionLoading = ref(false)

  // ============================================
  // COMPUTED
  // ============================================
  const filteredDocuments = computed(() => {
    let result = documents.value

    // Filter by status
    if (statusFilter.value !== 'all') {
      const statusMap: Record<string, string> = {
        pending: 'pending',
        verified: 'verified',
        rejected: 'rejected',
      }
      result = result.filter((d) => d.status === statusMap[statusFilter.value])
    }

    // Filter by search
    if (search.value.trim()) {
      const q = search.value.toLowerCase().trim()
      result = result.filter((d) => {
        const brandModel = `${d.vehicles.brand} ${d.vehicles.model}`.toLowerCase()
        const dealerName = d.vehicles.dealers
          ? localizedField(d.vehicles.dealers.company_name, locale.value).toLowerCase()
          : ''
        return brandModel.includes(q) || dealerName.includes(q)
      })
    }

    return result
  })

  const pendingCount = computed(() => documents.value.filter((d) => d.status === 'pending').length)

  const statusCounts = computed(() => ({
    all: documents.value.length,
    pending: documents.value.filter((d) => d.status === 'pending').length,
    verified: documents.value.filter((d) => d.status === 'verified').length,
    rejected: documents.value.filter((d) => d.status === 'rejected').length,
  }))

  // Group documents by vehicle for verification level display
  const vehicleVerificationMap = computed(() => {
    const map = new Map<string, VehicleVerificationEntry>()

    for (const doc of documents.value) {
      const vehicleId = doc.vehicle_id
      if (!map.has(vehicleId)) {
        map.set(vehicleId, {
          vehicle: doc.vehicles,
          docs: [],
          verificationLevel: doc.vehicles.verification_level || 'none',
        })
      }
      map.get(vehicleId)!.docs.push(doc)
    }

    return map
  })

  // ============================================
  // DATA LOADING
  // ============================================
  async function fetchDocuments() {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('verification_documents')
        .select(
          '*, vehicles!inner(id, brand, model, year, slug, price, dealer_id, verification_level, vehicle_images(url, position), dealers(company_name))',
        )
        .order('generated_at', { ascending: false })

      if (fetchError) {
        error.value = fetchError.message
        return
      }

      documents.value = (data as unknown as VerificationDocument[]) || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // ACTIONS
  // ============================================
  function toggleExpand(docId: string) {
    if (expandedDocId.value === docId) {
      expandedDocId.value = null
      rejectionReason.value = ''
    } else {
      expandedDocId.value = docId
      rejectionReason.value = ''
    }
  }

  async function approveDocument(doc: VerificationDocument) {
    actionLoading.value = true
    try {
      const { error: updateError } = await supabase
        .from('verification_documents')
        .update({
          status: 'verified',
          verified_by: (await supabase.auth.getUser()).data.user?.id || null,
        })
        .eq('id', doc.id)

      if (updateError) {
        error.value = updateError.message
        return
      }

      // The DB trigger auto-recalculates verification_level on the vehicle
      // Refresh data to see updated levels
      await fetchDocuments()
      expandedDocId.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      actionLoading.value = false
    }
  }

  async function rejectDocument(doc: VerificationDocument) {
    if (!rejectionReason.value.trim()) {
      return
    }

    actionLoading.value = true
    try {
      const { error: updateError } = await supabase
        .from('verification_documents')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason.value.trim(),
          verified_by: (await supabase.auth.getUser()).data.user?.id || null,
        })
        .eq('id', doc.id)

      if (updateError) {
        error.value = updateError.message
        return
      }

      await fetchDocuments()
      expandedDocId.value = null
      rejectionReason.value = ''
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      actionLoading.value = false
    }
  }

  function clearFilters() {
    statusFilter.value = 'all'
    search.value = ''
  }

  // ============================================
  // HELPERS
  // ============================================
  function getVehicleThumbnail(vehicle: VehicleInfo): string | null {
    if (!vehicle.vehicle_images?.length) return null
    const sorted = [...vehicle.vehicle_images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    return sorted[0]?.url || null
  }

  function getDealerName(doc: VerificationDocument): string {
    if (!doc.vehicles.dealers) return '-'
    return localizedField(doc.vehicles.dealers.company_name, locale.value) || '-'
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  function getDocTypeLabel(docType: string): string {
    const labels: Record<string, string> = {
      ficha_tecnica: t('admin.verificaciones.docTypes.fichaTecnica'),
      foto_km: t('admin.verificaciones.docTypes.fotoKm'),
      fotos_exteriores: t('admin.verificaciones.docTypes.fotosExteriores'),
      placa_fabricante: t('admin.verificaciones.docTypes.placaFabricante'),
      permiso_circulacion: t('admin.verificaciones.docTypes.permisoCirculacion'),
      tarjeta_itv: t('admin.verificaciones.docTypes.tarjetaItv'),
      adr: 'ADR',
      atp: 'ATP',
      exolum: 'EXOLUM',
      estanqueidad: t('admin.verificaciones.docTypes.estanqueidad'),
      dgt_report: t('admin.verificaciones.docTypes.dgtReport'),
      inspection_report: t('admin.verificaciones.docTypes.inspectionReport'),
    }
    return labels[docType] || docType
  }

  function getStatusClass(status: string | null): string {
    if (status === 'verified') return 'status-verified'
    if (status === 'rejected') return 'status-rejected'
    return 'status-pending'
  }

  function getStatusLabel(status: string | null): string {
    if (status === 'verified') return t('admin.verificaciones.status.verified')
    if (status === 'rejected') return t('admin.verificaciones.status.rejected')
    return t('admin.verificaciones.status.pending')
  }

  function getVerificationLevelInfo(level: string | null): VerificationLevelInfo {
    const levels: Record<string, VerificationLevelInfo> = {
      none: {
        label: t('admin.verificaciones.levels.none'),
        icon: '-',
        progress: 0,
        cssClass: 'level-none',
      },
      verified: {
        label: t('admin.verificaciones.levels.verified'),
        icon: '\u2713',
        progress: 20,
        cssClass: 'level-verified',
      },
      extended: {
        label: t('admin.verificaciones.levels.extended'),
        icon: '\u2713\u2713',
        progress: 40,
        cssClass: 'level-extended',
      },
      detailed: {
        label: t('admin.verificaciones.levels.detailed'),
        icon: '\u2713\u2713\u2713',
        progress: 60,
        cssClass: 'level-detailed',
      },
      audited: {
        label: t('admin.verificaciones.levels.audited'),
        icon: '\u2605',
        progress: 80,
        cssClass: 'level-audited',
      },
      certified: {
        label: t('admin.verificaciones.levels.certified'),
        icon: '\uD83D\uDEE1',
        progress: 100,
        cssClass: 'level-certified',
      },
    }
    return levels[level || 'none'] || levels.none!
  }

  function isFileImage(url: string | null): boolean {
    if (!url) return false
    const ext = url.split('.').pop()?.toLowerCase() || ''
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'].includes(ext)
  }

  return {
    // State
    documents,
    loading,
    error,
    search,
    statusFilter,
    expandedDocId,
    rejectionReason,
    actionLoading,
    // Computed
    filteredDocuments,
    pendingCount,
    statusCounts,
    vehicleVerificationMap,
    // Actions
    fetchDocuments,
    toggleExpand,
    approveDocument,
    rejectDocument,
    clearFilters,
    // Helpers
    getVehicleThumbnail,
    getDealerName,
    formatDate,
    getDocTypeLabel,
    getStatusClass,
    getStatusLabel,
    getVerificationLevelInfo,
    isFileImage,
  }
}
