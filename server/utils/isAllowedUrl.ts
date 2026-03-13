/**
 * PATRON OBLIGATORIO: Cada endpoint que reciba URLs externas
 * (successUrl, returnUrl, redirectUrl, callbackUrl, etc.)
 * DEBE validarlas con esta funcion antes de usarlas.
 * Previene ataques de open redirect.
 *
 * Validates that a URL belongs to an allowed origin.
 * Used to prevent open redirect attacks in Stripe redirect URLs.
 */
export function isAllowedUrl(url: string): boolean {
  const siteUrl = getSiteUrl().replace(/\/$/, '')
  const ALLOWED_ORIGINS = [
    siteUrl,
    siteUrl.replace('https://', 'https://www.'),
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '',
  ].filter(Boolean)
  try {
    const parsed = new URL(url)
    return ALLOWED_ORIGINS.includes(parsed.origin)
  } catch {
    return false
  }
}
