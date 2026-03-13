/**
 * GET /api/social/oauth/callback?code=...&state=...
 *
 * OAuth2 callback handler for all social platforms.
 * Validates CSRF state, exchanges code for tokens, stores in vertical_config.
 * Redirects admin to the configured redirect_to URL.
 *
 * Platform is determined from the stored state record.
 */
import { defineEventHandler, getQuery, sendRedirect } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { getSiteUrl } from '../../../utils/siteConfig'
import { logger } from '../../../utils/logger'

type SocialPlatform = 'linkedin' | 'facebook' | 'instagram' | 'x'

interface TokenEndpointConfig {
  url: string
  clientIdEnv: string
  clientSecretEnv: string
  grantType: string
}

const TOKEN_ENDPOINTS: Record<SocialPlatform, TokenEndpointConfig> = {
  linkedin: {
    url: 'https://www.linkedin.com/oauth/v2/accessToken',
    clientIdEnv: 'LINKEDIN_CLIENT_ID',
    clientSecretEnv: 'LINKEDIN_CLIENT_SECRET',
    grantType: 'authorization_code',
  },
  facebook: {
    url: 'https://graph.facebook.com/v19.0/oauth/access_token',
    clientIdEnv: 'FACEBOOK_APP_ID',
    clientSecretEnv: 'FACEBOOK_APP_SECRET',
    grantType: 'authorization_code',
  },
  instagram: {
    url: 'https://graph.facebook.com/v19.0/oauth/access_token',
    clientIdEnv: 'FACEBOOK_APP_ID',
    clientSecretEnv: 'FACEBOOK_APP_SECRET',
    grantType: 'authorization_code',
  },
  x: {
    url: 'https://api.twitter.com/2/oauth2/token',
    clientIdEnv: 'X_CLIENT_ID',
    clientSecretEnv: 'X_CLIENT_SECRET',
    grantType: 'authorization_code',
  },
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  scope?: string
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { code, state, error: oauthError, error_description } = query as Record<string, string>
  const siteUrl = getSiteUrl()
  const supabase = serverSupabaseServiceRole(event)

  // Handle user-denied flow
  if (oauthError) {
    logger.warn({ oauthError, error_description }, 'OAuth denied by user or platform')
    return sendRedirect(
      event,
      `${siteUrl}/admin/social?oauth_error=${encodeURIComponent(error_description || oauthError)}`,
    )
  }

  if (!code || !state) {
    return sendRedirect(event, `${siteUrl}/admin/social?oauth_error=missing_params`)
  }

  // 1. Validate CSRF state
  const { data: stateRecord, error: stateErr } = await supabase
    .from('social_oauth_states')
    .select('platform, admin_id, redirect_to, expires_at')
    .eq('state', state)
    .single()

  if (stateErr || !stateRecord) {
    logger.warn({ state }, 'OAuth state not found or already used')
    return sendRedirect(event, `${siteUrl}/admin/social?oauth_error=invalid_state`)
  }

  // Check expiry
  if (new Date(stateRecord.expires_at) < new Date()) {
    logger.warn({ state }, 'OAuth state expired')
    await supabase.from('social_oauth_states').delete().eq('state', state)
    return sendRedirect(event, `${siteUrl}/admin/social?oauth_error=state_expired`)
  }

  // Delete state (one-time use)
  await supabase.from('social_oauth_states').delete().eq('state', state)

  const platform = stateRecord.platform as SocialPlatform
  const redirectTo = stateRecord.redirect_to || '/admin/social'
  const tokenConfig = TOKEN_ENDPOINTS[platform]

  if (!tokenConfig) {
    return sendRedirect(event, `${siteUrl}${redirectTo}?oauth_error=unknown_platform`)
  }

  const clientId = process.env[tokenConfig.clientIdEnv]
  const clientSecret = process.env[tokenConfig.clientSecretEnv]

  if (!clientId || !clientSecret) {
    logger.error({ platform }, 'OAuth credentials not configured')
    return sendRedirect(event, `${siteUrl}${redirectTo}?oauth_error=server_misconfigured`)
  }

  // 2. Exchange code for tokens
  const callbackUrl = `${siteUrl}/api/social/oauth/callback`
  const body = new URLSearchParams({
    grant_type: tokenConfig.grantType,
    code,
    redirect_uri: callbackUrl,
    client_id: clientId,
    client_secret: clientSecret,
  })

  // X uses Basic auth
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json',
  }

  if (platform === 'x') {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    headers['Authorization'] = `Basic ${credentials}`
    body.set('code_verifier', state) // matches simplified PKCE from connect.get.ts
  }

  let tokens: TokenResponse
  try {
    const resp = await fetch(tokenConfig.url, {
      method: 'POST',
      headers,
      body: body.toString(),
    })

    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`Token exchange failed (${resp.status}): ${text}`)
    }

    tokens = (await resp.json()) as TokenResponse
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Token exchange error'
    logger.error({ platform, err }, msg)
    return sendRedirect(event, `${siteUrl}${redirectTo}?oauth_error=token_exchange_failed`)
  }

  // 3. Store tokens in vertical_config
  const tokenData = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || null,
    expires_at: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null,
    token_type: tokens.token_type || 'Bearer',
    scope: tokens.scope || null,
    connected_at: new Date().toISOString(),
    connected_by: stateRecord.admin_id,
  }

  const { error: upsertErr } = await supabase.from('vertical_config').upsert(
    {
      key: `social_tokens_${platform}`,
      value: tokenData,
      description: `OAuth2 tokens for ${platform} social publishing`,
    },
    { onConflict: 'key' },
  )

  if (upsertErr) {
    logger.error({ platform, err: upsertErr }, 'Failed to store OAuth tokens')
    return sendRedirect(event, `${siteUrl}${redirectTo}?oauth_error=token_storage_failed`)
  }

  logger.info({ platform, adminId: stateRecord.admin_id }, 'OAuth connected successfully')
  return sendRedirect(event, `${siteUrl}${redirectTo}?oauth_success=${platform}`)
})
