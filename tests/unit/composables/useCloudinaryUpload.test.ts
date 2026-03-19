import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, readonly } from 'vue'

// Mock validateImageMagicBytes
vi.mock('~/utils/validateImageMagicBytes', () => ({
  validateImageMagicBytes: vi.fn(() => Promise.resolve({ valid: true })),
}))

vi.stubGlobal('ref', ref)
vi.stubGlobal('readonly', readonly)
vi.stubGlobal(
  'useRuntimeConfig',
  vi.fn(() => ({
    public: {
      cloudinaryCloudName: 'test-cloud',
      cloudinaryUploadPreset: 'test-preset',
    },
  })),
)

// Mock XMLHttpRequest with a proper constructor function
const mockXHR = {
  open: vi.fn(),
  send: vi.fn(),
  upload: { addEventListener: vi.fn() },
  addEventListener: vi.fn(),
  status: 200,
  responseText: JSON.stringify({
    public_id: 'tracciona/test',
    secure_url: 'https://res.cloudinary.com/test/image.jpg',
    url: 'http://res.cloudinary.com/test/image.jpg',
    width: 800,
    height: 600,
    format: 'jpg',
    bytes: 50000,
  }),
}

// Use a regular function (not arrow) so it works as constructor with `new`
vi.stubGlobal('XMLHttpRequest', function MockXMLHttpRequest() {
  return mockXHR
})
vi.stubGlobal(
  'FormData',
  class MockFormData {
    private data: Record<string, any> = {}
    append(key: string, value: any) {
      this.data[key] = value
    }
    get(key: string) {
      return this.data[key]
    }
  },
)

import { useCloudinaryUpload } from '../../../app/composables/admin/useCloudinaryUpload'
import { validateImageMagicBytes } from '~/utils/validateImageMagicBytes'

function createMockFile(name: string, size: number, type: string): File {
  return { name, size, type } as any as File
}

describe('Admin vehicle images: Cloudinary upload (#216)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Re-set mocks that clearAllMocks may not fully restore
    vi.mocked(useRuntimeConfig).mockReturnValue({
      public: { cloudinaryCloudName: 'test-cloud', cloudinaryUploadPreset: 'test-preset' },
    } as any)
    vi.mocked(validateImageMagicBytes).mockResolvedValue({ valid: true } as any)
    // Re-assign XHR mock methods (clearAllMocks resets call history)
    mockXHR.open = vi.fn()
    mockXHR.send = vi.fn()
    mockXHR.upload = { addEventListener: vi.fn() }
    mockXHR.status = 200
    // Simulate successful XHR load
    mockXHR.addEventListener = vi.fn((event: string, handler: Function) => {
      if (event === 'load') {
        setTimeout(() => handler(), 0)
      }
    })
  })

  describe('Return shape', () => {
    it('returns upload, uploading, progress, error', () => {
      const result = useCloudinaryUpload()
      expect(result).toHaveProperty('upload')
      expect(result).toHaveProperty('uploading')
      expect(result).toHaveProperty('progress')
      expect(result).toHaveProperty('error')
    })

    it('initial state is clean', () => {
      const { uploading, progress, error } = useCloudinaryUpload()
      expect(uploading.value).toBe(false)
      expect(progress.value).toBe(0)
      expect(error.value).toBeNull()
    })
  })

  describe('Validation', () => {
    it('rejects non-image files', async () => {
      const { upload, error } = useCloudinaryUpload()
      const file = createMockFile('doc.pdf', 1000, 'application/pdf')
      const result = await upload(file)
      expect(result).toBeNull()
      expect(error.value).toContain('imagen')
    })

    it('rejects files > 10MB', async () => {
      const { upload, error } = useCloudinaryUpload()
      const file = createMockFile('big.jpg', 11 * 1024 * 1024, 'image/jpeg')
      const result = await upload(file)
      expect(result).toBeNull()
      expect(error.value).toContain('10MB')
    })

    it('validates magic bytes', async () => {
      vi.mocked(validateImageMagicBytes).mockResolvedValue({
        valid: false,
        reason: 'Invalid file header',
      } as any)
      const { upload, error } = useCloudinaryUpload()
      const file = createMockFile('fake.jpg', 1000, 'image/jpeg')
      const result = await upload(file)
      expect(result).toBeNull()
      expect(error.value).toBe('Invalid file header')
    })

    it('rejects when upload preset is not configured', async () => {
      vi.mocked(useRuntimeConfig).mockReturnValue({
        public: { cloudinaryCloudName: 'test', cloudinaryUploadPreset: '' },
      } as any)
      const { upload, error } = useCloudinaryUpload()
      const file = createMockFile('img.jpg', 1000, 'image/jpeg')
      const result = await upload(file)
      expect(result).toBeNull()
      expect(error.value).toContain('preset')
    })
  })

  describe('Upload flow', () => {
    it('sends XHR to Cloudinary with correct URL', async () => {
      const { upload } = useCloudinaryUpload()
      const file = createMockFile('img.jpg', 1000, 'image/jpeg')
      const result = await upload(file, 'tracciona/vehicles')
      expect(mockXHR.open).toHaveBeenCalledWith(
        'POST',
        'https://api.cloudinary.com/v1_1/test-cloud/image/upload',
      )
      expect(mockXHR.send).toHaveBeenCalled()
      expect(result).not.toBeNull()
      expect(result?.public_id).toBe('tracciona/test')
    })

    it('accepts CloudinaryUploadOptions object', async () => {
      const { upload } = useCloudinaryUpload()
      const file = createMockFile('img.jpg', 1000, 'image/jpeg')
      const result = await upload(file, {
        folder: 'tracciona/vehicles',
        publicId: 'my-custom-id',
        context: 'brand=Renault',
        tags: ['truck', '2024'],
      })
      expect(mockXHR.open).toHaveBeenCalled()
      expect(result?.secure_url).toBe('https://res.cloudinary.com/test/image.jpg')
    })

    it('resets uploading state after completion', async () => {
      const { upload, uploading } = useCloudinaryUpload()
      const file = createMockFile('img.jpg', 1000, 'image/jpeg')
      await upload(file)
      expect(uploading.value).toBe(false)
    })

    it('handles XHR error response', async () => {
      mockXHR.status = 400
      mockXHR.responseText = JSON.stringify({ error: { message: 'Bad request' } })
      const { upload, error } = useCloudinaryUpload()
      const file = createMockFile('img.jpg', 1000, 'image/jpeg')
      const result = await upload(file)
      expect(result).toBeNull()
      expect(error.value).toBe('Bad request')
    })
  })
})
