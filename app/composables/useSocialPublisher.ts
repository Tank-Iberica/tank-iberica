/**
 * Social Media Publisher Composable
 * Adapter pattern for multi-platform social publishing.
 * Real API calls require OAuth tokens configured in vertical_config.
 */

export type SocialPlatform = 'linkedin' | 'facebook' | 'instagram' | 'x'

export interface SocialPost {
  id: string
  vehicle_id: string | null
  article_id: string | null
  platform: SocialPlatform
  content: Record<string, string> // JSONB {"es": "...", "en": "..."}
  image_url: string | null
  status: string // 'draft' | 'pending' | 'approved' | 'posted' | 'rejected' | 'failed'
  scheduled_at: string | null
  posted_at: string | null
  external_post_id: string | null
  impressions: number
  clicks: number
  approved_at: string | null
  approved_by: string | null
  rejection_reason: string | null
  created_at: string
}

export interface SocialPostWithVehicle extends SocialPost {
  vehicles: {
    id: string
    brand: string
    model: string
    slug: string
    price: number | null
    location: string | null
    vehicle_images: { url: string; position: number }[]
  } | null
}

// Platform adapter interface
interface PlatformAdapter {
  name: SocialPlatform
  publish(
    content: string,
    imageUrl: string | null,
    tokens: Record<string, string>,
  ): Promise<{ postId: string } | null>
  getCharacterLimit(): number
  formatContent(
    vehicleTitle: string,
    price: string,
    location: string,
    url: string,
    locale: string,
  ): string
}

// ============================================
// PLATFORM ADAPTERS
// ============================================

const LinkedInAdapter: PlatformAdapter = {
  name: 'linkedin',

  getCharacterLimit() {
    return 3000
  },

  formatContent(
    vehicleTitle: string,
    price: string,
    location: string,
    url: string,
    locale: string,
  ): string {
    if (locale === 'en') {
      return [
        `\uD83D\uDE9B New on Tracciona: ${vehicleTitle}`,
        `\uD83D\uDCCD ${location} | \uD83D\uDCB0 ${price}`,
        `\u2705 Available now`,
        ``,
        `Industrial vehicle marketplace for professionals.`,
        ``,
        `\uD83D\uDC49 ${url}`,
        ``,
        `#industrialvehicles #trucks #logistics #transport #tracciona`,
      ].join('\n')
    }
    return [
      `\uD83D\uDE9B Nuevo en Tracciona: ${vehicleTitle}`,
      `\uD83D\uDCCD ${location} | \uD83D\uDCB0 ${price}`,
      `\u2705 Disponible ahora`,
      ``,
      `Marketplace de vehiculos industriales para profesionales.`,
      ``,
      `\uD83D\uDC49 ${url}`,
      ``,
      `#vehiculosindustriales #camiones #logistica #transporte #tracciona`,
    ].join('\n')
  },

  async publish(
    _content: string,
    _imageUrl: string | null,
    _tokens: Record<string, string>,
  ): Promise<{ postId: string } | null> {
    // ---------------------------------------------------------------
    // PLACEHOLDER: Real implementation would POST to:
    //   https://api.linkedin.com/v2/ugcPosts
    // Headers: Authorization: Bearer {tokens.access_token}
    // Body: { author, lifecycleState: 'PUBLISHED', specificContent: { ... } }
    // ---------------------------------------------------------------
    if (import.meta.dev) {
      console.info('[LinkedInAdapter] publish() — placeholder, no real API call')
    }
    return { postId: `li_mock_${Date.now()}` }
  },
}

const FacebookAdapter: PlatformAdapter = {
  name: 'facebook',

  getCharacterLimit() {
    return 63206
  },

  formatContent(
    vehicleTitle: string,
    price: string,
    location: string,
    url: string,
    locale: string,
  ): string {
    if (locale === 'en') {
      return [
        `New vehicle available! ${vehicleTitle}`,
        `\uD83D\uDCCD ${location}`,
        `\uD83D\uDCB0 ${price}`,
        `\uD83D\uDD17 See full listing: ${url}`,
      ].join('\n')
    }
    return [
      `\u00A1Nuevo vehiculo disponible! ${vehicleTitle}`,
      `\uD83D\uDCCD ${location}`,
      `\uD83D\uDCB0 ${price}`,
      `\uD83D\uDD17 Ver ficha completa: ${url}`,
    ].join('\n')
  },

  async publish(
    _content: string,
    _imageUrl: string | null,
    _tokens: Record<string, string>,
  ): Promise<{ postId: string } | null> {
    // ---------------------------------------------------------------
    // PLACEHOLDER: Real implementation would POST to:
    //   https://graph.facebook.com/v18.0/{page_id}/feed
    // With: access_token, message, link (optional photo via /photos endpoint)
    // ---------------------------------------------------------------
    if (import.meta.dev) {
      console.info('[FacebookAdapter] publish() — placeholder, no real API call')
    }
    return { postId: `fb_mock_${Date.now()}` }
  },
}

