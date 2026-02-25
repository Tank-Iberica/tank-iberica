/**
 * Cloudinary Upload Composable
 * Handles unsigned uploads to Cloudinary via their REST API
 * Supports SEO-friendly public_id, contextual metadata, and tags
 */

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  url: string
  width: number
  height: number
  format: string
  bytes: number
}

export interface CloudinaryUploadOptions {
  /** Cloudinary folder path (e.g. 'tracciona/vehicles') */
  folder?: string
  /** Custom public_id for SEO-friendly URLs (without folder prefix) */
  publicId?: string
  /** Pipe-separated context metadata (e.g. 'brand=Renault|year=2024') */
  context?: string
  /** Tags for Cloudinary Media Library organization */
  tags?: string[]
}

export function useCloudinaryUpload() {
  const config = useRuntimeConfig()
  const uploading = ref(false)
  const progress = ref(0)
  const error = ref<string | null>(null)

  const cloudName = config.public.cloudinaryCloudName as string
  const uploadPreset = config.public.cloudinaryUploadPreset as string

  /**
   * Upload a file to Cloudinary using unsigned upload
   *
   * @param file - Image file to upload
   * @param folderOrOptions - Folder string (backward compat) or CloudinaryUploadOptions
   *
   * @example
   * // Simple (backward compatible)
   * await upload(file)
   * await upload(file, 'tracciona/news')
   *
   * // With SEO options
   * await upload(file, {
   *   publicId: 'cisterna-alimentaria-renault-2024-v42',
   *   folder: 'tracciona/vehicles',
   *   context: 'brand=Renault|year=2024|subcategory=Cisterna',
   *   tags: ['cisterna', 'renault', '2024'],
   * })
   */
  async function upload(
    file: File,
    folderOrOptions: string | CloudinaryUploadOptions = 'tracciona/news',
  ): Promise<CloudinaryUploadResult | null> {
    const options: CloudinaryUploadOptions =
      typeof folderOrOptions === 'string' ? { folder: folderOrOptions } : folderOrOptions

    if (!uploadPreset) {
      error.value =
        'Cloudinary upload preset no configurado. Anade CLOUDINARY_UPLOAD_PRESET en .env'
      return null
    }

    if (!file.type.startsWith('image/')) {
      error.value = 'Solo se permiten archivos de imagen'
      return null
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      error.value = 'La imagen no puede superar 10MB'
      return null
    }

    uploading.value = true
    progress.value = 0
    error.value = null

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', uploadPreset)

      if (options.folder) formData.append('folder', options.folder)
      if (options.publicId) formData.append('public_id', options.publicId)
      if (options.context) formData.append('context', options.context)
      if (options.tags?.length) formData.append('tags', options.tags.join(','))

      const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`)

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            progress.value = Math.round((e.loaded / e.total) * 100)
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            const errData = JSON.parse(xhr.responseText)
            reject(new Error(errData?.error?.message || `Upload failed (${xhr.status})`))
          }
        })

        xhr.addEventListener('error', () => reject(new Error('Error de red al subir imagen')))
        xhr.addEventListener('abort', () => reject(new Error('Subida cancelada')))

        xhr.send(formData)
      })

      return result
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error subiendo imagen'
      return null
    } finally {
      uploading.value = false
      progress.value = 0
    }
  }

  return {
    upload,
    uploading: readonly(uploading),
    progress: readonly(progress),
    error: readonly(error),
  }
}
