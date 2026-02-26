import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { getRequestIP } from 'h3'

const EMAIL_REGEX = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const VALID_CONTACT_PREFERENCES = ['email', 'phone', 'whatsapp'] as const

interface AdvertisementBody {
  brand: string
  model: string
  year: number
  price: number
  location: string
  description: string
  contact_name: string
  contact_email: string
  contact_phone: string
  contact_preference?: string
  vehicle_type?: string
  category_id?: string
  subcategory_id?: string
  attributes_json?: Record<string, unknown>
  kilometers?: number
  photos?: string[]
  tech_sheet?: string
  turnstileToken?: string
}

function validateBody(body: AdvertisementBody): string[] {
  const errors: string[] = []
  const currentYear = new Date().getFullYear()

  // brand
  if (!body.brand || typeof body.brand !== 'string' || body.brand.trim().length === 0) {
    errors.push('brand is required')
  } else if (body.brand.trim().length > 100) {
    errors.push('brand must be at most 100 characters')
  }

  // model
  if (!body.model || typeof body.model !== 'string' || body.model.trim().length === 0) {
    errors.push('model is required')
  } else if (body.model.trim().length > 100) {
    errors.push('model must be at most 100 characters')
  }

  // year
  if (body.year === undefined || body.year === null || typeof body.year !== 'number') {
    errors.push('year is required and must be a number')
  } else if (body.year < 1950 || body.year > currentYear + 2) {
    errors.push(`year must be between 1950 and ${currentYear + 2}`)
  }

  // price
  if (body.price === undefined || body.price === null || typeof body.price !== 'number') {
    errors.push('price is required and must be a number')
  } else if (body.price <= 0) {
    errors.push('price must be greater than 0')
  }

  // location
  if (!body.location || typeof body.location !== 'string' || body.location.trim().length === 0) {
    errors.push('location is required')
  } else if (body.location.trim().length > 200) {
    errors.push('location must be at most 200 characters')
  }

  // description
  if (
    !body.description ||
    typeof body.description !== 'string' ||
    body.description.trim().length === 0
  ) {
    errors.push('description is required')
  } else if (body.description.trim().length > 5000) {
    errors.push('description must be at most 5000 characters')
  }

  // contact_name
  if (
    !body.contact_name ||
    typeof body.contact_name !== 'string' ||
    body.contact_name.trim().length === 0
  ) {
    errors.push('contact_name is required')
  } else if (body.contact_name.trim().length > 200) {
    errors.push('contact_name must be at most 200 characters')
  }

  // contact_email
  if (
    !body.contact_email ||
    typeof body.contact_email !== 'string' ||
    body.contact_email.trim().length === 0
  ) {
    errors.push('contact_email is required')
  } else if (!EMAIL_REGEX.test(body.contact_email.trim())) {
    errors.push('contact_email must be a valid email address')
  }

  // contact_phone
  if (
    !body.contact_phone ||
    typeof body.contact_phone !== 'string' ||
    body.contact_phone.trim().length === 0
  ) {
    errors.push('contact_phone is required')
  } else if (body.contact_phone.trim().length > 30) {
    errors.push('contact_phone must be at most 30 characters')
  }

  // contact_preference (optional)
  if (body.contact_preference !== undefined && body.contact_preference !== null) {
    if (
      typeof body.contact_preference !== 'string' ||
      !VALID_CONTACT_PREFERENCES.includes(
        body.contact_preference as (typeof VALID_CONTACT_PREFERENCES)[number],
      )
    ) {
      errors.push('contact_preference must be one of: email, phone, whatsapp')
    }
  }

  // vehicle_type (optional)
  if (body.vehicle_type !== undefined && body.vehicle_type !== null) {
    if (typeof body.vehicle_type !== 'string') {
      errors.push('vehicle_type must be a string')
    }
  }

  // category_id (optional, UUID)
  if (body.category_id !== undefined && body.category_id !== null) {
    if (typeof body.category_id !== 'string' || !UUID_REGEX.test(body.category_id)) {
      errors.push('category_id must be a valid UUID')
    }
  }

  // subcategory_id (optional, UUID)
  if (body.subcategory_id !== undefined && body.subcategory_id !== null) {
    if (typeof body.subcategory_id !== 'string' || !UUID_REGEX.test(body.subcategory_id)) {
      errors.push('subcategory_id must be a valid UUID')
    }
  }

  // attributes_json (optional, object)
  if (body.attributes_json !== undefined && body.attributes_json !== null) {
    if (typeof body.attributes_json !== 'object' || Array.isArray(body.attributes_json)) {
      errors.push('attributes_json must be an object')
    }
  }

  // kilometers (optional, >= 0)
  if (body.kilometers !== undefined && body.kilometers !== null) {
    if (typeof body.kilometers !== 'number' || body.kilometers < 0) {
      errors.push('kilometers must be a number >= 0')
    }
  }

  // photos (optional, string array)
  if (body.photos !== undefined && body.photos !== null) {
    if (!Array.isArray(body.photos) || !body.photos.every((p: unknown) => typeof p === 'string')) {
      errors.push('photos must be an array of strings')
    }
  }

  // tech_sheet (optional, string)
  if (body.tech_sheet !== undefined && body.tech_sheet !== null) {
    if (typeof body.tech_sheet !== 'string') {
      errors.push('tech_sheet must be a string')
    }
  }

  return errors
}

export default defineEventHandler(async (event) => {
  // Authenticate user
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  // Read body
  const body = await readBody<AdvertisementBody>(event)

  // Verify Turnstile CAPTCHA
  const turnstileToken = body.turnstileToken
  if (turnstileToken) {
    const ip = getRequestIP(event, { xForwardedFor: true }) || undefined
    const turnstileValid = await verifyTurnstile(turnstileToken, ip)
    if (!turnstileValid) {
      throw createError({ statusCode: 403, message: 'CAPTCHA verification failed' })
    }
  }

  // Validate body
  const errors = validateBody(body)

  if (errors.length > 0) {
    throw createError({
      statusCode: 400,
      message: `Validation failed: ${errors.join('; ')}`,
    })
  }

  // Insert into advertisements table using service role (bypasses RLS)
  const supabase = serverSupabaseServiceRole(event)

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
      attributes_json: body.attributes_json || null,
      kilometers: body.kilometers ?? null,
      photos: body.photos || null,
      tech_sheet: body.tech_sheet || null,
    })
    .select('id')
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      message: 'An error occurred while processing your request',
    })
  }

  return { success: true, id: data.id }
})
