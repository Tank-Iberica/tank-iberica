/**
 * Web Stories server route — /stories/:slug
 *
 * Generates AMP Web Stories for Google Discover.
 * Spec: https://amp.dev/documentation/guides-and-tutorials/start/create_amphtml_ads/
 *
 * Each vehicle gets a 5-6 slide story:
 *  1. Cover — main image + title
 *  2. Specs — brand, model, year
 *  3. Price — price highlight
 *  4. Location — where it is
 *  5. Second photo (if available)
 *  6. CTA — link to full vehicle page
 */
import { defineEventHandler, getRouterParam, setResponseHeader, createError } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

const AMP_BOILERPLATE = `body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}`
const AMP_BOILERPLATE_NOSCRIPT = `body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}`

interface VehicleRow {
  slug: string
  brand: string
  model: string
  year: number | null
  price: number | null
  location: string | null
  description_es: string | null
  vehicle_images: Array<{ url: string; position: number; alt_text: string | null }>
  dealers: { slug: string; company_name: Record<string, string> } | null
}

function formatPrice(price: number | null): string {
  if (!price) return ''
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price)
}

function safeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function slide(id: string, bgColor: string, content: string, image?: string): string {
  const bgLayer = image
    ? `<amp-story-grid-layer template="fill"><amp-img src="${safeText(image)}" layout="fill" object-fit="cover" /></amp-story-grid-layer>`
    : `<amp-story-grid-layer template="fill" style="background:${bgColor}"></amp-story-grid-layer>`

  return `
<amp-story-page id="${id}">
  ${bgLayer}
  <amp-story-grid-layer template="vertical" style="padding:24px;justify-content:flex-end">
    <div style="background:rgba(0,0,0,0.55);border-radius:12px;padding:16px 20px">
      ${content}
    </div>
  </amp-story-grid-layer>
</amp-story-page>`
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing slug' })

  const supabase = serverSupabaseServiceRole(event)
  const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://tracciona.com'
  const logoUrl = `${siteUrl}/logo.png`

  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .select('slug, brand, model, year, price, location, description_es, vehicle_images(url, position, alt_text), dealers(slug, company_name)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !vehicle) {
    throw createError({ statusCode: 404, statusMessage: 'Vehicle not found' })
  }

  const v = vehicle as unknown as VehicleRow
  const images = [...(v.vehicle_images || [])].sort((a, b) => a.position - b.position)
  const mainImage = images[0]?.url || ''
  const secondImage = images[1]?.url || ''

  const title = `${v.brand} ${v.model}${v.year ? ` (${v.year})` : ''}`
  const vehicleUrl = `${siteUrl}/vehiculo/${v.slug}`
  const dealerName = v.dealers?.company_name?.es || v.dealers?.company_name?.en || 'Tracciona'
  const price = formatPrice(v.price)
  const specs = [v.brand, v.model, v.year ? String(v.year) : null].filter(Boolean).join(' · ')
  const desc = (v.description_es || '').slice(0, 120).trim()

  const slides: string[] = []

  // Slide 1 — Cover
  slides.push(slide('cover', '#1a2d31',
    `<h1 style="color:#fff;font-size:1.4rem;font-weight:700;margin:0 0 8px">${safeText(title)}</h1>
     <p style="color:rgba(255,255,255,0.8);font-size:0.85rem;margin:0">${safeText(dealerName)}</p>`,
    mainImage || undefined,
  ))

  // Slide 2 — Specs
  slides.push(slide('specs', '#23424a',
    `<p style="color:rgba(255,255,255,0.6);font-size:0.75rem;text-transform:uppercase;margin:0 0 8px">Especificaciones</p>
     <h2 style="color:#fff;font-size:1.2rem;font-weight:600;margin:0">${safeText(specs)}</h2>`,
  ))

  // Slide 3 — Price
  if (price) {
    slides.push(slide('price', '#14532d',
      `<p style="color:rgba(255,255,255,0.6);font-size:0.75rem;text-transform:uppercase;margin:0 0 8px">Precio</p>
       <h2 style="color:#4ade80;font-size:2rem;font-weight:700;margin:0">${safeText(price)}</h2>`,
    ))
  }

  // Slide 4 — Location
  if (v.location) {
    slides.push(slide('location', '#1e3a5f',
      `<p style="color:rgba(255,255,255,0.6);font-size:0.75rem;text-transform:uppercase;margin:0 0 8px">Ubicación</p>
       <h2 style="color:#fff;font-size:1.1rem;font-weight:600;margin:0">${safeText(v.location)}</h2>`,
    ))
  }

  // Slide 5 — Second image (if available)
  if (secondImage) {
    slides.push(slide('photo2', '#1a2d31',
      `<p style="color:rgba(255,255,255,0.8);font-size:0.9rem;margin:0">${safeText(desc || title)}</p>`,
      secondImage,
    ))
  }

  // Slide 6 — CTA
  slides.push(`
<amp-story-page id="cta">
  <amp-story-grid-layer template="fill" style="background:#23424a"></amp-story-grid-layer>
  <amp-story-grid-layer template="vertical" style="padding:24px;justify-content:center;align-items:center">
    <h2 style="color:#fff;font-size:1.3rem;font-weight:700;text-align:center;margin:0 0 24px">${safeText(title)}</h2>
    <a href="${safeText(vehicleUrl)}" style="display:inline-block;background:#4ade80;color:#052e16;font-weight:700;font-size:1rem;padding:14px 28px;border-radius:50px;text-decoration:none;min-height:44px;line-height:1.2">Ver vehículo →</a>
  </amp-story-grid-layer>
</amp-story-page>`)

  const html = `<!doctype html>
<html ⚡ lang="es">
<head>
  <meta charset="utf-8">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
  <title>${safeText(title)} — Tracciona</title>
  <link rel="canonical" href="${safeText(vehicleUrl)}">
  <meta name="viewport" content="width=device-width">
  <style amp-boilerplate>${AMP_BOILERPLATE}</style>
  <noscript><style amp-boilerplate>${AMP_BOILERPLATE_NOSCRIPT}</style></noscript>
  <style amp-custom>
    amp-story { font-family: 'Inter', sans-serif; }
    amp-story-page { background: #1a2d31; }
  </style>
</head>
<body>
  <amp-story
    standalone
    title="${safeText(title)}"
    publisher="Tracciona"
    publisher-logo-src="${safeText(logoUrl)}"
    poster-portrait-src="${safeText(mainImage || logoUrl)}"
  >
    ${slides.join('\n    ')}
  </amp-story>
</body>
</html>`

  setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=86400')
  return html
})
