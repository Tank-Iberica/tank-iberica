import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useVehicleTable } from '../../app/composables/catalog/useVehicleTable'

// ─── Stubs ────────────────────────────────────────────────────────────────────

const mockToggleFav = vi.fn()
const mockIsFavorite = vi.fn().mockReturnValue(false)
const mockRouterPush = vi.fn()
const mockShare = vi.fn().mockResolvedValue(undefined)
const mockClipboard = vi.fn().mockResolvedValue(undefined)

function makeVehicle(overrides: Record<string, unknown> = {}) {
  return {
    id: 'v-1',
    slug: 'volvo-fh-2020',
    brand: 'Volvo',
    model: 'FH',
    year: 2020,
    price: 50000,
    category: 'camion',
    rental_price: null,
    location: 'Madrid, España',
    location_en: 'Madrid, Spain',
    location_country: 'ES',
    attributes_json: null,
    vehicle_images: [],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRouterPush.mockReset()
  mockIsFavorite.mockReturnValue(false)

  vi.stubGlobal('ref', (v: unknown) => {
    let _v = v
    return { get value() { return _v }, set value(x) { _v = x } }
  })
  vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))

  vi.stubGlobal('useI18n', () => ({
    t: (k: string) => k,
    locale: { value: 'es' },
  }))
  vi.stubGlobal('useUserLocation', () => ({
    location: { value: { country: 'ES', province: 'Madrid', region: null } },
  }))
  vi.stubGlobal('useRouter', () => ({
    push: mockRouterPush,
  }))
  vi.stubGlobal('useFavorites', () => ({
    toggle: mockToggleFav,
    isFavorite: mockIsFavorite,
  }))
  vi.stubGlobal('generateVehiclePdf', vi.fn().mockResolvedValue(undefined))
  vi.stubGlobal('buildProductName', (v: { brand: string; model: string }, _locale: string, _full?: boolean) =>
    `${v.brand} ${v.model}`)

  // Mock navigator for shareVehicle
  Object.defineProperty(globalThis, 'navigator', {
    value: { share: mockShare, clipboard: { writeText: mockClipboard } },
    writable: true,
    configurable: true,
  })
  Object.defineProperty(globalThis, 'location', {
    value: { origin: 'https://test.com' },
    writable: true,
    configurable: true,
  })
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('selectedIds starts empty', () => {
    const c = useVehicleTable(() => [makeVehicle()] as never)
    expect(c.selectedIds.value.size).toBe(0)
  })

  it('showPdfModal starts false', () => {
    const c = useVehicleTable(() => [makeVehicle()] as never)
    expect(c.showPdfModal.value).toBe(false)
  })

  it('sortColumn starts null', () => {
    const c = useVehicleTable(() => [] as never)
    expect(c.sortedVehicles.value).toHaveLength(0)
  })
})

// ─── toggleSelect ─────────────────────────────────────────────────────────────

describe('toggleSelect', () => {
  it('adds id when not selected', () => {
    const c = useVehicleTable(() => [makeVehicle()] as never)
    c.toggleSelect('v-1')
    expect(c.selectedIds.value.has('v-1')).toBe(true)
  })

  it('removes id when already selected', () => {
    const c = useVehicleTable(() => [makeVehicle()] as never)
    c.toggleSelect('v-1')
    c.toggleSelect('v-1')
    expect(c.selectedIds.value.has('v-1')).toBe(false)
  })

  it('selects multiple ids independently', () => {
    const c = useVehicleTable(() => [makeVehicle({ id: 'v-1' }), makeVehicle({ id: 'v-2' })] as never)
    c.toggleSelect('v-1')
    c.toggleSelect('v-2')
    expect(c.selectedIds.value.size).toBe(2)
  })
})

// ─── selectAll ────────────────────────────────────────────────────────────────

describe('selectAll', () => {
  it('selects all vehicles', () => {
    const vehicles = [makeVehicle({ id: 'v-1' }), makeVehicle({ id: 'v-2', slug: 'mercedes-2021' })]
    const c = useVehicleTable(() => vehicles as never)
    c.selectAll()
    expect(c.selectedIds.value.size).toBe(2)
    expect(c.selectedIds.value.has('v-1')).toBe(true)
    expect(c.selectedIds.value.has('v-2')).toBe(true)
  })
})

// ─── onPdfHeaderClick ─────────────────────────────────────────────────────────

describe('onPdfHeaderClick', () => {
  it('opens PDF modal', () => {
    const c = useVehicleTable(() => [] as never)
    c.onPdfHeaderClick()
    expect(c.showPdfModal.value).toBe(true)
  })
})

