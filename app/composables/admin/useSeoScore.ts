/**
 * SEO Score Composable
 * Real-time SEO scoring with 9 criteria and Google snippet preview
 */

export type SeoLevel = 'good' | 'warning' | 'bad'

export interface SeoCriterion {
  id: string
  label: string
  description: string
  score: number
  level: SeoLevel
  weight: number
}

export interface SeoSnippetPreview {
  title: string
  url: string
  description: string
}

export interface SeoAnalysis {
  score: number
  level: SeoLevel
  criteria: SeoCriterion[]
  snippetPreview: SeoSnippetPreview
}

export interface SeoInput {
  title_es: string
  title_en: string | null
  slug: string
  description_es: string | null
  content_es: string
  content_en: string | null
  image_url: string | null
  hashtags: string[]
}

const STOPWORDS_ES = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'de', 'del', 'en', 'con', 'por', 'para', 'que', 'es',
  'y', 'o', 'a', 'al', 'se', 'su', 'no', 'lo', 'le',
  'como', 'mas', 'pero', 'sus', 'este', 'esta', 'estos',
  'ese', 'esa', 'esos', 'esas', 'aquel', 'aquella',
  'ser', 'estar', 'haber', 'tener', 'hacer',
  'muy', 'todo', 'toda', 'todos', 'todas',
])

function getLevel(score: number): SeoLevel {
  if (score >= 70) return 'good'
  if (score >= 40) return 'warning'
  return 'bad'
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 3) + '...'
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length
}

function evaluateTitleLength(title: string): SeoCriterion {
  const len = title.trim().length
  let score = 0
  let description = ''

  if (len >= 30 && len <= 60) {
    score = 100
    description = `Perfecto: ${len} caracteres (recomendado 30-60)`
  }
  else if ((len >= 20 && len < 30) || (len > 60 && len <= 70)) {
    score = 50
    description = len < 30
      ? `Corto: ${len} caracteres. Intenta llegar a 30+`
      : `Largo: ${len} caracteres. Google podria truncarlo`
  }
  else {
    score = len > 0 ? 20 : 0
    description = len === 0
      ? 'El titulo esta vacio'
      : len < 20
        ? `Muy corto: ${len} caracteres. Minimo recomendado: 30`
        : `Muy largo: ${len} caracteres. Google truncara a ~60`
  }

  return {
    id: 'title_length',
    label: 'Longitud del titulo',
    description,
    score,
    level: getLevel(score),
    weight: 0.15,
  }
}

function evaluateTitleKeywords(title: string): SeoCriterion {
  const words = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0)

  const keywords = words.filter(w => w.length > 4 && !STOPWORDS_ES.has(w))
  const ratio = words.length > 0 ? keywords.length / words.length : 0

  let score = 0
  let description = ''

  if (keywords.length >= 2 && ratio >= 0.3) {
    score = 100
    description = `Bien: ${keywords.length} palabras clave relevantes`
  }
  else if (keywords.length >= 1) {
    score = 50
    description = `Mejorable: solo ${keywords.length} palabra(s) clave. Incluye terminos descriptivos`
  }
  else {
    score = words.length > 0 ? 20 : 0
    description = words.length === 0
      ? 'Sin titulo'
      : 'Sin palabras clave significativas. Usa terminos que los usuarios buscarian'
  }

  return {
    id: 'title_keywords',
    label: 'Palabras clave en titulo',
    description,
    score,
    level: getLevel(score),
    weight: 0.10,
  }
}

function evaluateSlugQuality(slug: string, _title: string): SeoCriterion {
  const parts = slug.split('-').filter(p => p.length > 0)
  const wordCount = parts.length

  let score = 0
  let description = ''

  if (!slug || slug.trim().length === 0) {
    score = 0
    description = 'Slug vacio. Se generara automaticamente del titulo'
  }
  else if (slug.match(/^[0-9a-f]{8}-/)) {
    score = 10
    description = 'Parece un UUID. Usa un slug descriptivo basado en el titulo'
  }
  else if (wordCount >= 3 && wordCount <= 5) {
    score = 100
    description = `Perfecto: ${wordCount} palabras, legible y descriptivo`
  }
  else if (wordCount >= 1 && wordCount <= 8) {
    score = wordCount <= 2 ? 60 : 60
    description = wordCount <= 2
      ? `Corto: ${wordCount} palabra(s). Intenta 3-5 para mejor SEO`
      : `Largo: ${wordCount} palabras. Intenta resumir a 3-5`
  }
  else {
    score = 30
    description = `Demasiado largo: ${wordCount} palabras. Simplifica a 3-5`
  }

  return {
    id: 'slug_quality',
    label: 'URL amigable (slug)',
    description,
    score,
    level: getLevel(score),
    weight: 0.10,
  }
}

