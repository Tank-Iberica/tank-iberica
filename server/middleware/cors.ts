/**
 * CORS middleware for API routes.
 *
 * Restricts cross-origin requests to known origins:
 * - Own site URL (from env)
 * - Supabase project URL
 * - Stripe JS SDK
 * - Cloudflare Turnstile
 *
 * Note: Cloudflare Pages already handles CORS for static assets.
 * This middleware adds explicit CORS headers for /api/* routes.
 */
import { defineEventHandler, getHeader, setResponseHeaders, setResponseStatus } from 'h3'
import { getSiteUrl } from '~~/server/utils/siteConfig'

export default defineEventHandler((event) => {
  const path = event.path || ''

  // Only apply CORS to API routes
  if (!path.startsWith('/api/')) return

  const origin = getHeader(event, 'origin')
  if (!origin) return

  const allowedOrigins = [
    getSiteUrl(),
    process.env.SUPABASE_URL,
    'https://js.stripe.com',
    'https://challenges.cloudflare.com',
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
  ].filter(Boolean) as string[]

  // Normalize origins (remove trailing slashes)
  const normalizedOrigin = origin.replace(/\/$/, '')
  const isAllowed = allowedOrigins.some((o) => normalizedOrigin === o.replace(/\/$/, ''))

  if (!isAllowed) return

  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, x-internal-secret, x-cron-secret, x-health-token, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  })

  // Handle preflight — use h3's response flow instead of raw res.end()
  if (event.method === 'OPTIONS') {
    setResponseStatus(event, 204)
    return ''
  }
})
