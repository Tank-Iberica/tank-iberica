/**
 * GET /api/email/unsubscribe
 *
 * One-click unsubscribe handler. Receives token + email type via query params,
 * looks up the user by unsubscribe_token, and disables that email type in
 * email_preferences. Returns a simple HTML confirmation page.
 */
import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { safeError } from '../../utils/safeError'

// ── Types ──────────────────────────────────────────────────────────────────────

interface UserRow {
  id: string
  email: string
  name: string | null
}

// ── Handler ────────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = query.token as string | undefined
  const emailType = query.type as string | undefined
  const newsletterId = query.newsletter_id as string | undefined

  const supabase = serverSupabaseServiceRole(event)

  // ── Newsletter one-click unsubscribe (from El Industrial cron) ────────────
  if (newsletterId) {
    await supabase
      .from('newsletter_subscriptions')
      .update({ pref_newsletter: false })
      .eq('id', newsletterId)

    event.node.res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return buildHtmlPage({
      title: 'Suscripcion cancelada',
      heading: 'Suscripcion cancelada con exito',
      message:
        'Has cancelado la suscripcion a la newsletter El Industrial.<br><br>You have been unsubscribed from El Industrial newsletter.',
      showBackLink: true,
    })
  }

  if (!token || !emailType) {
    throw safeError(400, 'Missing required query params: token, type')
  }

  // ── 1. Look up user by unsubscribe_token ──────────────────────────────────
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, name')
    .eq('unsubscribe_token', token)
    .single()

  if (userError || !user) {
    // Return a graceful HTML page even on error
    event.node.res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return buildHtmlPage({
      title: 'Enlace no valido',
      heading: 'Enlace no valido / Invalid link',
      message:
        'El enlace de cancelacion de suscripcion no es valido o ha expirado. / The unsubscribe link is invalid or expired.',
      showBackLink: true,
    })
  }

  const typedUser = user as unknown as UserRow

  // ── 2. Upsert email_preferences to disable this email type ────────────────
  // Try to update first, then insert if not exists
  const { data: existing } = await supabase
    .from('email_preferences')
    .select('id')
    .eq('user_id', typedUser.id)
    .eq('email_type', emailType)
    .single()

  if (existing) {
    await supabase
      .from('email_preferences')
      .update({ enabled: false, updated_at: new Date().toISOString() })
      .eq('user_id', typedUser.id)
      .eq('email_type', emailType)
  } else {
    await supabase.from('email_preferences').insert({
      user_id: typedUser.id,
      email_type: emailType,
      enabled: false,
      updated_at: new Date().toISOString(),
    })
  }

  // ── 3. Return confirmation HTML page ──────────────────────────────────────
  event.node.res.setHeader('Content-Type', 'text/html; charset=utf-8')

  const displayName = typedUser.name ?? typedUser.email
  const emailTypeLabel = emailType.replaceAll('_', ' ').replaceAll(/\b\w/g, (c) => c.toUpperCase())

  return buildHtmlPage({
    title: 'Suscripcion cancelada',
    heading: 'Suscripcion cancelada con exito',
    message: `<strong>${displayName}</strong>, has cancelado la suscripcion a correos de tipo <strong>"${emailTypeLabel}"</strong>.<br><br>You have been unsubscribed from <strong>"${emailTypeLabel}"</strong> emails.<br><br>Si deseas volver a suscribirte, puedes hacerlo desde tu perfil de usuario. / If you wish to resubscribe, you can do so from your user profile.`,
    showBackLink: true,
  })
})

// ── HTML Builder ───────────────────────────────────────────────────────────────

function buildHtmlPage(params: {
  title: string
  heading: string
  message: string
  showBackLink: boolean
}): string {
  const { title, heading, message, showBackLink } = params
  const primary = '#23424A'
  const siteUrl = getSiteUrl()

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — ${getSiteName()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', Arial, Helvetica, sans-serif;
      background-color: #f4f4f5;
      color: #1a1a1a;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px 16px;
    }
    .card {
      background: #ffffff;
      border-radius: 12px;
      padding: 48px 32px;
      max-width: 500px;
      width: 100%;
      text-align: center;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    .icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background-color: ${primary};
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .icon svg { width: 32px; height: 32px; }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: ${primary};
      margin-bottom: 16px;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: #4b5563;
      margin-bottom: 24px;
    }
    .back-link {
      display: inline-block;
      padding: 12px 28px;
      background-color: ${primary};
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      transition: opacity 0.2s;
    }
    .back-link:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg fill="none" viewBox="0 0 24 24" stroke="#ffffff" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <h1>${heading}</h1>
    <p>${message}</p>
    ${showBackLink ? `<a href="${siteUrl}" class="back-link">Ir a ${getSiteName()} / Go to ${getSiteName()}</a>` : ''}
  </div>
</body>
</html>`
}
