import type { Vehicle } from '~/composables/useVehicles'
import { generateVehicleQR } from '~/utils/generateQR'

// Logo URL — local asset for reliability (avoids Google Drive hotlinking issues)
const LOGO_URL = '/icon-512x512.png'

type RGB = [number, number, number]

const COLORS = {
  petrolBlue: [35, 66, 74] as RGB,
  petrolDark: [26, 50, 56] as RGB,
  white: [255, 255, 255] as RGB,
  darkText: [31, 42, 42] as RGB,
  grayText: [74, 90, 90] as RGB,
  accent: [127, 209, 200] as RGB,
}

interface PdfOptions {
  vehicle: Vehicle
  locale: string
  productName: string
  priceText: string
}

interface PdfLayout {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any
  margin: number
  contentWidth: number
  pageWidth: number
  pageHeight: number
  locale: string
}

interface Characteristic {
  label: string
  value: string
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
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

function extractCharacteristicsFromSource(
  source: Record<string, unknown> | null | undefined,
  locale: string,
  excludeKeys: Set<string>,
  seenKeys: Set<string>,
  out: Characteristic[],
) {
  if (!source || typeof source !== 'object') return
  for (const [key, value] of Object.entries(source)) {
    if (!value || excludeKeys.has(key.toLowerCase()) || seenKeys.has(key)) continue
    seenKeys.add(key)
    let displayValue: string
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, string>
      displayValue = obj[locale] || obj.es || obj.value || JSON.stringify(value)
    } else {
      displayValue = String(value as string | number | boolean)
    }
    if (displayValue) out.push({ label: key, value: displayValue })
  }
}

function collectCharacteristics(vehicle: Vehicle, locale: string): Characteristic[] {
  const characteristics: Characteristic[] = []
  const excludeKeys = new Set(['marca', 'modelo', 'año', 'brand', 'model', 'year'])
  const seenKeys = new Set<string>()

  extractCharacteristicsFromSource(
    vehicle.attributes_json,
    locale,
    excludeKeys,
    seenKeys,
    characteristics,
  )
  extractCharacteristicsFromSource(
    (vehicle as unknown as Record<string, unknown>).caracteristicas_json as Record<string, unknown>,
    locale,
    excludeKeys,
    seenKeys,
    characteristics,
  )
  return characteristics
}

function computeLayout(numChars: number, descLength: number, numImages: number) {
  const headerHeight = 32
  const footerHeight = 14
  const titleHeight = 22
  const charsHeight = Math.min(numChars * 4.5 + 8, 45)
  const descHeight = descLength ? Math.min(Math.ceil(descLength / 80) * 4 + 10, 40) : 0
  const galleryNeeded = numImages > 1

  const fixedContent = headerHeight + titleHeight + charsHeight + descHeight + footerHeight + 20
  const availableForImages = 297 - fixedContent

  let portadaHeight: number
  let galleryHeight: number
  if (galleryNeeded) {
    portadaHeight = Math.min(Math.max(availableForImages * 0.6, 50), 85)
    galleryHeight = Math.min(Math.max(availableForImages * 0.35, 25), 45)
  } else {
    portadaHeight = Math.min(Math.max(availableForImages * 0.9, 60), 100)
    galleryHeight = 0
  }

  return { headerHeight, footerHeight, portadaHeight, galleryHeight }
}

async function renderHeader(layout: PdfLayout, headerHeight: number): Promise<void> {
  const { doc, pageWidth, margin } = layout

  doc.setFillColor(...COLORS.petrolDark)
  doc.rect(0, 0, pageWidth, headerHeight / 2, 'F')
  doc.setFillColor(...COLORS.petrolBlue)
  doc.rect(0, headerHeight / 2, pageWidth, headerHeight / 2, 'F')

  const logoBase64 = await loadImageAsBase64(LOGO_URL)
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', margin, 5, 22, 22)
  } else {
    doc.setTextColor(...COLORS.white)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('TRACCIONA', margin, 20)
  }

  doc.setDrawColor(...COLORS.accent)
  doc.setLineWidth(0.8)
  const accentStart = logoBase64 ? margin + 24 : margin
  doc.line(accentStart, 23, accentStart + 45, 23)

  const siteDomain = useSiteUrl().replace('https://', '').replace('http://', '')
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  const contactX = pageWidth - margin
  doc.text(siteDomain.toUpperCase(), contactX, 12, { align: 'right' })
  doc.text(`info@${siteDomain}`, contactX, 18, { align: 'right' })
  doc.text('+34 645 779 594', contactX, 24, { align: 'right' })
}

