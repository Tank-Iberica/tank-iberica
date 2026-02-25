import { createClient } from '@supabase/supabase-js'

/**
 * Embeddable widget route for dealer vehicle listings.
 * Renders a self-contained HTML page with inline CSS.
 * Supports theme (light/dark), vehicle limit, and category filtering.
 *
 * URL: /embed/[dealer-slug]?limit=6&theme=light&category=slug
 */

interface VehicleRow {
  id: string
  slug: string
  brand: string
  model: string
  year: number | null
  price: number | null
  location: string | null
  vehicle_images: { url: string; position: number | null }[]
}

interface DealerRow {
  id: string
  slug: string
  company_name: Record<string, string> | string | null
  logo_url: string | null
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

function getDealerDisplayName(companyName: Record<string, string> | string | null): string {
  if (!companyName) return ''
  if (typeof companyName === 'string') return companyName
  return companyName.es || companyName.en || Object.values(companyName)[0] || ''
}

function getThemeStyles(themeMode: string): {
  bg: string
  cardBg: string
  textPrimary: string
  textSecondary: string
  border: string
  priceBg: string
  priceColor: string
  footerBg: string
  footerColor: string
  linkColor: string
} {
  if (themeMode === 'dark') {
    return {
      bg: '#1e293b',
      cardBg: '#334155',
      textPrimary: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#475569',
      priceBg: '#065f46',
      priceColor: '#6ee7b7',
      footerBg: '#0f172a',
      footerColor: '#94a3b8',
      linkColor: '#38bdf8',
    }
  }
  return {
    bg: '#f8fafc',
    cardBg: '#ffffff',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    priceBg: '#ecfdf5',
    priceColor: '#065f46',
    footerBg: '#f1f5f9',
    footerColor: '#64748b',
    linkColor: '#23424a',
  }
}

export default defineEventHandler(async (event) => {
  const dealerSlug = getRouterParam(event, 'dealer-slug')

  if (!dealerSlug) {
    setResponseStatus(event, 400)
    return 'Missing dealer slug'
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    setResponseStatus(event, 500)
    return 'Missing Supabase configuration'
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Parse query params
  const query = getQuery(event)
  const limit = Math.min(Math.max(Number(query.limit) || 6, 1), 24)
  const themeMode = query.theme === 'dark' ? 'dark' : 'light'
  const categorySlug = typeof query.category === 'string' ? query.category : ''

  // Fetch dealer
  const { data: dealer, error: dealerError } = await supabase
    .from('dealers')
    .select('id, slug, company_name, logo_url')
    .eq('slug', dealerSlug)
    .single()

  if (dealerError || !dealer) {
    setResponseStatus(event, 404)
    return 'Dealer not found'
  }

  const dealerData = dealer as DealerRow

  // Build vehicle query
  let vehicleQuery = supabase
    .from('vehicles')
    .select('id, slug, brand, model, year, price, location, vehicle_images(url, position)')
    .eq('dealer_id', dealerData.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit)

  // Apply category filter if provided
  if (categorySlug) {
    // Get category ID from slug
    const { data: catData } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()

    if (catData) {
      vehicleQuery = vehicleQuery.eq('category_id', catData.id)
    }
  }

  const { data: vehiclesData, error: vehiclesError } = await vehicleQuery

  if (vehiclesError) {
    setResponseStatus(event, 500)
    return `Error fetching vehicles: ${vehiclesError.message}`
  }

  const vehicles = (vehiclesData || []) as VehicleRow[]
  const theme = getThemeStyles(themeMode)
  const siteUrl = 'https://tracciona.com'
  const companyName = escapeHtml(getDealerDisplayName(dealerData.company_name))

  // Build vehicle cards HTML
  const vehicleCards = vehicles
    .map((v) => {
      const title = escapeHtml(`${v.brand} ${v.model}${v.year ? ` (${v.year})` : ''}`)
      const priceStr = v.price ? `${formatPrice(v.price)}\u20AC` : ''
      const locationStr = v.location ? escapeHtml(v.location) : ''
      const vehicleUrl = `${siteUrl}/vehiculo/${v.slug}`

      // Get first image sorted by position
      const images = v.vehicle_images || []
      const sorted = [...images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      const imageUrl = sorted.length > 0 ? sorted[0]!.url : ''

      const imagePart = imageUrl
        ? `<div style="width:100%;height:180px;overflow:hidden;border-radius:8px 8px 0 0;">
            <img src="${escapeHtml(imageUrl)}" alt="${title}" style="width:100%;height:100%;object-fit:cover;display:block;" />
          </div>`
        : `<div style="width:100%;height:180px;background:${theme.border};border-radius:8px 8px 0 0;display:flex;align-items:center;justify-content:center;color:${theme.textSecondary};font-size:14px;">
            Sin imagen
          </div>`

      const pricePart = priceStr
        ? `<span style="display:inline-block;padding:4px 10px;background:${theme.priceBg};color:${theme.priceColor};border-radius:4px;font-weight:700;font-size:14px;">${escapeHtml(priceStr)}</span>`
        : ''

      const locationPart = locationStr
        ? `<span style="font-size:13px;color:${theme.textSecondary};">\u{1F4CD} ${locationStr}</span>`
        : ''

      return `<a href="${vehicleUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:block;background:${theme.cardBg};border:1px solid ${theme.border};border-radius:8px;overflow:hidden;transition:box-shadow 0.2s;">
        ${imagePart}
        <div style="padding:12px;">
          <div style="font-size:15px;font-weight:600;color:${theme.textPrimary};margin-bottom:8px;line-height:1.3;">${title}</div>
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">
            ${pricePart}
            ${locationPart}
          </div>
        </div>
      </a>`
    })
    .join('\n')

  const emptyState =
    vehicles.length === 0
      ? `<div style="text-align:center;padding:40px 20px;color:${theme.textSecondary};font-size:14px;">No hay vehiculos disponibles</div>`
      : ''

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${companyName} - Vehiculos en Tracciona</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: ${theme.bg};
      color: ${theme.textPrimary};
      line-height: 1.5;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      padding: 16px;
    }
    .grid a:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .footer {
      text-align: center;
      padding: 16px;
      background: ${theme.footerBg};
      border-top: 1px solid ${theme.border};
    }
    .footer a {
      color: ${theme.linkColor};
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    @media (min-width: 480px) {
      .grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (min-width: 768px) {
      .grid { grid-template-columns: repeat(3, 1fr); }
    }
  </style>
</head>
<body>
  <div class="grid">
    ${emptyState || vehicleCards}
  </div>
  <div class="footer">
    <a href="${siteUrl}/dealer/${escapeHtml(dealerData.slug)}" target="_blank" rel="noopener noreferrer">
      Powered by Tracciona
    </a>
  </div>
</body>
</html>`

  setResponseHeader(event, 'content-type', 'text/html; charset=utf-8')
  setResponseHeader(event, 'x-frame-options', 'ALLOWALL')
  setResponseHeader(event, 'content-security-policy', 'frame-ancestors *;')

  return html
})
