/**
 * Tests for app/utils/generateDealerCard.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock jsPDF (dynamically imported inside generateDealerCardPdf)
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
  addPage: vi.fn(),
  circle: vi.fn(),
  roundedRect: vi.fn(),
  getTextWidth: vi.fn().mockReturnValue(20),
  splitTextToSize: vi.fn((text: string) => [text]),
  save: vi.fn(),
}

vi.mock('jspdf', () => {
  function JsPDFConstructor() { return mockDoc }
  return { jsPDF: JsPDFConstructor }
})

// Mock generateQR
vi.mock('~/utils/generateQR', () => ({
  generateDealerQR: vi.fn().mockResolvedValue('data:image/png;base64,fakeQR'),
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
    setTimeout(() => {
      if (this.onload) this.onload()
    }, 0)
  }
}

vi.stubGlobal('Image', MockImage)

// Mock canvas
const mockCtx = { drawImage: vi.fn() }
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => mockCtx),
  toDataURL: vi.fn(() => 'data:image/png;base64,fakeLogo'),
}

const origCreateElement = globalThis.document?.createElement?.bind(globalThis.document)
vi.spyOn(globalThis.document, 'createElement').mockImplementation((tag: string) => {
  if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement
  return origCreateElement?.(tag) ?? ({} as HTMLElement)
})

// ── Static import ─────────────────────────────────────────────────────────────

import { generateDealerCardPdf } from '../../app/utils/generateDealerCard'

// ── Helpers ───────────────────────────────────────────────────────────────────

const baseOpts = {
  dealer: {
    slug: 'mi-dealer',
    companyName: 'Mi Dealer SL',
    logoUrl: null as string | null,
    phone: '+34 600 000 000',
    whatsapp: '34600000000',
    email: 'info@midealer.com',
    website: 'https://midealer.com',
    address: 'Calle Mayor 1, Madrid',
    badge: null as string | null,
  },
  locale: 'es',
}

function getAllTextArgs(calls: any[][]): string[] {
  return calls.map(args =>
    Array.isArray(args[0]) ? args[0].join(' ') : String(args[0]),
  )
}

// ══ Tests ═════════════════════════════════════════════════════════════════════

describe('generateDealerCardPdf', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('generates a PDF and saves with dealer name', async () => {
    await generateDealerCardPdf(baseOpts)
    expect(mockDoc.save).toHaveBeenCalledWith(expect.stringContaining('Tracciona_Card_'))
  })

  it('adds back page with addPage', async () => {
    await generateDealerCardPdf(baseOpts)
    expect(mockDoc.addPage).toHaveBeenCalledWith([90, 55])
  })

  it('includes company name on front page', async () => {
    await generateDealerCardPdf(baseOpts)
    const texts = getAllTextArgs(mockDoc.text.mock.calls)
    expect(texts.some(t => t.includes('Mi Dealer SL'))).toBe(true)
  })

  it('includes TRACCIONA branding on back page', async () => {
    await generateDealerCardPdf(baseOpts)
    const texts = getAllTextArgs(mockDoc.text.mock.calls)
    expect(texts.some(t => t.includes('TRACCIONA'))).toBe(true)
  })

  it('shows Spanish tagline when locale is es', async () => {
    await generateDealerCardPdf({ ...baseOpts, locale: 'es' })
    const texts = getAllTextArgs(mockDoc.text.mock.calls)
    expect(texts.some(t => t.includes('Industriales'))).toBe(true)
  })

  it('shows English tagline when locale is en', async () => {
    await generateDealerCardPdf({ ...baseOpts, locale: 'en' })
    const texts = getAllTextArgs(mockDoc.text.mock.calls)
    expect(texts.some(t => t.includes('Industrial Vehicle Marketplace'))).toBe(true)
  })

  it('adds logo image and circle background when logoUrl is provided', async () => {
    await generateDealerCardPdf({
      ...baseOpts,
      dealer: { ...baseOpts.dealer, logoUrl: 'https://cdn/logo.png' },
    })
    expect(mockDoc.circle).toHaveBeenCalled()
    expect(mockDoc.addImage).toHaveBeenCalledWith('data:image/png;base64,fakeLogo', 'PNG', expect.any(Number), expect.any(Number), expect.any(Number), expect.any(Number))
  })

  it('does not draw circle when logoUrl is null', async () => {
    await generateDealerCardPdf(baseOpts) // logoUrl: null
    expect(mockDoc.circle).not.toHaveBeenCalled()
  })

  it('shows FOUNDING badge text', async () => {
    await generateDealerCardPdf({
      ...baseOpts,
      dealer: { ...baseOpts.dealer, badge: 'founding' },
    })
    const texts = getAllTextArgs(mockDoc.text.mock.calls)
    expect(texts.some(t => t.includes('FOUNDING'))).toBe(true)
  })

  it('shows PREMIUM badge text', async () => {
    await generateDealerCardPdf({
      ...baseOpts,
      dealer: { ...baseOpts.dealer, badge: 'premium' },
    })
    const texts = getAllTextArgs(mockDoc.text.mock.calls)
    expect(texts.some(t => t.includes('PREMIUM'))).toBe(true)
  })

  it('shows VERIFIED badge for unknown badge type', async () => {
    await generateDealerCardPdf({
      ...baseOpts,
      dealer: { ...baseOpts.dealer, badge: 'unknown-type' },
    })
    const texts = getAllTextArgs(mockDoc.text.mock.calls)
    expect(texts.some(t => t.includes('VERIFIED'))).toBe(true)
  })

  it('renders phone number in contact info', async () => {
    await generateDealerCardPdf(baseOpts)
    const texts = getAllTextArgs(mockDoc.text.mock.calls)
    expect(texts.some(t => t.includes('+34 600 000 000'))).toBe(true)
  })

  it('renders dealer profile URL on back page', async () => {
    await generateDealerCardPdf(baseOpts)
    const texts = getAllTextArgs(mockDoc.text.mock.calls)
    expect(texts.some(t => t.includes('mi-dealer'))).toBe(true)
  })

  it('strips website protocol for display', async () => {
    await generateDealerCardPdf(baseOpts)
    const texts = getAllTextArgs(mockDoc.text.mock.calls)
    // "https://midealer.com" → "midealer.com"
    expect(texts.some(t => t.includes('midealer.com') && !t.includes('https://'))).toBe(true)
  })

  it('renders address at bottom when provided', async () => {
    await generateDealerCardPdf(baseOpts)
    // splitTextToSize is called for address
    const splitCalls = mockDoc.splitTextToSize.mock.calls.map(args => args[0])
    expect(splitCalls.some(t => t.includes('Calle Mayor'))).toBe(true)
  })

  it('adds QR code image on front and back pages', async () => {
    await generateDealerCardPdf(baseOpts)
    // addImage called at least twice (front QR + back QR)
    expect(mockDoc.addImage.mock.calls.filter(
      ([data]: any[]) => data === 'data:image/png;base64,fakeQR',
    ).length).toBeGreaterThanOrEqual(2)
  })

  it('skips phone when not provided', async () => {
    await generateDealerCardPdf({
      ...baseOpts,
      dealer: { ...baseOpts.dealer, phone: null },
    })
    const texts = getAllTextArgs(mockDoc.text.mock.calls)
    expect(texts.some(t => t.includes('Tel:'))).toBe(false)
  })

  it('resolves null logo when canvas getContext returns null', async () => {
    mockCanvas.getContext.mockReturnValueOnce(null)
    await generateDealerCardPdf({
      ...baseOpts,
      dealer: { ...baseOpts.dealer, logoUrl: 'https://cdn/logo.png' },
    })
    expect(mockDoc.save).toHaveBeenCalled()
    expect(mockDoc.circle).not.toHaveBeenCalled()
  })

  it('resolves null logo when canvas toDataURL throws', async () => {
    mockCanvas.toDataURL.mockImplementationOnce(() => { throw new Error('SecurityError') })
    await generateDealerCardPdf({
      ...baseOpts,
      dealer: { ...baseOpts.dealer, logoUrl: 'https://cdn/logo.png' },
    })
    expect(mockDoc.save).toHaveBeenCalled()
    expect(mockDoc.circle).not.toHaveBeenCalled()
  })

  it('resolves null logo when image onerror fires', async () => {
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

    await generateDealerCardPdf({
      ...baseOpts,
      dealer: { ...baseOpts.dealer, logoUrl: 'https://cdn/bad.png' },
    })
    expect(mockDoc.save).toHaveBeenCalled()
    expect(mockDoc.circle).not.toHaveBeenCalled()

    vi.stubGlobal('Image', MockImage)
  })
})
