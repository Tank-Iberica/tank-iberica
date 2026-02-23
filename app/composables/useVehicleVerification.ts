/**
 * Vehicle Verification Composable
 *
 * Manages verification documents and levels for vehicles.
 * Verification levels (from Anexo G):
 *   - none:      No verification
 *   - verified:  Ficha tecnica + foto km + fotos exteriores match (✓)
 *   - extended:  + Placa fabricante + permiso circulacion + tarjeta ITV (✓✓)
 *   - detailed:  + Sector-specific docs: ADR, ATP, Exolum, estanqueidad (✓✓✓)
 *   - audited:   + DGT official report (★)
 *   - certified: + Physical inspection by mechanic (🛡)
 */

export type VerificationLevel =
  | 'none'
  | 'verified'
  | 'extended'
  | 'detailed'
  | 'audited'
  | 'certified'

export type VerificationDocType =
  | 'ficha_tecnica'
  | 'foto_km'
  | 'fotos_exteriores'
  | 'placa_fabricante'
  | 'permiso_circulacion'
  | 'tarjeta_itv'
  | 'adr'
  | 'atp'
  | 'exolum'
  | 'estanqueidad'
  | 'dgt_report'
  | 'inspection_report'

export type VerificationDocStatus = 'pending' | 'verified' | 'rejected'

export interface VerificationDocument {
  id: string
  vehicle_id: string
  doc_type: VerificationDocType
  file_url: string | null
  data: Record<string, unknown> | null
  verified_by: string | null
  status: VerificationDocStatus
  level: number
  generated_at: string | null
  expires_at: string | null
  price_cents: number | null
  submitted_by: string | null
  rejection_reason: string | null
  notes: string | null
}

export interface VerificationLevelDefinition {
  level: VerificationLevel
  badge: string
  labelKey: string
  requiredDocs: VerificationDocType[]
}

/**
 * Ordered verification level definitions.
 * Each level requires its own docs PLUS all docs from previous levels
 * (except 'audited' and 'certified' which are standalone additions).
 */
export const VERIFICATION_LEVELS: VerificationLevelDefinition[] = [
  {
    level: 'none',
    badge: '',
    labelKey: 'verification.level.none',
    requiredDocs: [],
  },
  {
    level: 'verified',
    badge: '✓',
    labelKey: 'verification.level.verified',
    requiredDocs: ['ficha_tecnica', 'foto_km', 'fotos_exteriores'],
  },
  {
    level: 'extended',
    badge: '✓✓',
    labelKey: 'verification.level.extended',
    requiredDocs: [
      'ficha_tecnica',
      'foto_km',
      'fotos_exteriores',
      'placa_fabricante',
      'permiso_circulacion',
      'tarjeta_itv',
    ],
  },
  {
    level: 'detailed',
    badge: '✓✓✓',
    labelKey: 'verification.level.detailed',
    requiredDocs: [
      'ficha_tecnica',
      'foto_km',
      'fotos_exteriores',
      'placa_fabricante',
      'permiso_circulacion',
      'tarjeta_itv',
      // At least one sector-specific doc is needed; all four are listed
      // so getMissingDocs can show which are available
      'adr',
      'atp',
      'exolum',
      'estanqueidad',
    ],
  },
  {
    level: 'audited',
    badge: '★',
    labelKey: 'verification.level.audited',
    requiredDocs: ['dgt_report'],
  },
  {
    level: 'certified',
    badge: '🛡',
    labelKey: 'verification.level.certified',
    requiredDocs: ['inspection_report'],
  },
]

/** Numeric ordering for level comparison. Higher = more verified. */
export const LEVEL_ORDER: Record<VerificationLevel, number> = {
  none: 0,
  verified: 1,
  extended: 2,
  detailed: 3,
  audited: 4,
  certified: 5,
}

/** Sector-specific doc types for the 'detailed' level. */
const SECTOR_SPECIFIC_DOCS: VerificationDocType[] = ['adr', 'atp', 'exolum', 'estanqueidad']

/**
 * Returns the required doc types for a given target level.
 * For 'detailed', only one sector-specific doc is required (any of the four).
 * For 'audited' and 'certified', the DGT report or inspection report is needed
 * in addition to all previous-level docs being implicitly expected.
 */
export function getRequiredDocsForLevel(targetLevel: VerificationLevel): VerificationDocType[] {
  const definition = VERIFICATION_LEVELS.find((l) => l.level === targetLevel)
  if (!definition) return []
  return [...definition.requiredDocs]
}

