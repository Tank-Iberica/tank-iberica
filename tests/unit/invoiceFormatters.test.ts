import { describe, it, expect } from 'vitest'
import {
  formatDateDMY,
  formatCurrency,
  formatHistoryDate,
  getInvoiceStatusClass,
} from '../../app/utils/invoiceFormatters'

describe('formatDateDMY', () => {
  it('formats ISO date to DD-MM-YYYY', () => {
    expect(formatDateDMY('2025-02-09')).toBe('09-02-2025')
  })

  it('returns empty string for empty input', () => {
    expect(formatDateDMY('')).toBe('')
  })

  it('pads single-digit day and month', () => {
    expect(formatDateDMY('2025-01-05')).toBe('05-01-2025')
  })
})

describe('formatCurrency', () => {
  it('formats integer as euros with two decimals', () => {
    const result = formatCurrency(1500)
    expect(result).toContain('1')
    expect(result).toContain('500')
    expect(result).toContain('€')
  })

  it('formats decimal value', () => {
    const result = formatCurrency(99.9)
    expect(result).toContain('99')
    expect(result).toContain('€')
  })

  it('formats zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
    expect(result).toContain('€')
  })
})

describe('formatHistoryDate', () => {
  it('returns dash for null', () => {
    expect(formatHistoryDate(null)).toBe('-')
  })

  it('returns formatted date for valid string', () => {
    const result = formatHistoryDate('2025-03-01')
    expect(result).toBeTruthy()
    expect(result).not.toBe('-')
  })
})

describe('getInvoiceStatusClass', () => {
  it('returns correct class for known statuses', () => {
    expect(getInvoiceStatusClass('draft')).toBe('status-draft')
    expect(getInvoiceStatusClass('sent')).toBe('status-sent')
    expect(getInvoiceStatusClass('paid')).toBe('status-paid')
    expect(getInvoiceStatusClass('cancelled')).toBe('status-cancelled')
  })

  it('returns empty string for unknown status', () => {
    expect(getInvoiceStatusClass('unknown')).toBe('')
    expect(getInvoiceStatusClass('')).toBe('')
  })
})
