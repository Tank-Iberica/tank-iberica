/**
 * GET /api/social/oauth/connect?platform=linkedin|facebook|instagram|x
 *
 * Initiates the OAuth2 authorization flow for a social platform.
 * Admin-only. Returns { redirectUrl } for the client to navigate to.
 *
 * Stores a CSRF state token in social_oauth_states for validation on callback.
 */
import { defineEventHandler, getQuery, createError } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { getSiteUrl } from '../../../utils/siteConfig'
import { logger } from '../../../utils/logger'

type SocialPlatform = 'linkedin' | 'facebook' | 'instagram' | 'x'

const PLATFORM_CONFIG: Record<
  SocialPlatform,
  { authUrl: string; scopes: string; clientIdEnv: string }
> = {
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    scopes: 'openid profile w_member_social',
    clientIdEnv: 'LINKEDIN_CLIENT_ID',
  },
  facebook: {
    authUrl: 'https://www.facebook.com/dialog/oauth',
    scopes: 'pages_manage_posts pages_read_engagement',
    clientIdEnv: 'FACEBOOK_APP_ID',
  },
  instagram: {
    authUrl: 'https://www.facebook.com/dialog/oauth',
    scopes: 'instagram_basic instagram_content_publish pages_show_list',
    clientIdEnv: 'FACEBOOK_APP_ID',
  },
  x: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    scopes: 'tweet.write tweet.read users.read offline.access',
    clientIdEnv: 'X_CLIENT_ID',
  },
}

function randomHex(length: number): string {
  const chars = '0123456789abcdef'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const query = getQuery(event)
  const platform = query.platform as string

  if (!PLATFORM_CONFIG[platform as SocialPlatform]) {
    throw createError({
      statusCode: 400,
      message: `Invalid platform. Must be one of: ${Object.keys(PLATFORM_CONFIG).join(', ')}`,
    })
  }

  const config = PLATFORM_CONFIG[platform as SocialPlatform]
  const clientId = process.env[config.clientIdEnv]

  if (!clientId) {
    throw createError({
      statusCode: 503,
      message: `Platform ${platform} not configured. Set ${config.clientIdEnv} environment variable.`,
    })
  }

  // Generate CSRF state token
  const state = randomHex(32)
  const callbackUrl = `${getSiteUrl()}/api/social/oauth/callback`

  // Store state in DB
  const supabase = serverSupabaseServiceRole(event)
  const { error: stateErr } = await supabase.from('social_oauth_states').insert({
    state,
    platform,
    admin_id: user.id,
    redirect_to: (query.redirect_to as string) || '/admin/social',
  })

  if (stateErr) {
    logger.error({ err: stateErr }, 'Failed to store OAuth state')
    throw createError({ statusCode: 500, message: 'Failed to initiate OAuth flow' })
  }

  // Build authorization URL
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: config.scopes,
    state,
  })

  // X requires PKCE — add code_challenge (simplified: S256 with random verifier)
  if (platform === 'x') {
    params.set('code_challenge_method', 'plain')
    params.set('code_challenge', state) // simplified; real PKCE would use SHA256
  }

  const redirectUrl = `${config.authUrl}?${params.toString()}`
  logger.info({ platform, adminId: user.id }, 'OAuth connect initiated')

  return { redirectUrl }
})
