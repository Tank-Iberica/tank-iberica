/**
 * POST /api/email/send
 *
 * Core email sending route. Reads template from vertical_config.email_templates,
 * substitutes variables, converts markdown to HTML, wraps in branded template,
 * checks user preferences, sends via Resend, and logs to email_logs.
 */
import { createError, defineEventHandler, getHeader, readBody } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { Resend } from 'resend'

// ── Types ──────────────────────────────────────────────────────────────────────

interface SendEmailBody {
  templateKey: string
  to: string
  userId?: string
  variables?: Record<string, string>
  locale?: string
}

interface LocalizedField {
  es?: string
  en?: string
  fr?: string
  [key: string]: string | undefined
}

interface EmailTemplate {
  subject: LocalizedField
  body: LocalizedField
}

interface ThemeConfig {
  primary?: string
  accent?: string
  background?: string
  text?: string
  [key: string]: string | undefined
}

interface VerticalConfigRow {
  email_templates: Record<string, EmailTemplate> | null
  theme: ThemeConfig
  logo_url: string | null
  name: LocalizedField
}

interface UserRow {
  id: string
  email: string
  unsubscribe_token: string | null
}

interface EmailPreferenceRow {
  enabled: boolean
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Resolve a localized JSONB field to a string for the given locale.
 * Falls back to 'es' then to first available value.
 */
function resolveLocalized(
  field: LocalizedField | string | undefined | null,
  locale: string,
): string {
  if (!field) return ''
  if (typeof field === 'string') return field
  return field[locale] ?? field.es ?? Object.values(field).find(Boolean) ?? ''
}

/**
 * Replace all {{variable}} placeholders in text with provided values.
 */
function substituteVariables(text: string, variables: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    return variables[key] ?? `{{${key}}}`
  })
}

/**
 * Convert simple markdown to inline-styled HTML for email clients.
 * Supports: **bold**, [link](url), paragraphs (double newline), line breaks.
 */
function markdownToEmailHtml(md: string): string {
  let html = md
    // Escape HTML special chars (except what we'll generate)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Bold: **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // Links: [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" style="color: inherit; text-decoration: underline;">$1</a>',
  )

  // Paragraphs: split on double newlines
  const paragraphs = html.split(/\n{2,}/)
  html = paragraphs
    .map((p) => {
      const trimmed = p.trim()
      if (!trimmed) return ''
      // Convert single newlines to <br> within a paragraph
      const withBreaks = trimmed.replace(/\n/g, '<br>')
      return `<p style="margin: 0 0 16px 0; line-height: 1.6;">${withBreaks}</p>`
    })
    .filter(Boolean)
    .join('')

  return html
}

/**
 * Build the full branded HTML email wrapper.
 */
