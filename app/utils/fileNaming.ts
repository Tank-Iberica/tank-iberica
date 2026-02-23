/**
 * Utilities for generating SEO-friendly file and folder names
 * Used by Cloudinary uploads (images) and Google Drive (documents)
 */

export interface FileNamingData {
  id: number | string
  brand: string
  year?: number | null
  plate?: string | null
  subcategory?: string | null
  type?: string | null
}

/**
 * Convert text to URL-safe slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Sanitize a string for use in folder/file names (not URLs)
 * Keeps uppercase, replaces spaces with hyphens
 */
function sanitize(text: string): string {
  return text
    .replace(/[<>:"/\\|?*]+/g, '')
    .replace(/\s+/g, '-')
    .trim()
}

// ---------------------------------------------------------------------------
// Cloudinary (SEO-friendly public_id for image URLs)
// ---------------------------------------------------------------------------

/**
 * Generate Cloudinary public_id for vehicle images
 * URL result: res.cloudinary.com/.../tank-iberica/vehicles/cisterna-alimentaria-renault-2024-v42.jpg
 * Note: model excluded per project convention
 */
export function generateVehiclePublicId(vehicle: FileNamingData, imageIndex: number = 1): string {
  const parts: string[] = []
  if (vehicle.subcategory) parts.push(slugify(vehicle.subcategory))
  if (vehicle.type) parts.push(slugify(vehicle.type))
  parts.push(slugify(vehicle.brand))
  if (vehicle.year) parts.push(String(vehicle.year))
  parts.push(`v${vehicle.id}`)
  if (imageIndex > 1) parts.push(String(imageIndex))

  return `tank-iberica/vehicles/${parts.join('-')}`
}

/**
 * Generate Cloudinary public_id for news images
 * URL result: res.cloudinary.com/.../tank-iberica/news/normativa-euro-7.jpg
 */
export function generateNewsPublicId(slug: string): string {
  return `tank-iberica/news/${slugify(slug)}`
}

/**
 * Generate Cloudinary context metadata string
 * Stored in Cloudinary for search/filtering in Media Library
 */
export function generateCloudinaryContext(vehicle: FileNamingData): string {
  const parts: string[] = [`brand=${vehicle.brand}`]
  if (vehicle.year) parts.push(`year=${vehicle.year}`)
  if (vehicle.subcategory) parts.push(`subcategory=${vehicle.subcategory}`)
  if (vehicle.type) parts.push(`type=${vehicle.type}`)
  if (vehicle.plate) parts.push(`plate=${vehicle.plate}`)
  return parts.join('|')
}

/**
 * Generate alt text for vehicle images
 * Format: "Cisterna Alimentaria Renault 2024 - Foto 1"
 */
export function generateVehicleAltText(vehicle: FileNamingData, imageIndex: number = 1): string {
  const parts: string[] = []
  if (vehicle.subcategory) parts.push(vehicle.subcategory)
  if (vehicle.type) parts.push(vehicle.type)
  parts.push(vehicle.brand)
  if (vehicle.year) parts.push(String(vehicle.year))
  return `${parts.join(' ')} - Foto ${imageIndex}`
}

// ---------------------------------------------------------------------------
// Google Drive (folder names + document filenames)
// ---------------------------------------------------------------------------

/**
 * Generate Drive folder name for own vehicles
 * Format: V42_Renault_2024_1234ABC
 */
export function generateVehicleFolderName(vehicle: FileNamingData): string {
  const parts = [`V${vehicle.id}`, sanitize(vehicle.brand)]
  if (vehicle.year) parts.push(String(vehicle.year))
  if (vehicle.plate) parts.push(vehicle.plate.replace(/\s+/g, ''))
  return parts.join('_')
}

/**
 * Generate Drive folder name for intermediation vehicles
 * Format: P3_Iveco_2023_5678DEF
 */
export function generateInterFolderName(vehicle: FileNamingData): string {
  const parts = [`P${vehicle.id}`, sanitize(vehicle.brand)]
  if (vehicle.year) parts.push(String(vehicle.year))
  if (vehicle.plate) parts.push(vehicle.plate.replace(/\s+/g, ''))
  return parts.join('_')
}

/**
 * Generate auto-named document filename for Drive upload
 * Format: ITV_Renault_2024_1234ABC_2025-02-09.pdf
 * Note: model excluded per project convention
 */
export function generateDocFileName(
  docType: string,
  vehicle: FileNamingData,
  date?: string,
  originalExt?: string,
): string {
  const parts = [sanitize(docType), sanitize(vehicle.brand)]
  if (vehicle.year) parts.push(String(vehicle.year))
  if (vehicle.plate) parts.push(vehicle.plate.replace(/\s+/g, ''))
  parts.push(date || new Date().toISOString().split('T')[0])

  return `${parts.join('_')}.${originalExt || 'pdf'}`
}

/**
 * Extract file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}
