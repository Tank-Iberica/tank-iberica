/**
 * Admin Productos Export Utilities
 * Pure export functions for Excel, PDF list, and vehicle ficha.
 * Extracted from useAdminProductosPage.ts (Auditoría #7 Iter. 15)
 */
import { formatPrice } from '~/composables/shared/useListingUtils'
import type { AdminVehicle } from '~/composables/admin/useAdminVehicles'

// -------------------------------------------------------------------------
// Helpers (internal to exports)
// -------------------------------------------------------------------------

export function getStatusLabel(status: string): string {
  const statusOptions = [
    { value: 'published', label: 'Publicado' },
    { value: 'draft', label: 'Oculto' },
    { value: 'rented', label: 'Alquilado' },
    { value: 'maintenance', label: 'Taller' },
    { value: 'sold', label: 'Vendido' },
  ]
  return statusOptions.find((s) => s.value === status)?.label || status
}

export interface ExportHelpers {
  getSubcategoryName: (id: string | null | undefined) => string
}

// -------------------------------------------------------------------------
// Excel export
// -------------------------------------------------------------------------

export async function exportToExcel(data: AdminVehicle[], helpers: ExportHelpers): Promise<void> {
  const ExcelJS = await import('exceljs')
  const { getSubcategoryName } = helpers

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Productos')

  worksheet.columns = [
    { header: 'Online', key: 'online', width: 10 },
    { header: 'Marca', key: 'brand', width: 15 },
    { header: 'Modelo', key: 'model', width: 20 },
    { header: 'Tipo', key: 'type', width: 20 },
    { header: 'A\u00F1o', key: 'year', width: 10 },
    { header: 'Precio', key: 'price', width: 12 },
    { header: 'Categor\u00EDa', key: 'category', width: 15 },
    { header: 'Estado', key: 'status', width: 12 },
    { header: 'Matr\u00EDcula', key: 'plate', width: 12 },
    { header: 'Ubicaci\u00F3n', key: 'location', width: 15 },
    { header: 'Precio M\u00EDn.', key: 'min_price', width: 12 },
    { header: 'Coste', key: 'acquisition_cost', width: 12 },
    { header: 'Precio Alquiler', key: 'rental_price', width: 15 },
  ]

  data.forEach((v) => {
    worksheet.addRow({
      online: v.is_online ? 'Online' : 'Offline',
      brand: v.brand,
      model: v.model,
      type: getSubcategoryName(v.type_id),
      year: v.year,
      price: v.price,
      category: v.category,
      status: getStatusLabel(v.status),
      plate: v.plate || '-',
      location: v.location || '-',
      min_price: v.min_price || '-',
      acquisition_cost: v.acquisition_cost || '-',
      rental_price: v.rental_price || '-',
    })
  })

  worksheet.getRow(1).font = { bold: true }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE5E7EB' },
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `productos_${new Date().toISOString().split('T')[0]}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}

// -------------------------------------------------------------------------
// PDF list export
// -------------------------------------------------------------------------

export async function exportToPdf(data: AdminVehicle[], helpers: ExportHelpers): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  const { getSubcategoryName } = helpers

  const doc = new jsPDF('l', 'mm', 'a4')
  doc.setFontSize(16)
  doc.text('Tracciona - Productos', 14, 15)
  doc.setFontSize(10)
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')} · ${data.length} productos`, 14, 22)

  const headers = ['Online', 'Marca', 'Modelo', 'Tipo', 'A\u00F1o', 'Precio', 'Cat.', 'Estado']
  const rows = data.map((v) => [
    v.is_online ? 'ON' : 'OFF',
    v.brand || '-',
    v.model || '-',
    getSubcategoryName(v.type_id),
    v.year || '-',
    formatPrice(v.price),
    v.category || '-',
    getStatusLabel(v.status),
  ])

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 28,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [35, 66, 74] },
  })

  doc.save(`productos_${new Date().toISOString().split('T')[0]}.pdf`)
}

// -------------------------------------------------------------------------
// Vehicle ficha PDF
// -------------------------------------------------------------------------

