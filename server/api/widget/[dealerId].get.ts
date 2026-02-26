import { defineEventHandler, getQuery, setResponseHeaders } from 'h3'
import { createClient } from '@supabase/supabase-js'

interface VehicleRow {
  id: string
  slug: string
  brand: string
  model: string
  year: number | null
  price: number | null
  images: string[] | null
  status: string
}

interface DealerRow {
  id: string
  company_name: Record<string, string> | string | null
  subscription_type: string | null
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export default defineEventHandler(async (event) => {
  const dealerId = event.context.params?.dealerId
  if (!dealerId) {
    return 'Missing dealer ID'
  }

  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 6, 12)
  const theme = query.theme === 'dark' ? 'dark' : 'light'
  const layout = query.layout === 'list' ? 'list' : 'grid'

  const config = useRuntimeConfig()
  const supabaseUrl = config.public?.supabaseUrl || process.env.SUPABASE_URL
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return 'Service unavailable'
  }

  const supabase = createClient(supabaseUrl as string, supabaseKey as string)

  // Get dealer info
  const { data: dealer } = await supabase
    .from('dealers')
    .select('id, company_name, subscription_type')
    .or(`id.eq.${dealerId},slug.eq.${dealerId}`)
    .maybeSingle<DealerRow>()

  if (!dealer) {
    return 'Dealer not found'
  }

  // Get published vehicles
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, slug, brand, model, year, price, images, status')
    .eq('dealer_id', dealer.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit)

  const vehicleList = (vehicles || []) as VehicleRow[]

  // Check if dealer has premium plan (no branding)
  const plan = dealer.subscription_type || 'free'
  const showBranding = plan !== 'premium' && plan !== 'founding'

  // Build UTM params
  const utm = `?utm_source=widget&utm_medium=embed&utm_campaign=${dealer.id}`

  // Theme colors
  const bg = theme === 'dark' ? '#1a1a2e' : '#f8f9fa'
  const cardBg = theme === 'dark' ? '#16213e' : '#ffffff'
  const textColor = theme === 'dark' ? '#e0e0e0' : '#333333'
  const textSecondary = theme === 'dark' ? '#a0a0a0' : '#666666'
  const priceColor = theme === 'dark' ? '#4fc3f7' : '#23424A'
  const linkColor = theme === 'dark' ? '#4fc3f7' : '#23424A'
  const borderColor = theme === 'dark' ? '#2a2a4a' : '#e5e7eb'

  // Cloudinary base URL for images
  const cloudName = config.public?.cloudinaryCloudName || process.env.CLOUDINARY_CLOUD_NAME || ''
  const cloudinaryBase = cloudName
    ? `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_400,h_260,q_auto,f_webp/`
    : ''

  // Build vehicle cards HTML
  const cardsHtml = vehicleList
    .map((v) => {
      const title = escapeHtml(`${v.brand} ${v.model}`)
      const yearText = v.year ? String(v.year) : ''
      const priceText = v.price
        ? new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
          }).format(v.price)
        : ''
      const imageUrl =
        v.images && v.images.length > 0 && cloudinaryBase ? `${cloudinaryBase}${v.images[0]}` : ''
      const vehicleUrl = `https://tracciona.com/vehiculo/${v.slug || v.id}${utm}`

      return `<a href="${vehicleUrl}" target="_blank" rel="noopener" class="trk-card">
      ${imageUrl ? `<img src="${imageUrl}" alt="${title}" class="trk-img" loading="lazy" />` : '<div class="trk-img trk-placeholder"></div>'}
      <div class="trk-info">
        <div class="trk-title">${title}</div>
        ${yearText ? `<div class="trk-year">${yearText}</div>` : ''}
        ${priceText ? `<div class="trk-price">${priceText}</div>` : ''}
      </div>
    </a>`
    })
    .join('\n    ')

  const brandingHtml = showBranding
    ? `<div class="trk-footer"><a href="https://tracciona.com${utm}" target="_blank" rel="noopener">Powered by Tracciona</a></div>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Inter, system-ui, -apple-system, sans-serif; background: ${bg}; padding: 16px; }
  .trk-grid { display: grid; grid-template-columns: ${layout === 'list' ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))'}; gap: 16px; }
  ${layout === 'list' ? '.trk-card { display: flex; flex-direction: row; } .trk-img { width: 200px; height: 140px; flex-shrink: 0; } .trk-info { display: flex; flex-direction: column; justify-content: center; }' : ''}
  .trk-card { display: block; background: ${cardBg}; border: 1px solid ${borderColor}; border-radius: 8px; overflow: hidden; text-decoration: none; color: ${textColor}; transition: box-shadow 0.2s, transform 0.2s; }
  .trk-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); transform: translateY(-2px); }
  .trk-img { width: 100%; height: 180px; object-fit: cover; display: block; background: ${borderColor}; }
  .trk-placeholder { background: ${borderColor}; }
  .trk-info { padding: 12px; }
  .trk-title { font-size: 14px; font-weight: 600; color: ${textColor}; margin-bottom: 4px; }
  .trk-year { font-size: 12px; color: ${textSecondary}; margin-bottom: 4px; }
  .trk-price { font-size: 16px; font-weight: 700; color: ${priceColor}; }
  .trk-footer { text-align: center; padding: 16px 0 4px; font-size: 12px; }
  .trk-footer a { color: ${linkColor}; text-decoration: none; opacity: 0.7; }
  .trk-footer a:hover { opacity: 1; }
  @media (max-width: 540px) { .trk-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; } .trk-img { height: 120px; } }
</style>
</head>
<body>
  <div class="trk-grid">
    ${cardsHtml}
  </div>
  ${brandingHtml}
</body>
</html>`

  setResponseHeaders(event, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
    'X-Frame-Options': 'ALLOWALL',
  })

  return html
})
