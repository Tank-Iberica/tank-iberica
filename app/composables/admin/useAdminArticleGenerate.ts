/**
 * A7 — AI editorial generation composable.
 * Calls /api/generate-article and returns the draft fields.
 */

export type ArticleType = 'guide' | 'news' | 'comparison' | 'success-story'

interface GenerateArticlePayload {
  topic: string
  type: ArticleType
  catalogContext?: string
}

interface GenerateArticleResult {
  title_es: string
  title_en: string
  meta_description_es: string
  meta_description_en: string
  content_es: string
  content_en: string
  aiUnavailable?: boolean
}

export function useAdminArticleGenerate() {
  const generating = ref(false)
  const error = ref<string | null>(null)

  async function generateArticle(
    payload: GenerateArticlePayload,
  ): Promise<GenerateArticleResult | null> {
    generating.value = true
    error.value = null
    try {
      const data = await $fetch<GenerateArticleResult>('/api/generate-article', {
        method: 'POST',
        body: payload,
      })
      if (data.aiUnavailable) {
        error.value = 'La IA no está disponible ahora. Inténtalo más tarde.'
        return null
      }
      return data
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generando artículo'
      error.value = msg
      if (import.meta.dev) console.error('[useAdminArticleGenerate]', err)
      return null
    } finally {
      generating.value = false
    }
  }

  return {
    generating,
    error,
    generateArticle,
  }
}
