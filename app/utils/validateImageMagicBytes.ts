/**
 * Validate image files by reading their magic bytes (file signatures).
 * Prevents malicious file uploads that spoof MIME types.
 *
 * Supported formats: JPEG, PNG, WebP, GIF, AVIF
 * Explicitly rejects: SVG (can contain JavaScript)
 */

interface MagicSignature {
  bytes: number[]
  offset: number
}

const SIGNATURES: Record<string, MagicSignature[]> = {
  jpeg: [
    { bytes: [0xFF, 0xD8, 0xFF], offset: 0 },
  ],
  png: [
    { bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], offset: 0 },
  ],
  webp: [
    // RIFF....WEBP
    { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
  ],
  gif: [
    { bytes: [0x47, 0x49, 0x46, 0x38], offset: 0 }, // GIF87a or GIF89a
  ],
  avif: [
    // ....ftypavif or ....ftypavis
    { bytes: [0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69], offset: 4 },
  ],
}

/**
 * Read the first N bytes of a File as a Uint8Array.
 */
async function readFileHead(file: File, bytes: number): Promise<Uint8Array> {
  const slice = file.slice(0, bytes)
  const buffer = await slice.arrayBuffer()
  return new Uint8Array(buffer)
}

/**
 * Check if a byte array matches a signature at a given offset.
 */
function matchesSignature(data: Uint8Array, sig: MagicSignature): boolean {
  if (data.length < sig.offset + sig.bytes.length) return false
  return sig.bytes.every((byte, i) => data[sig.offset + i] === byte)
}

/**
 * Check if the file header contains SVG content (text-based, can execute JS).
 */
function isSvg(data: Uint8Array): boolean {
  // SVG files start with <?xml or <svg or have an svg tag
  const text = new TextDecoder().decode(data).toLowerCase().trim()
  return text.startsWith('<?xml') || text.startsWith('<svg') || text.includes('<svg')
}

export type ImageValidationResult =
  | { valid: true; format: string }
  | { valid: false; reason: string }

/**
 * Validate that a file is a genuine image by checking magic bytes.
 * Returns the detected format or an error reason.
 */
export async function validateImageMagicBytes(file: File): Promise<ImageValidationResult> {
  // Read first 16 bytes (enough for all signatures)
  const head = await readFileHead(file, 64)

  // Reject SVG (can contain JavaScript)
  if (isSvg(head)) {
    return { valid: false, reason: 'SVG files are not allowed (security risk)' }
  }

  // Check against known signatures
  for (const [format, signatures] of Object.entries(SIGNATURES)) {
    for (const sig of signatures) {
      if (matchesSignature(head, sig)) {
        // Extra check for WebP: bytes 8-11 must be "WEBP"
        if (format === 'webp') {
          const webpMark = [0x57, 0x45, 0x42, 0x50]
          if (!webpMark.every((b, i) => head[8 + i] === b)) continue
        }
        return { valid: true, format }
      }
    }
  }

  return { valid: false, reason: 'Unrecognized image format. Allowed: JPEG, PNG, WebP, GIF, AVIF' }
}
