/**
 * Image upload service — handles uploads to Cloudinary and CF Images.
 */

export interface ImageUploadResult {
  publicId: string
  secureUrl: string
  width: number
  height: number
  format: string
}

interface CloudinaryUploadResponse {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
}

export interface ImageUploadOptions {
  filename: string
  folder?: string
  cloudName?: string
  uploadPreset?: string
}

/** Upload an image buffer to Cloudinary (server-side unsigned upload) */
export async function uploadToCloudinary(
  imageBuffer: Buffer,
  opts: ImageUploadOptions,
): Promise<ImageUploadResult | null> {
  const cloudName = opts.cloudName || (useRuntimeConfig().public.cloudinaryCloudName as string)
  const uploadPreset =
    opts.uploadPreset || (useRuntimeConfig().public.cloudinaryUploadPreset as string)
  const folder = opts.folder || 'tracciona/vehicles'

  if (!cloudName || !uploadPreset) {
    console.warn('[imageUploader] Cloudinary not configured, skipping upload')
    return null
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
  const base64 = imageBuffer.toString('base64')
  const dataUri = `data:image/jpeg;base64,${base64}`

  const formBody = new URLSearchParams({
    file: dataUri,
    upload_preset: uploadPreset,
    folder,
    public_id: opts.filename,
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody.toString(),
  })

  if (!response.ok) {
    await response.text()
    console.error(
      `[imageUploader] Cloudinary upload failed: ${response.status} ${response.statusText}`,
    )
    return null
  }

  const data = (await response.json()) as CloudinaryUploadResponse
  return {
    publicId: data.public_id,
    secureUrl: data.secure_url,
    width: data.width,
    height: data.height,
    format: data.format,
  }
}

/**
 * Upload an image buffer using the configured pipeline.
 * Reads IMAGE_PIPELINE_MODE from env: 'cloudinary' (default) or 'cf-images'.
 */
export async function uploadImage(
  imageBuffer: Buffer,
  opts: ImageUploadOptions,
): Promise<ImageUploadResult | null> {
  const mode = process.env.IMAGE_PIPELINE_MODE || 'cloudinary'

  if (mode === 'cf-images') {
    // CF Images not yet implemented — fall back to Cloudinary
    console.warn('[imageUploader] CF Images not yet implemented, using Cloudinary')
  }

  return uploadToCloudinary(imageBuffer, opts)
}
