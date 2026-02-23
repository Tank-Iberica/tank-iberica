/**
 * Validates that a URL belongs to an allowed origin.
 * Used to prevent open redirect attacks in Stripe redirect URLs.
 */
export function isAllowedUrl(url: string): boolean {
  const ALLOWED_ORIGINS = [
    'https://tracciona.com',
    'https://www.tracciona.com',
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '',
  ].filter(Boolean)
  try {
    const parsed = new URL(url)
    return ALLOWED_ORIGINS.includes(parsed.origin)
  } catch {
    return false
  }
}
