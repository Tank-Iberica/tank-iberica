/**
 * Security headers middleware
 * Adds CSP and other security headers to HTML responses (not API routes).
 *
 * CSP audit (Sesión 37):
 * - unsafe-inline in script-src: REQUIRED by Nuxt 3 SSR hydration. Nuxt injects
 *   inline <script> for payload and state hydration. Removing it breaks the app.
 *   Ref: https://github.com/nuxt/nuxt/issues/13223
 * - unsafe-eval in script-src: REQUIRED by Chart.js (used in admin dashboards)
 *   for its internal expression parser. Only affects admin pages.
 *   Nonce-based CSP: Nuxt 4 supports nonces via the `nuxt-security` module,
 *   but adopting it requires replacing this custom middleware entirely.
 *   Current decision (Session 59): keep custom middleware + report-uri to
 *   monitor violations. Revisit when migrating to nuxt-security module.
 *   Chart.js unsafe-eval can be mitigated by lazy-loading Chart.js only in admin.
 * - unsafe-inline in style-src: REQUIRED by Vue's scoped styles and Nuxt SSR
 *   which injects inline <style> blocks during hydration.
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
    // unsafe-inline: Nuxt SSR hydration; unsafe-eval: Chart.js in admin (see file header)
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com",
    // unsafe-inline: Vue scoped styles + Nuxt SSR inline styles
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://res.cloudinary.com https://*.supabase.co https://flagcdn.com https://www.google-analytics.com https://www.googletagmanager.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://challenges.cloudflare.com https://www.google-analytics.com https://api.cloudflare.com",
    'frame-src https://js.stripe.com https://challenges.cloudflare.com',
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'report-uri /api/infra/csp-report',
  ].join('; ')

  headers.setHeader('Content-Security-Policy', csp)
  headers.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  headers.setHeader('X-Content-Type-Options', 'nosniff')
  headers.setHeader('X-Frame-Options', 'DENY')
  headers.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)')
})
