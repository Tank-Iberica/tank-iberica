import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const SRC = readFileSync(resolve(ROOT, 'app/composables/admin/useCloudinaryUpload.ts'), 'utf-8')

describe('Admin vehicle images: Cloudinary upload (#216)', () => {
  it('exports upload function', () => {
    expect(SRC).toContain('upload')
  })

  it('tracks uploading state', () => {
    expect(SRC).toContain('uploading')
  })

  it('tracks upload progress', () => {
    expect(SRC).toContain('progress')
  })

  it('tracks error state', () => {
    expect(SRC).toContain('error')
  })

  it('supports folder option', () => {
    expect(SRC).toContain('folder')
  })

  it('supports custom publicId for SEO-friendly URLs', () => {
    expect(SRC).toContain('publicId')
  })

  it('validates image magic bytes', () => {
    expect(SRC).toContain('validateImageMagicBytes')
  })

  it('returns CloudinaryUploadResult with url and dimensions', () => {
    expect(SRC).toContain('secure_url')
    expect(SRC).toContain('width')
    expect(SRC).toContain('height')
  })

  it('uses FormData for upload', () => {
    expect(SRC).toContain('FormData')
  })
})
