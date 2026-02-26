/**
 * Dealer stock importer — import dealer's own vehicles from external platforms.
 *
 * Accepts a URL to the dealer's public profile on Mascus/MachineryZone/etc.
 * Fetches the page, extracts vehicle listings, and creates drafts.
 * Requires dealer auth + explicit consent checkbox.
 *
 * POST /api/dealer/import-stock
 */
import { defineEventHandler, readBody, createError } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { callAI } from '~/server/services/aiProvider'
import { checkRateLimit, getRateLimitKey, getRetryAfterSeconds } from '~/server/utils/rateLimit'

interface ImportRequest {
  url: string
  consent: boolean
}

interface ExtractedVehicle {
  brand: string
  model: string
  year: number | null
  price: number | null
  description: string
  imageUrls: string[]
}

const RATE_LIMIT = {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
}

const ALLOWED_DOMAINS = [
  'mascus.es',
  'mascus.com',
  'machineryzone.es',
  'machineryzone.eu',
  'autoline.es',
  'autoline.info',
  'truckscout24.es',
  'truckscout24.com',
]

export default defineEventHandler(async (event) => {
  // Auth required
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Check dealer exists
  const { data: dealer } = await supabase
    .from('dealers')
    .select('id, company_name')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!dealer) {
    throw createError({ statusCode: 403, statusMessage: 'Dealer account required' })
  }

  // Rate limit
  const ipKey = `import-stock:${getRateLimitKey(event)}`
  if (!checkRateLimit(ipKey, RATE_LIMIT)) {
    const retryAfter = getRetryAfterSeconds(ipKey, RATE_LIMIT)
    throw createError({
      statusCode: 429,
      statusMessage: `Rate limited. Try again in ${retryAfter} seconds.`,
    })
  }

  const body = (await readBody(event)) as ImportRequest

  // Validate consent
  if (!body.consent) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Explicit consent is required to import your stock',
    })
  }

  // Validate URL
  if (!body.url || typeof body.url !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'URL is required' })
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(body.url)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid URL format' })
  }

  const hostname = parsedUrl.hostname.replace('www.', '')
  if (!ALLOWED_DOMAINS.some((d) => hostname.endsWith(d))) {
    throw createError({
      statusCode: 400,
      statusMessage: `Unsupported platform. Supported: ${ALLOWED_DOMAINS.join(', ')}`,
    })
  }

  // Fetch the page
  let pageHtml: string
  try {
    const response = await fetch(body.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Tracciona Stock Import)',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    pageHtml = await response.text()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw createError({
      statusCode: 502,
      statusMessage: `Could not fetch the page: ${msg}`,
    })
  }

  // Truncate HTML to avoid exceeding AI token limits
  const maxHtmlLength = 50_000
  const truncatedHtml =
    pageHtml.length > maxHtmlLength ? pageHtml.substring(0, maxHtmlLength) : pageHtml

  // Use AI to extract vehicle data from the HTML
  try {
    const aiResponse = await callAI(
      {
        messages: [
          {
            role: 'user',
            content: `Extract vehicle listings from this HTML page. It's a dealer's public profile on a vehicle marketplace.

Return a JSON array of vehicles found. Each vehicle should have:
- brand (string)
- model (string)
- year (number or null)
- price (number in EUR or null)
- description (string, brief)
- imageUrls (array of image URLs found)

Only return the JSON array, no other text. If no vehicles found, return [].

HTML content:
${truncatedHtml}`,
          },
        ],
        maxTokens: 4096,
        system:
          'You are a data extraction expert. Parse vehicle listing data from HTML pages accurately. Return only valid JSON arrays.',
      },
      'deferred',
      'content',
    )

    // Parse extracted vehicles
    const jsonMatch = aiResponse.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return { success: true, imported: 0, message: 'No vehicles found on the page' }
    }

    const vehicles = JSON.parse(jsonMatch[0]) as ExtractedVehicle[]

    if (vehicles.length === 0) {
      return { success: true, imported: 0, message: 'No vehicles found on the page' }
    }

    // Create draft vehicles (max 20 per import)
    const maxImport = Math.min(vehicles.length, 20)
    let imported = 0

    for (let i = 0; i < maxImport; i++) {
      const v = vehicles[i]
      if (!v || !v.brand) continue

      const slug = `${v.brand}-${v.model || 'vehicle'}-${Date.now()}-${i}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')

      const { error: insertError } = await supabase.from('vehicles').insert({
        dealer_id: dealer.id,
        brand: v.brand,
        model: v.model || '',
        year: v.year,
        price: v.price,
        description: { es: v.description || '' },
        slug,
        status: 'draft',
        images: v.imageUrls?.slice(0, 10) || [],
        import_source: hostname,
      })

      if (!insertError) imported++
    }

    return {
      success: true,
      imported,
      total: vehicles.length,
      message: `${imported} vehicles imported as drafts. Review them in your dashboard.`,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[import-stock] AI extraction failed: ${msg}`)
    throw createError({
      statusCode: 500,
      statusMessage: 'Could not extract vehicle data from the page',
    })
  }
})