function buildEmailHtml(params: {
  bodyHtml: string
  theme: ThemeConfig
  logoUrl: string | null
  siteName: string
  siteUrl: string
  unsubscribeUrl: string
  footerText: string
}): string {
  const { bodyHtml, theme, logoUrl, siteName, siteUrl, unsubscribeUrl, footerText } = params
  const primary = theme.primary ?? '#23424A'
  const bgColor = theme.background ?? '#f4f4f5'
  const textColor = theme.text ?? '#1a1a1a'

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${siteName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${bgColor}; font-family: 'Inter', Arial, Helvetica, sans-serif; color: ${textColor}; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${bgColor};">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${primary}; padding: 24px 32px; text-align: center;">
              ${
                logoUrl
                  ? `<img src="${logoUrl}" alt="${siteName}" style="max-height: 40px; max-width: 200px; display: inline-block;" />`
                  : `<span style="font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">${siteName}</span>`
              }
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px; font-size: 16px; line-height: 1.6; color: ${textColor};">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; text-align: center;">
              <p style="margin: 0 0 8px 0;">${footerText}</p>
              <p style="margin: 0 0 8px 0;">
                <a href="${siteUrl}" style="color: ${primary}; text-decoration: underline;">${siteName}</a>
              </p>
              <p style="margin: 0;">
                <a href="${unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline; font-size: 12px;">Cancelar suscripcion / Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Handler ────────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const VERTICAL = process.env.NUXT_PUBLIC_VERTICAL || 'tracciona'
  const body = await readBody<SendEmailBody>(event)

  // ── Auth check: internal secret OR authenticated user ───────────────────
  const runtimeCfg = useRuntimeConfig()
  const internalSecret = runtimeCfg.cronSecret || process.env.CRON_SECRET
  const internalHeader = getHeader(event, 'x-internal-secret')
  const isInternalCall = internalSecret && internalHeader === internalSecret

  if (!isInternalCall) {
    const user = await serverSupabaseUser(event)
    if (!user) {
      throw createError({ statusCode: 401, message: 'Authentication required' })
    }
    // Force userId to the authenticated user to prevent spoofing
    if (body.userId && body.userId !== user.id) {
      body.userId = user.id
    }
  }

  if (!body.templateKey || !body.to) {
    throw createError({ statusCode: 400, message: 'Missing required fields: templateKey and to' })
  }

  const locale = body.locale ?? 'es'
  const variables = body.variables ?? {}
  const siteUrl = 'https://tracciona.com'

  const supabase = serverSupabaseServiceRole(event)

  // ── 1. Read vertical config (template + theme + branding) ─────────────────
  const { data: config, error: configError } = await supabase
    .from('vertical_config')
    .select('email_templates, theme, logo_url, name')
    .eq('vertical', VERTICAL)
    .single()

  if (configError || !config) {
    throw createError({
      statusCode: 500,
      message: `Failed to load vertical config: ${configError?.message ?? 'not found'}`,
    })
  }

  const typedConfig = config as unknown as VerticalConfigRow
  const templates = typedConfig.email_templates
  if (!templates || !templates[body.templateKey]) {
    throw createError({
      statusCode: 404,
      message: `Email template "${body.templateKey}" not found in vertical_config`,
    })
  }

  const template = templates[body.templateKey]

  // ── 2. Check user email preferences ───────────────────────────────────────
  if (body.userId) {
    const { data: prefs } = await supabase
      .from('email_preferences')
      .select('enabled')
      .eq('user_id', body.userId)
      .eq('email_type', body.templateKey)
      .single()

    const typedPrefs = prefs as unknown as EmailPreferenceRow | null
    if (typedPrefs && typedPrefs.enabled === false) {
      // User has opted out of this email type — skip sending
      await supabase.from('email_logs').insert({
        vertical: VERTICAL,
        recipient_email: body.to,
        recipient_user_id: body.userId,
        template_key: body.templateKey,
        variables: variables as Record<string, string>,
        status: 'skipped_preference',
      })

      return { success: true, messageId: null, skipped: true, reason: 'user_preference' }
    }
  }

  // ── 3. Resolve template fields for locale ─────────────────────────────────
  const rawSubject = resolveLocalized(template.subject, locale)
  const rawBody = resolveLocalized(template.body, locale)

  if (!rawSubject || !rawBody) {
    throw createError({
      statusCode: 500,
      message: `Template "${body.templateKey}" has empty subject or body for locale "${locale}"`,
    })
  }

  // ── 4. Get user unsubscribe token if userId provided ──────────────────────
  let unsubscribeToken = ''
  if (body.userId) {
    const { data: userData } = await supabase
      .from('users')
      .select('id, email, unsubscribe_token')
      .eq('id', body.userId)
      .single()

    const typedUser = userData as unknown as UserRow | null
    if (typedUser?.unsubscribe_token) {
      unsubscribeToken = typedUser.unsubscribe_token
    }
  }

  // ── 5. Substitute variables ───────────────────────────────────────────────
  const allVariables: Record<string, string> = {
    ...variables,
    site_url: siteUrl,
    unsubscribe_token: unsubscribeToken,
    templateKey: body.templateKey,
  }

  const subject = substituteVariables(rawSubject, allVariables)
  const bodyText = substituteVariables(rawBody, allVariables)

  // ── 6. Convert markdown to HTML and wrap in branded template ──────────────
  const bodyHtml = markdownToEmailHtml(bodyText)
  const unsubscribeUrl = unsubscribeToken
    ? `${siteUrl}/api/email/unsubscribe?token=${unsubscribeToken}&type=${body.templateKey}`
    : `${siteUrl}`

  const siteName = resolveLocalized(typedConfig.name, locale) || 'Tracciona'
  const theme = (typedConfig.theme ?? {}) as ThemeConfig

  const footerTextMap: Record<string, string> = {
    es: `Este correo fue enviado por ${siteName}. Si no deseas recibir estos correos, puedes cancelar tu suscripcion.`,
    en: `This email was sent by ${siteName}. If you no longer wish to receive these emails, you can unsubscribe.`,
  }
  const footerText = footerTextMap[locale] ?? footerTextMap.es

  const html = buildEmailHtml({
    bodyHtml,
    theme,
    logoUrl: typedConfig.logo_url,
    siteName,
    siteUrl,
    unsubscribeUrl,
    footerText,
  })

  // ── 7. Send via Resend (or mock in dev) ───────────────────────────────────
  const runtimeConfig = useRuntimeConfig()
  const resendApiKey = runtimeConfig.resendApiKey || process.env.RESEND_API_KEY
  let resendId = ''
  let status = 'sent'

  if (!resendApiKey) {
    // Dev mode — log and return mock
    console.warn(
      `[email/send] RESEND_API_KEY not set. Mock sending email to ${body.to} with template "${body.templateKey}"`,
    )
    console.warn(`[email/send] Subject: ${subject}`)
    resendId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  } else {
    try {
      const resend = new Resend(resendApiKey)
      const result = await resend.emails.send({
        from: 'noreply@tracciona.com',
        to: body.to,
        subject,
        html,
        headers: unsubscribeToken
          ? {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            }
          : undefined,
      })

      if (result.error) {
        status = 'failed'
        // Log the failure
        await supabase.from('email_logs').insert({
          vertical: VERTICAL,
          recipient_email: body.to,
          recipient_user_id: body.userId ?? null,
          template_key: body.templateKey,
          subject,
          variables: variables as Record<string, string>,
          status: 'failed',
          error: result.error.message,
          sent_at: new Date().toISOString(),
        })

        throw safeError(500, `Resend error: ${result.error.message}`)
      }

      resendId = result.data?.id ?? ''
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'statusCode' in err) {
        throw err // Re-throw h3 errors
      }
      const errorMessage = err instanceof Error ? err.message : 'Unknown Resend error'
      status = 'failed'

      await supabase.from('email_logs').insert({
        vertical: VERTICAL,
        recipient_email: body.to,
        recipient_user_id: body.userId ?? null,
        template_key: body.templateKey,
        subject,
        variables: variables as Record<string, string>,
        status: 'failed',
        error: errorMessage,
        sent_at: new Date().toISOString(),
      })

      throw safeError(500, `Email send failed: ${errorMessage}`)
    }
  }

  // ── 8. Log to email_logs ──────────────────────────────────────────────────
  await supabase.from('email_logs').insert({
    vertical: VERTICAL,
    recipient_email: body.to,
    recipient_user_id: body.userId ?? null,
    template_key: body.templateKey,
    subject,
    variables: variables as Record<string, string>,
    status,
    resend_id: resendId || null,
    sent_at: new Date().toISOString(),
  })

  return { success: true, messageId: resendId }
})
