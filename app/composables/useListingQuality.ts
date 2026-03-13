/**
 * Per-listing quality score composable.
 *
 * Calculates a 0-100 score for individual vehicle listings based on
 * completeness and quality indicators. Helps dealers improve their ads
 * by showing which fields are missing or could be improved.
 *
 * Scoring criteria:
 *   - Photos (0-25): 0 photos=0, 1-2=5, 3-5=10, 6-10=20, 11+=25
 *   - Description (0-20): length<50=0, 50-100=5, 100-200=10, 200-400=15, 400+=20
 *   - Key attributes (0-20): brand+model+year+km each worth 5
 *   - Price (0-15): no price=0, has price=15
 *   - Location (0-10): no location=0, has location=10
 *   - Contact completeness (0-10): phone+email each worth 5
 */

export interface ListingQualityInput {
  photoCount: number
  descriptionLength: number
  hasBrand: boolean
  hasModel: boolean
  hasYear: boolean
  hasKm: boolean
  hasPrice: boolean
  hasLocation: boolean
  hasPhone: boolean
  hasEmail: boolean
}

export interface QualityBreakdown {
  photos: number       // 0-25
  description: number  // 0-20
  attributes: number   // 0-20
  price: number        // 0-15
  location: number     // 0-10
  contact: number      // 0-10
  total: number        // 0-100
}

export type QualityLevel = 'low' | 'medium' | 'good' | 'excellent'

export interface QualityTip {
  key: string
  category: keyof Omit<QualityBreakdown, 'total'>
  i18nKey: string
}

/**
 * Calculate photo score (0-25).
 */
export function calcPhotoScore(count: number): number {
  if (count <= 0) return 0
  if (count <= 2) return 5
  if (count <= 5) return 10
  if (count <= 10) return 20
  return 25
}

/**
 * Calculate description score (0-20).
 */
export function calcDescriptionScore(length: number): number {
  if (length < 50) return 0
  if (length < 100) return 5
  if (length < 200) return 10
  if (length < 400) return 15
  return 20
}

/**
 * Calculate attributes score (0-20).
 * Each key attribute (brand, model, year, km) worth 5 points.
 */
export function calcAttributesScore(input: Pick<ListingQualityInput, 'hasBrand' | 'hasModel' | 'hasYear' | 'hasKm'>): number {
  let score = 0
  if (input.hasBrand) score += 5
  if (input.hasModel) score += 5
  if (input.hasYear) score += 5
  if (input.hasKm) score += 5
  return score
}

/**
 * Calculate full quality breakdown for a listing.
 */
export function calcListingQuality(input: ListingQualityInput): QualityBreakdown {
  const photos = calcPhotoScore(input.photoCount)
  const description = calcDescriptionScore(input.descriptionLength)
  const attributes = calcAttributesScore(input)
  const price = input.hasPrice ? 15 : 0
  const location = input.hasLocation ? 10 : 0
  const contact = (input.hasPhone ? 5 : 0) + (input.hasEmail ? 5 : 0)

  return {
    photos,
    description,
    attributes,
    price,
    location,
    contact,
    total: photos + description + attributes + price + location + contact,
  }
}

/**
 * Map total score to quality level.
 */
export function getQualityLevel(total: number): QualityLevel {
  if (total >= 80) return 'excellent'
  if (total >= 60) return 'good'
  if (total >= 40) return 'medium'
  return 'low'
}

/**
 * Generate improvement tips based on the breakdown.
 */
export function getQualityTips(breakdown: QualityBreakdown): QualityTip[] {
  const tips: QualityTip[] = []

  if (breakdown.photos < 20) {
    tips.push({ key: 'more_photos', category: 'photos', i18nKey: 'quality.tip_more_photos' })
  }
  if (breakdown.description < 15) {
    tips.push({ key: 'longer_description', category: 'description', i18nKey: 'quality.tip_longer_description' })
  }
  if (breakdown.attributes < 20) {
    tips.push({ key: 'fill_attributes', category: 'attributes', i18nKey: 'quality.tip_fill_attributes' })
  }
  if (breakdown.price === 0) {
    tips.push({ key: 'add_price', category: 'price', i18nKey: 'quality.tip_add_price' })
  }
  if (breakdown.location === 0) {
    tips.push({ key: 'add_location', category: 'location', i18nKey: 'quality.tip_add_location' })
  }
  if (breakdown.contact < 10) {
    tips.push({ key: 'complete_contact', category: 'contact', i18nKey: 'quality.tip_complete_contact' })
  }

  return tips
}

/**
 * Composable wrapper: calculates quality for a reactive vehicle listing.
 */
export function useListingQuality(input: Ref<ListingQualityInput> | ComputedRef<ListingQualityInput>) {
  const breakdown = computed(() => calcListingQuality(input.value))
  const level = computed(() => getQualityLevel(breakdown.value.total))
  const tips = computed(() => getQualityTips(breakdown.value))
  const score = computed(() => breakdown.value.total)

  return {
    score,
    level,
    breakdown,
    tips,
  }
}
