/**
 * Security headers middleware
 * Adds CSP and other security headers to HTML responses (not API routes).
 */
export default defineEventHandler((event) => {
  // Only apply to non-API routes (HTML pages)
  const path = event.path || ''
  if (path.startsWith('/api/') || path.startsWith('/_nuxt/')) {
    return
  }

  const headers = event.node.res

  // Content-Security-Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://res.cloudinary.com https://*.supabase.co https://flagcdn.com https://www.google-analytics.com https://www.googletagmanager.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://challenges.cloudflare.com https://www.google-analytics.com https://api.cloudflare.com",
    'frame-src https://js.stripe.com https://challenges.cloudflare.com',
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')

  headers.setHeader('Content-Security-Policy', csp)
  headers.setHeader('X-Content-Type-Options', 'nosniff')
  headers.setHeader('X-Frame-Options', 'DENY')
  headers.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)')
})
