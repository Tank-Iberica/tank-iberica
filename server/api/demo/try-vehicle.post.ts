/**
 * Demo vehicle analysis — no auth required.
 *
 * Accepts 1-4 images (base64) + basic text (brand, model).
 * Uses callAI to generate a listing preview without saving to DB.
 * Rate limited: 3 attempts per IP per day.
 *
 * POST /api/demo/try-vehicle
 */
import { defineEventHandler, readBody, createError } from 'h3'
import { callAI, type AIContentBlock } from '~/server/services/aiProvider'
import { checkRateLimit, getRateLimitKey, getRetryAfterSeconds } from '~/server/utils/rateLimit'

interface DemoRequestBody {
  images: Array<{ data: string; mediaType: string }>
  brand?: string
  model?: string
}

interface DemoPreview {
  title: string
  description: string
  category: string
  subcategory: string
  brand: string
  model: string
  year: number | null
  estimatedPrice: string | null
  highlights: string[]
}

const RATE_LIMIT = {
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3,
}

export default defineEventHandler(async (event) => {
  // Rate limit by IP
  const ipKey = `demo:${getRateLimitKey(event)}`
  if (!checkRateLimit(ipKey, RATE_LIMIT)) {
    const retryAfter = getRetryAfterSeconds(ipKey, RATE_LIMIT)
    throw createError({
      statusCode: 429,
      statusMessage: `Rate limited. Try again in ${Math.ceil(retryAfter / 3600)} hours.`,
    })
  }

  const body = (await readBody(event)) as DemoRequestBody

  // Validate images
  if (!body.images || !Array.isArray(body.images) || body.images.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'At least 1 image is required' })
  }
  if (body.images.length > 4) {
    throw createError({ statusCode: 400, statusMessage: 'Maximum 4 images allowed' })
  }

  // Validate each image (max 5MB base64)
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024 * 1.37 // ~5MB in base64
  for (const img of body.images) {
    if (!img.data || !img.mediaType) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Each image must have data and mediaType',
      })
    }
    if (img.data.length > MAX_IMAGE_SIZE) {
      throw createError({ statusCode: 400, statusMessage: 'Image exceeds 5MB limit' })
    }
  }

  // Build AI prompt with images
  const contentBlocks: AIContentBlock[] = []

  for (const img of body.images) {
    contentBlocks.push({
      type: 'image',
      source: { type: 'base64', media_type: img.mediaType, data: img.data },
    })
  }

  const brandInfo = body.brand ? `Brand: ${body.brand}` : ''
  const modelInfo = body.model ? `Model: ${body.model}` : ''
  const extraInfo = [brandInfo, modelInfo].filter(Boolean).join(', ')

  contentBlocks.push({
    type: 'text',
    text: `Analyze this industrial/commercial vehicle and generate a listing preview.
${extraInfo ? `Additional info provided by user: ${extraInfo}` : ''}

Respond in JSON format:
{
  "title": "...",
  "description": "Professional listing description in Spanish (2-3 paragraphs)",
  "category": "e.g. camiones, remolques, maquinaria, furgonetas, autobuses",
  "subcategory": "e.g. tractora, frigorífico, grúa, volquete",
  "brand": "...",
  "model": "...",
  "year": null or number,
  "estimatedPrice": "price range as string or null",
  "highlights": ["highlight 1", "highlight 2", "highlight 3"]
}`,
  })

  try {
    const response = await callAI(
      {
        messages: [{ role: 'user', content: contentBlocks }],
        maxTokens: 1024,
        system:
          'You are a professional vehicle listing expert for industrial and commercial vehicles. Analyze images and generate compelling, accurate Spanish-language listings. Always respond with valid JSON only.',
      },
      'background',
      'vision',
    )

    // Parse AI response
    const jsonMatch = response.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('AI did not return valid JSON')
    }

    const preview = JSON.parse(jsonMatch[0]) as DemoPreview

    return {
      success: true,
      preview: {
        title: preview.title || `${body.brand || ''} ${body.model || ''}`.trim(),
        description: preview.description || '',
        category: preview.category || '',
        subcategory: preview.subcategory || '',
        brand: preview.brand || body.brand || '',
        model: preview.model || body.model || '',
        year: preview.year,
        estimatedPrice: preview.estimatedPrice,
        highlights: preview.highlights || [],
        imageCount: body.images.length,
      },
      provider: response.provider,
    }
  } catch (err) {
    // Fallback: return a mock preview so the demo still works
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`[demo] AI analysis failed: ${msg}`)

    return {
      success: true,
      preview: {
        title: `${body.brand || 'Vehículo'} ${body.model || 'Industrial'}`.trim(),
        description:
          'Este vehículo industrial está en buenas condiciones. Nuestro sistema de IA no pudo analizar las imágenes en este momento, pero un profesional revisará tu listado al publicar.',
        category: 'vehicles',
        subcategory: '',
        brand: body.brand || '',
        model: body.model || '',
        year: null,
        estimatedPrice: null,
        highlights: ['Análisis de IA no disponible — se generará al publicar'],
        imageCount: body.images.length,
      },
      provider: 'fallback',
    }
  }
})
