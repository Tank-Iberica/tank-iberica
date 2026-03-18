/**
 * Tests for app/utils/validateImageMagicBytes.ts
 * Magic bytes validation for image uploads.
 */
import { describe, it, expect } from 'vitest'
import { validateImageMagicBytes } from '../../app/utils/validateImageMagicBytes'

/**
 * Helper: create a File from a Uint8Array.
 */
function makeFile(bytes: number[], name = 'test.bin', type = 'image/jpeg'): File {
  const buffer = new Uint8Array(bytes)
  return new File([buffer], name, { type })
}

describe('validateImageMagicBytes', () => {
  // ─── JPEG ─────────────────────────────────────────────────────────────────

  it('accepts valid JPEG (FF D8 FF)', async () => {
    const file = makeFile([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46])
    const result = await validateImageMagicBytes(file)
    expect(result).toEqual({ valid: true, format: 'jpeg' })
  })

  it('accepts JPEG with EXIF marker (FF D8 FF E1)', async () => {
    const file = makeFile([0xFF, 0xD8, 0xFF, 0xE1, 0x00, 0x00])
    const result = await validateImageMagicBytes(file)
    expect(result).toEqual({ valid: true, format: 'jpeg' })
  })

  // ─── PNG ──────────────────────────────────────────────────────────────────

  it('accepts valid PNG (89 50 4E 47)', async () => {
    const file = makeFile([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00])
    const result = await validateImageMagicBytes(file)
    expect(result).toEqual({ valid: true, format: 'png' })
  })

  // ─── WebP ─────────────────────────────────────────────────────────────────

  it('accepts valid WebP (RIFF....WEBP)', async () => {
    // RIFF + size bytes + WEBP
    const file = makeFile([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00, // file size
      0x57, 0x45, 0x42, 0x50, // WEBP
    ])
    const result = await validateImageMagicBytes(file)
    expect(result).toEqual({ valid: true, format: 'webp' })
  })

  it('rejects RIFF without WEBP marker', async () => {
    const file = makeFile([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00, // file size
      0x41, 0x56, 0x49, 0x20, // AVI (not WEBP)
    ])
    const result = await validateImageMagicBytes(file)
    expect(result.valid).toBe(false)
  })

  // ─── GIF ──────────────────────────────────────────────────────────────────

  it('accepts valid GIF89a', async () => {
    const file = makeFile([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
    const result = await validateImageMagicBytes(file)
    expect(result).toEqual({ valid: true, format: 'gif' })
  })

  it('accepts valid GIF87a', async () => {
    const file = makeFile([0x47, 0x49, 0x46, 0x38, 0x37, 0x61])
    const result = await validateImageMagicBytes(file)
    expect(result).toEqual({ valid: true, format: 'gif' })
  })

  // ─── AVIF ─────────────────────────────────────────────────────────────────

  it('accepts valid AVIF (ftypavif)', async () => {
    // 4 bytes size + "ftypavif"
    const file = makeFile([
      0x00, 0x00, 0x00, 0x1C, // box size
      0x66, 0x74, 0x79, 0x70, // ftyp
      0x61, 0x76, 0x69, 0x66, // avif
    ])
    const result = await validateImageMagicBytes(file)
    expect(result).toEqual({ valid: true, format: 'avif' })
  })

  // ─── SVG rejection ────────────────────────────────────────────────────────

  it('rejects SVG starting with <svg', async () => {
    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
    const encoder = new TextEncoder()
    const bytes = Array.from(encoder.encode(svgContent))
    const file = makeFile(bytes, 'evil.svg', 'image/svg+xml')
    const result = await validateImageMagicBytes(file)
    expect(result).toEqual({ valid: false, reason: 'SVG files are not allowed (security risk)' })
  })

  it('rejects SVG starting with <?xml', async () => {
    const svgContent = '<?xml version="1.0"?><svg><script>alert(1)</script></svg>'
    const encoder = new TextEncoder()
    const bytes = Array.from(encoder.encode(svgContent))
    const file = makeFile(bytes, 'evil.svg', 'image/svg+xml')
    const result = await validateImageMagicBytes(file)
    expect(result).toEqual({ valid: false, reason: 'SVG files are not allowed (security risk)' })
  })

  it('rejects SVG disguised as JPEG (MIME spoofing)', async () => {
    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
    const encoder = new TextEncoder()
    const bytes = Array.from(encoder.encode(svgContent))
    const file = makeFile(bytes, 'image.jpg', 'image/jpeg')
    const result = await validateImageMagicBytes(file)
    expect(result).toEqual({ valid: false, reason: 'SVG files are not allowed (security risk)' })
  })

  // ─── Unknown / invalid ────────────────────────────────────────────────────

  it('rejects unknown binary format', async () => {
    const file = makeFile([0x00, 0x01, 0x02, 0x03, 0x04, 0x05])
    const result = await validateImageMagicBytes(file)
    expect(result).toEqual({
      valid: false,
      reason: 'Unrecognized image format. Allowed: JPEG, PNG, WebP, GIF, AVIF',
    })
  })

  it('rejects PDF disguised as image', async () => {
    // PDF magic bytes: %PDF
    const file = makeFile([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E], 'file.pdf', 'image/jpeg')
    const result = await validateImageMagicBytes(file)
    expect(result.valid).toBe(false)
  })

  it('rejects empty file', async () => {
    const file = makeFile([], 'empty.jpg', 'image/jpeg')
    const result = await validateImageMagicBytes(file)
    expect(result.valid).toBe(false)
  })

  it('rejects executable disguised as image', async () => {
    // EXE magic bytes: MZ
    const file = makeFile([0x4D, 0x5A, 0x90, 0x00], 'virus.exe.jpg', 'image/jpeg')
    const result = await validateImageMagicBytes(file)
    expect(result.valid).toBe(false)
  })
})