const InstagramAdapter: PlatformAdapter = {
  name: 'instagram',

  getCharacterLimit() {
    return 2200
  },

  formatContent(
    vehicleTitle: string,
    price: string,
    location: string,
    _url: string,
    locale: string,
  ): string {
    if (locale === 'en') {
      return [
        `${vehicleTitle} available on Tracciona \uD83D\uDE9B`,
        `\uD83D\uDCCD ${location}`,
        `\uD83D\uDCB0 ${price}`,
        ``,
        `#industrialvehicles #transport #tracciona #trucks #logistics #semitrailers`,
      ].join('\n')
    }
    return [
      `${vehicleTitle} disponible en Tracciona \uD83D\uDE9B`,
      `\uD83D\uDCCD ${location}`,
      `\uD83D\uDCB0 ${price}`,
      ``,
      `#vehiculosindustriales #transporte #tracciona #camiones #logistica #semirremolques`,
    ].join('\n')
  },

  async publish(
    _content: string,
    _imageUrl: string | null,
    _tokens: Record<string, string>,
  ): Promise<{ postId: string } | null> {
    // ---------------------------------------------------------------
    // PLACEHOLDER: Real implementation uses Instagram Graph API:
    //   1. POST /{ig-user-id}/media — create media container
    //   2. POST /{ig-user-id}/media_publish — publish container
    // ---------------------------------------------------------------
    if (import.meta.dev) {
      console.info('[InstagramAdapter] publish() — placeholder, no real API call')
    }
    return { postId: `ig_mock_${Date.now()}` }
  },
}

const XAdapter: PlatformAdapter = {
  name: 'x',

  getCharacterLimit() {
    return 280
  },

  formatContent(
    vehicleTitle: string,
    price: string,
    location: string,
    url: string,
    locale: string,
  ): string {
    if (locale === 'en') {
      return `\uD83D\uDE9B ${vehicleTitle} | ${price} | ${location}\n${url}`
    }
    return `\uD83D\uDE9B ${vehicleTitle} | ${price} | ${location}\n${url}`
  },

  async publish(
    _content: string,
    _imageUrl: string | null,
    _tokens: Record<string, string>,
  ): Promise<{ postId: string } | null> {
    // ---------------------------------------------------------------
    // PLACEHOLDER: Real implementation would POST to:
    //   https://api.x.com/2/tweets
    // With OAuth 2.0 Bearer token
    // ---------------------------------------------------------------
    if (import.meta.dev) {
      console.info('[XAdapter] publish() — placeholder, no real API call')
    }
    return { postId: `x_mock_${Date.now()}` }
  },
}

// ============================================
// ADAPTER REGISTRY
// ============================================

const adapters: Record<SocialPlatform, PlatformAdapter> = {
  linkedin: LinkedInAdapter,
  facebook: FacebookAdapter,
  instagram: InstagramAdapter,
  x: XAdapter,
}

function getAdapter(platform: SocialPlatform): PlatformAdapter {
  return adapters[platform]
}

// ============================================
// MAIN COMPOSABLE
// ============================================

