// DEPRECATED: Manual scraping only (session 44). Kept for reference.

/**
 * Tracciona — Competitor Scraper for Dealer Lead Generation
 *
 * Scrapes competitor platforms to find professional vehicle dealers
 * with significant inventory. Results are stored in the dealer_leads
 * table for the sales team to follow up.
 *
 * Usage:
 *   npx tsx scripts/scrape-competitors.ts
 *
 * Environment variables:
 *   SUPABASE_URL            — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — Supabase service role key (NOT anon key)
 *
 * Can also be scheduled as a weekly cron job.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const VERTICAL = 'tracciona'

/** Minimum active listings to qualify as a potential dealer lead */
const MIN_LISTINGS_THRESHOLD = 5

/** Maximum concurrent scrapers to run at once */
const MAX_CONCURRENT_SCRAPERS = 2

// ============================================
// TYPES
// ============================================

interface ScrapedDealer {
  source: string
  source_url: string
  company_name: string
  phone: string | null
  email: string | null
  location: string | null
  active_listings: number
  vehicle_types: string[]
}

interface ScraperConfig {
  name: string
  enabled: boolean
  fn: () => Promise<ScrapedDealer[]>
}

interface UpsertResult {
  inserted: number
  updated: number
  skipped: number
  errors: string[]
}

type LeadStatus = 'new' | 'contacted' | 'interested' | 'onboarding' | 'active' | 'rejected'

interface DealerLeadRow {
  vertical: string
  source: string
  source_url: string
  company_name: string
  phone: string | null
  email: string | null
  location: string | null
  active_listings: number
  vehicle_types: string[]
  status: LeadStatus
  scraped_at: string
}

// ============================================
// LOGGING
// ============================================

function logInfo(source: string, message: string): void {
  const timestamp = new Date().toISOString()
  process.stdout.write(`[${timestamp}] [${source}] ${message}\n`)
}

function logError(source: string, message: string, err?: unknown): void {
  const timestamp = new Date().toISOString()
  const errorDetail = err instanceof Error ? err.message : String(err ?? '')
  const suffix = errorDetail ? ` — ${errorDetail}` : ''
  process.stderr.write(`[${timestamp}] [${source}] ERROR: ${message}${suffix}\n`)
}

// ============================================
// PLATFORM-SPECIFIC SCRAPERS
// ============================================
// These are placeholder implementations. In production, each would use
// Puppeteer, Playwright, or HTTP clients with cheerio to actually
// navigate the target sites and extract dealer information.

async function scrapeMascus(): Promise<ScrapedDealer[]> {
  logInfo('mascus', 'Scraping started...')

  // In production, this would:
  // 1. Navigate to mascus.es/transporte (or mascus.com for EU)
  // 2. Iterate through dealer profile pages
  // 3. Filter dealers with >MIN_LISTINGS_THRESHOLD active listings
  // 4. Extract: company name, phone, email, location, listing count, vehicle categories
  //
  // Example implementation with Playwright:
  // const browser = await chromium.launch({ headless: true })
  // const page = await browser.newPage()
  // await page.goto('https://www.mascus.es/transporte')
  // const dealerLinks = await page.locator('.dealer-profile-link').all()
  // for (const link of dealerLinks) {
  //   const href = await link.getAttribute('href')
  //   await page.goto(href)
  //   const name = await page.locator('.dealer-name').textContent()
  //   const phone = await page.locator('.dealer-phone').textContent()
  //   ... extract all fields ...
  // }
  // await browser.close()

  logInfo('mascus', 'Placeholder — implement with Puppeteer/Playwright')
  return []
}

async function scrapeEuropaCamiones(): Promise<ScrapedDealer[]> {
  logInfo('europa_camiones', 'Scraping started...')

  // In production, this would:
  // 1. Navigate to europa-camiones.com
  // 2. Browse the dealer directory
  // 3. Extract dealer profiles with contact info and listing counts
  //
  // Target URLs:
  // - https://www.europa-camiones.com/vendedores-profesionales
  // - Individual dealer profiles for detail extraction

  logInfo('europa_camiones', 'Placeholder — implement with Puppeteer/Playwright')
  return []
}

async function scrapeMilanuncios(): Promise<ScrapedDealer[]> {
  logInfo('milanuncios', 'Scraping started...')

  // In production, this would:
  // 1. Navigate to milanuncios.com/camiones/ and related categories
  // 2. Identify professional sellers (those with multiple listings)
  // 3. Extract company info from professional profiles
  //
  // Note: Milanuncios has strict anti-scraping measures.
  // Consider using their API if available, or rotating proxies.
  //
  // Target categories:
  // - /camiones/
  // - /remolques-y-semirremolques/
  // - /furgonetas-y-furgones/

  logInfo('milanuncios', 'Placeholder — implement with Puppeteer/Playwright')
  return []
}