// ─── toggleSort ───────────────────────────────────────────────────────────────

describe('toggleSort', () => {
  it('sets sortColumn and asc direction on first click', () => {
    const vehicles = [
      makeVehicle({ id: 'v-1', price: 50000 }),
      makeVehicle({ id: 'v-2', price: 30000 }),
    ]
    const c = useVehicleTable(() => vehicles as never)
    c.toggleSort('price')
    // After sorting by price asc, cheaper vehicle should be first
    expect(c.sortedVehicles.value[0]!.id).toBe('v-2')
  })

  it('toggles to desc on second click of same column', () => {
    const vehicles = [
      makeVehicle({ id: 'v-1', price: 30000 }),
      makeVehicle({ id: 'v-2', price: 50000 }),
    ]
    const c = useVehicleTable(() => vehicles as never)
    c.toggleSort('price')
    c.toggleSort('price')
    // After desc sort, more expensive vehicle first
    expect(c.sortedVehicles.value[0]!.id).toBe('v-2')
  })

  it('resets to asc when changing column', () => {
    const vehicles = [
      makeVehicle({ id: 'v-1', brand: 'Volvo' }),
      makeVehicle({ id: 'v-2', brand: 'Mercedes' }),
    ]
    const c = useVehicleTable(() => vehicles as never)
    c.toggleSort('price')
    c.toggleSort('brand')
    // brand asc: Mercedes < Volvo
    expect(c.sortedVehicles.value[0]!.brand).toBe('Mercedes')
  })
})

// ─── sortClass ────────────────────────────────────────────────────────────────

describe('sortClass', () => {
  it('returns empty when not the active sort column', () => {
    const c = useVehicleTable(() => [] as never)
    expect(c.sortClass('price')).toBe('')
  })

  it('returns sorted-asc for active asc column', () => {
    const c = useVehicleTable(() => [] as never)
    c.toggleSort('price')
    expect(c.sortClass('price')).toBe('sorted-asc')
  })

  it('returns sorted-desc after toggling same column twice', () => {
    const c = useVehicleTable(() => [] as never)
    c.toggleSort('price')
    c.toggleSort('price')
    expect(c.sortClass('price')).toBe('sorted-desc')
  })
})

// ─── Dynamic column detection ─────────────────────────────────────────────────

describe('showVolumeCol', () => {
  it('is false when no vehicle has volume attribute', () => {
    const c = useVehicleTable(() => [makeVehicle()] as never)
    expect(c.showVolumeCol.value).toBe(false)
  })

  it('is true when any vehicle has volume in attributes_json', () => {
    const vehicles = [makeVehicle({ attributes_json: { volume: 25000 } })]
    const c = useVehicleTable(() => vehicles as never)
    expect(c.showVolumeCol.value).toBe(true)
  })

  it('is true when vehicle has volumen (Spanish key)', () => {
    const vehicles = [makeVehicle({ attributes_json: { volumen: 20000 } })]
    const c = useVehicleTable(() => vehicles as never)
    expect(c.showVolumeCol.value).toBe(true)
  })

  it('is true when vehicle has capacity', () => {
    const vehicles = [makeVehicle({ attributes_json: { capacity: 5000 } })]
    const c = useVehicleTable(() => vehicles as never)
    expect(c.showVolumeCol.value).toBe(true)
  })
})

describe('showCompartmentsCol', () => {
  it('is false when no vehicle has compartments', () => {
    const c = useVehicleTable(() => [makeVehicle()] as never)
    expect(c.showCompartmentsCol.value).toBe(false)
  })

  it('is true when vehicle has compartments', () => {
    const vehicles = [makeVehicle({ attributes_json: { compartments: 3 } })]
    const c = useVehicleTable(() => vehicles as never)
    expect(c.showCompartmentsCol.value).toBe(true)
  })
})

describe('showPowerCol', () => {
  it('is false when no vehicle has power', () => {
    const c = useVehicleTable(() => [makeVehicle()] as never)
    expect(c.showPowerCol.value).toBe(false)
  })

  it('is true when vehicle has power (CV)', () => {
    const vehicles = [makeVehicle({ attributes_json: { cv: 420 } })]
    const c = useVehicleTable(() => vehicles as never)
    expect(c.showPowerCol.value).toBe(true)
  })
})

// ─── sortedVehicles ────────────────────────────────────────────────────────────

