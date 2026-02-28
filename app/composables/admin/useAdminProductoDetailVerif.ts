/**
 * Admin Producto Detail — Verification sub-composable
 * Handles: verification document state, init, and upload.
 * Extracted from useAdminProductoDetail.ts (Auditoría #7 Iter. 15)
 */
import {
  useVehicleVerification,
  type VerificationDocType,
  type VerificationDocument,
  type VerificationLevel,
} from '~/composables/useVehicleVerification'

export function useAdminProductoDetailVerif(params: {
  vehicleId: ComputedRef<string>
  uploadToCloudinary: (
    file: File,
    options: { publicId?: string; tags?: string[] },
  ) => Promise<{ public_id: string; secure_url: string } | null>
}) {
  const { vehicleId, uploadToCloudinary } = params

  const verifDocTypes: VerificationDocType[] = [
    'ficha_tecnica',
    'foto_km',
    'fotos_exteriores',
    'placa_fabricante',
    'permiso_circulacion',
    'tarjeta_itv',
    'adr',
    'atp',
    'exolum',
    'estanqueidad',
  ]
  const verifDocType = ref<VerificationDocType>('ficha_tecnica')
  const verifDocs = ref<VerificationDocument[]>([])
  const verifLoading = ref(false)
  const verifError = ref<string | null>(null)
  const verifCurrentLevel = ref<VerificationLevel>('none')
  const verifLevelBadge = computed(() => {
    const { VERIFICATION_LEVELS } = useVehicleVerification(vehicleId.value)
    const def = VERIFICATION_LEVELS.find((l) => l.level === verifCurrentLevel.value)
    return def?.badge || ''
  })

  let verifComposable: ReturnType<typeof useVehicleVerification> | null = null

  async function initVerification() {
    verifComposable = useVehicleVerification(vehicleId.value)
    verifLoading.value = true
    await verifComposable.fetchDocuments()
    verifDocs.value = verifComposable.documents.value as VerificationDocument[]
    verifCurrentLevel.value = verifComposable.currentLevel.value
    verifLoading.value = false
    verifError.value = verifComposable.error.value
  }

  async function handleVerifUpload(e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files?.length || !verifComposable) return
    verifLoading.value = true

    const file = input.files[0]!
    const result = await uploadToCloudinary(file, {
      publicId: `verif/${vehicleId.value}/${verifDocType.value}_${Date.now()}`,
      tags: ['verification', verifDocType.value],
    })

    if (result) {
      await verifComposable.uploadDocument(verifDocType.value, result.secure_url)
      verifDocs.value = verifComposable.documents.value as VerificationDocument[]
      verifCurrentLevel.value = verifComposable.currentLevel.value
      verifError.value = verifComposable.error.value
    }

    verifLoading.value = false
    input.value = ''
  }

  return {
    verifDocTypes,
    verifDocType,
    verifDocs,
    verifLoading,
    verifError,
    verifCurrentLevel,
    verifLevelBadge,
    initVerification,
    handleVerifUpload,
  }
}
