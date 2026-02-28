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
import { defineEventHandler, readBody, createError } from 'h3'
import { safeError } from '~~/server/utils/safeError'
import { callAI } from '~~/server/services/aiProvider'

interface GenerateDescriptionBody {
  brand: string
  model: string
  year?: number
  km?: number
  category?: string
  subcategory?: string
  attributes?: Record<string, unknown>
}

interface GenerateDescriptionResponse {
  description: string
}

export default defineEventHandler(async (event): Promise<GenerateDescriptionResponse> => {
  // 1. Authenticate
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  // 2. Read and validate body
  const body = await readBody<GenerateDescriptionBody>(event)

  if (!body.brand || typeof body.brand !== 'string') {
    throw createError({ statusCode: 400, message: 'brand is required' })
  }

  if (!body.model || typeof body.model !== 'string') {
    throw createError({ statusCode: 400, message: 'model is required' })
  }

  // 3. Build prompt
  const vehicleInfo = [
    `Marca: ${body.brand}`,
    `Modelo: ${body.model}`,
    body.year ? `Ano: ${body.year}` : null,
    body.km ? `Kilometros: ${body.km.toLocaleString('es-ES')}` : null,
    body.category ? `Categoria: ${body.category}` : null,
    body.subcategory ? `Subcategoria: ${body.subcategory}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  let attributesText = ''
  if (body.attributes && Object.keys(body.attributes).length > 0) {
    attributesText =
      '\nAtributos adicionales:\n' +
      Object.entries(body.attributes)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join('\n')
  }

  const prompt = `Genera una descripcion SEO-optimizada en espanol para un vehiculo industrial que se vendera en un marketplace online (Tracciona). La descripcion debe:

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

  // 4. Call AI with failover (Anthropic primary, OpenAI fallback)
  try {
    const response = await callAI(
      { messages: [{ role: 'user', content: prompt }], maxTokens: 500 },
      'realtime',
      'fast',
    )
    return { description: response.text.trim() }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI generation failed'
    throw safeError(500, `Description generation failed: ${message}`)
  }
})
