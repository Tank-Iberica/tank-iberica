/**
 * Vehicle creation service — creates vehicles from extracted/parsed data.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ImageUploadResult } from './imageUploader'

export interface VehicleCreateData {
  brand: string
  model: string
  year?: number | null
  slug: string
  categoryId?: string | null
  dealerId?: string | null
  descriptionEs?: string
  descriptionEn?: string
  plate?: string | null
  aiGenerated?: boolean
  attributesJson?: Record<string, unknown>
  status?: 'draft' | 'active' | 'paused'
}

export interface VehicleCreateResult {
  id: string
  slug: string
}

export interface ClaudeVehicleAnalysis {
  brand: string
  model: string
  year: number | null
  category_name_es: string
  subcategory_name_es: string | null
  license_plate: string | null
  title_es: string
  title_en: string
  description_es: string
  description_en: string
  attributes_json: Record<string, unknown>
  suggested_slug: string
  condition: string | null
  image_alt_texts: string[]
}

/** Sanitize a slug: lowercase, ASCII only, hyphens for spaces */
export function sanitizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

/** Create a vehicle in Supabase from structured data */
export async function createVehicle(
  supabase: SupabaseClient,
  data: VehicleCreateData,
): Promise<VehicleCreateResult> {
  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .insert({
      brand: data.brand,
      model: data.model,
      year: data.year ?? null,
      slug: data.slug,
      category: 'venta' as const,
      category_id: data.categoryId ?? null,
      status: (data.status || 'draft') as 'draft' | 'active' | 'paused',
      dealer_id: data.dealerId ?? null,
      description_es: data.descriptionEs || '',
      description_en: data.descriptionEn || '',
      plate: data.plate ?? null,
      ai_generated: data.aiGenerated ?? false,
      attributes_json: data.attributesJson || {},
    })
    .select('id, slug')
    .single()

  if (error || !vehicle) {
    throw new Error(`Failed to create vehicle: ${error?.message}`)
  }

  return vehicle as unknown as VehicleCreateResult
}

/**
 * Create a vehicle from AI analysis result + uploaded images.
 * Matches category from DB, inserts vehicle + vehicle_images.
 */
export async function createVehicleFromAI(
  supabase: SupabaseClient,
  analysis: ClaudeVehicleAnalysis,
  dealerId: string | null,
  images: Array<{ result: ImageUploadResult; altText: string; position: number }>,
  submissionId: string,
): Promise<VehicleCreateResult> {
  // Match category from database
  const { data: categoriesRaw } = await supabase.from('categories').select('id, name_es, slug')

  const categories = (categoriesRaw ?? []) as unknown as Array<{
    id: string
    name_es: string
    slug: string
  }>
  const matchedCategory = categories.find(
    (c) =>
      c.name_es.toLowerCase() === analysis.category_name_es.toLowerCase() ||
      c.slug.toLowerCase() === analysis.category_name_es.toLowerCase(),
  )

  const vehicleSlug = sanitizeSlug(
    analysis.suggested_slug || `${analysis.brand}-${analysis.model}-${Date.now()}`,
  )

  const vehicleResult = await createVehicle(supabase, {
    brand: analysis.brand,
    model: analysis.model,
    year: analysis.year,
    slug: vehicleSlug,
    categoryId: matchedCategory?.id ?? null,
    dealerId,
    descriptionEs: analysis.description_es,
    descriptionEn: analysis.description_en,
    plate: analysis.license_plate,
    aiGenerated: true,
    attributesJson: {
      ...analysis.attributes_json,
      source: 'whatsapp',
      submission_id: submissionId,
      condition: analysis.condition,
      title_es: analysis.title_es,
      title_en: analysis.title_en,
      subcategory_name_es: analysis.subcategory_name_es,
    },
  })

  // Insert vehicle images
  if (images.length > 0) {
    const imageInserts = images.map((img) => ({
      vehicle_id: vehicleResult.id,
      url: img.result.secureUrl,
      cloudinary_public_id: img.result.publicId,
      alt_text: img.altText,
      position: img.position,
    }))

    const { error: imageInsertError } = await supabase.from('vehicle_images').insert(imageInserts)

    if (imageInsertError) {
      console.error('[vehicleCreator] Failed to insert vehicle images:', imageInsertError.message)
    }
  }

  return vehicleResult
}
