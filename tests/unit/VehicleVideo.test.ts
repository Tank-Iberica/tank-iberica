import { describe, it, expect } from 'vitest'

/** Mirrors the parsed computed from VehicleVideo.vue */
function parseVideoUrl(url: string | null | undefined): { provider: string; id: string } | null {
  const trimmed = url?.trim()
  if (!trimmed) return null

  // YouTube
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  )
  if (ytMatch) return { provider: 'youtube', id: ytMatch[1]! }

  // Vimeo
  const vmMatch = trimmed.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/)
  if (vmMatch) return { provider: 'vimeo', id: vmMatch[1]! }

  return null
}

describe('VehicleVideo — URL parsing', () => {
  // YouTube
  it('parses youtube.com/watch?v= URL', () => {
    const r = parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(r).toEqual({ provider: 'youtube', id: 'dQw4w9WgXcQ' })
  })

  it('parses youtu.be short URL', () => {
    const r = parseVideoUrl('https://youtu.be/dQw4w9WgXcQ')
    expect(r).toEqual({ provider: 'youtube', id: 'dQw4w9WgXcQ' })
  })

  it('parses youtube.com/embed/ URL', () => {
    const r = parseVideoUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')
    expect(r).toEqual({ provider: 'youtube', id: 'dQw4w9WgXcQ' })
  })

  it('parses youtube.com/shorts/ URL', () => {
    const r = parseVideoUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')
    expect(r).toEqual({ provider: 'youtube', id: 'dQw4w9WgXcQ' })
  })

  // Vimeo
  it('parses vimeo.com/ID URL', () => {
    const r = parseVideoUrl('https://vimeo.com/123456789')
    expect(r).toEqual({ provider: 'vimeo', id: '123456789' })
  })

  it('parses vimeo.com/video/ID URL', () => {
    const r = parseVideoUrl('https://vimeo.com/video/987654321')
    expect(r).toEqual({ provider: 'vimeo', id: '987654321' })
  })

  it('parses player.vimeo.com/video/ID URL', () => {
    const r = parseVideoUrl('https://player.vimeo.com/video/111222333')
    expect(r).toEqual({ provider: 'vimeo', id: '111222333' })
  })

  // Edge cases
  it('returns null for empty string', () => {
    expect(parseVideoUrl('')).toBeNull()
  })

  it('returns null for null', () => {
    expect(parseVideoUrl(null)).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(parseVideoUrl(undefined)).toBeNull()
  })

  it('returns null for unrecognized URL', () => {
    expect(parseVideoUrl('https://dailymotion.com/video/x123')).toBeNull()
  })

  it('returns null for plain text', () => {
    expect(parseVideoUrl('not a url')).toBeNull()
  })

  it('trims whitespace before parsing', () => {
    const r = parseVideoUrl('  https://youtu.be/dQw4w9WgXcQ  ')
    expect(r).toEqual({ provider: 'youtube', id: 'dQw4w9WgXcQ' })
  })
})
