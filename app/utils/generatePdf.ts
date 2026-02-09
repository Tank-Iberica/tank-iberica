import type { Vehicle } from '~/composables/useVehicles'

// Logo URL — hosted on Cloudinary for reliability (originally from Google Drive)
const LOGO_URL = 'https://lh3.googleusercontent.com/d/1LoKrBHe5pLXYdXDAhNdMTiP4Xkm_jDbD'

interface PdfOptions {
  vehicle: Vehicle
  locale: string
  productName: string
  priceText: string
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
      if (!ctx) { resolve(null); return }
      ctx.drawImage(img, 0, 0)
      try {
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

export async function generateVehiclePdf(opts: PdfOptions): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const { vehicle, locale, productName, priceText } = opts

  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = 210
  const pageHeight = 297
  const margin = 12
  const contentWidth = pageWidth - margin * 2

  // Corporate colors from design system (tokens.css)
  const petrolBlue: [number, number, number] = [35, 66, 74]   // #23424A --color-primary
  const petrolDark: [number, number, number] = [26, 50, 56]    // #1A3238 --color-primary-dark
  const white: [number, number, number] = [255, 255, 255]
  const darkText: [number, number, number] = [31, 42, 42]      // #1F2A2A --text-primary
  const grayText: [number, number, number] = [74, 90, 90]      // #4A5A5A --text-secondary
  const accentColor: [number, number, number] = [127, 209, 200] // #7FD1C8 --color-accent

  // Collect characteristics from both sources (like legacy)
  const characteristics: { label: string, value: string }[] = []
  const excludeKeys = ['marca', 'modelo', 'año', 'brand', 'model', 'year']
  const seenKeys = new Set<string>()

  function extractCharacteristics(source: Record<string, unknown> | null | undefined) {
    if (!source || typeof source !== 'object') return
    for (const [key, value] of Object.entries(source)) {
      if (!value || excludeKeys.includes(key.toLowerCase()) || seenKeys.has(key)) continue
      seenKeys.add(key)
      let displayValue: string
      if (typeof value === 'object' && value !== null) {
        const obj = value as Record<string, string>
        displayValue = obj[locale] || obj.es || obj.value || String(value)
      }
      else {
        displayValue = String(value)
      }
      if (displayValue) characteristics.push({ label: key, value: displayValue })
    }
  }

  extractCharacteristics(vehicle.filters_json)
  extractCharacteristics((vehicle as Record<string, unknown>).caracteristicas_json as Record<string, unknown>)

  const description = locale === 'en' && vehicle.description_en
    ? vehicle.description_en
    : vehicle.description_es || ''
  const numImages = vehicle.vehicle_images?.length || 0

  // Layout calculations
  const headerHeight = 32
  const footerHeight = 14
  const titleHeight = 22
  const charsHeight = Math.min(characteristics.length * 4.5 + 8, 45)
  const descHeight = description ? Math.min(Math.ceil(description.length / 80) * 4 + 10, 40) : 0
  const galleryNeeded = numImages > 1

  const fixedContent = headerHeight + titleHeight + charsHeight + descHeight + footerHeight + 20
  const availableForImages = pageHeight - fixedContent

  let portadaHeight: number
  let galleryHeight: number
  if (galleryNeeded) {
    portadaHeight = Math.min(Math.max(availableForImages * 0.6, 50), 85)
    galleryHeight = Math.min(Math.max(availableForImages * 0.35, 25), 45)
  }
  else {
    portadaHeight = Math.min(Math.max(availableForImages * 0.9, 60), 100)
    galleryHeight = 0
  }

  // ===== HEADER =====
  // Gradient effect: dark at top, lighter at bottom
  doc.setFillColor(...petrolDark)
  doc.rect(0, 0, pageWidth, headerHeight / 2, 'F')
  doc.setFillColor(...petrolBlue)
  doc.rect(0, headerHeight / 2, pageWidth, headerHeight / 2, 'F')

  // Logo image (fallback to text if load fails)
  const logoBase64 = await loadImageAsBase64(LOGO_URL)
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', margin, 5, 22, 22)
  }
  else {
    doc.setTextColor(...white)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('TANK IBERICA', margin, 20)
  }

  // Accent line under logo
  doc.setDrawColor(...accentColor)
  doc.setLineWidth(0.8)
  const accentStart = logoBase64 ? margin + 24 : margin
  doc.line(accentStart, 23, accentStart + 45, 23)

  doc.setTextColor(...white)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  const contactX = pageWidth - margin
  doc.text('TANKIBERICA.COM', contactX, 12, { align: 'right' })
  doc.text('info@tankiberica.com', contactX, 18, { align: 'right' })
  doc.text('+34 645 779 594', contactX, 24, { align: 'right' })

  let yPos = headerHeight + 8

