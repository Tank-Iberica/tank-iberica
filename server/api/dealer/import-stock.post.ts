/**
 * Dealer stock importer — import dealer's own vehicles from external platforms.
 *
 * Accepts a URL to the dealer's public profile on Mascus/MachineryZone/etc.
 * Fetches the page, extracts vehicle listings, and creates drafts.
 * Requires dealer auth + explicit consent checkbox.
 *
 * POST /api/dealer/import-stock
 */
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { callAI } from '~~/server/services/aiProvider'
import { checkRateLimit, getRateLimitKey, getRetryAfterSeconds } from '~~/server/utils/rateLimit'
import { safeError } from '~~/server/utils/safeError'
import { validateBody } from '~~/server/utils/validateBody'
import { isPrivateHost } from '~~/server/utils/validatePath'
import { logger } from '../../utils/logger'

const importRequestSchema = z.object({
  url: z.string().url().max(2048),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Explicit consent is required to import your stock' }),
  }),
})

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

function extractErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
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

async function fetchPageHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': `Mozilla/5.0 (compatible; ${getSiteName()} Stock Import)`,
      Accept: 'text/html',
    },
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.text()
}

async function createDraftVehicles(
  supabase: SupabaseClient,
  dealerId: string,
  vehicles: ExtractedVehicle[],
  hostname: string,
): Promise<number> {
  const toImport = vehicles.slice(0, 20).filter((v) => v?.brand)
  let imported = 0

  for (let i = 0; i < toImport.length; i++) {
    const v = toImport[i]!
    const slug = `${v.brand}-${v.model || 'vehicle'}-${Date.now()}-${i}`
      .toLowerCase()
      .replaceAll(/[^a-z0-9-]/g, '-')
      .replaceAll(/-+/g, '-')

    const { error: insertError } = await supabase.from('vehicles').insert({
      dealer_id: dealerId,
      brand: v.brand,
      model: v.model || '',
      year: v.year,
      price: v.price,
      description_es: v.description || '',
      slug,
      status: 'draft',
      import_source: hostname,
    })

    if (!insertError) imported++
  }

  return imported
}

export default defineEventHandler(async (event) => {
  // Auth required
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Authentication required')
  }

  const supabase = serverSupabaseServiceRole(event)

  // Check dealer exists
  const { data: dealer } = await supabase
    .from('dealers')
    .select('id, company_name')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!dealer) {
    throw safeError(403, 'Dealer account required')
  }

  // Rate limit
  const ipKey = `import-stock:${getRateLimitKey(event)}`
  if (!checkRateLimit(ipKey, RATE_LIMIT)) {
    const retryAfter = getRetryAfterSeconds(ipKey, RATE_LIMIT)
    throw safeError(429, `Rate limited. Try again in ${retryAfter} seconds.`)
  }

  const body = await validateBody(event, importRequestSchema)

  let parsedUrl: URL
  try {
    parsedUrl = new URL(body.url)
  } catch {
    throw safeError(400, 'Invalid URL format')
  }

  // SSRF: enforce HTTPS only + reject private/loopback hosts
  if (parsedUrl.protocol !== 'https:') {
    throw safeError(400, 'Only HTTPS URLs are allowed')
  }
  if (isPrivateHost(parsedUrl.hostname)) {
    throw safeError(400, 'Invalid URL')
  }

  const hostname = parsedUrl.hostname.replace('www.', '')
  if (!ALLOWED_DOMAINS.some((d) => hostname.endsWith(d))) {
    throw safeError(400, `Unsupported platform. Supported: ${ALLOWED_DOMAINS.join(', ')}`)
  }

  // Fetch the page
  let pageHtml: string
  try {
    pageHtml = await fetchPageHtml(body.url)
  } catch {
    throw safeError(502, 'Could not fetch the page')
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
    const jsonMatch = /\[[\s\S]*\]/.exec(aiResponse.text)
    if (!jsonMatch) {
      return { success: true, imported: 0, message: 'No vehicles found on the page' }
    }

    const vehicles = JSON.parse(jsonMatch[0]) as ExtractedVehicle[]

    if (vehicles.length === 0) {
      return { success: true, imported: 0, message: 'No vehicles found on the page' }
    }

    const imported = await createDraftVehicles(supabase, dealer.id, vehicles, hostname)

    return {
      success: true,
      imported,
      total: vehicles.length,
      message: `${imported} vehicles imported as drafts. Review them in your dashboard.`,
    }
  } catch (err) {
    logger.error(`[import-stock] AI extraction failed: ${extractErrorMessage(err)}`)
    throw safeError(500, 'Could not extract vehicle data from the page')
  }
})
