/**
 * GET /api/market/price-recommendation
 *
 * Returns an AI-generated price recommendation for a vehicle.
 * Uses comparable vehicles from the platform as market context.
 * No credits charged — it's an advisory endpoint (not a gated action).
 *
 * Query params: brand, model, year?, km?, category?, currentPrice?
 * Returns: { suggested_price, confidence, reasoning, price_range, marketSamples }
 */
import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { safeError } from '~~/server/utils/safeError'
import { callAI } from '~~/server/services/aiProvider'
import { logger } from '~~/server/utils/logger'

interface PriceRecommendation {
  suggested_price: number | null
  confidence: 'low' | 'medium' | 'high'
  reasoning: string
  price_range: { min: number; max: number } | null
  marketSamples: number
  aiUnavailable?: boolean
}

export default defineEventHandler(async (event): Promise<PriceRecommendation> => {
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Authentication required')

  const q = getQuery(event)
  const brand = typeof q.brand === 'string' ? q.brand.trim() : ''
  const model = typeof q.model === 'string' ? q.model.trim() : ''
  const year = q.year ? Number(q.year) : undefined
  const km = q.km !== undefined && q.km !== '' ? Number(q.km) : undefined
  const category = typeof q.category === 'string' ? q.category.trim() : undefined
  const currentPrice =
    q.currentPrice !== undefined && q.currentPrice !== '' ? Number(q.currentPrice) : undefined

  if (!brand || !model) throw safeError(400, 'brand and model are required')

  // --- Fetch comparable vehicles from market for context ---------------------
  const config = useRuntimeConfig()
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  let marketContext = ''
  let marketSamples = 0

  if (supabaseUrl && supabaseKey) {
    try {
      const apiHeaders = {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      }
      const params = new URLSearchParams({
        status: 'eq.published',
        brand: `ilike.${brand}`,
        select: 'price,year',
        limit: '30',
        order: 'created_at.desc',
      })
      if (category) params.set('category_id', `eq.${category}`)
      // Narrow to ±3 years if year provided
      if (year) {
        params.set('year', `gte.${year - 3}`)
        params.append('year', `lte.${year + 3}`)
      }

      const res = await fetch(`${supabaseUrl}/rest/v1/vehicles?${params}`, { headers: apiHeaders })
      const comparables = (await res.json()) as Array<{ price: number | null; year: number | null }>
      const prices = comparables.map((c) => c.price).filter((p): p is number => p != null)
      marketSamples = prices.length

      if (prices.length > 0) {
        const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
        const min = Math.min(...prices)
        const max = Math.max(...prices)
        marketContext = `\n\nDatos de mercado (${prices.length} vehículos similares en plataforma):\n- Precio medio: ${avg.toLocaleString('es-ES')} EUR\n- Rango: ${min.toLocaleString('es-ES')} – ${max.toLocaleString('es-ES')} EUR`
      }
    } catch (err) {
      logger.warn('[price-recommendation] Failed to fetch market data', { error: String(err) })
    }
  }

  // --- Build AI prompt -------------------------------------------------------
  const vehicleDesc = [
    `Marca: ${brand}`,
    `Modelo: ${model}`,
    year ? `Año: ${year}` : null,
    km == null ? null : `Kilómetros: ${km.toLocaleString('es-ES')}`,
    category ? `Categoría: ${category}` : null,
    currentPrice == null
      ? null
      : `Precio actual del anunciante: ${currentPrice.toLocaleString('es-ES')} EUR`,
  ]
    .filter(Boolean)
    .join('\n')

  const prompt = `Eres un experto en valoración de vehículos industriales. Analiza los datos del vehículo y sugiere un precio óptimo de venta para el mercado español.

Datos del vehículo:
${vehicleDesc}${marketContext}

Responde ÚNICAMENTE con un objeto JSON con este esquema exacto, sin texto adicional:
{
  "suggested_price": <número entero en EUR>,
  "confidence": "low" | "medium" | "high",
  "reasoning": "<1-2 frases en español explicando el razonamiento>",
  "price_range": { "min": <número>, "max": <número> }
}`

  try {
    const response = await callAI(
      { messages: [{ role: 'user', content: prompt }], maxTokens: 300 },
      'realtime',
      'fast',
    )
    const parsed = JSON.parse(response.text.trim()) as {
      suggested_price: number
      confidence: 'low' | 'medium' | 'high'
      reasoning: string
      price_range: { min: number; max: number }
    }
    return { ...parsed, marketSamples }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    logger.warn(`[price-recommendation] AI or parse error: ${message}`)
    return {
      suggested_price: null,
      confidence: 'low',
      reasoning: 'No se pudo calcular una recomendación en este momento.',
      price_range: null,
      marketSamples,
      aiUnavailable: true,
    }
  }
})
