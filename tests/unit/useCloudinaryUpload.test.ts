import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCloudinaryUpload } from '../../app/composables/admin/useCloudinaryUpload'

// ─── XHR mock helpers ─────────────────────────────────────────────────────

interface MockXHR {
  upload: { addEventListener: ReturnType<typeof vi.fn> }
  open: ReturnType<typeof vi.fn>
  send: ReturnType<typeof vi.fn>
  status: number
  responseText: string
  _listeners: Record<string, () => void>
  addEventListener: (event: string, handler: () => void) => void
}

let mockXhr: MockXHR

const SUCCESS_RESULT = {
  public_id: 'tracciona/vehicles/img',
  secure_url: 'https://res.cloudinary.com/test/img.jpg',
  url: 'https://res.cloudinary.com/test/img.jpg',
  width: 800,
  height: 600,
  format: 'jpg',
  bytes: 50000,
}

function makeXhr(status = 200, responseData: Record<string, unknown> = SUCCESS_RESULT): MockXHR {
  const xhr: MockXHR = {
    upload: { addEventListener: vi.fn() },
    open: vi.fn(),
    send: vi.fn(),
    status,
    responseText: JSON.stringify(responseData),
    _listeners: {},
    addEventListener(event: string, handler: () => void) {
      this._listeners[event] = handler
    },
  }
  return xhr
}

function makeFile(name = 'test.jpg', type = 'image/jpeg', sizeBytes = 100) {
  const content = 'x'.repeat(sizeBytes)
  return new File([content], name, { type })
}

// ─── Initial state ─────────────────────────────────────────────────────────

describe('initial state', () => {
  it('uploading starts as false', () => {
    const c = useCloudinaryUpload()
    expect(c.uploading.value).toBe(false)
  })

  it('progress starts as 0', () => {
    const c = useCloudinaryUpload()
    expect(c.progress.value).toBe(0)
  })

  it('error starts as null', () => {
    const c = useCloudinaryUpload()
    expect(c.error.value).toBeNull()
  })
})

// ─── upload — no preset (default global config) ────────────────────────────

describe('upload without upload preset', () => {
  it('returns null when uploadPreset is not configured', async () => {
    const c = useCloudinaryUpload()
    const result = await c.upload(makeFile())
    expect(result).toBeNull()
  })

  it('sets error when uploadPreset is missing', async () => {
    const c = useCloudinaryUpload()
    await c.upload(makeFile())
    expect(c.error.value).toBeTruthy()
  })
})

// ─── upload — validation ───────────────────────────────────────────────────

