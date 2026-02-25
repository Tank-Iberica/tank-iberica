import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

interface MockChainEntry {
  method: string
  args: string[]
}

interface MockSupabase {
  from: ReturnType<typeof vi.fn>
  select: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  getChain: () => MockChainEntry[]
}

// Mock Supabase client for testing query builders
function createMockSupabase(): MockSupabase {
  const chain: MockChainEntry[] = []

  const mock: MockSupabase = {
    from: vi.fn((table: string) => {
      chain.push({ method: 'from', args: [table] })
      return mock
    }),
    select: vi.fn((cols: string) => {
      chain.push({ method: 'select', args: [cols] })
      return mock
    }),
    eq: vi.fn((col: string, val: string) => {
      chain.push({ method: 'eq', args: [col, val] })
      return mock
    }),
    getChain: () => chain,
  }

  return mock
}

describe('Vertical Isolation - Query Helpers', () => {
  it('vehiclesQuery applies vertical filter', async () => {
    const { vehiclesQuery } = await import('../../server/utils/supabaseQuery')
    const mock = createMockSupabase()
    vehiclesQuery(mock as unknown as SupabaseClient, 'tracciona')

    const chain = mock.getChain()
    expect(chain).toContainEqual({ method: 'from', args: ['vehicles'] })
    expect(chain).toContainEqual({ method: 'eq', args: ['vertical', 'tracciona'] })
  })

  it('dealersQuery applies vertical filter', async () => {
    const { dealersQuery } = await import('../../server/utils/supabaseQuery')
    const mock = createMockSupabase()
    dealersQuery(mock as unknown as SupabaseClient, 'tracciona')

    const chain = mock.getChain()
    expect(chain).toContainEqual({ method: 'from', args: ['dealers'] })
    expect(chain).toContainEqual({ method: 'eq', args: ['vertical', 'tracciona'] })
  })

  it('articlesQuery applies vertical filter', async () => {
    const { articlesQuery } = await import('../../server/utils/supabaseQuery')
    const mock = createMockSupabase()
    articlesQuery(mock as unknown as SupabaseClient, 'horecaria')

    const chain = mock.getChain()
    expect(chain).toContainEqual({ method: 'from', args: ['articles'] })
    expect(chain).toContainEqual({ method: 'eq', args: ['vertical', 'horecaria'] })
  })

  it('categoriesQuery applies vertical filter', async () => {
    const { categoriesQuery } = await import('../../server/utils/supabaseQuery')
    const mock = createMockSupabase()
    categoriesQuery(mock as unknown as SupabaseClient, 'tracciona')

    const chain = mock.getChain()
    expect(chain).toContainEqual({ method: 'from', args: ['categories'] })
    expect(chain).toContainEqual({ method: 'eq', args: ['vertical', 'tracciona'] })
  })

  it('queries with different verticals produce different filters', async () => {
    const { vehiclesQuery } = await import('../../server/utils/supabaseQuery')

    const mock1 = createMockSupabase()
    vehiclesQuery(mock1 as unknown as SupabaseClient, 'tracciona')
    expect(mock1.getChain()).toContainEqual({ method: 'eq', args: ['vertical', 'tracciona'] })

    const mock2 = createMockSupabase()
    vehiclesQuery(mock2 as unknown as SupabaseClient, 'horecaria')
    expect(mock2.getChain()).toContainEqual({ method: 'eq', args: ['vertical', 'horecaria'] })
  })
})

describe('Vertical Isolation - Middleware', () => {
  it('vertical-context middleware file exists', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const middlewarePath = path.resolve('server/middleware/vertical-context.ts')
    expect(fs.existsSync(middlewarePath)).toBe(true)
  })
})
