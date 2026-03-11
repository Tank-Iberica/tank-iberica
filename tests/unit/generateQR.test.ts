/**
 * Tests for app/utils/generateQR.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockToDataURL } = vi.hoisted(() => ({
  mockToDataURL: vi.fn().mockResolvedValue('data:image/png;base64,fakeQRData'),
}))

vi.mock('qrcode', () => ({
  default: { toDataURL: mockToDataURL },
}))

// ── Static imports ─────────────────────────────────────────────────────────────

import { generateQRDataURL, generateDealerQR, generateVehicleQR } from '../../app/utils/generateQR'

// ══ Tests ═════════════════════════════════════════════════════════════════════

describe('generateQRDataURL', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls QRCode.toDataURL with default parameters', async () => {
    await generateQRDataURL({ text: 'https://example.com' })
    expect(mockToDataURL).toHaveBeenCalledWith('https://example.com', expect.objectContaining({
      width: 256,
      margin: 1,
      errorCorrectionLevel: 'M',
    }))
  })

  it('returns the data URL from QRCode', async () => {
    const result = await generateQRDataURL({ text: 'test' })
    expect(result).toBe('data:image/png;base64,fakeQRData')
  })

  it('uses custom size when provided', async () => {
    await generateQRDataURL({ text: 'test', size: 512 })
    expect(mockToDataURL).toHaveBeenCalledWith('test', expect.objectContaining({ width: 512 }))
  })

  it('uses custom dark and light colors when provided', async () => {
    await generateQRDataURL({ text: 'test', darkColor: '#000000', lightColor: '#FFFFFF' })
    expect(mockToDataURL).toHaveBeenCalledWith('test', expect.objectContaining({
      color: { dark: '#000000', light: '#FFFFFF' },
    }))
  })

  it('defaults to petrol blue dark color', async () => {
    await generateQRDataURL({ text: 'test' })
    const [, opts] = mockToDataURL.mock.calls[0]!
    expect(opts.color.dark).toBe('#23424A')
  })

  it('uses custom error correction level when provided', async () => {
    await generateQRDataURL({ text: 'test', errorCorrectionLevel: 'H' })
    expect(mockToDataURL).toHaveBeenCalledWith('test', expect.objectContaining({
      errorCorrectionLevel: 'H',
    }))
  })
})

describe('generateDealerQR', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('generates QR for dealer profile URL with default size', async () => {
    await generateDealerQR('mi-dealer')
    expect(mockToDataURL).toHaveBeenCalledWith(
      'https://tracciona.com/mi-dealer',
      expect.objectContaining({ width: 256 }),
    )
  })

  it('uses custom size when provided', async () => {
    await generateDealerQR('mi-dealer', 512)
    expect(mockToDataURL).toHaveBeenCalledWith(
      'https://tracciona.com/mi-dealer',
      expect.objectContaining({ width: 512 }),
    )
  })

  it('returns the QR data URL', async () => {
    const result = await generateDealerQR('test-dealer')
    expect(result).toBe('data:image/png;base64,fakeQRData')
  })
})

describe('generateVehicleQR', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('generates QR for vehicle page URL with default size', async () => {
    await generateVehicleQR('volvo-fh16-2020')
    expect(mockToDataURL).toHaveBeenCalledWith(
      'https://tracciona.com/vehiculo/volvo-fh16-2020',
      expect.objectContaining({ width: 256 }),
    )
  })

  it('uses custom size when provided', async () => {
    await generateVehicleQR('volvo-fh16-2020', 128)
    expect(mockToDataURL).toHaveBeenCalledWith(
      'https://tracciona.com/vehiculo/volvo-fh16-2020',
      expect.objectContaining({ width: 128 }),
    )
  })

  it('returns the QR data URL', async () => {
    const result = await generateVehicleQR('test-vehicle')
    expect(result).toBe('data:image/png;base64,fakeQRData')
  })
})
