/**
 * ItemList Schema builder — #167
 *
 * Generates JSON-LD ItemList structured data for catalog/landing pages.
 * Pure function: no Nuxt auto-imports, fully testable.
 *
 * Schema.org spec: https://schema.org/ItemList
 * Google docs: https://developers.google.com/search/docs/appearance/structured-data/carousel
 */

export interface ItemListEntry {
  /** Vehicle slug, used to build the canonical URL */
  slug: string
  /** Display name for the vehicle */
  name: string
  /** Optional primary image URL */
  imageUrl?: string
}

/**
 * Build Schema.org ItemList JSON-LD for a catalog or landing page.
 * Returns null when items array is empty.
 *
 * @param items     Array of vehicle entries (max 20 recommended by Google)
 * @param siteUrl   Base URL without trailing slash (e.g. 'https://tracciona.com')
 * @param listName  Optional human-readable name for the list
 */
export function buildItemListSchema(
  items: ItemListEntry[],
  siteUrl: string,
  listName?: string,
): Record<string, unknown> | null {
  if (!items.length) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    ...(listName ? { name: listName } : {}),
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${siteUrl}/vehiculo/${item.slug}`,
      name: item.name,
      ...(item.imageUrl ? { image: item.imageUrl } : {}),
    })),
  }
}
