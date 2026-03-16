/**
 * Email Rendering Service
 *
 * Extracted from email/send.post.ts — handles template loading,
 * variable substitution, and HTML rendering independently of
 * the HTTP handler.
 */

// ---------------------------------------------------------------------------
// Variable substitution
// ---------------------------------------------------------------------------

/**
 * Replace {{variable}} placeholders in text with values from a map.
 * Falls back to empty string for missing variables.
 */
export function substituteVariables(
  text: string,
  variables: Record<string, string | number | undefined>,
): string {
  return text.replaceAll(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = variables[key]
    return value === undefined ? '' : String(value)
  })
}

// ---------------------------------------------------------------------------
// Markdown to email-safe HTML
// ---------------------------------------------------------------------------

/**
 * Convert simple markdown to email-safe HTML.
 * Supports: **bold**, [links](url), paragraphs, line breaks.
 */
export function markdownToEmailHtml(text: string): string {
  let html = text
    // Bold
    .replaceAll(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Links
    .replaceAll(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: inherit;">$1</a>')
    // Double newline = paragraph break
    .replaceAll('\n\n', '</p><p style="margin: 0 0 16px 0;">')
    // Single newline = line break
    .replaceAll('\n', '<br />')

  // Wrap in paragraph
  html = `<p style="margin: 0 0 16px 0;">${html}</p>`

  return html
}

// ---------------------------------------------------------------------------
// Branded HTML email wrapper
// ---------------------------------------------------------------------------

export interface EmailTheme {
  primaryColor: string
  logoUrl: string | null
  siteName: string
  siteUrl: string
}

const DEFAULT_THEME: EmailTheme = {
  primaryColor: '#23424A',
  logoUrl: null,
  siteName: getSiteName(),
  siteUrl: getSiteUrl(),
}

/**
 * Build a complete branded HTML email from body content.
 */
export function buildEmailHtml(
  bodyHtml: string,
  theme: Partial<EmailTheme> = {},
  options?: {
    locale?: string
    unsubscribeUrl?: string
    footerText?: string
  },
): string {
  const t = { ...DEFAULT_THEME, ...theme }
  const locale = options?.locale ?? 'es'
  const footerText =
    options?.footerText ??
    (locale === 'en'
      ? `You received this email because you have an account at ${t.siteName}.`
      : `Recibes este email porque tienes una cuenta en ${t.siteName}.`)

  const logoHtml = t.logoUrl
    ? `<img src="${t.logoUrl}" alt="${t.siteName}" width="160" style="display: block; margin: 0 auto 24px;" />`
    : `<h1 style="text-align: center; color: ${t.primaryColor}; font-size: 24px; margin: 0 0 24px;">${t.siteName}</h1>`

  const unsubLabel = locale === 'en' ? 'Unsubscribe' : 'Cancelar suscripción'
  const unsubscribeHtml = options?.unsubscribeUrl
    ? `<a href="${options.unsubscribeUrl}" style="color: #999; text-decoration: underline;">${unsubLabel}</a>`
    : ''

  return `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 8px; overflow: hidden; max-width: 100%;">
      <tr><td style="padding: 32px; border-top: 4px solid ${t.primaryColor};">
        ${logoHtml}
        ${bodyHtml}
      </td></tr>
      <tr><td style="padding: 16px 32px; background: #fafafa; text-align: center; font-size: 12px; color: #999;">
        <p style="margin: 0 0 8px;">${footerText}</p>
        ${unsubscribeHtml}
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
}

// ---------------------------------------------------------------------------
// Resolve localized field
// ---------------------------------------------------------------------------

/**
 * Extract the best available locale from a JSONB field.
 * Falls back: requested locale → 'es' → 'en' → first available.
 */
export function resolveLocalizedField(
  field: Record<string, string> | string | null,
  locale: string,
): string {
  if (!field) return ''
  if (typeof field === 'string') return field

  return field[locale] ?? field['es'] ?? field['en'] ?? Object.values(field)[0] ?? ''
}
