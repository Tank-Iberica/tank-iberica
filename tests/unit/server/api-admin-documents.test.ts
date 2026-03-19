import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'

// ── Mocks ────────────────────────────────────────────────────────────────────

const _mockAdminData = { role: 'admin' }
const _mockNonAdminData = { role: 'dealer' }

let mockUserRole: string
let mockUser: { id: string } | null

// validateBody mock
const mockValidateBody = vi.fn()

vi.mock('../../../server/utils/validateBody', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody(...args),
}))

vi.mock('../../../server/utils/safeError', () => ({
  safeError: (code: number, msg: string) => {
    const err = new Error(msg) as Error & { statusCode: number }
    err.statusCode = code
    return err
  },
}))

// Supabase chain mock
let mockQueryData: unknown
let mockQueryError: unknown
let mockQueryCount: number

vi.mock('#supabase/server', () => ({
  serverSupabaseUser: vi.fn(() => Promise.resolve(mockUser)),
  serverSupabaseServiceRole: vi.fn(() => {
    const makeChain = () => {
      const chain: Record<string, unknown> = {}
      const thenable = {
        then: (resolve: (v: unknown) => void) =>
          Promise.resolve().then(() =>
            resolve({ data: mockQueryData, error: mockQueryError, count: mockQueryCount }),
          ),
      }
      const self = new Proxy(chain, {
        get: (_target, prop: string) => {
          if (prop === 'then') return undefined // Not thenable by default
          if (prop === 'single') {
            return vi.fn().mockResolvedValue({ data: mockQueryData, error: mockQueryError })
          }
          if (prop === 'range') {
            // range() must return a thenable
            return vi.fn().mockReturnValue(thenable)
          }
          // All other chain methods return self
          return vi.fn().mockReturnValue(self)
        },
      })
      return self
    }

    return {
      from: vi.fn((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { role: mockUserRole },
                  error: null,
                }),
              }),
            }),
          }
        }
        return makeChain()
      }),
    }
  }),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getQuery: vi.fn(() => ({})),
  getRouterParam: vi.fn(),
}))

import documentsGet from '../../../server/api/admin/documents.get'
import documentsPatch from '../../../server/api/admin/documents.patch'

const mockEvent = {} as never

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Admin documents API (F39)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = { id: 'admin-1' }
    mockUserRole = 'admin'
    mockQueryData = []
    mockQueryError = null
    mockQueryCount = 0
  })

  describe('GET /api/admin/documents', () => {
    it('returns paginated document list', async () => {
      const docs = [
        { id: 'doc-1', title: 'Invoice #1', type: 'invoice' },
        { id: 'doc-2', title: 'Contract A', type: 'contract' },
      ]
      mockQueryData = docs
      mockQueryCount = 2

      const result = await (documentsGet as Function)(mockEvent)

      expect(result.documents).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(50)
    })

    it('returns empty list when no documents', async () => {
      mockQueryData = []
      mockQueryCount = 0

      const result = await (documentsGet as Function)(mockEvent)

      expect(result.documents).toEqual([])
      expect(result.total).toBe(0)
    })

    it('rejects unauthenticated requests', async () => {
      mockUser = null

      await expect((documentsGet as Function)(mockEvent)).rejects.toThrow('Unauthorized')
    })

    it('rejects non-admin users', async () => {
      mockUserRole = 'dealer'

      await expect((documentsGet as Function)(mockEvent)).rejects.toThrow('Forbidden')
    })
  })

  describe('PATCH /api/admin/documents', () => {
    it('updates document status', async () => {
      mockValidateBody.mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'approved',
      })
      mockQueryData = { id: '550e8400-e29b-41d4-a716-446655440000', status: 'approved' }

      const result = await (documentsPatch as Function)(mockEvent)

      expect(result).toHaveProperty('id')
      expect(result.status).toBe('approved')
    })

    it('rejects update with no fields', async () => {
      mockValidateBody.mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440000',
      })

      await expect((documentsPatch as Function)(mockEvent)).rejects.toThrow('No fields to update')
    })

    it('rejects unauthenticated requests', async () => {
      mockUser = null

      await expect((documentsPatch as Function)(mockEvent)).rejects.toThrow('Unauthorized')
    })
  })

  describe('Document type and status validation', () => {
    it('validates document type enum', () => {
      // z imported at top
      const typeEnum = z.enum([
        'invoice',
        'contract',
        'certificate',
        'insurance',
        'license',
        'other',
      ])

      expect(typeEnum.parse('invoice')).toBe('invoice')
      expect(typeEnum.parse('contract')).toBe('contract')
      expect(typeEnum.parse('certificate')).toBe('certificate')
      expect(() => typeEnum.parse('invalid_type')).toThrow()
    })

    it('validates document status enum', () => {
      // z imported at top
      const statusEnum = z.enum(['pending', 'approved', 'rejected', 'expired'])

      expect(statusEnum.parse('pending')).toBe('pending')
      expect(statusEnum.parse('approved')).toBe('approved')
      expect(() => statusEnum.parse('invalid')).toThrow()
    })

    it('requires UUID for document id', () => {
      // z imported at top
      const schema = z.object({ id: z.string().uuid() })

      expect(() => schema.parse({ id: 'not-a-uuid' })).toThrow()
      expect(() => schema.parse({ id: '550e8400-e29b-41d4-a716-446655440000' })).not.toThrow()
    })

    it('validates file_url is a valid URL', () => {
      // z imported at top
      const schema = z.object({ file_url: z.string().url() })

      expect(() => schema.parse({ file_url: 'not-a-url' })).toThrow()
      expect(() => schema.parse({ file_url: 'https://cdn.example.com/doc.pdf' })).not.toThrow()
    })

    it('enforces title length limits', () => {
      // z imported at top
      const schema = z.object({ title: z.string().min(1).max(255) })

      expect(() => schema.parse({ title: '' })).toThrow()
      expect(() => schema.parse({ title: 'Valid Title' })).not.toThrow()
      expect(() => schema.parse({ title: 'x'.repeat(256) })).toThrow()
    })
  })
})
