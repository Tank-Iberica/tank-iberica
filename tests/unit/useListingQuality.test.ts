import { describe, it, expect } from 'vitest'

/**
 * Tests for useListingQuality composable — per-listing quality score.
 * Inline copies of pure functions to avoid import issues across branches.
 */

type QualityLevel = 'low' | 'medium' | 'good' | 'excellent'

interface ListingQualityInput {
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

interface QualityBreakdown {
  photos: number
  description: number
  attributes: number
  price: number
  location: number
  contact: number
  total: number
}

function calcPhotoScore(count: number): number {
  if (count <= 0) return 0
  if (count <= 2) return 5
  if (count <= 5) return 10
  if (count <= 10) return 20
  return 25
}

function calcDescriptionScore(length: number): number {
  if (length < 50) return 0
  if (length < 100) return 5
  if (length < 200) return 10
  if (length < 400) return 15
  return 20
}

function calcAttributesScore(input: Pick<ListingQualityInput, 'hasBrand' | 'hasModel' | 'hasYear' | 'hasKm'>): number {
  let score = 0
  if (input.hasBrand) score += 5
  if (input.hasModel) score += 5
  if (input.hasYear) score += 5
  if (input.hasKm) score += 5
  return score
}

function calcListingQuality(input: ListingQualityInput): QualityBreakdown {
  const photos = calcPhotoScore(input.photoCount)
  const description = calcDescriptionScore(input.descriptionLength)
  const attributes = calcAttributesScore(input)
  const price = input.hasPrice ? 15 : 0
  const location = input.hasLocation ? 10 : 0
  const contact = (input.hasPhone ? 5 : 0) + (input.hasEmail ? 5 : 0)
  return { photos, description, attributes, price, location, contact, total: photos + description + attributes + price + location + contact }
}

function getQualityLevel(total: number): QualityLevel {
  if (total >= 80) return 'excellent'
  if (total >= 60) return 'good'
  if (total >= 40) return 'medium'
  return 'low'
}

function getQualityTips(breakdown: QualityBreakdown) {
  const tips: { key: string; category: string }[] = []
  if (breakdown.photos < 20) tips.push({ key: 'more_photos', category: 'photos' })
  if (breakdown.description < 15) tips.push({ key: 'longer_description', category: 'description' })
  if (breakdown.attributes < 20) tips.push({ key: 'fill_attributes', category: 'attributes' })
  if (breakdown.price === 0) tips.push({ key: 'add_price', category: 'price' })
  if (breakdown.location === 0) tips.push({ key: 'add_location', category: 'location' })
  if (breakdown.contact < 10) tips.push({ key: 'complete_contact', category: 'contact' })
  return tips
}

const PERFECT_INPUT: ListingQualityInput = {
  photoCount: 15,
  descriptionLength: 500,
  hasBrand: true,
  hasModel: true,
  hasYear: true,
  hasKm: true,
  hasPrice: true,
  hasLocation: true,
  hasPhone: true,
  hasEmail: true,
}

const EMPTY_INPUT: ListingQualityInput = {
  photoCount: 0,
  descriptionLength: 0,
  hasBrand: false,
  hasModel: false,
  hasYear: false,
  hasKm: false,
  hasPrice: false,
  hasLocation: false,
  hasPhone: false,
  hasEmail: false,
}

describe('calcPhotoScore', () => {
  it('0 photos = 0', () => expect(calcPhotoScore(0)).toBe(0))
  it('1 photo = 5', () => expect(calcPhotoScore(1)).toBe(5))
  it('2 photos = 5', () => expect(calcPhotoScore(2)).toBe(5))
  it('3 photos = 10', () => expect(calcPhotoScore(3)).toBe(10))
  it('5 photos = 10', () => expect(calcPhotoScore(5)).toBe(10))
  it('6 photos = 20', () => expect(calcPhotoScore(6)).toBe(20))
  it('10 photos = 20', () => expect(calcPhotoScore(10)).toBe(20))
  it('11 photos = 25', () => expect(calcPhotoScore(11)).toBe(25))
  it('30 photos = 25', () => expect(calcPhotoScore(30)).toBe(25))
  it('negative = 0', () => expect(calcPhotoScore(-1)).toBe(0))
})

describe('calcDescriptionScore', () => {
  it('0 chars = 0', () => expect(calcDescriptionScore(0)).toBe(0))
  it('49 chars = 0', () => expect(calcDescriptionScore(49)).toBe(0))
  it('50 chars = 5', () => expect(calcDescriptionScore(50)).toBe(5))
  it('99 chars = 5', () => expect(calcDescriptionScore(99)).toBe(5))
  it('100 chars = 10', () => expect(calcDescriptionScore(100)).toBe(10))
  it('200 chars = 15', () => expect(calcDescriptionScore(200)).toBe(15))
  it('400 chars = 20', () => expect(calcDescriptionScore(400)).toBe(20))
  it('1000 chars = 20', () => expect(calcDescriptionScore(1000)).toBe(20))
})

describe('calcAttributesScore', () => {
  it('no attributes = 0', () => {
    expect(calcAttributesScore({ hasBrand: false, hasModel: false, hasYear: false, hasKm: false })).toBe(0)
  })
  it('all attributes = 20', () => {
    expect(calcAttributesScore({ hasBrand: true, hasModel: true, hasYear: true, hasKm: true })).toBe(20)
  })
  it('partial attributes', () => {
    expect(calcAttributesScore({ hasBrand: true, hasModel: true, hasYear: false, hasKm: false })).toBe(10)
  })
  it('single attribute = 5', () => {
    expect(calcAttributesScore({ hasBrand: false, hasModel: false, hasYear: true, hasKm: false })).toBe(5)
  })
})

describe('calcListingQuality', () => {
  it('perfect listing = 100', () => {
    const result = calcListingQuality(PERFECT_INPUT)
    expect(result.total).toBe(100)
    expect(result.photos).toBe(25)
    expect(result.description).toBe(20)
    expect(result.attributes).toBe(20)
    expect(result.price).toBe(15)
    expect(result.location).toBe(10)
    expect(result.contact).toBe(10)
  })

  it('empty listing = 0', () => {
    const result = calcListingQuality(EMPTY_INPUT)
    expect(result.total).toBe(0)
  })

  it('partial listing calculates correctly', () => {
    const result = calcListingQuality({
      photoCount: 5,
      descriptionLength: 150,
      hasBrand: true,
      hasModel: true,
      hasYear: false,
      hasKm: false,
      hasPrice: true,
      hasLocation: false,
      hasPhone: true,
      hasEmail: false,
    })
    // photos=10, description=10, attributes=10, price=15, location=0, contact=5
    expect(result.total).toBe(50)
  })

  it('total never exceeds 100', () => {
    const result = calcListingQuality({
      ...PERFECT_INPUT,
      photoCount: 100,
      descriptionLength: 10000,
    })
    expect(result.total).toBe(100)
  })
})

describe('getQualityLevel', () => {
  it('0 = low', () => expect(getQualityLevel(0)).toBe('low'))
  it('39 = low', () => expect(getQualityLevel(39)).toBe('low'))
  it('40 = medium', () => expect(getQualityLevel(40)).toBe('medium'))
  it('59 = medium', () => expect(getQualityLevel(59)).toBe('medium'))
  it('60 = good', () => expect(getQualityLevel(60)).toBe('good'))
  it('79 = good', () => expect(getQualityLevel(79)).toBe('good'))
  it('80 = excellent', () => expect(getQualityLevel(80)).toBe('excellent'))
  it('100 = excellent', () => expect(getQualityLevel(100)).toBe('excellent'))
})

describe('getQualityTips', () => {
  it('perfect score = no tips', () => {
    const breakdown = calcListingQuality(PERFECT_INPUT)
    const tips = getQualityTips(breakdown)
    expect(tips).toHaveLength(0)
  })

  it('empty listing = all tips', () => {
    const breakdown = calcListingQuality(EMPTY_INPUT)
    const tips = getQualityTips(breakdown)
    expect(tips).toHaveLength(6)
    expect(tips.map(t => t.key)).toContain('more_photos')
    expect(tips.map(t => t.key)).toContain('longer_description')
    expect(tips.map(t => t.key)).toContain('fill_attributes')
    expect(tips.map(t => t.key)).toContain('add_price')
    expect(tips.map(t => t.key)).toContain('add_location')
    expect(tips.map(t => t.key)).toContain('complete_contact')
  })

  it('partial listing = relevant tips only', () => {
    const breakdown = calcListingQuality({
      ...PERFECT_INPUT,
      photoCount: 3,  // photos=10, below threshold 20
      hasLocation: false,
    })
    const tips = getQualityTips(breakdown)
    expect(tips.map(t => t.key)).toContain('more_photos')
    expect(tips.map(t => t.key)).toContain('add_location')
    expect(tips.map(t => t.key)).not.toContain('add_price')
  })

  it('tips have correct categories', () => {
    const breakdown = calcListingQuality(EMPTY_INPUT)
    const tips = getQualityTips(breakdown)
    const photoTip = tips.find(t => t.key === 'more_photos')
    expect(photoTip?.category).toBe('photos')
    const priceTip = tips.find(t => t.key === 'add_price')
    expect(priceTip?.category).toBe('price')
  })
})
