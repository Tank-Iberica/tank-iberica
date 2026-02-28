/**
 * Admin Producto Detail — Images sub-composable
 * Handles: image upload, delete, reorder, set as portada.
 * Extracted from useAdminProductoDetail.ts (Auditoría #7 Iter. 15)
 */
import {
  generateVehiclePublicId,
  generateCloudinaryContext,
  generateVehicleAltText,
  type FileNamingData,
} from '~/utils/fileNaming'

interface ImageEntry {
  id: string
  url: string
  position: number
}

export function useAdminProductoDetailImages(params: {
  vehicleId: ComputedRef<string>
  fileNamingData: ComputedRef<FileNamingData>
  images: Ref<ImageEntry[]>
  uploadToCloudinary: (
    file: File,
    options: { publicId?: string; context?: string; tags?: string[] },
  ) => Promise<{ public_id: string; secure_url: string } | null>
  addImage: (
    vehicleId: string,
    data: { cloudinary_public_id: string; url: string; alt_text: string },
  ) => Promise<boolean>
  deleteImage: (id: string) => Promise<boolean>
  reorderImages: (updates: { id: string; position: number }[]) => Promise<boolean>
  loadVehicle: () => Promise<void>
}) {
  const { t } = useI18n()
  const toast = useToast()
  const {
    vehicleId,
    fileNamingData,
    images,
    uploadToCloudinary,
    addImage,
    deleteImage,
    reorderImages,
    loadVehicle,
  } = params

  const uploadingImage = ref(false)

  async function handleImageUpload(e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files?.length) return
    uploadingImage.value = true

    const files = Array.from(input.files)
    const currentCount = images.value.length
    const availableSlots = 10 - currentCount

    if (availableSlots <= 0) {
      toast.warning(t('toast.maxImagesReached'))
      input.value = ''
      uploadingImage.value = false
      return
    }

    const filesToUpload = files.slice(0, availableSlots)

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i]!
      const imageIndex = currentCount + i + 1
      const naming = fileNamingData.value
      const publicId = generateVehiclePublicId(naming, imageIndex)
      const context = generateCloudinaryContext(naming)
      const altText = generateVehicleAltText(naming, imageIndex)

      const result = await uploadToCloudinary(file, {
        publicId,
        context,
        tags: [
          naming.brand?.toLowerCase(),
          naming.subcategory?.toLowerCase(),
          naming.type?.toLowerCase(),
        ].filter(Boolean) as string[],
      })

      if (result) {
        const ok = await addImage(vehicleId.value, {
          cloudinary_public_id: result.public_id,
          url: result.secure_url,
          alt_text: altText,
        })
        if (ok) {
          images.value.push({
            id: crypto.randomUUID(),
            url: result.secure_url,
            position: currentCount + i,
          })
        }
      }
    }

    uploadingImage.value = false
    input.value = ''
    await loadVehicle()
  }

  async function handleDeleteImage(id: string) {
    if (!confirm('\u00BFEliminar imagen?')) return
    const ok = await deleteImage(id)
    if (ok) images.value = images.value.filter((i) => i.id !== id)
  }

  async function setAsPortada(index: number) {
    if (index === 0) return
    const arr = [...images.value]
    const img = arr.splice(index, 1)[0]!
    arr.unshift(img)
    const updates = arr.map((img, i) => ({ id: img.id, position: i }))
    const ok = await reorderImages(updates)
    if (ok) images.value = arr.map((img, i) => ({ ...img, position: i }))
  }

  async function moveImage(index: number, dir: 'up' | 'down') {
    const newIdx = dir === 'up' ? index - 1 : index + 1
    if (newIdx < 0 || newIdx >= images.value.length) return
    const arr = [...images.value]
    const tmp = arr[index]!
    arr[index] = arr[newIdx]!
    arr[newIdx] = tmp
    const updates = arr.map((img, i) => ({ id: img.id, position: i }))
    const ok = await reorderImages(updates)
    if (ok) images.value = arr.map((img, i) => ({ ...img, position: i }))
  }

  return {
    uploadingImage,
    handleImageUpload,
    handleDeleteImage,
    setAsPortada,
    moveImage,
  }
}
