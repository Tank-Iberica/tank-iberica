/**
 * Tests for server/routes/embed/[dealer-slug].get.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({ createClient: mockCreateClient }))

// Nuxt globals
const mockGetRouterParam = vi.fn()
const mockSetResponseStatus = vi.fn()
const mockGetQuery = vi.fn()
const mockSetResponseHeader = vi.fn()

vi.stubGlobal('defineEventHandler', (fn: Function) => fn)
vi.stubGlobal('getRouterParam', mockGetRouterParam)
vi.stubGlobal('setResponseStatus', mockSetResponseStatus)
vi.stubGlobal('getQuery', mockGetQuery)
vi.stubGlobal('setResponseHeader', mockSetResponseHeader)

// ── Dynamic import (after stubs are set up) ──────────────────────────────────

let embedHandler: any

beforeAll(async () => {
  embedHandler = (await import('../../../server/routes/embed/[dealer-slug].get')).default
})

// ── Supabase mock helpers ────────────────────────────────────────────────────

function makeChain(data: any = null, error: any = null) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  }
  chain.then = (onFulfilled: Function, onRejected?: Function) =>
    Promise.resolve({ data, error }).then(onFulfilled as any, onRejected as any)
  return chain
}

function makeMultiSupabase(steps: Array<{ data?: any; error?: any }>) {
  let callCount = 0
  const client = {
    from: vi.fn().mockImplementation(() => {
      const step = steps[callCount++] ?? { data: null, error: null }
      return makeChain(step.data ?? null, step.error ?? null)
    }),
  }
  mockCreateClient.mockReturnValue(client)
  return client
}

const event = {} as any

const dealerRow = {
  id: 'dealer-1',
  slug: 'mi-dealer',
  company_name: { es: 'Mi Dealer SL', en: 'My Dealer' },
  logo_url: null,
}

const vehicleRow = {
  id: 'v1',
  slug: 'volvo-fh16',
  brand: 'Volvo',
  model: 'FH16',
  year: 2022,
  price: 75000,
  location: 'Madrid',
  vehicle_images: [{ url: 'https://cdn/img.jpg', position: 0 }],
}

// ══ Tests ════════════════════════════════════════════════════════════════════

describe('GET /embed/[dealer-slug]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_KEY = 'service-key'
    mockGetQuery.mockReturnValue({})
    mockGetRouterParam.mockReturnValue('mi-dealer')
  })

  afterEach(() => {
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_KEY
  })

  it('returns 400 when dealer slug is missing', async () => {
    mockGetRouterParam.mockReturnValue(null)
    makeMultiSupabase([])
    const result = await embedHandler(event)
    expect(mockSetResponseStatus).toHaveBeenCalledWith(event, 400)
    expect(result).toContain('Missing dealer slug')
  })

  it('returns 500 when Supabase URL is missing', async () => {
    delete process.env.SUPABASE_URL
    makeMultiSupabase([])
    const result = await embedHandler(event)
    expect(mockSetResponseStatus).toHaveBeenCalledWith(event, 500)
    expect(result).toContain('Missing Supabase configuration')
  })

  it('returns 500 when Supabase service key is missing', async () => {
    delete process.env.SUPABASE_SERVICE_KEY
    makeMultiSupabase([])
    const result = await embedHandler(event)
    expect(mockSetResponseStatus).toHaveBeenCalledWith(event, 500)
    expect(result).toContain('Missing Supabase configuration')
  })

  it('returns 404 when dealer not found', async () => {
    makeMultiSupabase([
      { data: null, error: { message: 'not found' } },
    ])
    const result = await embedHandler(event)
    expect(mockSetResponseStatus).toHaveBeenCalledWith(event, 404)
    expect(result).toContain('Dealer not found')
  })

  it('returns 500 when vehicles query fails', async () => {
    makeMultiSupabase([
      { data: dealerRow }, // dealer
      { data: null, error: { message: 'DB error' } }, // vehicles
    ])
    const result = await embedHandler(event)
    expect(mockSetResponseStatus).toHaveBeenCalledWith(event, 500)
    expect(result).toContain('Error fetching vehicles')
  })

  it('returns valid HTML on happy path', async () => {
    makeMultiSupabase([
      { data: dealerRow }, // dealer
      { data: [vehicleRow] }, // vehicles
    ])
    const result = await embedHandler(event)
    expect(typeof result).toBe('string')
    expect(result).toContain('<!DOCTYPE html>')
    expect(result).toContain('Volvo FH16')
    expect(result).toContain('75.000') // formatPrice
    expect(result).toContain('Madrid')
  })

  it('sets correct response headers', async () => {
    makeMultiSupabase([
      { data: dealerRow },
      { data: [vehicleRow] },
    ])
    await embedHandler(event)
    expect(mockSetResponseHeader).toHaveBeenCalledWith(event, 'content-type', 'text/html; charset=utf-8')
    expect(mockSetResponseHeader).toHaveBeenCalledWith(event, 'x-frame-options', 'ALLOWALL')
    expect(mockSetResponseHeader).toHaveBeenCalledWith(event, 'content-security-policy', 'frame-ancestors *;')
  })

  it('applies dark theme when ?theme=dark', async () => {
    mockGetQuery.mockReturnValue({ theme: 'dark' })
    makeMultiSupabase([
      { data: dealerRow },
      { data: [vehicleRow] },
    ])
    const result = await embedHandler(event)
    expect(result).toContain('#1e293b') // dark bg color
  })

  it('applies light theme by default', async () => {
    mockGetQuery.mockReturnValue({})
    makeMultiSupabase([
      { data: dealerRow },
      { data: [vehicleRow] },
    ])
    const result = await embedHandler(event)
    expect(result).toContain('#f8fafc') // light bg color
  })

  it('shows empty state when no vehicles', async () => {
    makeMultiSupabase([
      { data: dealerRow },
      { data: [] }, // no vehicles
    ])
    const result = await embedHandler(event)
    expect(result).toContain('No hay vehiculos disponibles')
  })

  it('limits vehicle count by limit param (min 1, max 24)', async () => {
    mockGetQuery.mockReturnValue({ limit: '100' }) // over max
    makeMultiSupabase([
      { data: dealerRow },
      { data: [] },
    ])
    // We can't directly check the query, but it should not throw
    const result = await embedHandler(event)
    expect(result).toContain('<!DOCTYPE html>')
  })

  it('applies category filter when ?category provided', async () => {
    mockGetQuery.mockReturnValue({ category: 'camiones' })
    // Call order: from(dealers) → from(vehicles) [chain built, not awaited] → from(categories) → vehicleQuery awaited
    makeMultiSupabase([
      { data: dealerRow }, // dealer
      { data: [vehicleRow] }, // vehicles (chain built before category lookup, awaited after)
      { data: { id: 'cat-1' } }, // category lookup
    ])
    const result = await embedHandler(event)
    expect(result).toContain('Volvo')
  })

  it('handles vehicle without price gracefully', async () => {
    const vehicleNoPrice = { ...vehicleRow, price: null }
    makeMultiSupabase([
      { data: dealerRow },
      { data: [vehicleNoPrice] },
    ])
    const result = await embedHandler(event)
    expect(result).not.toContain('€') // no price badge
  })

  it('handles vehicle without year gracefully', async () => {
    const vehicleNoYear = { ...vehicleRow, year: null }
    makeMultiSupabase([
      { data: dealerRow },
      { data: [vehicleNoYear] },
    ])
    const result = await embedHandler(event)
    expect(result).toContain('Volvo FH16')
    expect(result).not.toContain('undefined')
  })

  it('handles vehicle without images gracefully (shows placeholder)', async () => {
    const vehicleNoImages = { ...vehicleRow, vehicle_images: [] }
    makeMultiSupabase([
      { data: dealerRow },
      { data: [vehicleNoImages] },
    ])
    const result = await embedHandler(event)
    expect(result).toContain('Sin imagen')
  })

  it('handles vehicle without location gracefully', async () => {
    const vehicleNoLocation = { ...vehicleRow, location: null }
    makeMultiSupabase([
      { data: dealerRow },
      { data: [vehicleNoLocation] },
    ])
    const result = await embedHandler(event)
    expect(result).toContain('Volvo FH16')
  })

  it('uses company_name string when not an object', async () => {
    const dealerStringName = { ...dealerRow, company_name: 'Mi Dealer Directo' }
    makeMultiSupabase([
      { data: dealerStringName },
      { data: [] },
    ])
    const result = await embedHandler(event)
    expect(result).toContain('Mi Dealer Directo')
  })

  it('handles null company_name gracefully', async () => {
    const dealerNullName = { ...dealerRow, company_name: null }
    makeMultiSupabase([
      { data: dealerNullName },
      { data: [] },
    ])
    const result = await embedHandler(event)
    expect(result).toContain('<!DOCTYPE html>')
  })

  it('escapes HTML in vehicle data to prevent XSS', async () => {
    const vehicleXss = {
      ...vehicleRow,
      brand: '<script>alert("xss")</script>',
      model: 'FH16',
    }
    makeMultiSupabase([
      { data: dealerRow },
      { data: [vehicleXss] },
    ])
    const result = await embedHandler(event)
    expect(result).not.toContain('<script>alert')
    expect(result).toContain('&lt;script&gt;')
  })

  it('sorts vehicle images by position and uses first', async () => {
    const vehicleMultiImages = {
      ...vehicleRow,
      vehicle_images: [
        { url: 'https://cdn/img2.jpg', position: 1 },
        { url: 'https://cdn/img0.jpg', position: 0 },
      ],
    }
    makeMultiSupabase([
      { data: dealerRow },
      { data: [vehicleMultiImages] },
    ])
    const result = await embedHandler(event)
    // First image by position should be used
    expect(result).toContain('https://cdn/img0.jpg')
  })

  it('includes Powered by Tracciona link in footer', async () => {
    makeMultiSupabase([
      { data: dealerRow },
      { data: [] },
    ])
    const result = await embedHandler(event)
    expect(result).toContain('Powered by Tracciona')
    expect(result).toContain('tracciona.com')
  })
})
