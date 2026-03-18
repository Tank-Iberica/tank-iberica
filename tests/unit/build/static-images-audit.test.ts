import { describe, it, expect } from 'vitest'
import { readdirSync, statSync } from 'node:fs'
import { resolve, extname } from 'node:path'

/**
 * Verifies static image optimization in public/.
 *
 * Static images in public/ are limited to favicon/PWA/OG metadata images
 * which have format constraints (ICO, PNG required by browsers/specs).
 * All user-uploaded content images go through Cloudinary which auto-serves
 * WebP/AVIF based on Accept header.
 */

const PUBLIC_DIR = resolve(__dirname, '../../../public')

function getImages(dir: string): string[] {
  const images: string[] = []
  const imgExts = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico', '.svg'])

  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = resolve(dir, entry.name)
      if (entry.isDirectory()) {
        images.push(...getImages(full))
      } else if (imgExts.has(extname(entry.name).toLowerCase())) {
        images.push(full)
      }
    }
  } catch {
    // Directory doesn't exist
  }
  return images
}

describe('Static images audit', () => {
  const images = getImages(PUBLIC_DIR)

  it('public/ contains only metadata images (favicon, PWA, OG)', () => {
    // All static images should be metadata images, not content images
    const filenames = images.map(i => i.replace(/\\/g, '/').split('/').pop()!)
    const metadataPatterns = [
      /^favicon/,
      /^apple-touch-icon/,
      /^icon-\d+x\d+/,
      /^og-/,
      /^logo/,
      /^manifest/,
    ]

    for (const filename of filenames) {
      const isMetadata = metadataPatterns.some(p => p.test(filename))
      expect(isMetadata, `${filename} appears to be a content image in public/ — should use Cloudinary`).toBe(true)
    }
  })

  it('no unoptimized JPEG/GIF content images in public/', () => {
    const contentImages = images.filter((i) => {
      const ext = extname(i).toLowerCase()
      return ext === '.jpg' || ext === '.jpeg' || ext === '.gif'
    })
    expect(contentImages).toHaveLength(0)
  })

  it('total static image count is minimal (<15)', () => {
    expect(images.length).toBeLessThan(15)
  })

  it('no oversized images (each <500KB)', () => {
    const oversized = images.filter((i) => {
      try {
        return statSync(i).size > 500 * 1024
      } catch {
        return false
      }
    })
    expect(oversized, `Oversized images: ${oversized.join(', ')}`).toHaveLength(0)
  })

  it('favicon.ico exists', () => {
    const hasIco = images.some(i => i.endsWith('favicon.ico'))
    expect(hasIco).toBe(true)
  })

  it('PWA icons exist (192x192, 512x512)', () => {
    const filenames = images.map(i => i.replace(/\\/g, '/').split('/').pop()!)
    expect(filenames).toContain('icon-192x192.png')
    expect(filenames).toContain('icon-512x512.png')
  })
})
