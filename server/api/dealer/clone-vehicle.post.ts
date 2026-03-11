import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { z } from 'zod'
import { safeError } from '../../utils/safeError'

const bodySchema = z.object({
  vehicleId: z.string().uuid(),
})

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Authentication required')
  }

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw safeError(400, 'Invalid request body')
  }

  const supabase = serverSupabaseServiceRole(event)

  // Verify dealer ownership
  const { data: dealer } = await supabase
    .from('dealers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!dealer) {
    throw safeError(403, 'Dealer profile not found')
  }

  // Get the source vehicle (must belong to this dealer)
  const { data: source, error: fetchErr } = await supabase
    .from('vehicles')
    .select(
      'brand, model, year, km, price, rental_price, category_id, subcategory_id, description_es, description_en, location, location_country, location_province, location_region, attributes_json, featured, is_online, vertical',
    )
    .eq('id', parsed.data.vehicleId)
    .eq('dealer_id', dealer.id)
    .single()

  if (fetchErr || !source) {
    throw safeError(404, 'Vehicle not found or not owned by this dealer')
  }

  // Generate a unique slug for the clone
  const baseSlug = `${source.brand}-${source.model}-${source.year || ''}`
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036F]/g, '')
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/(^-|-$)/g, '')

  const timestamp = Date.now().toString(36)
  const slug = `${baseSlug}-copia-${timestamp}`

  const { data: clone, error: insertErr } = await supabase
    .from('vehicles')
    .insert({
      dealer_id: dealer.id,
      brand: source.brand,
      model: source.model,
      year: source.year,
      km: source.km,
      price: source.price,
      rental_price: source.rental_price,
      category_id: source.category_id,
      subcategory_id: source.subcategory_id,
      description_es: source.description_es,
      description_en: source.description_en,
      location: source.location,
      location_country: source.location_country,
      location_province: source.location_province,
      location_region: source.location_region,
      attributes_json: source.attributes_json,
      featured: false,
      is_online: false,
      status: 'draft',
      vertical: source.vertical,
      slug,
      views: 0,
    } as never)
    .select('id, slug')
    .single()

  if (insertErr || !clone) {
    throw safeError(500, 'Failed to clone vehicle')
  }

  return { id: clone.id, slug: clone.slug }
})
