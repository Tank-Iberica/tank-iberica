/**
 * Invoice — Formatting utility functions
 * Pure functions, no reactive deps.
 * Extracted from useInvoice.ts (Auditoría #7 Iter. 15)
 */

export function formatDateDMY(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
}

export function formatCurrency(val: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val)
}

export function formatHistoryDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function getInvoiceStatusClass(status: string): string {
  const map: Record<string, string> = {
    draft: 'status-draft',
    sent: 'status-sent',
    paid: 'status-paid',
    cancelled: 'status-cancelled',
  }
  return map[status] || ''
}
