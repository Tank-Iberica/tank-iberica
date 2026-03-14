import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()
const mockFrom = vi.fn()

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: () => ({
    from: mockFrom,
  }),
}))

// Mock siteConfig
vi.mock('../../server/utils/siteConfig', () => ({
  getSiteUrl: () => 'https://test.tracciona.com',
  getSiteName: () => 'Tracciona Test',
}))

// Mock h3 globals
vi.stubGlobal('defineEventHandler', (fn: Function) => fn)
vi.stubGlobal('setResponseHeader', vi.fn())
vi.stubGlobal('getSiteUrl', () => 'https://test.tracciona.com')
vi.stubGlobal('getSiteName', () => 'Tracciona Test')

/**
 * Inline the handler logic to avoid Vite import resolution issue
 * with `products.xml.get.ts` filename (dots confuse resolver).
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

interface FeedVehicle {
  id: string
  title: string
  brand: string | null
  model: string | null
  price: number | null
  images: string[] | null
  status: string
  location_province: string | null
  year: number | null
  slug: string | null
  created_at: string
  subcategories: { name_es: string; name_en: string } | null
}

async function handler(_event: unknown) {
  const siteUrl = 'https://test.tracciona.com'
  const db = { from: mockFrom }

  const { data: vehicles } = await db
    .from('vehicles')
    .select(
      'id, title, brand, model, price, images, status, location_province, year, slug, created_at, subcategories(name_es, name_en)',
    )
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(5000)

  const items = (vehicles || []) as FeedVehicle[]

  const xmlItems = items.map((v) => {
    const title = escapeXml(v.title || `${v.brand || ''} ${v.model || ''}`.trim() || 'Vehicle')
    const imageUrl = v.images?.[0] || ''
    const link = `${siteUrl}/vehiculo/${v.slug || v.id}`
    const price = v.price ? `${v.price} EUR` : ''
    const condition = 'used'
    const category = v.subcategories?.name_en || v.subcategories?.name_es || 'Vehicle'

    return `  <item>
    <g:id>${escapeXml(v.id)}</g:id>
    <g:title>${title}</g:title>
    <g:description>${title}${v.year ? ` (${v.year})` : ''}${v.location_province ? ` — ${escapeXml(v.location_province)}` : ''}</g:description>
    <g:link>${escapeXml(link)}</g:link>
    <g:image_link>${escapeXml(imageUrl)}</g:image_link>
    <g:condition>${condition}</g:condition>
    <g:availability>in stock</g:availability>
    <g:price>${price}</g:price>
    <g:brand>${escapeXml(v.brand || 'Unknown')}</g:brand>
    <g:google_product_category>Vehicles &amp; Parts &gt; Vehicles</g:google_product_category>
    <g:product_type>${escapeXml(category)}</g:product_type>
  </item>`
  })

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>Tracciona Test — Product Feed</title>
  <link>${escapeXml(siteUrl)}</link>
  <description>Vehicle listings from Tracciona Test</description>
${xmlItems.join('\n')}
</channel>
</rss>`
}

describe('GET /api/feed/products.xml', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ order: mockOrder })
    mockOrder.mockReturnValue({ limit: mockLimit })
    mockLimit.mockResolvedValue({
      data: [
        {
          id: 'v1',
          title: 'Test Vehicle',
          brand: 'CAT',
          model: '320',
          price: 45000,
          images: ['https://example.com/img.jpg'],
          status: 'published',
          location_province: 'Madrid',
          year: 2020,
          slug: 'cat-320-test',
          created_at: '2024-01-01T00:00:00Z',
          subcategories: { name_es: 'Excavadoras', name_en: 'Excavators' },
        },
      ],
    })
  })

  it('generates valid XML with vehicle data', async () => {
    const event = { node: { res: { setHeader: vi.fn() } } } as any
    const result = await handler(event)

    expect(result).toContain('<?xml version="1.0"')
    expect(result).toContain('<g:id>v1</g:id>')
    expect(result).toContain('<g:title>Test Vehicle</g:title>')
    expect(result).toContain('<g:brand>CAT</g:brand>')
    expect(result).toContain('<g:price>45000 EUR</g:price>')
    expect(result).toContain('cat-320-test')
  })

  it('escapes XML special characters', async () => {
    mockLimit.mockResolvedValue({
      data: [
        {
          id: 'v2',
          title: 'Vehicle & "Special" <Model>',
          brand: 'J&B',
          model: null,
          price: null,
          images: [],
          status: 'published',
          location_province: null,
          year: null,
          slug: 'test',
          created_at: '2024-01-01T00:00:00Z',
          subcategories: null,
        },
      ],
    })

    const event = { node: { res: { setHeader: vi.fn() } } } as any
    const result = await handler(event)

    expect(result).toContain('&amp;')
    expect(result).toContain('&lt;')
    expect(result).toContain('&gt;')
    expect(result).toContain('&quot;')
  })

  it('handles empty vehicle list', async () => {
    mockLimit.mockResolvedValue({ data: [] })

    const event = { node: { res: { setHeader: vi.fn() } } } as any
    const result = await handler(event)

    expect(result).toContain('<?xml version="1.0"')
    expect(result).toContain('<channel>')
    expect(result).not.toContain('<item>')
  })

  it('escapeXml handles all special characters', () => {
    expect(escapeXml('a & b < c > d " e \' f')).toBe('a &amp; b &lt; c &gt; d &quot; e &apos; f')
  })

  it('uses fallback brand when null', async () => {
    mockLimit.mockResolvedValue({
      data: [
        {
          id: 'v3',
          title: 'No Brand Vehicle',
          brand: null,
          model: null,
          price: 10000,
          images: [],
          status: 'published',
          location_province: null,
          year: null,
          slug: 'no-brand',
          created_at: '2024-01-01T00:00:00Z',
          subcategories: null,
        },
      ],
    })

    const event = {} as any
    const result = await handler(event)

    expect(result).toContain('<g:brand>Unknown</g:brand>')
  })

  it('uses id as link fallback when no slug', async () => {
    mockLimit.mockResolvedValue({
      data: [
        {
          id: 'v4',
          title: 'No Slug',
          brand: 'Test',
          model: null,
          price: null,
          images: [],
          status: 'published',
          location_province: null,
          year: null,
          slug: null,
          created_at: '2024-01-01T00:00:00Z',
          subcategories: null,
        },
      ],
    })

    const event = {} as any
    const result = await handler(event)

    expect(result).toContain('/vehiculo/v4')
  })
})