async function renderCoverImage(
  layout: PdfLayout,
  coverUrl: string | undefined,
  yPos: number,
  portadaHeight: number,
): Promise<number> {
  if (!coverUrl) return yPos
  try {
    const mainImg = await loadImageAsBase64(coverUrl)
    if (!mainImg) return yPos
    let imgWidth = layout.contentWidth
    let imgHeight = imgWidth * 0.5625
    if (imgHeight > portadaHeight) {
      imgHeight = portadaHeight
      imgWidth = imgHeight / 0.5625
    }
    const xOffset = layout.margin + (layout.contentWidth - imgWidth) / 2
    layout.doc.addImage(mainImg, 'JPEG', xOffset, yPos, imgWidth, imgHeight)
    return yPos + imgHeight + 6
  } catch {
    return yPos + 10
  }
}

function renderTitlePrice(
  layout: PdfLayout,
  productName: string,
  priceText: string,
  location: string | undefined,
  yPos: number,
): number {
  const { doc, margin, locale } = layout

  doc.setTextColor(...COLORS.darkText)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(productName, margin, yPos)
  yPos += 6

  doc.setFontSize(12)
  doc.setTextColor(...COLORS.petrolBlue)
  doc.text(`${locale === 'es' ? 'Precio' : 'Price'}: ${priceText}`, margin, yPos)
  yPos += 5

  if (location) {
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.grayText)
    doc.setFont('helvetica', 'normal')
    doc.text(`${locale === 'es' ? 'Ubicación' : 'Location'}: ${location}`, margin, yPos)
    yPos += 6
  }
  return yPos
}

function renderCharacteristics(
  layout: PdfLayout,
  characteristics: Characteristic[],
  yPos: number,
): number {
  if (characteristics.length === 0) return yPos

  const { doc, margin, pageWidth, contentWidth, locale } = layout

  doc.setDrawColor(...COLORS.petrolBlue)
  doc.setLineWidth(0.3)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 5

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.darkText)
  doc.text(locale === 'es' ? 'CARACTERÍSTICAS' : 'SPECIFICATIONS', margin, yPos)
  yPos += 5

  doc.setFontSize(8)
  const colWidth = contentWidth / 2
  let col = 0

  for (const car of characteristics.slice(0, 10)) {
    const xPos = margin + col * colWidth
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.grayText)
    doc.text(`${car.label}:`, xPos, yPos)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.darkText)
    const labelWidth = Math.min(doc.getTextWidth(`${car.label}: `), 28)
    doc.text(car.value.substring(0, 20), xPos + labelWidth + 1, yPos)
    col++
    if (col >= 2) {
      col = 0
      yPos += 4.5
    }
  }
  if (col === 1) yPos += 4.5
  return yPos + 3
}

async function renderGallery(
  layout: PdfLayout,
  images: { url: string }[],
  yPos: number,
  galleryHeight: number,
): Promise<number> {
  if (images.length <= 1 || galleryHeight <= 0) return yPos

  const { doc, margin, pageWidth, contentWidth, locale } = layout

  doc.setDrawColor(...COLORS.petrolBlue)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 5

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.darkText)
  doc.text(locale === 'es' ? 'GALERÍA DE IMÁGENES' : 'IMAGE GALLERY', margin, yPos)
  yPos += 5

  const maxThumbsPerRow = 4
  const thumbGap = 4
  const thumbWidth = (contentWidth - thumbGap * (maxThumbsPerRow - 1)) / maxThumbsPerRow
  const thumbHeight = Math.min(thumbWidth * 0.65, galleryHeight - 10)

  let thumbX = margin
  let thumbCount = 0

  for (let i = 1; i < images.length && thumbCount < 8; i++) {
    try {
      const thumbImg = await loadImageAsBase64(images[i]!.url)
      if (!thumbImg) continue
      doc.addImage(thumbImg, 'JPEG', thumbX, yPos, thumbWidth, thumbHeight)
      thumbX += thumbWidth + thumbGap
      thumbCount++
      if (thumbCount % maxThumbsPerRow === 0) {
        thumbX = margin
        yPos += thumbHeight + 3
      }
    } catch {
      /* skip failed images */
    }
  }

  if (thumbCount % maxThumbsPerRow !== 0) {
    yPos += thumbHeight + 3
  }
  return yPos + 2
}

