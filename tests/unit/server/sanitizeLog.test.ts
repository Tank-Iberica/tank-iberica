import { describe, it, expect } from 'vitest'
import { sanitizeForLog } from '../../../server/utils/sanitizeLog'

describe('sanitizeForLog', () => {
  it('redacts phone', () => {
    const result = sanitizeForLog({ phone: '+34 600 123 456', brand: 'Volvo' })
    expect(result.phone).toBe('[REDACTED]')
    expect(result.brand).toBe('Volvo')
  })

  it('redacts email', () => {
    const result = sanitizeForLog({ email: 'user@example.com' })
    expect(result.email).toBe('[REDACTED]')
  })

  it('redacts password, token, secret', () => {
    const result = sanitizeForLog({ password: 'secret123', token: 'abc', secret: 'xyz' })
    expect(result.password).toBe('[REDACTED]')
    expect(result.token).toBe('[REDACTED]')
    expect(result.secret).toBe('[REDACTED]')
  })

  it('redacts ip and stack', () => {
    const result = sanitizeForLog({ ip: '192.168.1.1', stack: 'Error at line 1' })
    expect(result.ip).toBe('[REDACTED]')
    expect(result.stack).toBe('[REDACTED]')
  })

  it('preserves non-sensitive fields', () => {
    const result = sanitizeForLog({ id: 42, status: 'active', brand: 'MAN' })
    expect(result.id).toBe(42)
    expect(result.status).toBe('active')
    expect(result.brand).toBe('MAN')
  })

  it('does not mutate the original object', () => {
    const original = { email: 'user@example.com', id: 1 }
    const result = sanitizeForLog(original)
    expect(original.email).toBe('user@example.com')
    expect(result.email).toBe('[REDACTED]')
  })

  it('skips null/falsy values (does not redact)', () => {
    const result = sanitizeForLog({ email: null as unknown as string, phone: '' })
    expect(result.email).toBeNull()
    expect(result.phone).toBe('')
  })
})