export async function exportVehicleFicha(
  vehicle: AdminVehicle,
  helpers: ExportHelpers,
): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const { getSubcategoryName } = helpers

  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(35, 66, 74)
  doc.rect(0, 0, pageWidth, 40, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.text('Tracciona', 14, 20)
  doc.setFontSize(12)
  doc.text('Ficha de Producto', 14, 30)

  doc.setTextColor(35, 66, 74)
  doc.setFontSize(20)
  doc.text(`${vehicle.brand} ${vehicle.model}`, 14, 55)

  if (vehicle.year) {
    doc.setFontSize(14)
    doc.setTextColor(100, 100, 100)
    doc.text(`A\u00F1o: ${vehicle.year}`, 14, 63)
  }

  if (vehicle.price) {
    doc.setFillColor(240, 249, 255)
    doc.roundedRect(pageWidth - 80, 45, 66, 25, 3, 3, 'F')
    doc.setTextColor(35, 66, 74)
    doc.setFontSize(16)
    doc.text(formatPrice(vehicle.price), pageWidth - 75, 60)
  }

  let yPos = 80
  doc.setFontSize(12)
  doc.setTextColor(50, 50, 50)

  const details: [string, string][] = [
    ['Categor\u00EDa', vehicle.category?.toUpperCase() || '-'],
    ['Tipo', getSubcategoryName(vehicle.type_id)],
    ['Estado', getStatusLabel(vehicle.status)],
    ['Visibilidad', vehicle.is_online ? 'Online (Web)' : 'Offline (Intermediaci\u00F3n)'],
  ]

  if (vehicle.location) details.push(['Ubicaci\u00F3n', vehicle.location])
  if (vehicle.plate) details.push(['Matr\u00EDcula', vehicle.plate])
  if (vehicle.rental_price)
    details.push(['Precio Alquiler', `${formatPrice(vehicle.rental_price)}/d\u00EDa`])

  doc.setFontSize(14)
  doc.setTextColor(35, 66, 74)
  doc.text('Datos del Veh\u00EDculo', 14, yPos)
  yPos += 8

  doc.setFontSize(10)
  for (const [label, value] of details) {
    doc.setTextColor(100, 100, 100)
    doc.text(`${label}:`, 14, yPos)
    doc.setTextColor(50, 50, 50)
    doc.text(String(value), 60, yPos)
    yPos += 7
  }

  if (vehicle.description_es) {
    yPos += 10
    doc.setFontSize(14)
    doc.setTextColor(35, 66, 74)
    doc.text('Descripci\u00F3n', 14, yPos)
    yPos += 8
    doc.setFontSize(10)
    doc.setTextColor(50, 50, 50)
    const descLines = doc.splitTextToSize(vehicle.description_es, pageWidth - 28)
    doc.text(descLines, 14, yPos)
    yPos += descLines.length * 5
  }

  if (vehicle.acquisition_cost || vehicle.min_price) {
    yPos += 15
    doc.setFillColor(255, 251, 235)
    doc.roundedRect(14, yPos - 5, pageWidth - 28, 35, 3, 3, 'F')
    doc.setFontSize(12)
    doc.setTextColor(146, 64, 14)
    doc.text('Informaci\u00F3n Financiera (Interno)', 18, yPos + 3)
    yPos += 10
    doc.setFontSize(10)
    if (vehicle.acquisition_cost) {
      doc.text(`Coste Adquisici\u00F3n: ${formatPrice(vehicle.acquisition_cost)}`, 18, yPos)
      yPos += 6
    }
    if (vehicle.min_price) {
      doc.text(`Precio M\u00EDnimo: ${formatPrice(vehicle.min_price)}`, 18, yPos)
      yPos += 6
    }
    if (vehicle.price && vehicle.acquisition_cost) {
      const margin = vehicle.price - vehicle.acquisition_cost
      doc.text(`Margen: ${formatPrice(margin)}`, 18, yPos)
    }
  }

  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')} · Tracciona`, 14, 285)

  doc.save(`ficha_${vehicle.brand}_${vehicle.model}_${vehicle.year || ''}.pdf`)
}
