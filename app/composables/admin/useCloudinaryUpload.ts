/**
 * Cloudinary Upload Composable
 * Handles unsigned uploads to Cloudinary via their REST API
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

export function useCloudinaryUpload() {
  const config = useRuntimeConfig()
  const uploading = ref(false)
  const progress = ref(0)
  const error = ref<string | null>(null)

  const cloudName = config.public.cloudinaryCloudName as string
  const uploadPreset = config.public.cloudinaryUploadPreset as string

  /**
   * Upload a file to Cloudinary using unsigned upload
   * Requires CLOUDINARY_UPLOAD_PRESET env variable to be set
   */
  async function upload(file: File, folder = 'tank-iberica/news'): Promise<CloudinaryUploadResult | null> {
    if (!uploadPreset) {
      error.value = 'Cloudinary upload preset no configurado. Anade CLOUDINARY_UPLOAD_PRESET en .env'
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
      formData.append('folder', folder)

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
          }
          else {
            const errData = JSON.parse(xhr.responseText)
            reject(new Error(errData?.error?.message || `Upload failed (${xhr.status})`))
          }
        })

        xhr.addEventListener('error', () => reject(new Error('Error de red al subir imagen')))
        xhr.addEventListener('abort', () => reject(new Error('Subida cancelada')))

        xhr.send(formData)
      })

      return result
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error subiendo imagen'
      return null
    }
    finally {
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
