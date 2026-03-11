/**
 * Unit tests for server repositories (vehicleRepository, dealerRepository).
 *
 * These verify the query chain construction — column selection, filters,
 * ordering, limits — without needing a real Supabase connection.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { vehicleRepository } from '../../../server/repositories/vehicleRepository'
import { dealerRepository } from '../../../server/repositories/dealerRepository'

/** Build a chainable mock that captures the final query config. */
function buildMockSupabase() {
  const calls: Record<string, unknown[]> = {}

  const chain: Record<string, (...args: unknown[]) => unknown> = {}
  const methods = ['select', 'eq', 'order', 'limit', 'single']
  for (const m of methods) {
    chain[m] = vi.fn((...args: unknown[]) => {
      calls[m] = [...(calls[m] ?? []), args]
      return chain
    })
  }

  const supabase = {
    from: vi.fn(() => chain),
  }

  return { supabase, chain, calls }
}

describe('vehicleRepository', () => {
  let mock: ReturnType<typeof buildMockSupabase>
  beforeEach(() => { mock = buildMockSupabase() })

  describe('findPublished', () => {
    it('queries from vehicles table', () => {
      vehicleRepository.findPublished(mock.supabase as any, { vertical: 'tracciona' })
      expect(mock.supabase.from).toHaveBeenCalledWith('vehicles')
    })

    it('applies vertical filter', () => {
      vehicleRepository.findPublished(mock.supabase as any, { vertical: 'tracciona' })
      const eqCalls = vi.mocked(mock.chain.eq).mock.calls
      expect(eqCalls.some(c => c[0] === 'vertical' && c[1] === 'tracciona')).toBe(true)
    })

    it('filters by published status', () => {
      vehicleRepository.findPublished(mock.supabase as any, { vertical: 'tracciona' })
      const eqCalls = vi.mocked(mock.chain.eq).mock.calls
      expect(eqCalls.some(c => c[0] === 'status' && c[1] === 'published')).toBe(true)
    })

    it('applies default limit of 50', () => {
      vehicleRepository.findPublished(mock.supabase as any, { vertical: 'tracciona' })
      expect(mock.chain.limit).toHaveBeenCalledWith(50)
    })

    it('respects custom limit', () => {
      vehicleRepository.findPublished(mock.supabase as any, { vertical: 'tracciona', limit: 10 })
      expect(mock.chain.limit).toHaveBeenCalledWith(10)
    })

    it('orders by created_at descending by default', () => {
      vehicleRepository.findPublished(mock.supabase as any, { vertical: 'tracciona' })
      expect(mock.chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('respects custom orderBy and ascending options', () => {
      vehicleRepository.findPublished(mock.supabase as any, {
        vertical: 'tracciona',
        orderBy: 'price',
        ascending: true,
      })
      expect(mock.chain.order).toHaveBeenCalledWith('price', { ascending: true })
    })

    it('selects list columns (not wildcard)', () => {
      vehicleRepository.findPublished(mock.supabase as any, { vertical: 'tracciona' })
      const selectArg = vi.mocked(mock.chain.select).mock.calls[0]?.[0] as string
      expect(selectArg).toContain('id')
      expect(selectArg).toContain('slug')
      expect(selectArg).toContain('price')
      expect(selectArg).not.toBe('*')
    })
  })

  describe('findById', () => {
    it('queries by id', () => {
      vehicleRepository.findById(mock.supabase as any, 'vehicle-123')
      expect(mock.chain.eq).toHaveBeenCalledWith('id', 'vehicle-123')
    })

    it('calls .single()', () => {
      vehicleRepository.findById(mock.supabase as any, 'vehicle-123')
      expect(mock.chain.single).toHaveBeenCalled()
    })

    it('selects detail columns including description', () => {
      vehicleRepository.findById(mock.supabase as any, 'vehicle-123')
      const selectArg = vi.mocked(mock.chain.select).mock.calls[0]?.[0] as string
      expect(selectArg).toContain('description')
      expect(selectArg).not.toBe('*')
    })
  })

  describe('findBySlug', () => {
    it('queries by slug', () => {
      vehicleRepository.findBySlug(mock.supabase as any, 'volvo-fh-2020')
      expect(mock.chain.eq).toHaveBeenCalledWith('slug', 'volvo-fh-2020')
    })

    it('calls .single()', () => {
      vehicleRepository.findBySlug(mock.supabase as any, 'volvo-fh-2020')
      expect(mock.chain.single).toHaveBeenCalled()
    })
  })

  describe('findByDealer', () => {
    it('filters by dealer_id', () => {
      vehicleRepository.findByDealer(mock.supabase as any, 'dealer-456')
      expect(mock.chain.eq).toHaveBeenCalledWith('dealer_id', 'dealer-456')
    })

    it('applies default limit of 100', () => {
      vehicleRepository.findByDealer(mock.supabase as any, 'dealer-456')
      expect(mock.chain.limit).toHaveBeenCalledWith(100)
    })

    it('applies optional status filter', () => {
      vehicleRepository.findByDealer(mock.supabase as any, 'dealer-456', { status: 'published' })
      const eqCalls = vi.mocked(mock.chain.eq).mock.calls
      expect(eqCalls.some(c => c[0] === 'status' && c[1] === 'published')).toBe(true)
    })

    it('does not apply status filter when not provided', () => {
      vehicleRepository.findByDealer(mock.supabase as any, 'dealer-456')
      const eqCalls = vi.mocked(mock.chain.eq).mock.calls
      expect(eqCalls.some(c => c[0] === 'status')).toBe(false)
    })
  })

  describe('findByStatus', () => {
    it('filters by vertical and status', () => {
      vehicleRepository.findByStatus(mock.supabase as any, 'tracciona', 'draft')
      const eqCalls = vi.mocked(mock.chain.eq).mock.calls
      expect(eqCalls.some(c => c[0] === 'vertical' && c[1] === 'tracciona')).toBe(true)
      expect(eqCalls.some(c => c[0] === 'status' && c[1] === 'draft')).toBe(true)
    })

    it('applies default limit of 100', () => {
      vehicleRepository.findByStatus(mock.supabase as any, 'tracciona', 'published')
      expect(mock.chain.limit).toHaveBeenCalledWith(100)
    })
  })
})

describe('dealerRepository', () => {
  let mock: ReturnType<typeof buildMockSupabase>
  beforeEach(() => { mock = buildMockSupabase() })

  describe('findById', () => {
    it('queries from dealers table', () => {
      dealerRepository.findById(mock.supabase as any, 'dealer-123')
      expect(mock.supabase.from).toHaveBeenCalledWith('dealers')
    })

    it('filters by id', () => {
      dealerRepository.findById(mock.supabase as any, 'dealer-123')
      expect(mock.chain.eq).toHaveBeenCalledWith('id', 'dealer-123')
    })

    it('calls .single()', () => {
      dealerRepository.findById(mock.supabase as any, 'dealer-123')
      expect(mock.chain.single).toHaveBeenCalled()
    })

    it('selects admin columns including stripe fields', () => {
      dealerRepository.findById(mock.supabase as any, 'dealer-123')
      const selectArg = vi.mocked(mock.chain.select).mock.calls[0]?.[0] as string
      expect(selectArg).toContain('stripe_customer_id')
      expect(selectArg).not.toBe('*')
    })
  })

  describe('findBySlug', () => {
    it('filters by slug', () => {
      dealerRepository.findBySlug(mock.supabase as any, 'my-dealer')
      expect(mock.chain.eq).toHaveBeenCalledWith('slug', 'my-dealer')
    })

    it('selects public columns (not stripe fields)', () => {
      dealerRepository.findBySlug(mock.supabase as any, 'my-dealer')
      const selectArg = vi.mocked(mock.chain.select).mock.calls[0]?.[0] as string
      expect(selectArg).toContain('name')
      expect(selectArg).not.toContain('stripe_customer_id')
      expect(selectArg).not.toBe('*')
    })
  })

  describe('findByVertical', () => {
    it('filters by vertical', () => {
      dealerRepository.findByVertical(mock.supabase as any, 'tracciona')
      expect(mock.chain.eq).toHaveBeenCalledWith('vertical', 'tracciona')
    })

    it('orders by created_at descending', () => {
      dealerRepository.findByVertical(mock.supabase as any, 'tracciona')
      expect(mock.chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })
  })

  describe('findActive', () => {
    it('filters by vertical and active subscription', () => {
      dealerRepository.findActive(mock.supabase as any, 'tracciona')
      const eqCalls = vi.mocked(mock.chain.eq).mock.calls
      expect(eqCalls.some(c => c[0] === 'vertical' && c[1] === 'tracciona')).toBe(true)
      expect(eqCalls.some(c => c[0] === 'subscription_status' && c[1] === 'active')).toBe(true)
    })

    it('orders by name ascending', () => {
      dealerRepository.findActive(mock.supabase as any, 'tracciona')
      expect(mock.chain.order).toHaveBeenCalledWith('name', { ascending: true })
    })
  })

  describe('findByStripeCustomerId', () => {
    it('filters by stripe_customer_id', () => {
      dealerRepository.findByStripeCustomerId(mock.supabase as any, 'cus_abc123')
      expect(mock.chain.eq).toHaveBeenCalledWith('stripe_customer_id', 'cus_abc123')
    })

    it('calls .single()', () => {
      dealerRepository.findByStripeCustomerId(mock.supabase as any, 'cus_abc123')
      expect(mock.chain.single).toHaveBeenCalled()
    })
  })
})
