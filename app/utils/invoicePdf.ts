/**
 * Invoice — PDF generation utility
 * Pure functions, no reactive deps.
 * Extracted from useInvoice.ts (Auditoría #7 Iter. 15)
 */
import type { InvoiceLine } from '~/utils/invoiceTypes'

export interface InvoicePdfData {
  invoiceNumber: string
  invoiceDate: string
  invoiceLanguage: 'es' | 'en'
  invoiceConditions: string
  invoiceLines: InvoiceLine[]
  invoiceSubtotal: number
  invoiceTotalIva: number
  invoiceTotal: number
  companyName: string
  companyTaxId: string
  companyAddress1: string
  companyAddress2: string
  companyAddress3: string
  companyPhone: string
  companyEmail: string
  companyLogoUrl: string
  companyWebsite: string
  clientName: string
  clientDocType: string
  clientDocNumber: string
  clientAddress1: string
  clientAddress2: string
  clientAddress3: string
}

function formatDateDMY(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
}

function getLineImporte(line: InvoiceLine): number {
  return line.cantidad * line.precioUd
}

function getLineSubtotal(line: InvoiceLine): number {
  const importe = getLineImporte(line)
  return importe + (importe * line.iva) / 100
}

export function generateInvoicePDF(data: InvoicePdfData): void {
  const isEnglish = data.invoiceLanguage === 'en'

  const txt = isEnglish
    ? {
        invoice: 'INVOICE',
        num: 'Invoice No:',
        date: 'Date:',
        billedTo: 'Billed to:',
        type: 'Type',
        concept: 'Concept',
        qty: 'Qty',
        price: 'Unit Price',
        amount: 'Amount',
        vat: 'VAT %',
        subtotal: 'Subtotal',
        baseAmount: 'Base Amount',
        totalVat: 'Total VAT',
        total: 'TOTAL',
        conditions: 'Payment terms:',
        lineTypes: {
          Venta: 'Sale',
          Alquiler: 'Rental',
          Servicio: 'Service',
          Transporte: 'Transport',
          Transferencia: 'Transfer',
        } as Record<string, string>,
      }
    : {
        invoice: 'FACTURA',
        num: 'N Factura:',
        date: 'Fecha:',
        billedTo: 'Facturado a:',
        type: 'Tipo',
        concept: 'Concepto',
        qty: 'Cant.',
        price: 'Precio/Ud',
        amount: 'Importe',
        vat: 'IVA %',
        subtotal: 'Subtotal',
        baseAmount: 'Base Imponible',
        totalVat: 'Total IVA',
        total: 'TOTAL',
        conditions: 'Condiciones:',
        lineTypes: {
          Venta: 'Venta',
          Alquiler: 'Alquiler',
          Servicio: 'Servicio',
          Transporte: 'Transporte',
          Transferencia: 'Transferencia',
        } as Record<string, string>,
      }

  // Build logo HTML
  const logoHtml = data.companyLogoUrl
    ? `<img src="${data.companyLogoUrl}" alt="${data.companyName}" style="max-height:50px;max-width:120px;margin-bottom:8px;" />`
    : ''

  let html = `<!DOCTYPE html><html><head>
    <meta charset="UTF-8">
    <title>${txt.invoice} ${data.invoiceNumber}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1F2A2A; }
      .header { background: linear-gradient(135deg, #1A3238 0%, #23424A 100%); color: white; padding: 20px 24px; display: flex; justify-content: space-between; align-items: flex-start; }
      .header-left { flex: 1; }
      .header-right { text-align: right; }
      .company-name { font-size: 20px; font-weight: 700; margin-bottom: 4px; letter-spacing: 1px; }
      .header-accent { width: 45px; height: 2px; background: #7FD1C8; margin-bottom: 8px; }
      .invoice-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
      .invoice-meta { font-size: 12px; opacity: 0.9; }
      .content { padding: 20px 24px; }
      .client-section { margin-bottom: 20px; }
      .section-title { font-size: 13px; font-weight: 700; color: #23424A; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      th { background: #23424A; color: white; padding: 10px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
      th.right { text-align: right; }
      td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; }
      td.right { text-align: right; }
      tr:nth-child(even) td { background: #f9fafb; }
      .totals { width: 300px; margin-left: auto; }
      .totals tr td { border: none; padding: 6px 8px; background: transparent; }
      .totals .total-row { font-size: 14px; font-weight: bold; background: #e8f5e9; }
      .conditions { margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px; font-size: 10px; }
      .footer { position: fixed; bottom: 0; left: 0; right: 0; background: #23424A; color: white; padding: 10px 20px; display: flex; justify-content: space-between; font-size: 10px; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .footer { position: fixed; }
      }
    </style>
  </head><body>
    <div class="header">
      <div class="header-left">
        ${logoHtml}
        <div class="company-name">${data.companyName}</div>
        <div class="header-accent"></div>
        <div>${data.companyTaxId ? `NIF/CIF: ${data.companyTaxId}` : ''}</div>
        <div>${data.companyAddress1}</div>
        <div>${data.companyAddress2}</div>
        <div>${data.companyAddress3}</div>
      </div>
      <div class="header-right">
        <div class="invoice-title">${txt.invoice}</div>
        <div class="invoice-meta">
          <div>${txt.num} ${data.invoiceNumber}</div>
          <div>${txt.date} ${formatDateDMY(data.invoiceDate)}</div>
        </div>
      </div>
    </div>
    <div class="content">
      <div class="client-section">
        <div class="section-title">${txt.billedTo}</div>
        <div><strong>${data.clientName}</strong></div>
        <div>${data.clientAddress1}</div>
        <div>${data.clientAddress2}</div>
        <div>${data.clientAddress3}</div>
        <div>${data.clientDocType}: ${data.clientDocNumber}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>${txt.type}</th>
            <th>${txt.concept}</th>
            <th class="right">${txt.qty}</th>
            <th class="right">${txt.price}</th>
            <th class="right">${txt.amount}</th>
            <th class="right">${txt.vat}</th>
            <th class="right">${txt.subtotal}</th>
          </tr>
        </thead>
        <tbody>`

  for (const line of data.invoiceLines) {
    const importe = getLineImporte(line)
    const subtotal = getLineSubtotal(line)
    const tipoLabel = txt.lineTypes[line.tipo] || line.tipo
    html += `<tr>
      <td>${tipoLabel}</td>
      <td>${line.concepto}</td>
      <td class="right">${line.cantidad}</td>
      <td class="right">${line.precioUd.toFixed(2)} &euro;</td>
      <td class="right">${importe.toFixed(2)} &euro;</td>
      <td class="right">${line.iva}%</td>
      <td class="right">${subtotal.toFixed(2)} &euro;</td>
    </tr>`
  }

  html += `</tbody></table>
      <table class="totals">
        <tr><td>${txt.baseAmount}:</td><td class="right">${data.invoiceSubtotal.toFixed(2)} &euro;</td></tr>
        <tr><td>${txt.totalVat}:</td><td class="right">${data.invoiceTotalIva.toFixed(2)} &euro;</td></tr>
        <tr class="total-row"><td>${txt.total}:</td><td class="right">${data.invoiceTotal.toFixed(2)} &euro;</td></tr>
      </table>
      <div class="conditions">
        <strong>${txt.conditions}</strong> ${data.invoiceConditions}
      </div>
    </div>
    <div class="footer">
      <span>${data.companyPhone}</span>
      <span>${data.companyEmail}</span>
      <span>${data.companyWebsite}</span>
    </div>
  </body></html>`

  printHTML(html)
}

function printHTML(html: string): void {
  const existingFrame = document.getElementById('print-frame-invoice')
  if (existingFrame) {
    existingFrame.remove()
  }

  const iframe = document.createElement('iframe')
  iframe.id = 'print-frame-invoice'
  iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:0;height:0;border:none;'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) {
    // Fallback to window.open
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html)
    w.document.close()
    w.focus()
    w.print()
    return
  }

  doc.open()
  doc.write(html)
  doc.close()

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch {
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(html)
        win.document.close()
        win.focus()
        win.print()
      }
    }
  }, 100)
}
