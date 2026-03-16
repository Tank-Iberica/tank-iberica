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

interface VehicleParams {
  brand: string
  model: string
  year?: number
  km?: number
  category?: string
  currentPrice?: number
}

async function fetchMarketContext(
  brand: string,
  year?: number,
  category?: string,
): Promise<{ marketContext: string; marketSamples: number }> {
  const config = useRuntimeConfig()
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !supabaseKey) return { marketContext: '', marketSamples: 0 }

  try {
    const apiHeaders = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    const params = new URLSearchParams({
      status: 'eq.published',
      brand: `ilike.${brand}`,
      select: 'price,year',
      limit: '30',
      order: 'created_at.desc',
    })
    if (category) params.set('category_id', `eq.${category}`)
    if (year) {
      params.set('year', `gte.${year - 3}`)
      params.append('year', `lte.${year + 3}`)
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/vehicles?${params}`, { headers: apiHeaders })
    const comparables = (await res.json()) as Array<{ price: number | null; year: number | null }>
    const prices = comparables.map((c) => c.price).filter((p): p is number => p != null)

    if (!prices.length) return { marketContext: '', marketSamples: 0 }

    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    return {
      marketContext: `\n\nDatos de mercado (${prices.length} vehículos similares en plataforma):\n- Precio medio: ${avg.toLocaleString('es-ES')} EUR\n- Rango: ${min.toLocaleString('es-ES')} – ${max.toLocaleString('es-ES')} EUR`,
      marketSamples: prices.length,
    }
  } catch (err) {
    logger.warn('[price-recommendation] Failed to fetch market data', { error: String(err) })
    return { marketContext: '', marketSamples: 0 }
  }
}

function buildPricePrompt(v: VehicleParams, marketContext: string): string {
  const vehicleDesc = [
    `Marca: ${v.brand}`,
    `Modelo: ${v.model}`,
    v.year ? `Año: ${v.year}` : null,
    v.km == null ? null : `Kilómetros: ${v.km.toLocaleString('es-ES')}`,
    v.category ? `Categoría: ${v.category}` : null,
    v.currentPrice == null
      ? null
      : `Precio actual del anunciante: ${v.currentPrice.toLocaleString('es-ES')} EUR`,
  ]
    .filter(Boolean)
    .join('\n')

  return `Eres un experto en valoración de vehículos industriales. Analiza los datos del vehículo y sugiere un precio óptimo de venta para el mercado español.

Datos del vehículo:
${vehicleDesc}${marketContext}

Responde ÚNICAMENTE con un objeto JSON con este esquema exacto, sin texto adicional:
{
  "suggested_price": <número entero en EUR>,
  "confidence": "low" | "medium" | "high",
  "reasoning": "<1-2 frases en español explicando el razonamiento>",
  "price_range": { "min": <número>, "max": <número> }
}`
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

  const { marketContext, marketSamples } = await fetchMarketContext(brand, year, category)
  const prompt = buildPricePrompt({ brand, model, year, km, category, currentPrice }, marketContext)

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