  // ===== COVER IMAGE =====
  const coverImage = vehicle.vehicle_images?.[0]
  if (coverImage?.url) {
    try {
      const mainImg = await loadImageAsBase64(coverImage.url)
      if (mainImg) {
        let imgWidth = contentWidth
        let imgHeight = imgWidth * 0.5625
        if (imgHeight > portadaHeight) {
          imgHeight = portadaHeight
          imgWidth = imgHeight / 0.5625
        }
        const xOffset = margin + (contentWidth - imgWidth) / 2
        doc.addImage(mainImg, 'JPEG', xOffset, yPos, imgWidth, imgHeight)
        yPos += imgHeight + 6
      }
    }
    catch {
      yPos += 10
    }
  }

  // ===== TITLE & PRICE =====
  doc.setTextColor(...darkText)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(productName, margin, yPos)
  yPos += 6

  doc.setFontSize(12)
  doc.setTextColor(...petrolBlue)
  doc.text(`${locale === 'es' ? 'Precio' : 'Price'}: ${priceText}`, margin, yPos)
  yPos += 5

  // Location
  const location = locale === 'en' && vehicle.location_en ? vehicle.location_en : vehicle.location
  if (location) {
    doc.setFontSize(9)
    doc.setTextColor(...grayText)
    doc.setFont('helvetica', 'normal')
    doc.text(`${locale === 'es' ? 'Ubicación' : 'Location'}: ${location}`, margin, yPos)
    yPos += 6
  }

  // ===== CHARACTERISTICS =====
  if (characteristics.length > 0) {
    doc.setDrawColor(...petrolBlue)
    doc.setLineWidth(0.3)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 5

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...darkText)
    doc.text(locale === 'es' ? 'CARACTERÍSTICAS' : 'SPECIFICATIONS', margin, yPos)
    yPos += 5

    doc.setFontSize(8)
    const colWidth = contentWidth / 2
    let col = 0
    const maxChars = 10

    for (const car of characteristics.slice(0, maxChars)) {
      const xPos = margin + col * colWidth
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...grayText)
      doc.text(`${car.label}:`, xPos, yPos)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...darkText)
      const labelWidth = Math.min(doc.getTextWidth(`${car.label}: `), 28)
      doc.text(car.value.substring(0, 20), xPos + labelWidth + 1, yPos)
      col++
      if (col >= 2) {
        col = 0
        yPos += 4.5
      }
    }
    if (col === 1) yPos += 4.5
    yPos += 3
  }

  // ===== IMAGE GALLERY =====
  if (numImages > 1 && galleryHeight > 0) {
    doc.setDrawColor(...petrolBlue)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 5

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...darkText)
    doc.text(locale === 'es' ? 'GALERÍA DE IMÁGENES' : 'IMAGE GALLERY', margin, yPos)
    yPos += 5

    const maxThumbsPerRow = 4
    const thumbGap = 4
    const thumbWidth = (contentWidth - thumbGap * (maxThumbsPerRow - 1)) / maxThumbsPerRow
    const thumbHeight = Math.min(thumbWidth * 0.65, galleryHeight - 10)

    let thumbX = margin
    let thumbCount = 0
    const images = vehicle.vehicle_images || []

    for (let i = 1; i < images.length && thumbCount < 8; i++) {
      try {
        const thumbImg = await loadImageAsBase64(images[i]!.url)
        if (thumbImg) {
          doc.addImage(thumbImg, 'JPEG', thumbX, yPos, thumbWidth, thumbHeight)
          thumbX += thumbWidth + thumbGap
          thumbCount++
          if (thumbCount % maxThumbsPerRow === 0) {
            thumbX = margin
            yPos += thumbHeight + 3
          }
        }
      }
      catch { /* skip failed images */ }
    }

    if (thumbCount % maxThumbsPerRow !== 0) {
      yPos += thumbHeight + 3
    }
    yPos += 2
  }

  // ===== DESCRIPTION =====
  if (description) {
    doc.setDrawColor(...petrolBlue)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 5

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...darkText)
    doc.text(locale === 'es' ? 'DESCRIPCIÓN' : 'DESCRIPTION', margin, yPos)
    yPos += 5

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...grayText)

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

  // ===== FOOTER =====
  const footerY = pageHeight - footerHeight
  doc.setFillColor(...petrolBlue)
  doc.rect(0, footerY, pageWidth, footerHeight, 'F')

  doc.setFontSize(8)
  doc.setTextColor(...white)
  doc.text('TANKIBERICA.COM', pageWidth / 2, footerY + 8, { align: 'center' })

  // ===== SAVE =====
  const fileName = `TankIberica_${vehicle.brand || ''}_${vehicle.model || ''}`.replace(/\s+/g, '_')
  doc.save(`${fileName}.pdf`)
}