describe('upload validation', () => {
  beforeEach(() => {
    mockXhr = makeXhr()
    vi.stubGlobal('XMLHttpRequest', function MockXHR() { return mockXhr })
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: { cloudinaryCloudName: 'test-cloud', cloudinaryUploadPreset: 'test-preset' },
    }))
  })

  it('returns null for non-image MIME type', async () => {
    const c = useCloudinaryUpload()
    const result = await c.upload(makeFile('doc.pdf', 'application/pdf'))
    expect(result).toBeNull()
  })

  it('sets error message for non-image file', async () => {
    const c = useCloudinaryUpload()
    await c.upload(makeFile('doc.pdf', 'application/pdf'))
    expect(c.error.value).toBeTruthy()
  })

  it('returns null for file exceeding 10MB', async () => {
    const c = useCloudinaryUpload()
    const bigFile = new File(['x'.repeat(11 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' })
    const result = await c.upload(bigFile)
    expect(result).toBeNull()
  })

  it('sets error for file exceeding 10MB', async () => {
    const c = useCloudinaryUpload()
    const bigFile = new File(['x'.repeat(11 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' })
    await c.upload(bigFile)
    expect(c.error.value).toBeTruthy()
  })
})

// ─── upload — XHR success ─────────────────────────────────────────────────

describe('upload XHR success', () => {
  beforeEach(() => {
    mockXhr = makeXhr(200, SUCCESS_RESULT)
    // Use a regular function (not arrow) so it works with `new XMLHttpRequest()`
    // Returning an object from a constructor overrides `this`
    vi.stubGlobal('XMLHttpRequest', function MockXHR() { return mockXhr })
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: { cloudinaryCloudName: 'test-cloud', cloudinaryUploadPreset: 'test-preset' },
    }))
  })

  it('returns CloudinaryUploadResult on success', async () => {
    const c = useCloudinaryUpload()
    const promise = c.upload(makeFile(), 'tracciona/vehicles')
    mockXhr._listeners['load']?.()
    const result = await promise
    expect(result).toMatchObject({ public_id: 'tracciona/vehicles/img' })
  })

  it('sets uploading to true during upload', () => {
    const c = useCloudinaryUpload()
    c.upload(makeFile(), 'folder')
    expect(c.uploading.value).toBe(true)
  })

  it('sets uploading to false after upload completes', async () => {
    const c = useCloudinaryUpload()
    const promise = c.upload(makeFile(), 'folder')
    mockXhr._listeners['load']?.()
    await promise
    expect(c.uploading.value).toBe(false)
  })

  it('calls xhr.open with the correct Cloudinary URL', () => {
    const c = useCloudinaryUpload()
    c.upload(makeFile(), 'folder')
    expect(mockXhr.open).toHaveBeenCalledWith('POST', expect.stringContaining('test-cloud'))
  })

  it('accepts string folder as backward-compatible option', async () => {
    const c = useCloudinaryUpload()
    const promise = c.upload(makeFile(), 'tracciona/news')
    mockXhr._listeners['load']?.()
    const result = await promise
    expect(result).not.toBeNull()
  })

  it('accepts full options object with publicId, context and tags', async () => {
    const c = useCloudinaryUpload()
    const promise = c.upload(makeFile(), {
      folder: 'tracciona/vehicles',
      publicId: 'camion-cisterna-renault-2024',
      context: 'brand=Renault|year=2024',
      tags: ['cisterna', 'renault'],
    })
    mockXhr._listeners['load']?.()
    const result = await promise
    expect(result).not.toBeNull()
  })

  it('clears previous error after successful upload', async () => {
    const c = useCloudinaryUpload()
    c.error.value = 'previous error'
    const promise = c.upload(makeFile(), 'folder')
    mockXhr._listeners['load']?.()
    await promise
    expect(c.error.value).toBeNull()
  })

  it('resets progress to 0 after upload completes', async () => {
    const c = useCloudinaryUpload()
    const promise = c.upload(makeFile(), 'folder')
    mockXhr._listeners['load']?.()
    await promise
    expect(c.progress.value).toBe(0)
  })
})

// ─── upload — XHR error cases ─────────────────────────────────────────────

describe('upload XHR error cases', () => {
  beforeEach(() => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: { cloudinaryCloudName: 'test-cloud', cloudinaryUploadPreset: 'test-preset' },
    }))
  })

  it('returns null on HTTP 500 error', async () => {
    mockXhr = makeXhr(500, { error: { message: 'Internal Server Error' } })
    vi.stubGlobal('XMLHttpRequest', function MockXHR() { return mockXhr })
    const c = useCloudinaryUpload()
    const promise = c.upload(makeFile(), 'folder')
    mockXhr._listeners['load']?.()
    const result = await promise
    expect(result).toBeNull()
  })

  it('sets error on HTTP error', async () => {
    mockXhr = makeXhr(500, { error: { message: 'Internal Server Error' } })
    vi.stubGlobal('XMLHttpRequest', function MockXHR() { return mockXhr })
    const c = useCloudinaryUpload()
    const promise = c.upload(makeFile(), 'folder')
    mockXhr._listeners['load']?.()
    await promise
    expect(c.error.value).toBeTruthy()
  })

  it('returns null on network error', async () => {
    mockXhr = makeXhr(0, {})
    vi.stubGlobal('XMLHttpRequest', function MockXHR() { return mockXhr })
    const c = useCloudinaryUpload()
    const promise = c.upload(makeFile(), 'folder')
    mockXhr._listeners['error']?.()
    const result = await promise
    expect(result).toBeNull()
  })

  it('sets error on network error', async () => {
    mockXhr = makeXhr(0, {})
    vi.stubGlobal('XMLHttpRequest', function MockXHR() { return mockXhr })
    const c = useCloudinaryUpload()
    const promise = c.upload(makeFile(), 'folder')
    mockXhr._listeners['error']?.()
    await promise
    expect(c.error.value).toBeTruthy()
  })

  it('returns null on upload abort', async () => {
    mockXhr = makeXhr(0, {})
    vi.stubGlobal('XMLHttpRequest', function MockXHR() { return mockXhr })
    const c = useCloudinaryUpload()
    const promise = c.upload(makeFile(), 'folder')
    mockXhr._listeners['abort']?.()
    const result = await promise
    expect(result).toBeNull()
  })

  it('sets uploading to false after error', async () => {
    mockXhr = makeXhr(0, {})
    vi.stubGlobal('XMLHttpRequest', function MockXHR() { return mockXhr })
    const c = useCloudinaryUpload()
    const promise = c.upload(makeFile(), 'folder')
    mockXhr._listeners['error']?.()
    await promise
    expect(c.uploading.value).toBe(false)
  })
})
