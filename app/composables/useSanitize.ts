import DOMPurify from 'isomorphic-dompurify'

export function useSanitize() {
  /**
   * Sanitize user-generated HTML allowing a safe subset of tags.
   * Suitable for rich-text content like descriptions and articles.
   */
  function sanitize(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h2', 'h3', 'h4'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
    })
  }

  /**
   * Strip ALL HTML tags and attributes. Returns plain text only.
   * Suitable for inputs that should never contain markup (names, titles, etc.).
   */
  function sanitizeStrict(dirty: string): string {
    return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
  }

  return { sanitize, sanitizeStrict }
}
