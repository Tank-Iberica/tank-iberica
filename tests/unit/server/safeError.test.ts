import { describe, it, expect, vi, afterEach } from 'vitest'
import { safeError } from '../../../server/utils/safeError'

describe('safeError', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns generic message in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const error = safeError(500, 'Detailed internal error with stack trace')
    expect(error.statusCode).toBe(500)
    expect(error.message).toBe('Error interno del servidor')
  })

  it('returns dev message outside production', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const error = safeError(500, 'Detailed internal error with stack trace')
    expect(error.statusCode).toBe(500)
    expect(error.message).toBe('Detailed internal error with stack trace')
  })

  it('returns correct status code', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(safeError(400, 'Bad request').statusCode).toBe(400)
    expect(safeError(404, 'Not found').statusCode).toBe(404)
    expect(safeError(429, 'Rate limit').statusCode).toBe(429)
  })

  it('returns fallback generic message for unknown status in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const error = safeError(503, 'Service unavailable details')
    expect(error.message).toBe('Error')
  })

  it('has a non-empty message property', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const error = safeError(500, 'Some dev info')
    expect(typeof error.message).toBe('string')
    expect(error.message.length).toBeGreaterThan(0)
  })
})