async function scrapeAutoline(): Promise<ScrapedDealer[]> {
  logInfo('autoline', 'Scraping started...')

  // In production, this would:
  // 1. Navigate to autoline.es or autoline-eu.es
  // 2. Browse dealer listings for trucks, trailers, semi-trailers
  // 3. Extract dealer profiles with at least MIN_LISTINGS_THRESHOLD vehicles
  //
  // Target URLs:
  // - https://autoline.es/-/vendedores
  // - Filtered by country: Spain, Portugal, France

  logInfo('autoline', 'Placeholder — implement with Puppeteer/Playwright')
  return []
}

// ============================================
// DATA PIPELINE
// ============================================

/**
 * Normalizes a company name for deduplication.
 * Removes common suffixes (S.L., S.A., etc.), trims, and lowercases.
 */
function normalizeCompanyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+(s\.?l\.?u?\.?|s\.?a\.?|s\.?c\.?|ltd\.?|gmbh|srl)$/i, '')
    .replace(/[.,;]+$/, '')
    .trim()
}

/**
 * Normalizes a phone number by stripping non-digit characters
 * and adding country code if missing.
 */
function normalizePhone(phone: string | null): string | null {
  if (!phone) return null
  const digits = phone.replace(/[^0-9+]/g, '')
  if (!digits || digits.length < 6) return null
  // Add Spain country code if it looks like a local number
  if (digits.length === 9 && !digits.startsWith('+')) {
    return `+34${digits}`
  }
  return digits.startsWith('+') ? digits : `+${digits}`
}

/**
 * Validates an email address format.
 */
function isValidEmail(email: string | null): boolean {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Deduplicates dealers by normalized company name.
 * When duplicates are found, keeps the entry with the most active listings.
 */
function deduplicateDealers(dealers: ScrapedDealer[]): ScrapedDealer[] {
  const seen = new Map<string, ScrapedDealer>()

  for (const dealer of dealers) {
    const key = normalizeCompanyName(dealer.company_name)
    const existing = seen.get(key)

    if (!existing || dealer.active_listings > existing.active_listings) {
      // Keep the one with more listings (more data = more reliable)
      seen.set(key, {
        ...dealer,
        phone: normalizePhone(dealer.phone),
        email: isValidEmail(dealer.email) ? (dealer.email?.trim().toLowerCase() ?? null) : null,
        company_name: dealer.company_name.trim(),
        location: dealer.location?.trim() || null,
        vehicle_types: [...new Set(dealer.vehicle_types.map((vt) => vt.trim().toLowerCase()))],
      })
    } else if (existing) {
      // Merge: fill in missing contact info from duplicate
      if (!existing.phone && dealer.phone) {
        existing.phone = normalizePhone(dealer.phone)
      }
      if (!existing.email && isValidEmail(dealer.email)) {
        existing.email = dealer.email?.trim().toLowerCase() ?? null
      }
      // Merge vehicle types
      const mergedTypes = new Set([
        ...existing.vehicle_types,
        ...dealer.vehicle_types.map((vt) => vt.trim().toLowerCase()),
      ])
      existing.vehicle_types = [...mergedTypes]
    }
  }

  return [...seen.values()]
}

/**
 * Upserts dealers into the dealer_leads table with deduplication
 * based on the (source, company_name) unique constraint.
 */
async function upsertDealers(
  supabase: SupabaseClient,
  dealers: ScrapedDealer[],
): Promise<UpsertResult> {
  const result: UpsertResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  }

  const now = new Date().toISOString()

  for (const dealer of dealers) {
    const row: DealerLeadRow = {
      vertical: VERTICAL,
      source: dealer.source,
      source_url: dealer.source_url,
      company_name: dealer.company_name,
      phone: dealer.phone,
      email: dealer.email,
      location: dealer.location,
      active_listings: dealer.active_listings,
      vehicle_types: dealer.vehicle_types,
      status: 'new',
      scraped_at: now,
    }

    const { error } = await supabase.from('dealer_leads').upsert(row, {
      onConflict: 'source,company_name',
      ignoreDuplicates: false,
    })

    if (error) {
      result.errors.push(`${dealer.company_name}: ${error.message}`)
      result.skipped++
    } else {
      // Supabase upsert does not distinguish insert vs update in the response,
      // so we count everything as inserted/updated
      result.inserted++
    }
  }

  return result
}

// ============================================
// RUNNER — CONCURRENT SCRAPER EXECUTION
// ============================================

/**
 * Runs scrapers with controlled concurrency.
 */