function evaluateContentLength(content: string): SeoCriterion {
  const words = countWords(content)

  let score = 0
  let description = ''

  if (words >= 300) {
    score = 100
    description = `Excelente: ${words} palabras. Contenido sustancial para SEO`
  }
  else if (words >= 150) {
    score = 50
    description = `Mejorable: ${words} palabras. Intenta llegar a 300+ para mejor posicionamiento`
  }
  else {
    score = words > 0 ? 20 : 0
    description = words === 0
      ? 'Sin contenido'
      : `Corto: ${words} palabras. Google prefiere contenido de 300+ palabras`
  }

  return {
    id: 'content_length',
    label: 'Longitud del contenido',
    description,
    score,
    level: getLevel(score),
    weight: 0.20,
  }
}

function evaluateMetaDescription(descriptionEs: string | null): SeoCriterion {
  const text = (descriptionEs || '').trim()
  const len = text.length

  let score = 0
  let description = ''

  if (len === 0) {
    score = 0
    description = 'Sin meta descripcion. Escribe un resumen de 120-160 caracteres para Google'
  }
  else if (len >= 120 && len <= 160) {
    score = 100
    description = `Perfecto: ${len} caracteres. Longitud ideal para Google`
  }
  else if (len >= 80 && len < 120) {
    score = 60
    description = `Corta: ${len} chars. Intenta llegar a 120-160 para aprovechar todo el espacio en Google`
  }
  else if (len > 160 && len <= 200) {
    score = 70
    description = `Larga: ${len} chars. Google truncara a ~155. Intenta resumir a 120-160`
  }
  else if (len > 200) {
    score = 40
    description = `Muy larga: ${len} chars. Google solo muestra ~155. Reduce a 120-160`
  }
  else {
    score = 30
    description = `Muy corta: ${len} chars. Recomendado 120-160 caracteres`
  }

  return {
    id: 'meta_description',
    label: 'Meta descripcion',
    description,
    score,
    level: getLevel(score),
    weight: 0.10,
  }
}

function evaluateImage(imageUrl: string | null): SeoCriterion {
  let score = 0
  let description = ''

  if (imageUrl && imageUrl.trim().length > 0) {
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      score = 100
      description = 'Imagen presente. Se usara como og:image en redes sociales'
    }
    else {
      score = 50
      description = 'URL de imagen no parece valida. Debe empezar con https://'
    }
  }
  else {
    score = 0
    description = 'Sin imagen. Las noticias con imagen tienen 2x mas clicks en redes sociales'
  }

  return {
    id: 'image',
    label: 'Imagen destacada',
    description,
    score,
    level: getLevel(score),
    weight: 0.10,
  }
}

function evaluateHashtags(hashtags: string[]): SeoCriterion {
  const count = hashtags.length

  let score = 0
  let description = ''

  if (count >= 3 && count <= 6) {
    score = 100
    description = `Perfecto: ${count} etiquetas. Ideal para categorizacion`
  }
  else if ((count >= 1 && count < 3) || (count > 6 && count <= 10)) {
    score = 50
    description = count < 3
      ? `Pocas: ${count} etiqueta(s). Anade al menos 3 para mejor categorizacion`
      : `Muchas: ${count} etiquetas. Recomendado 3-6 para no diluir relevancia`
  }
  else if (count === 0) {
    score = 0
    description = 'Sin etiquetas. Anade 3-6 para mejorar la categorizacion y descubrimiento'
  }
  else {
    score = 30
    description = `Demasiadas: ${count} etiquetas. Reduce a 3-6 para mantener relevancia`
  }

  return {
    id: 'hashtags',
    label: 'Etiquetas / hashtags',
    description,
    score,
    level: getLevel(score),
    weight: 0.05,
  }
}

