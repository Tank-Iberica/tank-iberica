/**
 * A7 — AI editorial generation: generate article draft from topic + context.
 *
 * POST /api/generate-article
 * Body: { topic, type, catalogContext? }
 * Requires: authenticated admin user
 *
 * Returns: { title_es, title_en, meta_description_es, meta_description_en, content_es, content_en }
 */
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { serverSupabaseUser } from '#supabase/server'
import { safeError } from '~~/server/utils/safeError'
import { validateBody } from '~~/server/utils/validateBody'
import { callAI } from '~~/server/services/aiProvider'
import { sanitizeText } from '~~/server/utils/sanitizeInput'
import { logger } from '~~/server/utils/logger'

const ARTICLE_TYPES = ['guide', 'news', 'comparison', 'success-story'] as const

const generateArticleSchema = z.object({
  topic: z.string().min(5).max(400),
  type: z.enum(ARTICLE_TYPES).default('guide'),
  catalogContext: z.string().max(1000).optional(),
})

type ArticleType = (typeof ARTICLE_TYPES)[number]

interface GenerateArticleResponse {
  title_es: string
  title_en: string
  meta_description_es: string
  meta_description_en: string
  content_es: string
  content_en: string
  aiUnavailable?: boolean
}

const TYPE_LABELS: Record<ArticleType, string> = {
  guide: 'guía de compra',
  news: 'noticia del sector',
  comparison: 'comparativa de vehículos',
  'success-story': 'caso de éxito',
}

function buildPrompt(topic: string, type: ArticleType, catalogContext?: string): string {
  const typeLabel = TYPE_LABELS[type]
  const contextBlock = catalogContext ? `\nContexto del catálogo actual: ${catalogContext}\n` : ''

  return `Eres un redactor especializado en vehículos industriales (camiones, maquinaria, semirremolques) para el marketplace B2B "Tracciona" (tracciona.com). Escribes en un tono profesional, claro y orientado a compradores y vendedores de vehículos industriales en España y Europa.
${contextBlock}
Genera un borrador de ${typeLabel} sobre el siguiente tema:
"${topic}"

Responde ÚNICAMENTE con un JSON válido con la siguiente estructura (sin markdown, sin backticks, solo el objeto JSON):
{
  "title_es": "Título en español (50-60 caracteres, atractivo y con keyword)",
  "title_en": "Title in English (50-60 chars, attractive and with keyword)",
  "meta_description_es": "Meta description en español (140-160 caracteres, con llamada a la acción)",
  "meta_description_en": "Meta description in English (140-160 chars, with call to action)",
  "content_es": "Cuerpo del artículo en español (400-600 palabras, en HTML semántico con h2, p, ul/ol si es apropiado. Sin h1 ni doctype.)",
  "content_en": "Article body in English (400-600 words, semantic HTML with h2, p, ul/ol where appropriate. No h1 or doctype.)"
}`
}

export default defineEventHandler(async (event): Promise<GenerateArticleResponse> => {
  // 1. Auth — only authenticated users (admin checked via middleware on page)
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Authentication required')
  }

  // 2. Validate body
  const body = await validateBody(event, generateArticleSchema)
  const topic = sanitizeText(body.topic, { maxLength: 400 })
  const catalogContext = body.catalogContext
    ? sanitizeText(body.catalogContext, { maxLength: 1000 })
    : undefined

  const prompt = buildPrompt(topic, body.type, catalogContext)

  // 3. Call AI
  try {
    const aiResponse = await callAI(
      {
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 1200,
        system:
          'You are a professional content writer for industrial vehicles marketplace. Always respond with valid JSON only.',
      },
      'background',
      'content',
    )

    // 4. Parse JSON response
    let parsed: GenerateArticleResponse
    try {
      // Strip any accidental backtick wrappers
      const clean = aiResponse.text
        .replace(/^```json\s*/i, '')
        .replace(/\s*```$/, '')
        .trim()
      parsed = JSON.parse(clean) as GenerateArticleResponse
    } catch {
      logger.warn('[generate-article] Could not parse AI JSON response', {
        raw: aiResponse.text.slice(0, 200),
      })
      throw safeError(502, 'AI returned invalid JSON')
    }

    // 5. Basic validation
    if (!parsed.title_es || !parsed.content_es) {
      throw safeError(502, 'AI response missing required fields')
    }

    logger.info('[generate-article] Generated article draft', {
      userId: user.id,
      type: body.type,
      latencyMs: aiResponse.latencyMs,
    })

    return {
      title_es: parsed.title_es ?? '',
      title_en: parsed.title_en ?? '',
      meta_description_es: parsed.meta_description_es ?? '',
      meta_description_en: parsed.meta_description_en ?? '',
      content_es: parsed.content_es ?? '',
      content_en: parsed.content_en ?? '',
    }
  } catch (err) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    logger.error('[generate-article] AI call failed', { err })
    return {
      title_es: '',
      title_en: '',
      meta_description_es: '',
      meta_description_en: '',
      content_es: '',
      content_en: '',
      aiUnavailable: true,
    }
  }
})
