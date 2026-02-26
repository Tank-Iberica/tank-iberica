/**
 * 301 Redirect middleware
 *
 * Handles permanent redirects for URL structure changes.
 * Also logs frequent 404s for identifying URLs that need redirection.
 *
 * Note: www → non-www is handled by Cloudflare Page Rules.
 */
import { defineEventHandler, sendRedirect } from 'h3'

// Static redirect map: old path → new path
const REDIRECT_MAP: Record<string, string> = {
  // Legacy Tank Ibérica URLs
  '/vehiculos': '/',
  '/vehicles': '/',
  '/catalogo': '/',
  '/catalog': '/',
  '/contacto': '/sobre-nosotros',
  '/contact': '/sobre-nosotros',
  '/about': '/sobre-nosotros',
  '/privacidad': '/legal/privacidad',
  '/privacy': '/legal/privacidad',
  '/terminos': '/legal/condiciones',
  '/terms': '/legal/condiciones',
  '/cookies': '/legal/cookies',
}

// Pattern-based redirects (checked via regex)
const PATTERN_REDIRECTS: { pattern: RegExp; replace: string }[] = [
  // /vehiculos/123 → / (old numeric ID URLs)
  { pattern: /^\/vehiculos\/(\d+)$/, replace: '/' },
  // /en/vehicles/xxx → /en/vehiculo/xxx
  { pattern: /^\/en\/vehicles\/(.+)$/, replace: '/en/vehiculo/$1' },
]

// 404 frequency tracking (in-memory, resets on server restart)
const notFoundCounts = new Map<string, number>()
let lastLogTime = Date.now()
const LOG_INTERVAL = 60 * 60 * 1000 // Log frequent 404s every hour
const MIN_COUNT_TO_LOG = 3

export default defineEventHandler((event) => {
  const path = event.path || ''

  // Skip API and static asset routes
  if (path.startsWith('/api/') || path.startsWith('/_nuxt/') || path.startsWith('/__nuxt')) {
    return
  }

  // Normalize: remove trailing slash (except root)
  const cleanPath = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path

  // Check static redirects
  const staticTarget = REDIRECT_MAP[cleanPath] || REDIRECT_MAP[cleanPath.toLowerCase()]
  if (staticTarget) {
    return sendRedirect(event, staticTarget, 301)
  }

  // Check pattern redirects
  for (const { pattern, replace } of PATTERN_REDIRECTS) {
    if (pattern.test(cleanPath)) {
      const target = cleanPath.replace(pattern, replace)
      return sendRedirect(event, target, 301)
    }
  }

  // Trailing slash redirect (non-root paths)
  if (path.length > 1 && path.endsWith('/')) {
    return sendRedirect(event, cleanPath, 301)
  }
})

/**
 * Track a 404 for frequency analysis.
 * Called from error handling when a 404 is detected.
 */
export function track404(path: string): void {
  const count = (notFoundCounts.get(path) || 0) + 1
  notFoundCounts.set(path, count)

  // Periodically log frequent 404s
  const now = Date.now()
  if (now - lastLogTime > LOG_INTERVAL) {
    lastLogTime = now
    const frequent = [...notFoundCounts.entries()]
      .filter(([, c]) => c >= MIN_COUNT_TO_LOG)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)

    if (frequent.length > 0) {
      console.warn(
        '[Redirects] Frequent 404s (consider adding redirects):',
        JSON.stringify(frequent),
      )
    }

    // Reset counters
    notFoundCounts.clear()
  }
}
