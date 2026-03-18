/**
 * Dynamic PWA manifest generated from vertical_config.
 * Falls back to hardcoded Tracciona defaults if DB is unavailable.
 *
 * Roadmap: N50 — manifest per-vertical (name, icons, theme_color from vertical_config)
 */
import { defineEventHandler, setHeader } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

interface ManifestIcon {
  src: string
  sizes: string
  type: string
  purpose?: string
}

const DEFAULT_MANIFEST = {
  name: 'Tracciona — Marketplace de Vehículos Industriales',
  short_name: 'Tracciona',
  description:
    'Compra, venta y alquiler de vehículos industriales: semirremolques, cisternas, cabezas tractoras y camiones.',
  theme_color: '#23424A',
  background_color: '#F3F4F6',
  display: 'standalone' as const,
  scope: '/',
  start_url: '/',
  id: '/',
  icons: [
    { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ] as ManifestIcon[],
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Content-Type', 'application/manifest+json')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=86400')

  try {
    const client = serverSupabaseServiceRole(event)
    const vertical = process.env.NUXT_PUBLIC_VERTICAL || 'tracciona'

    const { data } = await client
      .from('vertical_config')
      .select('name, theme, logo_url, favicon_url, meta_description, default_locale')
      .eq('vertical', vertical)
      .single()

    if (!data) {
      return DEFAULT_MANIFEST
    }

    const locale = (data.default_locale as string) || 'es'
    const nameObj = data.name as Record<string, string> | null
    const name = nameObj?.[locale] || nameObj?.es || DEFAULT_MANIFEST.name
    const shortName = name.split('—')[0]?.trim() || name.substring(0, 20)
    const descObj = data.meta_description as Record<string, string> | null
    const description = descObj?.[locale] || descObj?.es || DEFAULT_MANIFEST.description
    const themeObj = data.theme as Record<string, string> | null
    const themeColor = themeObj?.color_primary || DEFAULT_MANIFEST.theme_color

    // Build icons array — use vertical-specific if available, else defaults
    const icons: ManifestIcon[] = []

    if (data.favicon_url) {
      // If vertical has custom icons, use them
      icons.push({ src: data.favicon_url, sizes: '192x192', type: 'image/png' })
    } else {
      icons.push({ src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' })
    }

    if (data.logo_url) {
      icons.push(
        { src: data.logo_url, sizes: '512x512', type: 'image/png' },
        { src: data.logo_url, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      )
    } else {
      icons.push(
        { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      )
    }

    return {
      name,
      short_name: shortName,
      description,
      theme_color: themeColor,
      background_color: DEFAULT_MANIFEST.background_color,
      display: DEFAULT_MANIFEST.display,
      scope: '/',
      start_url: '/',
      id: '/',
      icons,
    }
  } catch {
    // DB unavailable — return safe defaults
    return DEFAULT_MANIFEST
  }
})
