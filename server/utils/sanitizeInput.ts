/**
 * Server-side input sanitization (§2.4 Plan Maestro).
 *
 * Centralizes string sanitization for server routes.
 * DOMPurify handles client-side HTML sanitization; this handles
 * text fields that reach the server before any HTML rendering.
 *
 * Rules applied:
 *   - Strip null bytes (PostgreSQL chokes on \0)
 *   - Strip HTML tags (prevents stored XSS if content ever rendered unescaped)
 *   - Collapse repeated whitespace
 *   - Trim leading/trailing whitespace
 *   - Enforce max length (optional)
 *
 * Usage:
 *   sanitizeText(body.description)                    // basic cleanup
 *   sanitizeText(body.company_name, { maxLength: 100 })
 *   sanitizeTextRecord({ brand, model, description }) // sanitize object values
 */

interface SanitizeOptions {
  /** Maximum allowed length. Excess characters are truncated. Default: unlimited. */
  maxLength?: number
  /** Strip HTML tags. Default: true. */
  stripHtml?: boolean
}

/**
 * Sanitize a single string value for safe storage.
 */
export function sanitizeText(value: string, options: SanitizeOptions = {}): string {
  const { maxLength, stripHtml = true } = options

  let result = value
    // Remove null bytes — PostgreSQL and browsers handle them inconsistently
    .replaceAll(/\0/g, '')
    // Collapse carriage returns to newlines
    .replaceAll(/\r\n/g, '\n')
    .replaceAll(/\r/g, '\n')

  if (stripHtml) {
    // Strip HTML/script tags — simple regex is fine for stored text fields
    // (not a security-critical sanitizer for HTML rendering — use DOMPurify for that)
    result = result
      .replaceAll(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replaceAll(/<[^>]+>/g, '')
      // Decode common HTML entities to plain text
      .replaceAll(/&amp;/g, '&')
      .replaceAll(/&lt;/g, '<')
      .replaceAll(/&gt;/g, '>')
      .replaceAll(/&quot;/g, '"')
      .replaceAll(/&#x27;/g, "'")
  }

  // Trim and collapse repeated internal whitespace (preserve newlines)
  result = result
    .split('\n')
    .map((line) => line.trim().replace(/\s{2,}/g, ' '))
    .join('\n')
    .trim()

  // Enforce max length
  if (maxLength !== undefined && result.length > maxLength) {
    result = result.slice(0, maxLength)
  }

  return result
}

/**
 * Sanitize all string values in a plain object.
 * Non-string values are passed through unchanged.
 */
export function sanitizeRecord<T extends Record<string, unknown>>(
  record: T,
  options: SanitizeOptions = {},
): T {
  const result = { ...record }
  for (const key of Object.keys(result) as Array<keyof T>) {
    if (typeof result[key] === 'string') {
      result[key] = sanitizeText(result[key] as string, options) as T[typeof key]
    }
  }
  return result
}

/**
 * Sanitize a slug — alphanumeric + hyphens, lowercase, trimmed.
 * More aggressive than sanitizeText — intended for URL segments.
 */
export function sanitizeSlug(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(/\0/g, '')
    .replaceAll(/[^a-z0-9-]/g, '-')
    .replaceAll(/-+/g, '-')
    .replaceAll(/(?:^-|-$)/g, '')
    .slice(0, 200)
}
