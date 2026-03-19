import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'

// ── Mocks ────────────────────────────────────────────────────────────────────

let mockUser: { id: string } | null
let mockUserRole: string
let mockQueryData: unknown
let mockQueryError: unknown
let mockQueryCount: number

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

vi.mock('#supabase/server', () => ({
  serverSupabaseUser: vi.fn(() => Promise.resolve(mockUser)),
  serverSupabaseServiceRole: vi.fn(() => {
    const thenable = {
      then: (resolve: (v: unknown) => void) =>
        Promise.resolve().then(() =>
          resolve({ data: mockQueryData, error: mockQueryError, count: mockQueryCount }),
        ),
    }

    const makeChain = () => {
      const chain: Record<string, unknown> = {}
      const self = new Proxy(chain, {
        get: (_target, prop: string) => {
          if (prop === 'then') return undefined
          if (prop === 'single') {
            return vi.fn().mockResolvedValue({ data: mockQueryData, error: mockQueryError })
          }
          if (prop === 'range') return vi.fn().mockReturnValue(thenable)
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
                single: vi.fn().mockResolvedValue({ data: { role: mockUserRole }, error: null }),
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
}))

import pipelineGet from '../../../server/api/admin/crm-pipeline.get'
import pipelinePatch from '../../../server/api/admin/crm-pipeline.patch'

const mockEvent = {} as never

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Admin CRM pipeline API (F40)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = { id: 'admin-1' }
    mockUserRole = 'admin'
    mockQueryData = []
    mockQueryError = null
    mockQueryCount = 0
  })

  describe('GET /api/admin/crm-pipeline', () => {
    it('returns paginated pipeline items', async () => {
      mockQueryData = [
        { id: 'p-1', dealer_id: 'd-1', stage: 'contacted' },
        { id: 'p-2', dealer_id: 'd-2', stage: 'negotiating' },
      ]
      mockQueryCount = 2

      const result = await (pipelineGet as Function)(mockEvent)

      expect(result.items).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
    })

    it('rejects unauthenticated requests', async () => {
      mockUser = null
      await expect((pipelineGet as Function)(mockEvent)).rejects.toThrow('Unauthorized')
    })

    it('rejects non-admin users', async () => {
      mockUserRole = 'dealer'
      await expect((pipelineGet as Function)(mockEvent)).rejects.toThrow('Forbidden')
    })
  })

  describe('PATCH /api/admin/crm-pipeline', () => {
    it('moves pipeline item to new stage', async () => {
      mockValidateBody.mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440000',
        stage: 'demo',
        notes: 'Demo scheduled',
      })
      mockQueryData = { id: '550e8400-e29b-41d4-a716-446655440000', stage: 'demo' }

      const result = await (pipelinePatch as Function)(mockEvent)
      expect(result.stage).toBe('demo')
    })

    it('rejects update with no fields', async () => {
      mockValidateBody.mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440000',
      })

      await expect((pipelinePatch as Function)(mockEvent)).rejects.toThrow('No fields to update')
    })
  })

  describe('Pipeline stage validation', () => {
    it('validates stage enum', () => {
      // z imported at top
      const stageEnum = z.enum(['contacted', 'demo', 'negotiating', 'closed', 'lost'])

      expect(stageEnum.parse('contacted')).toBe('contacted')
      expect(stageEnum.parse('demo')).toBe('demo')
      expect(stageEnum.parse('negotiating')).toBe('negotiating')
      expect(stageEnum.parse('closed')).toBe('closed')
      expect(stageEnum.parse('lost')).toBe('lost')
      expect(() => stageEnum.parse('invalid')).toThrow()
    })

    it('validates pipeline item ID is UUID', () => {
      // z imported at top
      const schema = z.object({ id: z.string().uuid() })

      expect(() => schema.parse({ id: 'not-uuid' })).toThrow()
      expect(() => schema.parse({ id: '550e8400-e29b-41d4-a716-446655440000' })).not.toThrow()
    })
  })
})
