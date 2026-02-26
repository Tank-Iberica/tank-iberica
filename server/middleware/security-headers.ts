/**
 * Security headers middleware
 * Adds CSP and other security headers to HTML responses (not API routes).
 *
 * ## Nonce-based CSP assessment (Sessions 59-60):
 *
 * Nuxt 4 supports nonce-based CSP via the `nuxt-security` module, which would
 * allow removing `unsafe-inline` from script-src. However, adopting it requires:
 *   1. Installing `nuxt-security` module
 *   2. Removing this custom middleware entirely (nuxt-security manages its own)
 *   3. Configuring all CSP directives through nuxt.config.ts
 *   4. Testing every page for hydration breakage
 *
 * **Decision (Session 60):** NOT VIABLE at this time. Reasons:
 *   - Migration risk: replacing a working middleware with a module dependency
 *   - Chart.js still requires `unsafe-eval` regardless of nonces
 *   - Vue scoped styles still inject inline <style> (unsafe-inline in style-src)
 *   - Current CSP + report-uri provides adequate monitoring for violations
 *
 * **Mitigation in place:**
 *   - report-uri sends violations to /api/infra/csp-report for monitoring
 *   - ZAP rule 10055 set to WARN (not FAIL) for unsafe-inline
 *   - All other XSS/injection rules set to FAIL in DAST scan
 *
 * **Revisit when:** nuxt-security module reaches stable v2+ and Chart.js
 *   drops eval requirement, or when migrating to Nuxt 5.
 *
 * ## Current CSP directives rationale:
 * - unsafe-inline in script-src: REQUIRED by Nuxt SSR hydration inline scripts
 * - unsafe-eval in script-src: REQUIRED by Chart.js expression parser (admin only)
 * - unsafe-inline in style-src: REQUIRED by Vue scoped styles + SSR inline styles
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
  // Cross-Origin headers for additional isolation
  headers.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  headers.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
})
