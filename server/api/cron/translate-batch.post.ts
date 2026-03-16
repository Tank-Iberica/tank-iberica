/**
 * Cron endpoint: Batch translate pending content.
 *
 * Finds vehicles and articles with pending_translations=true,
 * translates their text fields into all active target locales,
 * stores results in content_translations, and clears the flag.
 *
 * Protected by x-cron-secret header.
 * POST /api/cron/translate-batch
 *
 * Query params:
 *   limit — max entities per type (default 10, max 50)
 */
import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { callAI } from '../../services/aiProvider'
import { logger } from '../../utils/logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TranslationResult {
  entityType: string
  entityId: string
  locale: string
  field: string
  ok: boolean
}

interface TranslateResponse {
  translated: number
  failed: number
  vehicles: number
  articles: number
  details: TranslationResult[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ENGINE_SOURCE_MAP: Record<string, string> = {
  claude_haiku: 'auto_haiku',
  gpt4omini: 'auto_gpt4omini',
  deepl: 'auto_deepl',
}

const LOCALE_NAMES: Record<string, string> = {
  es: 'Spanish',
  en: 'English',
  fr: 'French',
  de: 'German',
  nl: 'Dutch',
  pl: 'Polish',
  it: 'Italian',
}

function buildTranslationPrompt(
  text: string,
  sourceLocale: string,
  targetLocale: string,
  field: string,
): string {
  const sourceName = LOCALE_NAMES[sourceLocale] || sourceLocale
  const targetName = LOCALE_NAMES[targetLocale] || targetLocale

  return [
    `Translate the following ${field} from ${sourceName} to ${targetName}.`,
    'Preserve all HTML tags, markdown formatting, and technical terms.',
    'Do NOT add explanations — output ONLY the translated text.',
    '',
    text,
  ].join('\n')
}

async function translateText(
  text: string,
  sourceLocale: string,
  targetLocale: string,
  field: string,
): Promise<string> {
  const prompt = buildTranslationPrompt(text, sourceLocale, targetLocale, field)

  const response = await callAI(
    {
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 4096,
      system:
        'You are a professional translator for an industrial vehicles marketplace. Translate accurately, preserving tone and technical vocabulary.',
    },
    'background',
    'content',
  )

  return response.text.trim()
}

// ---------------------------------------------------------------------------
// Extracted translators (reduce cognitive complexity of handler)
// ---------------------------------------------------------------------------

interface TranslateFieldParams {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
  entityType: string
  entityId: string
  field: string
  text: string
  targetLocale: string
  defaultLocale: string
  sourceTag: string
}

async function translateField(params: TranslateFieldParams): Promise<TranslationResult> {
  const { supabase, entityType, entityId, field, text, targetLocale, defaultLocale, sourceTag } =
    params
  try {
    const translated = await translateText(text, defaultLocale, targetLocale, field)

    await supabase.from('content_translations').upsert(
      {
        entity_type: entityType,
        entity_id: entityId,
        field,
        locale: targetLocale,
        value: translated,
        source: sourceTag,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'entity_type,entity_id,field,locale' },
    )

    return { entityType, entityId, locale: targetLocale, field, ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error(`[translate-batch] ${entityType} ${entityId} → ${targetLocale}/${field}: ${msg}`)
    return { entityType, entityId, locale: targetLocale, field, ok: false }
  }
}

async function translatePendingVehicles(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  batchLimit: number,
  targetLocales: string[],
  defaultLocale: string,
  sourceTag: string,
): Promise<{ count: number; results: TranslationResult[] }> {
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, description_es')
    .eq('pending_translations', true)
    .limit(batchLimit)

  const results: TranslationResult[] = []
  let count = 0

  if (!vehicles?.length) return { count, results }

  for (const vehicle of vehicles) {
    const sourceText = vehicle.description_es as string | null
    if (!sourceText) {
      await supabase.from('vehicles').update({ pending_translations: false }).eq('id', vehicle.id)
      continue
    }

    count++

    for (const targetLocale of targetLocales) {
      const result = await translateField({
        supabase,
        entityType: 'vehicle',
        entityId: vehicle.id,
        field: 'description',
        text: sourceText,
        targetLocale,
        defaultLocale,
        sourceTag,
      })
      results.push(result)
    }

    await supabase.from('vehicles').update({ pending_translations: false }).eq('id', vehicle.id)
  }

  return { count, results }
}

function collectArticleFields(
  article: Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sourceContent: any[] | null,
  defaultLocale: string,
): Array<{ field: string; text: string }> {
  const fields: Array<{ field: string; text: string }> = []

  const contentRow = sourceContent?.find((r: { field: string }) => r.field === 'content')
  if (contentRow?.value) {
    fields.push({ field: 'content', text: contentRow.value })
  }

  const excerptJson = article.excerpt as Record<string, string> | null
  const excerptText = excerptJson?.[defaultLocale]
  if (excerptText) {
    fields.push({ field: 'excerpt', text: excerptText })
  }

  const metaJson = article.meta_description as Record<string, string> | null
  const metaText = metaJson?.[defaultLocale]
  if (metaText) {
    fields.push({ field: 'meta_description', text: metaText })
  }

  return fields
}

async function translatePendingArticles(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  batchLimit: number,
  targetLocales: string[],
  defaultLocale: string,
  sourceTag: string,
): Promise<{ count: number; results: TranslationResult[] }> {
  const { data: articles } = await supabase
    .from('articles')
    .select('id, excerpt, meta_description')
    .eq('pending_translations', true)
    .limit(batchLimit)

  const results: TranslationResult[] = []
  let count = 0

  if (!articles?.length) return { count, results }

  for (const article of articles) {
    count++

    const { data: sourceContent } = await supabase
      .from('content_translations')
      .select('field, value')
      .eq('entity_type', 'article')
      .eq('entity_id', article.id)
      .eq('locale', defaultLocale)

    const fieldsToTranslate = collectArticleFields(article, sourceContent, defaultLocale)

    if (fieldsToTranslate.length === 0) {
      await supabase.from('articles').update({ pending_translations: false }).eq('id', article.id)
      continue
    }

    for (const targetLocale of targetLocales) {
      for (const { field, text } of fieldsToTranslate) {
        const result = await translateField({
          supabase,
          entityType: 'article',
          entityId: article.id,
          field,
          text,
          targetLocale,
          defaultLocale,
          sourceTag,
        })
        results.push(result)
      }
    }

    await supabase.from('articles').update({ pending_translations: false }).eq('id', article.id)
  }

  return { count, results }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default defineEventHandler(async (event): Promise<TranslateResponse> => {
  verifyCronSecret(event)

  const query = getQuery(event)
  const batchLimit = Math.min(Number(query.limit) || 10, 50)

  const supabase = serverSupabaseServiceRole(event)

  // ── Load vertical config for locale + engine settings ──────────────────

  const { data: verticalCfg } = await supabase
    .from('vertical_config')
    .select('active_locales, default_locale, translation_engine')
    .limit(1)
    .single()

  const defaultLocale: string = verticalCfg?.default_locale || 'es'
  const activeLocales: string[] = verticalCfg?.active_locales || ['es', 'en']
  const engine: string = verticalCfg?.translation_engine || 'claude_haiku'
  const sourceTag = ENGINE_SOURCE_MAP[engine] || 'auto_haiku'

  const targetLocales = activeLocales.filter((l) => l !== defaultLocale)
  if (targetLocales.length === 0) {
    return { translated: 0, failed: 0, vehicles: 0, articles: 0, details: [] }
  }

  const veh = await translatePendingVehicles(
    supabase,
    batchLimit,
    targetLocales,
    defaultLocale,
    sourceTag,
  )
  const art = await translatePendingArticles(
    supabase,
    batchLimit,
    targetLocales,
    defaultLocale,
    sourceTag,
  )

  const allResults = [...veh.results, ...art.results]
  const translated = allResults.filter((r) => r.ok).length
  const failed = allResults.filter((r) => !r.ok).length

  return { translated, failed, vehicles: veh.count, articles: art.count, details: allResults }
})
