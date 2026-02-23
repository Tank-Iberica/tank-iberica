import { generateDealerQR } from '~/utils/generateQR'

interface DealerCardInfo {
  slug: string
  companyName: string
  logoUrl: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  address: string | null
  badge: string | null
}

interface CardOptions {
  dealer: DealerCardInfo
  locale: string
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }
      ctx.drawImage(img, 0, 0)
      try {
        resolve(canvas.toDataURL('image/png'))
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

/**
 * Generate a professional dealer business card PDF (A4 page with 2 cards).
 * Each card: 90mm × 55mm (standard business card size).
 * Includes: logo, company name, contact info, QR code to dealer profile.
 */
export async function generateDealerCardPdf(opts: CardOptions): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const { dealer, locale } = opts

  const doc = new jsPDF('l', 'mm', [90, 55])

  // Corporate colors
  const petrolBlue: [number, number, number] = [35, 66, 74]
  const white: [number, number, number] = [255, 255, 255]
  const _darkText: [number, number, number] = [31, 42, 42]
  const grayText: [number, number, number] = [74, 90, 90]
  const accentColor: [number, number, number] = [127, 209, 200]

  // Badge colors
  const badgeColors: Record<string, [number, number, number]> = {
    founding: [245, 213, 71],
    premium: [35, 66, 74],
    verified: [16, 185, 129],
  }

  // Card dimensions
  const cardW = 90
  const cardH = 55

  // Generate QR code
  const qrDataUrl = await generateDealerQR(dealer.slug, 512)

  // Load logo
  let logoBase64: string | null = null
  if (dealer.logoUrl) {
    logoBase64 = await loadImageAsBase64(dealer.logoUrl)
  }

  // ===== FRONT SIDE =====
  // Background
  doc.setFillColor(...petrolBlue)
  doc.rect(0, 0, cardW, cardH, 'F')

  // Accent line at top
  doc.setFillColor(...accentColor)
  doc.rect(0, 0, cardW, 1.5, 'F')

  // Logo (left side)
  const logoSize = 16
  const logoX = 6
  const logoY = 8
  if (logoBase64) {
    // White circle background for logo
    doc.setFillColor(...white)
    doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 1, 'F')
    doc.addImage(logoBase64, 'PNG', logoX, logoY, logoSize, logoSize)
  }

  // Company name
  const nameX = logoBase64 ? logoX + logoSize + 4 : 6
  doc.setTextColor(...white)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  const nameLines = doc.splitTextToSize(dealer.companyName, 50) as string[]
  doc.text(nameLines.slice(0, 2), nameX, 14)

  // Badge
  if (dealer.badge && dealer.badge !== 'none') {
    const badgeY = nameLines.length > 1 ? 22 : 19
    const badgeColor = badgeColors[dealer.badge] || accentColor
    doc.setFillColor(...badgeColor)
    const badgeText =
      dealer.badge === 'founding' ? 'FOUNDING' : dealer.badge === 'premium' ? 'PREMIUM' : 'VERIFIED'
    const badgeW = doc.getTextWidth(badgeText) * 0.55 + 4
    doc.roundedRect(nameX, badgeY, badgeW, 4, 1, 1, 'F')
    doc.setTextColor(
      ...(dealer.badge === 'founding' ? ([90, 69, 0] as [number, number, number]) : white),
    )
    doc.setFontSize(5)
    doc.setFont('helvetica', 'bold')
    doc.text(badgeText, nameX + 2, badgeY + 3)
  }

  // Contact info
  let contactY = 32
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...white)

  if (dealer.phone) {
    doc.text(`Tel: ${dealer.phone}`, 6, contactY)
    contactY += 4
  }
  if (dealer.whatsapp) {
    doc.text(`WhatsApp: +${dealer.whatsapp}`, 6, contactY)
    contactY += 4
  }
  if (dealer.email) {
    doc.text(dealer.email, 6, contactY)
    contactY += 4
  }
  if (dealer.website) {
    const displayUrl = dealer.website.replace(/^https?:\/\//, '').replace(/\/$/, '')
    doc.text(displayUrl, 6, contactY)
    contactY += 4
  }

  // Address at bottom
  if (dealer.address) {
    doc.setFontSize(5.5)
    doc.setTextColor(180, 200, 205)
    const addrLines = doc.splitTextToSize(dealer.address, 55) as string[]
    doc.text(addrLines.slice(0, 1), 6, 51)
  }

  // QR code on the right side
  const qrSize = 20
  const qrX = cardW - qrSize - 5
  const qrY = 28
  // White background for QR
  doc.setFillColor(...white)
  doc.roundedRect(qrX - 1.5, qrY - 1.5, qrSize + 3, qrSize + 3, 1.5, 1.5, 'F')
  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)

  // URL under QR
  doc.setFontSize(4.5)
  doc.setTextColor(...accentColor)
  doc.text('tracciona.com', qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' })

  // ===== BACK SIDE =====
  doc.addPage([90, 55])

  // Light background
  doc.setFillColor(...white)
  doc.rect(0, 0, cardW, cardH, 'F')

  // Accent bar at top
  doc.setFillColor(...petrolBlue)
  doc.rect(0, 0, cardW, 2, 'F')
  doc.setFillColor(...accentColor)
  doc.rect(0, 2, cardW, 0.5, 'F')

  // Tracciona branding
  doc.setTextColor(...petrolBlue)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('TRACCIONA', cardW / 2, 16, { align: 'center' })

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...grayText)
  const tagline =
    locale === 'en' ? 'Industrial Vehicle Marketplace' : 'Marketplace de Vehiculos Industriales'
  doc.text(tagline, cardW / 2, 22, { align: 'center' })

  // Separator
  doc.setDrawColor(...accentColor)
  doc.setLineWidth(0.3)
  doc.line(25, 27, 65, 27)

  // Dealer profile URL
  doc.setFontSize(8)
  doc.setTextColor(...petrolBlue)
  doc.setFont('helvetica', 'bold')
  const profileUrl = `tracciona.com/${dealer.slug}`
  doc.text(profileUrl, cardW / 2, 34, { align: 'center' })

  // Large QR code centered
  const backQrSize = 14
  doc.addImage(qrDataUrl, 'PNG', (cardW - backQrSize) / 2, 37, backQrSize, backQrSize)

  // Footer bar
  doc.setFillColor(...petrolBlue)
  doc.rect(0, cardH - 2, cardW, 2, 'F')

  // ===== SAVE =====
  const safeName = dealer.companyName.replace(/[^a-z0-9]/gi, '_').substring(0, 30)
  doc.save(`Tracciona_Card_${safeName}.pdf`)
}
