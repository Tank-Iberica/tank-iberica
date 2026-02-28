/**
 * Invoice — Shared types
 * Extracted from useInvoice.ts (Auditoría #7 Iter. 15)
 */

export interface InvoiceLine {
  id: number
  tipo: 'Venta' | 'Alquiler' | 'Servicio' | 'Transporte' | 'Transferencia'
  concepto: string
  cantidad: number
  precioUd: number
  iva: number
}

export interface VehicleOption {
  id: string
  label: string
}

export interface DealerInvoiceRow {
  id: string
  invoice_number: string
  invoice_date: string
  client_name: string
  client_doc_type: string | null
  client_doc_number: string | null
  client_address: string | null
  vehicle_ids: string[] | null
  lines: InvoiceLine[]
  subtotal: number
  total_tax: number
  total: number
  conditions: string | null
  language: string | null
  status: string
  created_at: string | null
}

export interface DealerFiscalRow {
  tax_id: string | null
  tax_address: string | null
}
