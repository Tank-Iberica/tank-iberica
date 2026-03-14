/**
 * Geo-blocking middleware — optional per-vertical country restriction.
 *
 * Uses the CF-IPCountry header (set by Cloudflare) to block or allow
 * requests based on the vertical's allowed_countries configuration.
 *
 * Configuration via runtime config:
 *   NUXT_GEO_BLOCKING_ENABLED=true
 *   NUXT_GEO_BLOCKING_COUNTRIES=ES,PT,FR  (comma-separated ISO 3166-1 alpha-2)
 *   NUXT_GEO_BLOCKING_MODE=allow          (allow = whitelist, deny = blacklist)
 *
 * When disabled (default), all requests pass through.
 * API routes under /api/ are never blocked (for webhooks, crons, etc.).
 */
import { defineEventHandler, getRequestHeader, createError } from 'h3'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()

  // Feature flag — disabled by default
  const enabled = config.geoBlockingEnabled === 'true' || String(config.geoBlockingEnabled) === 'true'
  if (!enabled) return

  // Never block API routes (webhooks, crons, health checks)
  const path = event.path || ''
  if (path.startsWith('/api/')) return

  // Get country from Cloudflare header
  const country = getRequestHeader(event, 'cf-ipcountry')?.toUpperCase()

  // If no header (local dev, non-CF), allow through
  if (!country || country === 'XX' || country === 'T1') return

  const countriesRaw = (config.geoBlockingCountries as string) || ''
  if (!countriesRaw) return

  const countries = countriesRaw
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean)
  if (countries.length === 0) return

  const mode = ((config.geoBlockingMode as string) || 'allow').toLowerCase()

  const isInList = countries.includes(country)

  // Allow mode: only listed countries pass
  if (mode === 'allow' && !isInList) {
    throw createError({
      statusCode: 451,
      statusMessage: 'Unavailable For Legal Reasons',
      message: `This service is not available in your region (${country}).`,
    })
  }

  // Deny mode: listed countries are blocked
  if (mode === 'deny' && isInList) {
    throw createError({
      statusCode: 451,
      statusMessage: 'Unavailable For Legal Reasons',
      message: `This service is not available in your region (${country}).`,
    })
  }
})
