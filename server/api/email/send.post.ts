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
  return text.replaceAll(/\{\{(\w+)\}\}/g, (_match, key: string) => {
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
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

  // Bold: **text**
  html = html.replaceAll(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // Links: [text](url)
  html = html.replaceAll(
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
      const withBreaks = trimmed.replaceAll('\n', '<br>')
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

async function loadEmailTemplate(
  supabase: ReturnType<typeof serverSupabaseServiceRole>,
  vertical: string,
  templateKey: string,
): Promise<{ template: EmailTemplate; config: VerticalConfigRow }> {
  const { data: config, error: configError } = await supabase
    .from('vertical_config')
    .select('email_templates, theme, logo_url, name')
    .eq('vertical', vertical)
    .single()

  if (configError || !config) {
    throw createError({
      statusCode: 500,
      message: `Failed to load vertical config: ${configError?.message ?? 'not found'}`,
    })
  }

  const typedConfig = config as unknown as VerticalConfigRow
  const templates = typedConfig.email_templates
  if (!templates?.[templateKey]) {
    throw createError({
      statusCode: 404,
      message: `Email template "${templateKey}" not found in vertical_config`,
    })
  }

  return { template: templates[templateKey]!, config: typedConfig }
}

async function checkEmailPreference(
  supabase: ReturnType<typeof serverSupabaseServiceRole>,
  userId: string,
  templateKey: string,
  vertical: string,
  to: string,
  variables: Record<string, string>,
): Promise<{ skipped: true; response: object } | null> {
  const { data: prefs } = await supabase
    .from('email_preferences')
    .select('enabled')
    .eq('user_id', userId)
    .eq('email_type', templateKey)
    .single()

  const typedPrefs = prefs as unknown as EmailPreferenceRow | null
  if (typedPrefs?.enabled === false) {
    await supabase.from('email_logs').insert({
      vertical,
      recipient_email: to,
      recipient_user_id: userId,
      template_key: templateKey,
      variables,
      status: 'skipped_preference',
    })
    return {
      skipped: true,
      response: { success: true, messageId: null, skipped: true, reason: 'user_preference' },
    }
  }
  return null
}

async function sendViaResend(
  resendApiKey: string,
  params: {
    to: string
    subject: string
    html: string
    unsubscribeUrl: string
    unsubscribeToken: string
  },
): Promise<string> {
  const resend = new Resend(resendApiKey)
  const result = await resend.emails.send({
    from: 'noreply@tracciona.com',
    to: params.to,
    subject: params.subject,
    html: params.html,
    headers: params.unsubscribeToken
      ? {
          'List-Unsubscribe': `<${params.unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        }
      : undefined,
  })

  if (result.error) {
    throw safeError(500, `Resend error: ${result.error.message}`)
  }

  return result.data?.id ?? ''
}

async function verifyEmailAuth(
  event: Parameters<Parameters<typeof defineEventHandler>[0]>[0],
  body: SendEmailBody,
): Promise<void> {
  const runtimeCfg = useRuntimeConfig()
  const internalSecret = runtimeCfg.cronSecret || process.env.CRON_SECRET
  const internalHeader = getHeader(event, 'x-internal-secret')
  if (internalSecret && internalHeader === internalSecret) return

  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Authentication required' })
  if (body.userId && body.userId !== user.id) body.userId = user.id
}

async function fetchUnsubscribeToken(
  supabase: ReturnType<typeof serverSupabaseServiceRole>,
  userId: string | undefined,
): Promise<string> {
  if (!userId) return ''
  const { data } = await supabase
    .from('users')
    .select('id, email, unsubscribe_token')
    .eq('id', userId)
    .single()
  return (data as unknown as UserRow | null)?.unsubscribe_token ?? ''
}

async function sendOrMockEmail(
  supabase: ReturnType<typeof serverSupabaseServiceRole>,
  logBase: Record<string, unknown>,
  sendParams: {
    to: string
    subject: string
    html: string
    unsubscribeUrl: string
    unsubscribeToken: string
  },
  templateKey: string,
): Promise<string> {
  const runtimeConfig = useRuntimeConfig()
  const resendApiKey = runtimeConfig.resendApiKey || process.env.RESEND_API_KEY

  if (!resendApiKey) {
    console.warn(`[email/send] RESEND_API_KEY not set. Mock sending template "${templateKey}"`)
    return `mock_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  }

  try {
    return await sendViaResend(resendApiKey, sendParams)
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown Resend error'
    await supabase
      .from('email_logs')
      .insert({
        ...logBase,
        status: 'failed',
        error: errorMessage,
        sent_at: new Date().toISOString(),
      })
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw safeError(500, `Email send failed: ${errorMessage}`)
  }
}

// ── Handler ────────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const VERTICAL = process.env.NUXT_PUBLIC_VERTICAL || 'tracciona'
  const body = await readBody<SendEmailBody>(event)

  await verifyEmailAuth(event, body)

  if (!body.templateKey || !body.to) {
    throw createError({ statusCode: 400, message: 'Missing required fields: templateKey and to' })
  }

  const locale = body.locale ?? 'es'
  const variables = body.variables ?? {}
  const siteUrl = 'https://tracciona.com'
  const supabase = serverSupabaseServiceRole(event)

  // ── 1. Read vertical config + check preferences ───────────────────────────
  const { template, config: typedConfig } = await loadEmailTemplate(
    supabase,
    VERTICAL,
    body.templateKey,
  )

  if (body.userId) {
    const prefResult = await checkEmailPreference(
      supabase,
      body.userId,
      body.templateKey,
      VERTICAL,
      body.to,
      variables,
    )
    if (prefResult) return prefResult.response
  }

  // ── 2. Resolve and substitute template ────────────────────────────────────
  const rawSubject = resolveLocalized(template.subject, locale)
  const rawBody = resolveLocalized(template.body, locale)
  if (!rawSubject || !rawBody) {
    throw createError({
      statusCode: 500,
      message: `Template "${body.templateKey}" has empty subject or body for locale "${locale}"`,
    })
  }

  const unsubscribeToken = await fetchUnsubscribeToken(supabase, body.userId)
  const allVariables: Record<string, string> = {
    ...variables,
    site_url: siteUrl,
    unsubscribe_token: unsubscribeToken,
    templateKey: body.templateKey,
  }
  const subject = substituteVariables(rawSubject, allVariables)
  const bodyText = substituteVariables(rawBody, allVariables)

  // ── 3. Build HTML ─────────────────────────────────────────────────────────
  const unsubscribeUrl = unsubscribeToken
    ? `${siteUrl}/api/email/unsubscribe?token=${unsubscribeToken}&type=${body.templateKey}`
    : siteUrl
  const siteName = resolveLocalized(typedConfig.name, locale) || 'Tracciona'
  const footerTextMap: Record<string, string> = {
    es: `Este correo fue enviado por ${siteName}. Si no deseas recibir estos correos, puedes cancelar tu suscripcion.`,
    en: `This email was sent by ${siteName}. If you no longer wish to receive these emails, you can unsubscribe.`,
  }
  const html = buildEmailHtml({
    bodyHtml: markdownToEmailHtml(bodyText),
    theme: typedConfig.theme ?? {},
    logoUrl: typedConfig.logo_url,
    siteName,
    siteUrl,
    unsubscribeUrl,
    footerText: footerTextMap[locale] ?? footerTextMap.es ?? '',
  })

  // ── 4. Send + log ─────────────────────────────────────────────────────────
  const logBase = {
    vertical: VERTICAL,
    recipient_email: body.to,
    recipient_user_id: body.userId ?? null,
    template_key: body.templateKey,
    subject,
    variables,
  }
  const resendId = await sendOrMockEmail(
    supabase,
    logBase,
    { to: body.to, subject, html, unsubscribeUrl, unsubscribeToken },
    body.templateKey,
  )
  await supabase
    .from('email_logs')
    .insert({
      ...logBase,
      status: 'sent',
      resend_id: resendId || null,
      sent_at: new Date().toISOString(),
    })

  return { success: true, messageId: resendId }
})