function renderDescription(
  layout: PdfLayout,
  description: string,
  yPos: number,
  footerHeight: number,
): void {
  if (!description) return

  const { doc, margin, pageWidth, contentWidth, pageHeight, locale } = layout

  doc.setDrawColor(...COLORS.petrolBlue)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 5

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.darkText)
  doc.text(locale === 'es' ? 'DESCRIPCIÓN' : 'DESCRIPTION', margin, yPos)
  yPos += 5

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.grayText)

  const splitDesc = doc.splitTextToSize(description, contentWidth) as string[]
  const remainingSpace = pageHeight - yPos - footerHeight - 5
  const maxLines = Math.floor(remainingSpace / 4)
  const linesToShow = splitDesc.slice(0, Math.max(maxLines, 3))

  for (const line of linesToShow) {
    doc.text(line, margin, yPos)
    yPos += 4
  }
  if (splitDesc.length > linesToShow.length) {
    doc.text('...', margin, yPos)
  }
}

async function renderFooter(
  layout: PdfLayout,
  vehicleSlug: string,
  footerHeight: number,
): Promise<void> {
  const { doc, margin, pageWidth, pageHeight, locale } = layout
  const footerY = pageHeight - footerHeight
  const siteUrl = useSiteUrl()
  const vehicleUrl = `${siteUrl}/vehiculo/${vehicleSlug}`

  let qrDataUrl: string | null = null
  try {
    qrDataUrl = await generateVehicleQR(vehicleSlug, 128)
  } catch {
    // QR generation failed, continue without it
  }

  if (qrDataUrl) {
    const qrSize = 18
    const qrX = pageWidth - margin - qrSize
    const qrY = footerY - qrSize - 3
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
    doc.setFontSize(6)
    doc.setTextColor(...COLORS.grayText)
    doc.text(
      locale === 'es' ? 'Escanea para ver online' : 'Scan to view online',
      qrX + qrSize / 2,
      qrY + qrSize + 3,
      { align: 'center' },
    )
  }

  doc.setFillColor(...COLORS.petrolBlue)
  doc.rect(0, footerY, pageWidth, footerHeight, 'F')

  doc.setFontSize(7)
  doc.setTextColor(...COLORS.white)
  doc.text(vehicleUrl, margin, footerY + 5)
  const footerDomain = siteUrl.replace('https://', '').replace('http://', '')
  doc.text(
    locale === 'es' ? `Más vehículos en ${footerDomain}` : `More vehicles at ${footerDomain}`,
    margin,
    footerY + 10,
  )
  doc.text(footerDomain.toUpperCase(), pageWidth - margin, footerY + 8, { align: 'right' })
}

export async function generateVehiclePdf(opts: PdfOptions): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const { vehicle, locale, productName, priceText } = opts

  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = 210
  const pageHeight = 297
  const margin = 12
  const contentWidth = pageWidth - margin * 2

  const layout: PdfLayout = { doc, margin, contentWidth, pageWidth, pageHeight, locale }

  const characteristics = collectCharacteristics(vehicle, locale)
  const description =
    locale === 'en' && vehicle.description_en // NOSONAR typescript:S1874
      ? vehicle.description_en // NOSONAR typescript:S1874
      : vehicle.description_es || '' // NOSONAR typescript:S1874
  const numImages = vehicle.vehicle_images?.length || 0
  const { headerHeight, footerHeight, portadaHeight, galleryHeight } = computeLayout(
    characteristics.length,
    description.length,
    numImages,
  )

  await renderHeader(layout, headerHeight)

  let yPos = headerHeight + 8
  const coverUrl = vehicle.vehicle_images?.[0]?.url
  yPos = await renderCoverImage(layout, coverUrl, yPos, portadaHeight)

  const location = locale === 'en' && vehicle.location_en ? vehicle.location_en : vehicle.location
  yPos = renderTitlePrice(layout, productName, priceText, location ?? undefined, yPos)
  yPos = renderCharacteristics(layout, characteristics, yPos)
  yPos = await renderGallery(layout, vehicle.vehicle_images || [], yPos, galleryHeight)
  renderDescription(layout, description, yPos, footerHeight)
  await renderFooter(layout, vehicle.slug, footerHeight)

  const fileName = `Tracciona_${vehicle.brand || ''}_${vehicle.model || ''}`.replaceAll(/\s+/g, '_')
  doc.save(`${fileName}.pdf`)
}