describe('sortedVehicles', () => {
  it('returns vehicles as-is when no sort column', () => {
    const vehicles = [makeVehicle({ id: 'v-1' }), makeVehicle({ id: 'v-2' })]
    const c = useVehicleTable(() => vehicles as never)
    expect(c.sortedVehicles.value[0]!.id).toBe('v-1')
    expect(c.sortedVehicles.value[1]!.id).toBe('v-2')
  })

  it('sorts by year ascending', () => {
    const vehicles = [
      makeVehicle({ id: 'v-1', year: 2022 }),
      makeVehicle({ id: 'v-2', year: 2018 }),
    ]
    const c = useVehicleTable(() => vehicles as never)
    c.toggleSort('year')
    expect(c.sortedVehicles.value[0]!.id).toBe('v-2') // 2018 first
  })

  it('sorts by brand alphabetically', () => {
    const vehicles = [
      makeVehicle({ id: 'v-1', brand: 'Volvo' }),
      makeVehicle({ id: 'v-2', brand: 'DAF' }),
    ]
    const c = useVehicleTable(() => vehicles as never)
    c.toggleSort('brand')
    expect(c.sortedVehicles.value[0]!.brand).toBe('DAF')
  })

  it('sorts by category', () => {
    const vehicles = [
      makeVehicle({ id: 'v-1', category: 'furgon' }),
      makeVehicle({ id: 'v-2', category: 'camion' }),
    ]
    const c = useVehicleTable(() => vehicles as never)
    c.toggleSort('category')
    expect(c.sortedVehicles.value[0]!.category).toBe('camion')
  })

  it('sorts by volume (attributes_json)', () => {
    const vehicles = [
      makeVehicle({ id: 'v-1', attributes_json: { volume: 10000 } }),
      makeVehicle({ id: 'v-2', attributes_json: { volume: 5000 } }),
    ]
    const c = useVehicleTable(() => vehicles as never)
    c.toggleSort('volume')
    expect(c.sortedVehicles.value[0]!.id).toBe('v-2') // 5000 first asc
  })

  it('uses rental_price for alquiler category', () => {
    const vehicles = [
      makeVehicle({ id: 'v-1', category: 'alquiler', price: 0, rental_price: 1000 }),
      makeVehicle({ id: 'v-2', category: 'alquiler', price: 0, rental_price: 500 }),
    ]
    const c = useVehicleTable(() => vehicles as never)
    c.toggleSort('price')
    expect(c.sortedVehicles.value[0]!.id).toBe('v-2') // 500 first asc
  })
})

// ─── priceText ────────────────────────────────────────────────────────────────

describe('priceText', () => {
  it('returns catalog.solicitar for terceros', () => {
    const c = useVehicleTable(() => [] as never)
    const v = makeVehicle({ category: 'terceros' })
    expect(c.priceText(v as never)).toBe('catalog.solicitar')
  })

  it('formats price with EUR for sale vehicle', () => {
    const c = useVehicleTable(() => [] as never)
    const v = makeVehicle({ category: 'camion', price: 50000 })
    const text = c.priceText(v as never)
    expect(text).toContain('50')
    expect(text).toContain('€')
  })

  it('formats rental price with /month for alquiler', () => {
    const c = useVehicleTable(() => [] as never)
    const v = makeVehicle({ category: 'alquiler', rental_price: 1000, price: 0 })
    const text = c.priceText(v as never)
    expect(text).toContain('/catalog.month')
  })

  it('returns catalog.solicitar when no price', () => {
    const c = useVehicleTable(() => [] as never)
    const v = makeVehicle({ category: 'camion', price: null })
    expect(c.priceText(v as never)).toBe('catalog.solicitar')
  })
})

// ─── locationLabel ────────────────────────────────────────────────────────────

describe('locationLabel', () => {
  it('returns location string', () => {
    const c = useVehicleTable(() => [] as never)
    const v = makeVehicle({ location: 'Madrid, España', location_country: 'ES' })
    const label = c.locationLabel(v as never)
    // Strips "España" when both user and vehicle are in ES
    expect(label).toBe('Madrid')
  })

  it('returns full location when countries differ', () => {
    const c = useVehicleTable(() => [] as never)
    const v = makeVehicle({ location: 'Munich, Germany', location_country: 'DE' })
    expect(c.locationLabel(v as never)).toBe('Munich, Germany')
  })

  it('returns — when no location', () => {
    const c = useVehicleTable(() => [] as never)
    const v = makeVehicle({ location: null })
    expect(c.locationLabel(v as never)).toBe('—')
  })
})

// ─── locationFlagCode ─────────────────────────────────────────────────────────