export function useVehicleVerification(vehicleId: string) {
  const supabase = useSupabaseClient()

  const documents = ref<VerificationDocument[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Current verification level, derived from the vehicle record.
   * Falls back to calculating from approved documents if not set.
   */
  const currentLevel = computed<VerificationLevel>(() => {
    return calculateLevelFromDocuments(documents.value)
  })

  /**
   * Calculate verification level from a set of documents (client-side mirror
   * of the DB function `calculate_verification_level`).
   */
  function calculateLevelFromDocuments(docs: VerificationDocument[]): VerificationLevel {
    const approvedTypes = new Set(
      docs.filter((d) => d.status === 'verified').map((d) => d.doc_type),
    )

    if (approvedTypes.size === 0) return 'none'

    const has = (type: VerificationDocType): boolean => approvedTypes.has(type)

    // Check from highest to lowest (mirrors DB function logic)
    if (has('inspection_report')) return 'certified'
    if (has('dgt_report')) return 'audited'

    const hasBasic = has('ficha_tecnica') && has('foto_km') && has('fotos_exteriores')
    const hasExtended =
      hasBasic && has('placa_fabricante') && has('permiso_circulacion') && has('tarjeta_itv')
    const hasSectorSpecific = SECTOR_SPECIFIC_DOCS.some((doc) => approvedTypes.has(doc))

    if (hasExtended && hasSectorSpecific) return 'detailed'
    if (hasExtended) return 'extended'
    if (hasBasic) return 'verified'

    return 'none'
  }

  /**
   * Fetch all verification documents for the vehicle, ordered by creation date.
   */
  async function fetchDocuments(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('verification_documents')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('generated_at', { ascending: false })

      if (err) throw err

      documents.value = (data as unknown as VerificationDocument[]) || []
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value =
        supabaseError?.message ||
        (err instanceof Error ? err.message : 'Error fetching verification documents')
      documents.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Upload/submit a new verification document with status='pending'.
   */
  async function uploadDocument(
    docType: VerificationDocType,
    fileUrl: string,
    submittedBy?: string,
  ): Promise<string | null> {
    loading.value = true
    error.value = null

    try {
      const insertData: Record<string, unknown> = {
        vehicle_id: vehicleId,
        doc_type: docType,
        file_url: fileUrl,
        status: 'pending',
        generated_at: new Date().toISOString(),
      }

      if (submittedBy) {
        insertData.submitted_by = submittedBy
      }

      const { data, error: err } = await supabase
        .from('verification_documents')
        .insert(insertData as never)
        .select('id')
        .single()

      if (err) throw err

      // Refresh the document list to reflect the new addition
      await fetchDocuments()

      return (data as { id: string } | null)?.id || null
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value =
        supabaseError?.message ||
        (err instanceof Error ? err.message : 'Error uploading verification document')
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Approve a verification document (admin action).
   * Sets status to 'verified' and records who verified it.
   * The DB trigger will automatically recalculate the vehicle's verification_level.
   */
  async function approveDocument(docId: string, adminUserId: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const { error: err } = await supabase
        .from('verification_documents')
        .update({
          status: 'verified',
          verified_by: adminUserId,
          data: { verified_at: new Date().toISOString() },
        } as never)
        .eq('id', docId)

      if (err) throw err

      // Refresh documents to get updated status and recalculated level
      await fetchDocuments()

      return true
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value =
        supabaseError?.message || (err instanceof Error ? err.message : 'Error approving document')
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Reject a verification document (admin action).
   * Sets status to 'rejected' and records the reason.
   * The DB trigger will automatically recalculate the vehicle's verification_level.
   */
  async function rejectDocument(
    docId: string,
    adminUserId: string,
    reason: string,
  ): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const { error: err } = await supabase
        .from('verification_documents')
        .update({
          status: 'rejected',
          verified_by: adminUserId,
          rejection_reason: reason,
        } as never)
        .eq('id', docId)

      if (err) throw err

      // Refresh documents to get updated status and recalculated level
      await fetchDocuments()

      return true
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value =
        supabaseError?.message || (err instanceof Error ? err.message : 'Error rejecting document')
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Returns doc types that are missing (not approved) for the target level.
   * For 'detailed', at least one sector-specific doc is required;
   * returns all sector-specific types if none are approved.
   */
  function getMissingDocs(targetLevel: VerificationLevel): VerificationDocType[] {
    const required = getRequiredDocsForLevel(targetLevel)
    const approvedTypes = new Set(
      documents.value.filter((d) => d.status === 'verified').map((d) => d.doc_type),
    )

    if (targetLevel === 'detailed') {
      // For detailed level, separate sector-specific from regular docs
      const regularDocs = required.filter((doc) => !SECTOR_SPECIFIC_DOCS.includes(doc))
      const missingRegular = regularDocs.filter((doc) => !approvedTypes.has(doc))

      // Check if at least one sector-specific doc is approved
      const hasSectorDoc = SECTOR_SPECIFIC_DOCS.some((doc) => approvedTypes.has(doc))

      if (hasSectorDoc) {
        return missingRegular
      }

      // None approved: return all sector-specific docs as options + missing regular
      return [...missingRegular, ...SECTOR_SPECIFIC_DOCS.filter((doc) => !approvedTypes.has(doc))]
    }

    return required.filter((doc) => !approvedTypes.has(doc))
  }

  /**
   * Get the level definition for a given level string.
   */
  function getLevelDefinition(level: VerificationLevel): VerificationLevelDefinition | undefined {
    return VERIFICATION_LEVELS.find((l) => l.level === level)
  }

  /**
   * Check if one level is higher than another.
   */
  function isLevelHigherThan(levelA: VerificationLevel, levelB: VerificationLevel): boolean {
    return LEVEL_ORDER[levelA] > LEVEL_ORDER[levelB]
  }

  /**
   * Get documents filtered by status.
   */
  const pendingDocuments = computed(() => documents.value.filter((d) => d.status === 'pending'))

  const approvedDocuments = computed(() => documents.value.filter((d) => d.status === 'verified'))

  const rejectedDocuments = computed(() => documents.value.filter((d) => d.status === 'rejected'))

  return {
    // State
    documents: readonly(documents),
    loading: readonly(loading),
    error: readonly(error),
    currentLevel,
    pendingDocuments,
    approvedDocuments,
    rejectedDocuments,

    // Actions
    fetchDocuments,
    uploadDocument,
    approveDocument,
    rejectDocument,

    // Helpers
    getRequiredDocsForLevel,
    getMissingDocs,
    getLevelDefinition,
    isLevelHigherThan,
    calculateLevelFromDocuments,

    // Constants (re-exported for convenience)
    VERIFICATION_LEVELS,
    LEVEL_ORDER,
  }
}
