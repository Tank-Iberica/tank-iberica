/**
 * Tests for OpenAPI specification generator.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('~/server/utils/siteConfig', () => ({
  getSiteUrl: () => 'https://tracciona.com',
  getSiteName: () => 'Tracciona',
}))

// Also mock the relative import used by the module
vi.mock('../../../server/utils/siteConfig', () => ({
  getSiteUrl: () => 'https://tracciona.com',
  getSiteName: () => 'Tracciona',
}))

import { generateOpenApiSpec } from '../../../server/utils/openApiSpec'

describe('generateOpenApiSpec', () => {
  let spec: Record<string, unknown>

  beforeEach(() => {
    spec = generateOpenApiSpec()
  })

  it('returns valid OpenAPI 3.0 version', () => {
    expect(spec.openapi).toBe('3.0.3')
  })

  it('includes site name in info.title', () => {
    const info = spec.info as Record<string, unknown>
    expect(info.title).toContain('Tracciona')
  })

  it('includes production server', () => {
    const servers = spec.servers as Array<Record<string, string>>
    expect(servers).toHaveLength(1)
    expect(servers[0].url).toBe('https://tracciona.com/api')
  })

  it('defines tags', () => {
    const tags = spec.tags as Array<Record<string, string>>
    expect(tags.length).toBeGreaterThan(5)
    const tagNames = tags.map(t => t.name)
    expect(tagNames).toContain('Search')
    expect(tagNames).toContain('Vehicles')
    expect(tagNames).toContain('Market')
    expect(tagNames).toContain('Dealer')
    expect(tagNames).toContain('Credits')
  })

  it('includes /search path', () => {
    const paths = spec.paths as Record<string, unknown>
    expect(paths).toHaveProperty('/search')
  })

  it('includes /health path', () => {
    const paths = spec.paths as Record<string, unknown>
    expect(paths).toHaveProperty('/health')
  })

  it('includes /v1/valuation path with API key auth', () => {
    const paths = spec.paths as Record<string, Record<string, Record<string, unknown>>>
    const valuation = paths['/v1/valuation']
    expect(valuation).toBeDefined()
    expect(valuation.get.security).toEqual([{ apiKeyAuth: [] }])
  })

  it('includes dealer endpoints', () => {
    const paths = spec.paths as Record<string, unknown>
    expect(paths).toHaveProperty('/dealer/api-key')
    expect(paths).toHaveProperty('/dealer/market-intelligence')
    expect(paths).toHaveProperty('/dealer/clone-vehicle')
  })

  it('includes credit endpoints', () => {
    const paths = spec.paths as Record<string, unknown>
    expect(paths).toHaveProperty('/credits/unlock-vehicle')
    expect(paths).toHaveProperty('/credits/highlight-vehicle')
    expect(paths).toHaveProperty('/credits/priority-reserve')
  })

  it('includes seller reviews endpoints', () => {
    const paths = spec.paths as Record<string, unknown>
    expect(paths).toHaveProperty('/seller-reviews/{sellerId}')
    expect(paths).toHaveProperty('/seller-reviews/create')
  })

  it('includes GDPR account endpoints', () => {
    const paths = spec.paths as Record<string, unknown>
    expect(paths).toHaveProperty('/account/export')
    expect(paths).toHaveProperty('/account/delete')
  })

  it('defines bearerAuth security scheme', () => {
    const components = spec.components as Record<string, Record<string, Record<string, string>>>
    expect(components.securitySchemes.bearerAuth.type).toBe('http')
    expect(components.securitySchemes.bearerAuth.scheme).toBe('bearer')
  })

  it('defines apiKeyAuth security scheme', () => {
    const components = spec.components as Record<string, Record<string, Record<string, string>>>
    expect(components.securitySchemes.apiKeyAuth.type).toBe('apiKey')
    expect(components.securitySchemes.apiKeyAuth.in).toBe('header')
  })

  it('defines VehicleSummary schema', () => {
    const components = spec.components as Record<string, Record<string, unknown>>
    expect(components.schemas).toHaveProperty('VehicleSummary')
  })

  it('defines SearchResult schema', () => {
    const components = spec.components as Record<string, Record<string, unknown>>
    expect(components.schemas).toHaveProperty('SearchResult')
  })

  it('defines Valuation schema', () => {
    const components = spec.components as Record<string, Record<string, unknown>>
    expect(components.schemas).toHaveProperty('Valuation')
  })

  it('search endpoint has query parameters', () => {
    const paths = spec.paths as Record<string, Record<string, Record<string, unknown>>>
    const params = paths['/search'].get.parameters as Array<Record<string, unknown>>
    expect(params.length).toBeGreaterThan(5)
    const names = params.map(p => p.name)
    expect(names).toContain('q')
    expect(names).toContain('brand')
    expect(names).toContain('min_price')
    expect(names).toContain('page')
  })

  it('all paths have valid HTTP methods', () => {
    const paths = spec.paths as Record<string, Record<string, unknown>>
    const validMethods = ['get', 'post', 'put', 'patch', 'delete']
    for (const [, methods] of Object.entries(paths)) {
      for (const method of Object.keys(methods)) {
        expect(validMethods).toContain(method)
      }
    }
  })
})
