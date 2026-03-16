/**
 * Generate SEO-optimized Vehicle Description using Claude Haiku
 *
 * POST /api/generate-description
 * Body: { brand, model, year, km, category, subcategory, attributes }
 *
 * Returns: { description: string }
 * Requires auth. Rate limiting should be enforced by the caller based on plan.
 */
import { serverSupabaseUser } from '#supabase/server'
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { safeError } from '~~/server/utils/safeError'
import { validateBody } from '~~/server/utils/validateBody'
import { callAI } from '~~/server/services/aiProvider'
import { sanitizeText } from '~~/server/utils/sanitizeInput'
import { logger } from '~~/server/utils/logger'
import { deductUserCredits } from '~~/server/utils/creditService'

const generateDescriptionSchema = z.object({
  brand: z.string().min(1).max(128),
  model: z.string().min(1).max(128),
  year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 2)
    .optional(),
  km: z.number().nonnegative().optional(),
  category: z.string().max(128).optional(),
  subcategory: z.string().max(128).optional(),
  attributes: z.record(z.unknown()).optional(),
})

const DESCRIPTION_CREDIT_COST = 1

interface GenerateDescriptionResponse {
  description: string
  creditsRemaining?: number
  /** True when all AI providers were unavailable — caller should let user fill manually */
  aiUnavailable?: boolean
}

export default defineEventHandler(async (event): Promise<GenerateDescriptionResponse> => {
  // 1. Authenticate
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Authentication required')
  }

  // 2. Deduct 1 credit for AI generation
  const creditResult = await deductUserCredits(
    user.id,
    DESCRIPTION_CREDIT_COST,
    'Generación IA descripción vehículo',
  )
  if (!creditResult.success) {
    if (creditResult.reason === 'insufficient') {
      throw safeError(402, 'Insufficient credits')
    }
    throw safeError(500, 'Credit service unavailable')
  }

  // 3. Read and validate body
  const body = await validateBody(event, generateDescriptionSchema)

  // 3.5 Sanitize string fields before interpolating into AI prompt
  const brand = sanitizeText(body.brand, { maxLength: 128 })
  const model = sanitizeText(body.model, { maxLength: 128 })
  const category = body.category ? sanitizeText(body.category, { maxLength: 128 }) : undefined
  const subcategory = body.subcategory
    ? sanitizeText(body.subcategory, { maxLength: 128 })
    : undefined

  // 4. Build prompt
  const vehicleInfo = [
    `Marca: ${brand}`,
    `Modelo: ${model}`,
    body.year ? `Ano: ${body.year}` : null,
    body.km ? `Kilometros: ${body.km.toLocaleString('es-ES')}` : null,
    category ? `Categoria: ${category}` : null,
    subcategory ? `Subcategoria: ${subcategory}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  let attributesText = ''
  if (body.attributes && Object.keys(body.attributes).length) {
    attributesText =
      '\nAtributos adicionales:\n' +
      Object.entries(body.attributes)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join('\n')
  }

  const prompt = `Genera una descripcion SEO-optimizada en espanol para un vehiculo industrial que se vendera en un marketplace online (${getSiteName()}). La descripcion debe:

- Tener aproximadamente 150 palabras
- Incluir palabras clave relevantes para SEO (vehiculo industrial, marca, tipo)
- Ser profesional y persuasiva
- Destacar los puntos fuertes tipicos de este vehiculo
- Incluir un llamado a la accion sutil al final
- NO usar emojis
- NO inventar datos que no se proporcionan
- Usar un tono profesional pero accesible

Datos del vehiculo:
${vehicleInfo}${attributesText}

Responde SOLO con la descripcion, sin titulos ni encabezados.`

  // 5. Call AI with failover (Anthropic primary, OpenAI fallback)
  try {
    const response = await callAI(
      { messages: [{ role: 'user', content: prompt }], maxTokens: 500 },
      'realtime',
      'fast',
    )
    return { description: response.text.trim(), creditsRemaining: creditResult.newBalance }
  } catch (err: unknown) {
    // Graceful fallback: if all AI providers are down (circuit open, timeout, no keys),
    // return an empty description so the user can still publish the vehicle manually.
    const message = err instanceof Error ? err.message : String(err)
    logger.warn(
      `[generate-description] AI unavailable (${message}) — returning empty for manual input`,
    )
    return { description: '', aiUnavailable: true, creditsRemaining: creditResult.newBalance }
  }
})