export function useSocialPublisher() {
  const supabase = useSupabaseClient()

  const posts = ref<SocialPostWithVehicle[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ------------------------------------------
  // Generate content for a single platform
  // ------------------------------------------
  function generatePostContent(
    vehicle: {
      title: string
      price_cents: number
      location: string
      slug: string
      images?: { url: string }[]
    },
    platform: SocialPlatform,
    locale: string = 'es',
  ): string {
    const adapter = getAdapter(platform)
    const price = new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(vehicle.price_cents / 100)

    const baseUrl = 'https://tracciona.com'
    const url = `${baseUrl}/vehiculo/${vehicle.slug}`

    return adapter.formatContent(vehicle.title, price, vehicle.location || '-', url, locale)
  }

  // ------------------------------------------
  // Create pending posts for all platforms
  // ------------------------------------------
  async function createPendingPosts(
    vehicleId: string,
    vehicleData: {
      title: string
      price_cents: number
      location: string
      slug: string
      images?: { url: string }[]
    },
  ): Promise<string[]> {
    loading.value = true
    error.value = null

    try {
      const platforms: SocialPlatform[] = ['linkedin', 'facebook', 'instagram', 'x']
      const imageUrl = vehicleData.images?.[0]?.url || null

      const inserts = platforms.map((platform) => {
        const contentEs = generatePostContent(vehicleData, platform, 'es')
        const contentEn = generatePostContent(vehicleData, platform, 'en')

        return {
          vehicle_id: vehicleId,
          article_id: null,
          platform,
          content: { es: contentEs, en: contentEn },
          image_url: imageUrl,
          status: 'pending',
          impressions: 0,
          clicks: 0,
        }
      })

      const { data, error: insertErr } = await supabase
        .from('social_posts')
        .insert(inserts as never[])
        .select('id')

      if (insertErr) throw insertErr

      const ids = (data as unknown as { id: string }[])?.map((d) => d.id) || []
      return ids
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value =
        supabaseError?.message || (err instanceof Error ? err.message : 'Error creating posts')
      return []
    } finally {
      loading.value = false
    }
  }

  // ------------------------------------------
  // Approve a post
  // ------------------------------------------
  async function approvePost(postId: string, adminUserId: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const { error: updateErr } = await supabase
        .from('social_posts')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: adminUserId,
        } as never)
        .eq('id', postId)

      if (updateErr) throw updateErr
      return true
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value =
        supabaseError?.message || (err instanceof Error ? err.message : 'Error approving post')
      return false
    } finally {
      loading.value = false
    }
  }

  // ------------------------------------------
  // Reject a post
  // ------------------------------------------
  async function rejectPost(postId: string, reason: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const { error: updateErr } = await supabase
        .from('social_posts')
        .update({
          status: 'rejected',
          rejection_reason: reason,
        } as never)
        .eq('id', postId)

      if (updateErr) throw updateErr
      return true
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value =
        supabaseError?.message || (err instanceof Error ? err.message : 'Error rejecting post')
      return false
    } finally {
      loading.value = false
    }
  }

  // ------------------------------------------
  // Publish an approved post
  // ------------------------------------------
  async function publishPost(postId: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      // 1. Fetch the post
      const { data: post, error: fetchErr } = await supabase
        .from('social_posts')
        .select('*')
        .eq('id', postId)
        .single()

      if (fetchErr || !post) throw fetchErr || new Error('Post not found')

      const socialPost = post as unknown as SocialPost

      if (socialPost.status !== 'approved') {
        throw new Error('Post must be approved before publishing')
      }

      // 2. Read tokens from vertical_config
      const { data: configData } = await supabase
        .from('vertical_config')
        .select('value')
        .eq('key', `social_tokens_${socialPost.platform}`)
        .single()

      const tokens =
        (configData as unknown as { value: Record<string, string> } | null)?.value || {}

      // 3. Call adapter
      const adapter = getAdapter(socialPost.platform)
      const contentLocale = socialPost.content?.es || socialPost.content?.en || ''
      const result = await adapter.publish(contentLocale, socialPost.image_url, tokens)

      if (result) {
        // Success
        const { error: updateErr } = await supabase
          .from('social_posts')
          .update({
            status: 'posted',
            posted_at: new Date().toISOString(),
            external_post_id: result.postId,
          } as never)
          .eq('id', postId)

        if (updateErr) throw updateErr
        return true
      } else {
        // Adapter returned null — failure
        const { error: failErr } = await supabase
          .from('social_posts')
          .update({ status: 'failed' } as never)
          .eq('id', postId)

        if (failErr) throw failErr
        return false
      }
    } catch (err: unknown) {
      // Mark as failed
      await supabase
        .from('social_posts')
        .update({ status: 'failed' } as never)
        .eq('id', postId)

      const supabaseError = err as { message?: string }
      error.value =
        supabaseError?.message || (err instanceof Error ? err.message : 'Error publishing post')
      return false
    } finally {
      loading.value = false
    }
  }

  // ------------------------------------------
  // Fetch posts with optional filters
  // ------------------------------------------
  async function fetchPosts(filters?: { status?: string; platform?: string }): Promise<void> {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('social_posts')
        .select(
          '*, vehicles(id, brand, model, slug, price, location, vehicle_images(url, position))',
        )
        .order('created_at', { ascending: false })

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.platform) {
        query = query.eq('platform', filters.platform)
      }

      const { data, error: fetchErr } = await query

      if (fetchErr) throw fetchErr

      posts.value = (data as unknown as SocialPostWithVehicle[]) || []
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value =
        supabaseError?.message || (err instanceof Error ? err.message : 'Error fetching posts')
      posts.value = []
    } finally {
      loading.value = false
    }
  }

  // ------------------------------------------
  // Fetch posts by vehicle
  // ------------------------------------------
  async function fetchPostsByVehicle(vehicleId: string): Promise<SocialPost[]> {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchErr } = await supabase
        .from('social_posts')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false })

      if (fetchErr) throw fetchErr

      return (data as unknown as SocialPost[]) || []
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value =
        supabaseError?.message || (err instanceof Error ? err.message : 'Error fetching posts')
      return []
    } finally {
      loading.value = false
    }
  }

  // ------------------------------------------
  // Update post content
  // ------------------------------------------
  async function updatePostContent(
    postId: string,
    content: Record<string, string>,
  ): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const { error: updateErr } = await supabase
        .from('social_posts')
        .update({ content } as never)
        .eq('id', postId)

      if (updateErr) throw updateErr
      return true
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value =
        supabaseError?.message || (err instanceof Error ? err.message : 'Error updating post')
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    posts: readonly(posts),
    loading: readonly(loading),
    error: readonly(error),
    generatePostContent,
    createPendingPosts,
    approvePost,
    rejectPost,
    publishPost,
    fetchPosts,
    fetchPostsByVehicle,
    updatePostContent,
  }
}