function evaluateBilingual(titleEn: string | null, contentEn: string | null): SeoCriterion {
  const hasTitle = !!titleEn && titleEn.trim().length > 0
  const hasContent = !!contentEn && contentEn.trim().length > 0

  let score = 0
  let description = ''

  if (hasTitle && hasContent) {
    score = 100
    description = 'Contenido bilingue completo. Duplica tu audiencia potencial'
  }
  else if (hasTitle) {
    score = 50
    description = 'Solo titulo en ingles. Anade el contenido para completar la version bilingue'
  }
  else {
    score = 0
    description = 'Sin version en ingles. El contenido bilingue amplía el alcance internacional'
  }

  return {
    id: 'bilingual',
    label: 'Contenido bilingue',
    description,
    score,
    level: getLevel(score),
    weight: 0.10,
  }
}

function evaluateContentStructure(content: string): SeoCriterion {
  const paragraphs = content.split(/\n\n|\r\n\r\n/).filter(p => p.trim().length > 0)
  const count = paragraphs.length

  let score = 0
  let description = ''

  if (count >= 4) {
    score = 100
    description = `Bien estructurado: ${count} parrafos. Facilita la lectura y el SEO`
  }
  else if (count >= 2) {
    score = 50
    description = `Mejorable: ${count} parrafos. Divide el contenido en mas secciones`
  }
  else {
    score = count > 0 ? 20 : 0
    description = count === 0
      ? 'Sin contenido'
      : 'Bloque unico de texto. Divide en parrafos para mejor legibilidad'
  }

  return {
    id: 'content_structure',
    label: 'Estructura del contenido',
    description,
    score,
    level: getLevel(score),
    weight: 0.10,
  }
}

export function useSeoScore(input: Ref<SeoInput> | ComputedRef<SeoInput>) {
  const analysis = computed<SeoAnalysis>(() => {
    const data = unref(input)

    const criteria: SeoCriterion[] = [
      evaluateTitleLength(data.title_es),
      evaluateTitleKeywords(data.title_es),
      evaluateSlugQuality(data.slug, data.title_es),
      evaluateContentLength(data.content_es),
      evaluateMetaDescription(data.description_es),
      evaluateImage(data.image_url),
      evaluateHashtags(data.hashtags),
      evaluateBilingual(data.title_en, data.content_en),
      evaluateContentStructure(data.content_es),
    ]

    const score = Math.round(
      criteria.reduce((sum, c) => sum + c.score * c.weight, 0),
    )

    const level = getLevel(score)

    const descText = (data.description_es || '').trim()
    const snippetDescription = descText || truncate((data.content_es || '').replace(/\n+/g, ' ').trim(), 155)
    const snippetPreview: SeoSnippetPreview = {
      title: truncate(data.title_es || 'Sin titulo', 60),
      url: `tankiberica.com/noticias/${data.slug || 'sin-url'}`,
      description: truncate(snippetDescription, 155),
    }

    return { score, level, criteria, snippetPreview }
  })

  return { analysis }
}

/**
 * Lightweight score calculation for list views (avoids full analysis overhead)
 */
export function calculateMiniSeoScore(data: {
  title_es: string
  content_es: string
  slug: string
  image_url: string | null
  hashtags: string[]
}): { score: number; level: SeoLevel } {
  let score = 0
  let total = 0

  // Title (30%)
  const titleLen = data.title_es.trim().length
  if (titleLen >= 30 && titleLen <= 60) score += 30
  else if (titleLen >= 20 && titleLen <= 70) score += 15
  else if (titleLen > 0) score += 5
  total += 30

  // Content (30%)
  const words = countWords(data.content_es)
  if (words >= 300) score += 30
  else if (words >= 150) score += 15
  else if (words > 0) score += 5
  total += 30

  // Image (20%)
  if (data.image_url && data.image_url.startsWith('http')) score += 20
  total += 20

  // Hashtags (10%)
  if (data.hashtags.length >= 3 && data.hashtags.length <= 6) score += 10
  else if (data.hashtags.length >= 1) score += 5
  total += 10

  // Slug (10%)
  const slugWords = data.slug.split('-').filter(p => p.length > 0).length
  if (slugWords >= 3 && slugWords <= 5) score += 10
  else if (slugWords >= 1) score += 5
  total += 10

  const finalScore = Math.round((score / total) * 100)
  return { score: finalScore, level: getLevel(finalScore) }
}
