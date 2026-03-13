/**
 * Lightweight markdown-to-HTML converter — #169
 *
 * Converts a safe subset of markdown to HTML for vehicle descriptions.
 * Supports: paragraphs, bold, italic, inline links, line breaks.
 * Sanitization handled by DOMPurify via markdownToSafeHtml().
 *
 * Kept intentionally minimal — no external markdown deps needed.
 * Pure functions: fully testable without Nuxt.
 */

import DOMPurify from 'isomorphic-dompurify'

const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'a', 'p', 'br']
const ALLOWED_ATTR = ['href', 'rel']

/**
 * Convert a subset of markdown to raw HTML.
 * Does NOT sanitize — call markdownToSafeHtml() for user-facing output.
 *
 * Supported syntax:
 *   **bold** → <strong>bold</strong>
 *   *italic* → <em>italic</em>
 *   [text](url) → <a href="url" rel="noopener noreferrer">text</a>
 *   Blank line → paragraph break
 *   Single newline → <br>
 */
export function parseSimpleMarkdown(text: string): string {
  if (!text.trim()) return ''

  // Split on blank lines (two+ newlines) to get paragraphs
  const paragraphs = text.split(/\n{2,}/)

  const rendered = paragraphs.map((para) => {
    let html = para

    // Links: [text](url)
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" rel="noopener noreferrer">$1</a>',
    )

    // Bold: **text** or __text__
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')

    // Italic: *text* or _text_ (not preceded/followed by *)
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    html = html.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>')

    // Single newlines → <br>
    html = html.replace(/\n/g, '<br>')

    return `<p>${html}</p>`
  })

  return rendered.join('\n')
}

/**
 * Convert markdown to sanitized HTML safe for v-html rendering.
 * Uses DOMPurify to strip any injected malicious content.
 */
export function markdownToSafeHtml(text: string): string {
  if (!text.trim()) return ''
  const raw = parseSimpleMarkdown(text)
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  })
}
