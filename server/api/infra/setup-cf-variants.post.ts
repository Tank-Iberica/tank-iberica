/**
 * POST /api/infra/setup-cf-variants
 *
 * Admin-only. Creates the 4 named variants in Cloudflare Images.
 * This endpoint should be run once during initial setup.
 *
 * Variants: thumb (300x200), card (600x400), gallery (1200x800), og (1200x630)
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { defineEventHandler, createError } from 'h3'

// ── Types ─────────────────────────────────────────────────────────────────────

interface VariantConfig {
  id: string
  width: number
  height: number
  fit: 'cover'
}

interface CfVariantResponse {
  success: boolean
  errors: Array<{ message: string }>
  result: {
    id: string
    options: {
      fit: string
      width: number
      height: number
      metadata: string
    }
  }
}

interface SetupResult {
  created: string[]
  errors: Array<{ variant: string; message: string }>
}

// ── Variant definitions ───────────────────────────────────────────────────────

const VARIANTS: VariantConfig[] = [
  { id: 'thumb', width: 300, height: 200, fit: 'cover' },
  { id: 'card', width: 600, height: 400, fit: 'cover' },
  { id: 'gallery', width: 1200, height: 800, fit: 'cover' },
  { id: 'og', width: 1200, height: 630, fit: 'cover' },
]

// ── Handler ───────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event): Promise<SetupResult> => {
  // 1. Admin auth check
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const supabase = serverSupabaseServiceRole(event)
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

  if (userData?.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  // 2. Validate runtime config
  const config = useRuntimeConfig()
  const cfApiToken = config.cloudflareImagesApiToken as string | undefined
  const cfAccountId = config.cloudflareAccountId as string | undefined

  if (!cfApiToken || !cfAccountId) {
    throw createError({
      statusCode: 500,
      message:
        'Missing Cloudflare Images configuration: CLOUDFLARE_IMAGES_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are required',
    })
  }

  // 3. Create each variant in CF Images
  const created: string[] = []
  const errors: Array<{ variant: string; message: string }> = []

  for (const variant of VARIANTS) {
    try {
      const response = await $fetch<CfVariantResponse>(
        `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/images/v1/variants`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfApiToken}`,
            'Content-Type': 'application/json',
          },
          body: {
            id: variant.id,
            options: {
              fit: variant.fit,
              width: variant.width,
              height: variant.height,
              metadata: 'none',
            },
          },
        },
      )

      if (response.success) {
        created.push(variant.id)
      } else {
        const errorMsg = response.errors?.[0]?.message ?? 'Unknown error'
        errors.push({ variant: variant.id, message: errorMsg })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      // Check if the variant already exists (409 Conflict)
      if (message.includes('409') || message.includes('already exists')) {
        created.push(variant.id)
        errors.push({ variant: variant.id, message: 'Already exists (skipped)' })
      } else {
        errors.push({ variant: variant.id, message })
      }
    }
  }

  return { created, errors }
})
