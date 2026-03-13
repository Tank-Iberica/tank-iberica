/**
 * POST /api/social/publish
 *
 * Server-side social media publisher for approved posts.
 * Reads OAuth tokens from vertical_config, calls real platform APIs.
 * Admin-only. Updates social_posts status on success/failure.
 *
 * Body: { postId: string }
 */
import { defineEventHandler } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { safeError } from '../../utils/safeError'
import { validateBody } from '../../utils/validateBody'
import { logger } from '../../utils/logger'
import { z } from 'zod'

const PublishSchema = z.object({
  postId: z.string().uuid('postId must be a valid UUID'),
})

type SocialPlatform = 'linkedin' | 'facebook' | 'instagram' | 'x'

interface OAuthTokens {
  access_token: string
  refresh_token?: string | null
  expires_at?: string | null
  token_type?: string
}

interface PostRecord {
  id: string
  platform: SocialPlatform
  content: Record<string, string>
  image_url: string | null
  status: string
}

// ── Platform publishers ───────────────────────────────────────────────────────

async function publishLinkedIn(
  content: string,
  imageUrl: string | null,
  tokens: OAuthTokens,
): Promise<string> {
  // Get user URN from LinkedIn
  const meResp = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  if (!meResp.ok) throw new Error(`LinkedIn userinfo failed: ${meResp.status}`)
  const me = (await meResp.json()) as { sub: string }

  const postBody: Record<string, unknown> = {
    author: `urn:li:person:${me.sub}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: content },
        shareMediaCategory: imageUrl ? 'IMAGE' : 'NONE',
        media: imageUrl
          ? [
              {
                status: 'READY',
                originalUrl: imageUrl,
                title: { text: content.substring(0, 70) },
              },
            ]
          : [],
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  }

  const resp = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postBody),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`LinkedIn post failed (${resp.status}): ${text}`)
  }

  const data = (await resp.json()) as { id?: string }
  return data.id || `li_${Date.now()}`
}

async function publishFacebook(
  content: string,
  imageUrl: string | null,
  tokens: OAuthTokens,
): Promise<string> {
  // First, get the page ID from token metadata
  const pagesResp = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${tokens.access_token}`,
  )
  if (!pagesResp.ok) throw new Error(`Facebook pages fetch failed: ${pagesResp.status}`)
  const pagesData = (await pagesResp.json()) as {
    data: { id: string; access_token: string }[]
  }

  const page = pagesData.data?.[0]
  if (!page) throw new Error('No Facebook pages found for this account')

  const params = new URLSearchParams({
    access_token: page.access_token,
    message: content,
  })
  if (imageUrl) params.set('link', imageUrl)

  const resp = await fetch(`https://graph.facebook.com/v19.0/${page.id}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Facebook post failed (${resp.status}): ${text}`)
  }

  const data = (await resp.json()) as { id?: string }
  return data.id || `fb_${Date.now()}`
}

async function publishInstagram(
  content: string,
  imageUrl: string | null,
  tokens: OAuthTokens,
): Promise<string> {
  if (!imageUrl) throw new Error('Instagram requires an image to publish')

  // Get IG Business account connected to the Page
  const pagesResp = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?fields=id,instagram_business_account&access_token=${tokens.access_token}`,
  )
  if (!pagesResp.ok) throw new Error(`Instagram pages fetch failed: ${pagesResp.status}`)
  const pagesData = (await pagesResp.json()) as {
    data: { id: string; instagram_business_account?: { id: string } }[]
  }

  const igAccount = pagesData.data?.find(
    (p) => p.instagram_business_account,
  )?.instagram_business_account
  if (!igAccount) throw new Error('No Instagram Business Account found')

  // Step 1: Create media container
  const containerResp = await fetch(`https://graph.facebook.com/v19.0/${igAccount.id}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      image_url: imageUrl,
      caption: content,
      access_token: tokens.access_token,
    }).toString(),
  })
  if (!containerResp.ok) {
    const text = await containerResp.text()
    throw new Error(`Instagram media container failed (${containerResp.status}): ${text}`)
  }
  const container = (await containerResp.json()) as { id: string }

  // Step 2: Publish container
  const publishResp = await fetch(
    `https://graph.facebook.com/v19.0/${igAccount.id}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        creation_id: container.id,
        access_token: tokens.access_token,
      }).toString(),
    },
  )
  if (!publishResp.ok) {
    const text = await publishResp.text()
    throw new Error(`Instagram publish failed (${publishResp.status}): ${text}`)
  }

  const published = (await publishResp.json()) as { id: string }
  return published.id || `ig_${Date.now()}`
}

async function publishX(
  content: string,
  _imageUrl: string | null,
  tokens: OAuthTokens,
): Promise<string> {
  const resp = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: content }),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`X post failed (${resp.status}): ${text}`)
  }

  const data = (await resp.json()) as { data?: { id: string } }
  return data.data?.id || `x_${Date.now()}`
}

const PUBLISHERS: Record<
  SocialPlatform,
  (content: string, imageUrl: string | null, tokens: OAuthTokens) => Promise<string>
> = {
  linkedin: publishLinkedIn,
  facebook: publishFacebook,
  instagram: publishInstagram,
  x: publishX,
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Unauthorized')

  const { postId } = await validateBody(event, PublishSchema)
  const supabase = serverSupabaseServiceRole(event)

  // Fetch post
  const { data: post, error: fetchErr } = await supabase
    .from('social_posts')
    .select('id, platform, content, image_url, status')
    .eq('id', postId)
    .single()

  if (fetchErr || !post) throw safeError(404, 'Post not found')

  const socialPost = post as PostRecord
  if (socialPost.status !== 'approved') {
    throw safeError(400, `Post must be 'approved' to publish (current: ${socialPost.status})`)
  }

  // Fetch OAuth tokens
  const { data: tokenConfig } = await supabase
    .from('vertical_config')
    .select('value')
    .eq('key', `social_tokens_${socialPost.platform}`)
    .single()

  const tokens = (tokenConfig as { value: OAuthTokens } | null)?.value

  if (!tokens?.access_token) {
    throw safeError(503, `Platform ${socialPost.platform} not connected. Configure OAuth first.`)
  }

  // Check token expiry
  if (tokens.expires_at && new Date(tokens.expires_at) < new Date()) {
    throw safeError(
      401,
      `OAuth token for ${socialPost.platform} has expired. Reconnect the platform.`,
    )
  }

  const publisher = PUBLISHERS[socialPost.platform]
  const content = socialPost.content?.es || socialPost.content?.en || ''

  let externalPostId: string
  try {
    externalPostId = await publisher(content, socialPost.image_url, tokens)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Publish failed'
    logger.error({ platform: socialPost.platform, postId, err }, msg)

    await supabase
      .from('social_posts')
      .update({ status: 'failed' } as never)
      .eq('id', postId)

    throw safeError(502, msg)
  }

  // Mark posted
  const { error: updateErr } = await supabase
    .from('social_posts')
    .update({
      status: 'posted',
      posted_at: new Date().toISOString(),
      external_post_id: externalPostId,
    } as never)
    .eq('id', postId)

  if (updateErr) {
    logger.error({ postId, updateErr }, 'Failed to update post status after publishing')
  }

  logger.info({ platform: socialPost.platform, postId, externalPostId }, 'Social post published')
  return { ok: true, postId, externalPostId, platform: socialPost.platform }
})
