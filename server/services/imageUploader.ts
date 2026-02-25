/**
 * Image upload service — handles uploads to Cloudinary and CF Images.
 */

interface CloudinaryUploadResponse {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
}

/** Upload an image buffer to Cloudinary (server-side unsigned upload) */
export async function uploadToCloudinary(
  imageBuffer: Buffer,
  filename: string,
  cloudName: string,
  uploadPreset: string,
  folder: string,
): Promise<CloudinaryUploadResponse | null> {
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
    public_id: filename,
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

  return (await response.json()) as CloudinaryUploadResponse
}
