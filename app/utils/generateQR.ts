import QRCode from 'qrcode'

interface QROptions {
  /** URL or text to encode */
  text: string
  /** Size in pixels (default 256) */
  size?: number
  /** Dark color (default #23424A — petrol blue) */
  darkColor?: string
  /** Light color (default transparent) */
  lightColor?: string
  /** Error correction level (default M) */
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

/**
 * Generate a QR code as data URL (base64 PNG).
 * Suitable for embedding in PDFs, images, or <img> tags.
 */
export async function generateQRDataURL(options: QROptions): Promise<string> {
  const {
    text,
    size = 256,
    darkColor = '#23424A',
    lightColor = '#FFFFFF',
    errorCorrectionLevel = 'M',
  } = options

  return QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    color: {
      dark: darkColor,
      light: lightColor,
    },
    errorCorrectionLevel,
  })
}

/**
 * Generate a QR code for a dealer profile URL.
 * Encodes: https://tracciona.com/{dealer-slug}
 */
export async function generateDealerQR(dealerSlug: string, size = 256): Promise<string> {
  return generateQRDataURL({
    text: `https://tracciona.com/${dealerSlug}`,
    size,
  })
}

/**
 * Generate a QR code for a vehicle page URL.
 * Encodes: https://tracciona.com/vehiculo/{vehicle-slug}
 */
export async function generateVehicleQR(vehicleSlug: string, size = 256): Promise<string> {
  return generateQRDataURL({
    text: `https://tracciona.com/vehiculo/${vehicleSlug}`,
    size,
  })
}