describe('locationFlagCode', () => {
  it('returns null when both in same country (ES)', () => {
    const c = useVehicleTable(() => [] as never)
    const v = makeVehicle({ location_country: 'ES' })
    expect(c.locationFlagCode(v as never)).toBeNull()
  })

  it('returns lowercase country code for foreign vehicle', () => {
    const c = useVehicleTable(() => [] as never)
    const v = makeVehicle({ location_country: 'DE' })
    expect(c.locationFlagCode(v as never)).toBe('de')
  })

  it('returns null when no country', () => {
    const c = useVehicleTable(() => [] as never)
    const v = makeVehicle({ location_country: null })
    expect(c.locationFlagCode(v as never)).toBeNull()
  })
})

// ─── Text helper functions ─────────────────────────────────────────────────────

describe('volumeText', () => {
  it('returns — when no attributes', () => {
    const c = useVehicleTable(() => [] as never)
    const v = makeVehicle({ attributes_json: null })
    expect(c.volumeText(v as never)).toBe('—')
  })

  it('returns volume in liters', () => {
    const c = useVehicleTable(() => [] as never)
    const v = makeVehicle({ attributes_json: { volume: 25000 } })
    expect(c.volumeText(v as never)).toBe('25000 L')
  })

  it('returns capacity in kg', () => {
    const c = useVehicleTable(() => [] as never)
    const v = makeVehicle({ attributes_json: { capacity: 5000 } })
    expect(c.volumeText(v as never)).toBe('5000 kg')
  })
})

describe('powerText', () => {
  it('returns — when no power data', () => {
    const c = useVehicleTable(() => [] as never)
    const v = makeVehicle({ attributes_json: {} })
    expect(c.powerText(v as never)).toBe('—')
  })

  it('returns CV value', () => {
    const c = useVehicleTable(() => [] as never)
    const v = makeVehicle({ attributes_json: { cv: 420 } })
    expect(c.powerText(v as never)).toBe('420 CV')
  })
})

describe('compartmentsText', () => {
  it('returns — when no compartments data', () => {
    const c = useVehicleTable(() => [] as never)
    const v = makeVehicle({ attributes_json: {} })
    expect(c.compartmentsText(v as never)).toBe('—')
  })

  it('returns compartment count as string', () => {
    const c = useVehicleTable(() => [] as never)
    const v = makeVehicle({ attributes_json: { compartments: 3 } })
    expect(c.compartmentsText(v as never)).toBe('3')
  })
})

// ─── firstImage ───────────────────────────────────────────────────────────────

describe('firstImage', () => {
  it('returns undefined when no images', () => {
    const c = useVehicleTable(() => [] as never)
    const v = makeVehicle({ vehicle_images: [] })
    expect(c.firstImage(v as never)).toBeUndefined()
  })

  it('returns thumbnail of first image by position', () => {
    const c = useVehicleTable(() => [] as never)
    const v = makeVehicle({
      vehicle_images: [
        { position: 2, thumbnail_url: 'https://cdn/img2.jpg', url: 'https://cdn/full2.jpg' },
        { position: 1, thumbnail_url: 'https://cdn/img1.jpg', url: 'https://cdn/full1.jpg' },
      ]
    })
    expect(c.firstImage(v as never)).toBe('https://cdn/img1.jpg')
  })

  it('falls back to url when no thumbnail', () => {
    const c = useVehicleTable(() => [] as never)
    const v = makeVehicle({
      vehicle_images: [
        { position: 1, thumbnail_url: null, url: 'https://cdn/full1.jpg' },
      ]
    })
    expect(c.firstImage(v as never)).toBe('https://cdn/full1.jpg')
  })
})

// ─── navigateTo ───────────────────────────────────────────────────────────────

describe('navigateTo', () => {
  it('pushes /vehiculo/slug to router', () => {
    const c = useVehicleTable(() => [] as never)
    c.navigateTo('volvo-fh-2020')
    expect(mockRouterPush).toHaveBeenCalledWith('/vehiculo/volvo-fh-2020')
  })
})

// ─── shareVehicle ─────────────────────────────────────────────────────────────

describe('shareVehicle', () => {
  it('uses navigator.share when available', async () => {
    const c = useVehicleTable(() => [] as never)
    const v = makeVehicle()
    await c.shareVehicle(v as never)
    expect(mockShare).toHaveBeenCalledWith({
      title: 'Volvo FH',
      url: 'https://test.com/vehiculo/volvo-fh-2020',
    })
  })

  it('falls back to clipboard when navigator.share not available', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { clipboard: { writeText: mockClipboard } },
      writable: true,
      configurable: true,
    })
    const c = useVehicleTable(() => [] as never)
    const v = makeVehicle()
    await c.shareVehicle(v as never)
    expect(mockClipboard).toHaveBeenCalledWith('https://test.com/vehiculo/volvo-fh-2020')
  })
})
