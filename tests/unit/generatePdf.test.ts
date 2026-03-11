import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock jsPDF
const mockDoc = {
  setFillColor: vi.fn(),
  setTextColor: vi.fn(),
  setDrawColor: vi.fn(),
  setLineWidth: vi.fn(),
  setFontSize: vi.fn(),
  setFont: vi.fn(),
  rect: vi.fn(),
  line: vi.fn(),
  text: vi.fn(),
  addImage: vi.fn(),
  getTextWidth: vi.fn().mockReturnValue(20),
  splitTextToSize: vi.fn((text: string) => [text]),
  save: vi.fn(),
}

vi.mock('jspdf', () => {
  // The constructor needs to be a real function that returns mockDoc
  function JsPDFConstructor() { return mockDoc }
  return { jsPDF: JsPDFConstructor }
})

// Mock generateQR
vi.mock('~/utils/generateQR', () => ({
  generateVehicleQR: vi.fn().mockResolvedValue('data:image/png;base64,fakeQR'),
}))

// Mock browser Image API
class MockImage {
  crossOrigin = ''
  src = ''
  width = 100
  height = 100
  onload: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor() {
    // Trigger onload after src is set (async)
    setTimeout(() => {
      if (this.onload) this.onload()
    }, 0)
  }
}

vi.stubGlobal('Image', MockImage)

// Mock canvas
const mockContext = {
  drawImage: vi.fn(),
}

const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => mockContext),
  toDataURL: vi.fn(() => 'data:image/jpeg;base64,fakeImage'),
}

// Mock document.createElement for canvas
const originalCreateElement = globalThis.document?.createElement?.bind(globalThis.document)
vi.spyOn(globalThis.document, 'createElement').mockImplementation((tag: string) => {
  if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement
  return originalCreateElement?.(tag) ?? ({} as HTMLElement)
})

import { generateVehiclePdf } from '../../app/utils/generatePdf'

function makeVehicle(overrides: Record<string, unknown> = {}) {
  return {
    id: 'v1',
    slug: 'volvo-fh16-2020',
    brand: 'Volvo',
    model: 'FH16',
    year: 2020,
    price: 65000,
    description_es: 'Camión en perfecto estado, revisiones al día.',
    description_en: 'Truck in perfect condition, up to date inspections.',
    location: 'Madrid, España',
    location_en: 'Madrid, Spain',
    vehicle_images: [
      { url: 'https://example.com/img1.jpg' },
      { url: 'https://example.com/img2.jpg' },
      { url: 'https://example.com/img3.jpg' },
    ],
    attributes_json: {
      potencia: '500 CV',
      kilometraje: '250.000 km',
      combustible: 'Diésel',
      transmision: 'Automática',
    },
    ...overrides,
  }
}