async function runScrapersWithConcurrency(
  scrapers: ScraperConfig[],
  maxConcurrent: number,
): Promise<{ source: string; dealers: ScrapedDealer[] }[]> {
  const results: { source: string; dealers: ScrapedDealer[] }[] = []
  const enabledScrapers = scrapers.filter((s) => s.enabled)

  // Process in batches of maxConcurrent
  for (let i = 0; i < enabledScrapers.length; i += maxConcurrent) {
    const batch = enabledScrapers.slice(i, i + maxConcurrent)

    const batchResults = await Promise.allSettled(
      batch.map(async (scraper) => {
        try {
          const dealers = await scraper.fn()
          logInfo(scraper.name, `Found ${dealers.length} dealers`)
          return { source: scraper.name, dealers }
        } catch (err) {
          logError(scraper.name, 'Scraper failed', err)
          return { source: scraper.name, dealers: [] as ScrapedDealer[] }
        }
      }),
    )

    for (const settledResult of batchResults) {
      if (settledResult.status === 'fulfilled') {
        results.push(settledResult.value)
      }
    }
  }

  return results
}

// ============================================
// MAIN
// ============================================

async function main(): Promise<void> {
  // Validate environment
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    logError('main', 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  logInfo('main', '=== Tracciona Competitor Scraper ===')
  logInfo('main', `Vertical: ${VERTICAL}`)
  logInfo('main', `Min listings threshold: ${MIN_LISTINGS_THRESHOLD}`)
  logInfo('main', `Max concurrent scrapers: ${MAX_CONCURRENT_SCRAPERS}`)
  logInfo('main', '')

  // Define scrapers (all enabled by default; disable individual ones as needed)
  const scrapers: ScraperConfig[] = [
    { name: 'mascus', enabled: true, fn: scrapeMascus },
    { name: 'europa_camiones', enabled: true, fn: scrapeEuropaCamiones },
    { name: 'milanuncios', enabled: true, fn: scrapeMilanuncios },
    { name: 'autoline', enabled: true, fn: scrapeAutoline },
  ]

  // 1. Run all scrapers
  logInfo('main', 'Starting scraper execution...')
  const scraperResults = await runScrapersWithConcurrency(scrapers, MAX_CONCURRENT_SCRAPERS)

  // 2. Aggregate all dealers
  const allDealers: ScrapedDealer[] = []
  for (const result of scraperResults) {
    allDealers.push(...result.dealers)
  }
  logInfo('main', `Total raw dealers found: ${allDealers.length}`)

  // 3. Filter by minimum listings threshold
  const qualifiedDealers = allDealers.filter((d) => d.active_listings >= MIN_LISTINGS_THRESHOLD)
  logInfo(
    'main',
    `Qualified dealers (>=${MIN_LISTINGS_THRESHOLD} listings): ${qualifiedDealers.length}`,
  )

  // 4. Deduplicate across sources
  const uniqueDealers = deduplicateDealers(qualifiedDealers)
  logInfo('main', `Unique dealers after deduplication: ${uniqueDealers.length}`)

  if (uniqueDealers.length === 0) {
    logInfo('main', 'No dealers to upsert. Exiting.')
    logInfo('main', '=== Scraping complete ===')
    return
  }

  // 5. Upsert into database
  logInfo('main', 'Upserting dealers into dealer_leads...')
  const upsertResult = await upsertDealers(supabase, uniqueDealers)

  logInfo('main', '')
  logInfo('main', '--- Results ---')
  logInfo('main', `Inserted/Updated: ${upsertResult.inserted}`)
  logInfo('main', `Skipped (errors):  ${upsertResult.skipped}`)

  if (upsertResult.errors.length > 0) {
    logInfo('main', '')
    logInfo('main', 'Errors:')
    for (const errMsg of upsertResult.errors) {
      logError('main', errMsg)
    }
  }

  // 6. Summary statistics from database
  logInfo('main', '')
  logInfo('main', '--- Database Summary ---')

  const { count: totalLeads } = await supabase
    .from('dealer_leads')
    .select('*', { count: 'exact', head: true })
    .eq('vertical', VERTICAL)

  const { count: newLeads } = await supabase
    .from('dealer_leads')
    .select('*', { count: 'exact', head: true })
    .eq('vertical', VERTICAL)
    .eq('status', 'new')

  logInfo('main', `Total leads in DB: ${totalLeads ?? 'unknown'}`)
  logInfo('main', `New (uncontacted):  ${newLeads ?? 'unknown'}`)

  logInfo('main', '')
  logInfo('main', '=== Scraping complete ===')
}

main().catch((err) => {
  logError('main', 'Unhandled error', err)
  process.exit(1)
})
