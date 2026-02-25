/**
 * Vehicle creation service — creates vehicles from extracted/parsed data.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

interface VehicleCreateData {
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

interface VehicleCreateResult {
  id: string
  slug: string
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