describe('generateVehiclePdf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDoc.save.mockClear()
    mockDoc.addImage.mockImplementation(vi.fn())
    mockDoc.splitTextToSize.mockImplementation((text: string) => [text])
    mockCanvas.getContext.mockImplementation(() => mockContext)
    mockCanvas.toDataURL.mockImplementation(() => 'data:image/jpeg;base64,fakeImage')
    vi.stubGlobal('Image', MockImage)
  })

  it('generates a PDF and calls doc.save with correct filename', async () => {
    await generateVehiclePdf({
      vehicle: makeVehicle() as any,
      locale: 'es',
      productName: 'Volvo FH16 2020',
      priceText: '65.000 €',
    })
    expect(mockDoc.save).toHaveBeenCalledOnce()
    expect(mockDoc.save).toHaveBeenCalledWith('Tracciona_Volvo_FH16.pdf')
  })

  it('renders header with brand info', async () => {
    await generateVehiclePdf({
      vehicle: makeVehicle() as any,
      locale: 'es',
      productName: 'Volvo FH16 2020',
      priceText: '65.000 €',
    })
    // Should call text for header contact info
    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0])
    expect(textCalls).toContain('TRACCIONA.COM')
    expect(textCalls).toContain('info@tracciona.com')
    expect(textCalls).toContain('+34 645 779 594')
  })

  it('renders title and price', async () => {
    await generateVehiclePdf({
      vehicle: makeVehicle() as any,
      locale: 'es',
      productName: 'Volvo FH16 2020',
      priceText: '65.000 €',
    })
    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0])
    expect(textCalls).toContain('Volvo FH16 2020')
    expect(textCalls.some((t: string) => t.includes('65.000'))).toBe(true)
  })

  it('renders characteristics section in Spanish', async () => {
    await generateVehiclePdf({
      vehicle: makeVehicle() as any,
      locale: 'es',
      productName: 'Volvo FH16 2020',
      priceText: '65.000 €',
    })
    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0])
    expect(textCalls).toContain('CARACTERÍSTICAS')
    expect(textCalls.some((t: string) => t.includes('potencia'))).toBe(true)
  })

  it('renders characteristics section in English', async () => {
    await generateVehiclePdf({
      vehicle: makeVehicle() as any,
      locale: 'en',
      productName: 'Volvo FH16 2020',
      priceText: '€65,000',
    })
    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0])
    expect(textCalls).toContain('SPECIFICATIONS')
  })

  it('handles vehicle without images', async () => {
    await generateVehiclePdf({
      vehicle: makeVehicle({ vehicle_images: [] }) as any,
      locale: 'es',
      productName: 'Volvo FH16 2020',
      priceText: '65.000 €',
    })
    expect(mockDoc.save).toHaveBeenCalledOnce()
  })

  it('handles vehicle without description', async () => {
    await generateVehiclePdf({
      vehicle: makeVehicle({ description_es: '', description_en: '' }) as any,
      locale: 'es',
      productName: 'Volvo FH16 2020',
      priceText: '65.000 €',
    })
    expect(mockDoc.save).toHaveBeenCalledOnce()
  })

  it('handles vehicle without attributes', async () => {
    await generateVehiclePdf({
      vehicle: makeVehicle({ attributes_json: null }) as any,
      locale: 'es',
      productName: 'Volvo FH16 2020',
      priceText: '65.000 €',
    })
    expect(mockDoc.save).toHaveBeenCalledOnce()
    // CARACTERÍSTICAS should not appear when empty
    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0])
    expect(textCalls).not.toContain('CARACTERÍSTICAS')
  })

  it('uses English location when locale is en', async () => {
    await generateVehiclePdf({
      vehicle: makeVehicle() as any,
      locale: 'en',
      productName: 'Volvo FH16 2020',
      priceText: '€65,000',
    })
    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0])
    expect(textCalls.some((t: string) => t.includes('Madrid, Spain'))).toBe(true)
  })

  it('uses English description when locale is en', async () => {
    await generateVehiclePdf({
      vehicle: makeVehicle() as any,
      locale: 'en',
      productName: 'Volvo FH16 2020',
      priceText: '€65,000',
    })
    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0])
    expect(textCalls).toContain('DESCRIPTION')
  })

  it('renders footer with QR code and vehicle URL', async () => {
    await generateVehiclePdf({
      vehicle: makeVehicle() as any,
      locale: 'es',
      productName: 'Volvo FH16 2020',
      priceText: '65.000 €',
    })
    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0])
    expect(textCalls.some((t: string) => t.includes('tracciona.com/vehiculo/volvo-fh16-2020'))).toBe(true)
  })

  it('handles brand/model with spaces in filename', async () => {
    await generateVehiclePdf({
      vehicle: makeVehicle({ brand: 'Mercedes Benz', model: 'Actros MP4' }) as any,
      locale: 'es',
      productName: 'Mercedes Benz Actros MP4',
      priceText: '70.000 €',
    })
    expect(mockDoc.save).toHaveBeenCalledWith('Tracciona_Mercedes_Benz_Actros_MP4.pdf')
  })

  it('handles vehicle with single image (no gallery)', async () => {
    await generateVehiclePdf({
      vehicle: makeVehicle({ vehicle_images: [{ url: 'https://example.com/img1.jpg' }] }) as any,
      locale: 'es',
      productName: 'Volvo FH16 2020',
      priceText: '65.000 €',
    })
    expect(mockDoc.save).toHaveBeenCalledOnce()
    // Gallery title should not appear with single image
    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0])
    expect(textCalls).not.toContain('GALERÍA DE IMÁGENES')
  })

  it('renders gallery when multiple images exist', async () => {
    await generateVehiclePdf({
      vehicle: makeVehicle() as any,
      locale: 'es',
      productName: 'Volvo FH16 2020',
      priceText: '65.000 €',
    })
    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0])
    expect(textCalls).toContain('GALERÍA DE IMÁGENES')
  })

  it('handles multi-language attributes_json values', async () => {
    await generateVehiclePdf({
      vehicle: makeVehicle({
        attributes_json: {
          tipo: { es: 'Camión', en: 'Truck' },
          estado: { es: 'Usado', en: 'Used', value: 'used' },
        },
      }) as any,
      locale: 'en',
      productName: 'Volvo FH16 2020',
      priceText: '€65,000',
    })
    expect(mockDoc.save).toHaveBeenCalledOnce()
  })

  it('excludes brand/model/year keys from characteristics', async () => {
    await generateVehiclePdf({
      vehicle: makeVehicle({
        attributes_json: {
          brand: 'Volvo',
          model: 'FH16',
          year: 2020,
          potencia: '500 CV',
        },
      }) as any,
      locale: 'es',
      productName: 'Volvo FH16 2020',
      priceText: '65.000 €',
    })
    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0])
    // 'brand', 'model', 'year' should be excluded
    expect(textCalls).not.toContain('brand:')
    expect(textCalls).not.toContain('model:')
    // But 'potencia' should be included
    expect(textCalls.some((t: string) => t.includes('potencia'))).toBe(true)
  })

  it('renders TRACCIONA text fallback when logo fails to load', async () => {
    mockCanvas.getContext.mockReturnValueOnce(null).mockReturnValueOnce(null)
    await generateVehiclePdf({
      vehicle: makeVehicle() as any,
      locale: 'es',
      productName: 'Volvo FH16 2020',
      priceText: '65.000 €',
    })
    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0])
    // Fallback: logo null → text "TRACCIONA" rendered
    expect(textCalls.filter((t: string) => t === 'TRACCIONA').length).toBeGreaterThanOrEqual(1)
  })

  it('handles cover image load failure (null result)', async () => {
    class ErrorImage {
      crossOrigin = ''
      src = ''
      width = 100
      height = 100
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      constructor() {
        setTimeout(() => { if (this.onerror) this.onerror() }, 0)
      }
    }
    vi.stubGlobal('Image', ErrorImage)
    await generateVehiclePdf({
      vehicle: makeVehicle() as any,
      locale: 'es',
      productName: 'Volvo FH16 2020',
      priceText: '65.000 €',
    })
    expect(mockDoc.save).toHaveBeenCalled()
  })

  it('handles toDataURL throwing in loadImageAsBase64', async () => {
    mockCanvas.toDataURL.mockImplementation(() => { throw new Error('SecurityError') })
    await generateVehiclePdf({
      vehicle: makeVehicle() as any,
      locale: 'es',
      productName: 'Volvo FH16 2020',
      priceText: '65.000 €',
    })
    expect(mockDoc.save).toHaveBeenCalled()
  })

  it('shows ellipsis when description exceeds available space', async () => {
    const longDesc = 'A'.repeat(2000) // Very long description
    mockDoc.splitTextToSize.mockReturnValue(
      Array.from({ length: 80 }, (_, i) => `Line ${i + 1}`),
    )
    await generateVehiclePdf({
      vehicle: makeVehicle({ description_es: longDesc }) as any,
      locale: 'es',
      productName: 'Volvo FH16 2020',
      priceText: '65.000 €',
    })
    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0])
    expect(textCalls).toContain('...')
  })

  it('handles QR generation failure in footer', async () => {
    const { generateVehicleQR } = await import('~/utils/generateQR')
    vi.mocked(generateVehicleQR).mockRejectedValueOnce(new Error('QR failed'))
    await generateVehiclePdf({
      vehicle: makeVehicle() as any,
      locale: 'es',
      productName: 'Volvo FH16 2020',
      priceText: '65.000 €',
    })
    expect(mockDoc.save).toHaveBeenCalled()
  })

  it('handles vehicle without location', async () => {
    await generateVehiclePdf({
      vehicle: makeVehicle({ location: null, location_en: null }) as any,
      locale: 'es',
      productName: 'Volvo FH16 2020',
      priceText: '65.000 €',
    })
    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0])
    expect(textCalls.some((t: string) => typeof t === 'string' && t.includes('Ubicación'))).toBe(false)
  })

  it('handles vehicle with null brand/model in filename', async () => {
    await generateVehiclePdf({
      vehicle: makeVehicle({ brand: null, model: null }) as any,
      locale: 'es',
      productName: 'Unknown Vehicle',
      priceText: '0 €',
    })
    expect(mockDoc.save).toHaveBeenCalledWith('Tracciona__.pdf')
  })

  it('renders odd number of characteristics (col=1 finisher)', async () => {
    await generateVehiclePdf({
      vehicle: makeVehicle({
        attributes_json: {
          potencia: '500 CV',
          combustible: 'Diésel',
          color: 'Blanco',
        },
      }) as any,
      locale: 'es',
      productName: 'Volvo FH16 2020',
      priceText: '65.000 €',
    })
    expect(mockDoc.save).toHaveBeenCalled()
  })

  it('renders gallery row break when 4+ thumbnail images exist', async () => {
    await generateVehiclePdf({
      vehicle: makeVehicle({
        vehicle_images: [
          { url: 'https://example.com/cover.jpg' },
          { url: 'https://example.com/t1.jpg' },
          { url: 'https://example.com/t2.jpg' },
          { url: 'https://example.com/t3.jpg' },
          { url: 'https://example.com/t4.jpg' },
          { url: 'https://example.com/t5.jpg' },
        ],
      }) as any,
      locale: 'es',
      productName: 'Volvo FH16 2020',
      priceText: '65.000 €',
    })
    expect(mockDoc.save).toHaveBeenCalled()
    // Gallery should have rendered 5 thumbnails (indices 1-5), triggering row break at 4
    const addImageCalls = mockDoc.addImage.mock.calls.length
    expect(addImageCalls).toBeGreaterThanOrEqual(5)
  })

  it('catches addImage error in renderCoverImage and gallery', async () => {
    // Make addImage throw on JPEG calls (cover + gallery thumbnails)
    mockDoc.addImage.mockImplementation((_data: string, format: string) => {
      if (format === 'JPEG') {
        throw new Error('addImage failed')
      }
    })
    await generateVehiclePdf({
      vehicle: makeVehicle() as any,
      locale: 'es',
      productName: 'Volvo FH16 2020',
      priceText: '65.000 €',
    })
    expect(mockDoc.save).toHaveBeenCalled()
  })
})
