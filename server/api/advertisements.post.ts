import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { getRequestIP, getHeaders } from 'h3'
import { z } from 'zod'
import { safeError } from '../utils/safeError'
import { validateBody } from '../utils/validateBody'
import { getIdempotencyKey, checkIdempotency, storeIdempotencyResponse } from '../utils/idempotency'

const advertisementSchema = z.object({
  brand: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  year: z
    .number()
    .int()
    .min(1950)
    .max(new Date().getFullYear() + 2),
  price: z.number().positive(),
  location: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  contact_name: z.string().min(1).max(200),
  contact_email: z.string().email(),
  contact_phone: z.string().min(1).max(30),
  contact_preference: z.enum(['email', 'phone', 'whatsapp']).optional(),
  vehicle_type: z.string().optional(),
  category_id: z.string().uuid().optional().nullable(),
  subcategory_id: z.string().uuid().optional().nullable(),
  attributes_json: z.record(z.unknown()).optional().nullable(),
  kilometers: z.number().nonnegative().optional().nullable(),
  photos: z.array(z.string()).optional().nullable(),
  tech_sheet: z.string().optional().nullable(),
  turnstileToken: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  // Authenticate user
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Unauthorized')
  }

  // Read and validate body
  const body = await validateBody(event, advertisementSchema)

  // Verify Turnstile CAPTCHA
  if (body.turnstileToken) {
    const ip = getRequestIP(event, { xForwardedFor: true }) || undefined
    const turnstileValid = await verifyTurnstile(body.turnstileToken, ip)
    if (!turnstileValid) {
      throw safeError(403, 'CAPTCHA verification failed')
    }
  }

  // Insert into advertisements table using service role (bypasses RLS)
  const supabase = serverSupabaseServiceRole(event)

  const idempotencyKey = getIdempotencyKey(getHeaders(event))
  if (idempotencyKey) {
    const cached = await checkIdempotency(supabase, idempotencyKey)
    if (cached) return cached
  }

  const { data, error } = await supabase
    .from('advertisements')
    .insert({
      user_id: user.id,
      status: 'pending',
      brand: body.brand.trim(),
      model: body.model.trim(),
      year: body.year,
      price: body.price,
      location: body.location.trim(),
      description: body.description.trim(),
      contact_name: body.contact_name.trim(),
      contact_email: body.contact_email.trim(),
      contact_phone: body.contact_phone.trim(),
      contact_preference: body.contact_preference || 'email',
      vehicle_type: body.vehicle_type || null,
      category_id: body.category_id || null,
      subcategory_id: body.subcategory_id || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      attributes_json: (body.attributes_json || null) as any,
      kilometers: body.kilometers ?? null,
      photos: body.photos || null,
      tech_sheet: body.tech_sheet || null,
    })
    .select('id')
    .single()

  if (error) {
    throw safeError(500, 'An error occurred while processing your request')
  }

  const response = { success: true, id: data.id }
  if (idempotencyKey) {
    await storeIdempotencyResponse(supabase, idempotencyKey, 'POST /api/advertisements', response)
  }
  return response
})
