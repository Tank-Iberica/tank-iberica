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

function requireString(errors: string[], val: unknown, field: string, maxLen: number): void {
  if (!val || typeof val !== 'string' || val.trim().length === 0) {
    errors.push(`${field} is required`)
  } else if (val.trim().length > maxLen) {
    errors.push(`${field} must be at most ${maxLen} characters`)
  }
}

function requireNumber(
  errors: string[],
  val: unknown,
  field: string,
  min: number,
  max: number,
): void {
  if (val === undefined || val === null || typeof val !== 'number') {
    errors.push(`${field} is required and must be a number`)
  } else if (val < min || val > max) {
    errors.push(`${field} must be between ${min} and ${max}`)
  }
}

function optionalUUID(errors: string[], val: unknown, field: string): void {
  if (val === undefined || val === null) return
  if (typeof val !== 'string' || !UUID_REGEX.test(val)) {
    errors.push(`${field} must be a valid UUID`)
  }
}

function optionalString(errors: string[], val: unknown, field: string): void {
  if (val === undefined || val === null) return
  if (typeof val !== 'string') {
    errors.push(`${field} must be a string`)
  }
}

function validatePrice(errors: string[], price: unknown): void {
  if (price === undefined || price === null || typeof price !== 'number') {
    errors.push('price is required and must be a number')
  } else if ((price as number) <= 0) {
    errors.push('price must be greater than 0')
  }
}

function validateContactEmail(errors: string[], email: unknown): void {
  if (!email || typeof email !== 'string' || (email as string).trim().length === 0) {
    errors.push('contact_email is required')
  } else if (!EMAIL_REGEX.test((email as string).trim())) {
    errors.push('contact_email must be a valid email address')
  }
}

function validateOptionalEnum(
  errors: string[],
  val: unknown,
  field: string,
  allowed: ReadonlyArray<string>,
): void {
  if (val == null) return
  if (typeof val !== 'string' || !allowed.includes(val as string)) {
    errors.push(`${field} must be one of: ${allowed.join(', ')}`)
  }
}

function validateOptionalObject(errors: string[], val: unknown, field: string): void {
  if (val == null) return
  if (typeof val !== 'object' || Array.isArray(val)) {
    errors.push(`${field} must be an object`)
  }
}

function validateOptionalNonNegativeNumber(errors: string[], val: unknown, field: string): void {
  if (val == null) return
  if (typeof val !== 'number' || (val as number) < 0) {
    errors.push(`${field} must be a number >= 0`)
  }
}

function validateStringArray(errors: string[], val: unknown, field: string): void {
  if (val == null) return
  if (!Array.isArray(val) || !(val as unknown[]).every((p) => typeof p === 'string')) {
    errors.push(`${field} must be an array of strings`)
  }
}

function validateBody(body: AdvertisementBody): string[] {
  const errors: string[] = []
  const currentYear = new Date().getFullYear()

  requireString(errors, body.brand, 'brand', 100)
  requireString(errors, body.model, 'model', 100)
  requireNumber(errors, body.year, 'year', 1950, currentYear + 2)
  requireString(errors, body.location, 'location', 200)
  requireString(errors, body.description, 'description', 5000)
  requireString(errors, body.contact_name, 'contact_name', 200)
  requireString(errors, body.contact_phone, 'contact_phone', 30)

  validatePrice(errors, body.price)
  validateContactEmail(errors, body.contact_email)
  validateOptionalEnum(
    errors,
    body.contact_preference,
    'contact_preference',
    VALID_CONTACT_PREFERENCES,
  )
  optionalString(errors, body.vehicle_type, 'vehicle_type')
  optionalUUID(errors, body.category_id, 'category_id')
  optionalUUID(errors, body.subcategory_id, 'subcategory_id')
  optionalString(errors, body.tech_sheet, 'tech_sheet')
  validateOptionalObject(errors, body.attributes_json, 'attributes_json')
  validateOptionalNonNegativeNumber(errors, body.kilometers, 'kilometers')
  validateStringArray(errors, body.photos, 'photos')

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      attributes_json: (body.attributes_json || null) as any,
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
