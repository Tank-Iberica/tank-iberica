/**
 * Composable for i18n JSONB field handling.
 * Reads JSONB fields with fallback chain and fetches long translations from content_translations.
 */

/**
 * Read a JSONB field with fallback chain.
 * Example: localizedField(category.name, 'pl')
 *   → tries 'pl' → 'en' → 'es' → first available value
 */
export function localizedField(
  jsonField: Record<string, string> | null | undefined,
  locale: string,
): string {
  if (!jsonField) return ''
  return (
    jsonField[locale] || jsonField['en'] || jsonField['es'] || Object.values(jsonField)[0] || ''
  )
}

/**
 * Read a localized name from an entity that may have both JSONB `name` and legacy `name_es`/`name_en` columns.
 * Tries JSONB first, then falls back to legacy columns.
 */
export function localizedName(
  item:
    | { name?: Record<string, string> | null; name_es?: string; name_en?: string | null }
    | null
    | undefined,
  locale: string,
): string {
  if (!item) return ''
  // Try JSONB column first
  const fromJsonb = localizedField(item.name, locale)
  if (fromJsonb) return fromJsonb
  // Fallback to legacy columns
  if (locale === 'en' && item.name_en) return item.name_en
  return item.name_es || ''
}

/**
 * Read a long translation from content_translations table.
 * Used in detail pages (vehicle detail, article). NOT used in listings.
 */
export async function fetchTranslation(
  entityType: string,
  entityId: string,
  field: string,
  locale: string,
): Promise<string> {
  const supabase = useSupabaseClient()
  const { data } = await supabase
    .from('content_translations')
    .select('value, locale')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('field', field)
    .in('locale', [locale, 'en', 'es'])
    .order('locale')

  if (!data || !data.length) return ''
  const match =
    data.find((d) => d.locale === locale) ||
    data.find((d) => d.locale === 'en') ||
    data.find((d) => d.locale === 'es')
  return match?.value || ''
}
