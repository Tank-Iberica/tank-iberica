import { describe, it, expect, vi } from 'vitest'

const mockReadBody = vi.fn()

vi.mock('h3', () => ({
  readBody: (...args: unknown[]) => mockReadBody(...args),
  createError: (opts: { statusCode: number; statusMessage: string; data?: unknown }) => {
    const err = new Error(opts.statusMessage) as Error & Record<string, unknown>
    err.statusCode = opts.statusCode
    err.data = opts.data
    return err
  },
}))

import { validateBody } from '../../../server/utils/validateBody'

// Minimal Zod-compatible schema interface
function okSchema(data: unknown) {
  return { safeParse: () => ({ success: true as const, data }) }
}

function failSchema(issues: Array<{ path: string[]; message: string }>) {
  return { safeParse: () => ({ success: false as const, error: { issues } }) }
}

describe('validateBody', () => {
  it('returns validated data on success', async () => {
    mockReadBody.mockResolvedValue({ email: 'test@example.com' })
    const schema = okSchema({ email: 'test@example.com' })
    const result = await validateBody({} as never, schema as never)
    expect(result).toEqual({ email: 'test@example.com' })
  })

  it('throws 400 on validation failure', async () => {
    mockReadBody.mockResolvedValue({ email: 'bad' })
    const schema = failSchema([{ path: ['email'], message: 'Invalid email' }])
    try {
      await validateBody({} as never, schema as never)
      expect.fail('Should have thrown')
    } catch (err: unknown) {
      const e = err as { statusCode: number }
      expect(e.statusCode).toBe(400)
    }
  })

  it('formats multiple Zod errors with path and message', async () => {
    mockReadBody.mockResolvedValue({})
    const schema = failSchema([
      { path: ['name'], message: 'Required' },
      { path: ['email'], message: 'Invalid email' },
    ])
    try {
      await validateBody({} as never, schema as never)
      expect.fail('Should have thrown')
    } catch (err: unknown) {
      const e = err as { data: { errors: string } }
      expect(e.data.errors).toContain('name: Required')
      expect(e.data.errors).toContain('email: Invalid email')
    }
  })

  it('formats nested path correctly', async () => {
    mockReadBody.mockResolvedValue({})
    const schema = failSchema([{ path: ['address', 'city'], message: 'Required' }])
    try {
      await validateBody({} as never, schema as never)
    } catch (err: unknown) {
      const e = err as { data: { errors: string } }
      expect(e.data.errors).toContain('address.city: Required')
    }
  })
})
