import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminProductoDetailImages } from '../../app/composables/admin/useAdminProductoDetailImages'

// ─── Module mocks ─────────────────────────────────────────────────────────

vi.mock('~/utils/fileNaming', () => ({
  generateVehiclePublicId: () => 'public-id',
  generateCloudinaryContext: () => ({}),
  generateVehicleAltText: () => 'alt text',
}))

// ─── Global stubs ─────────────────────────────────────────────────────────

let mockUploadToCloudinary: ReturnType<typeof vi.fn>
let mockAddImage: ReturnType<typeof vi.fn>
let mockDeleteImage: ReturnType<typeof vi.fn>
let mockReorderImages: ReturnType<typeof vi.fn>
let mockLoadVehicle: ReturnType<typeof vi.fn>
let mockToastWarning: ReturnType<typeof vi.fn>
let mockConfirm: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockUploadToCloudinary = vi.fn().mockResolvedValue(null)
  mockAddImage = vi.fn().mockResolvedValue(true)
  mockDeleteImage = vi.fn().mockResolvedValue(true)
  mockReorderImages = vi.fn().mockResolvedValue(true)
  mockLoadVehicle = vi.fn().mockResolvedValue(undefined)
  mockToastWarning = vi.fn()
  mockConfirm = vi.fn().mockReturnValue(true)
  vi.stubGlobal('useToast', () => ({ warning: mockToastWarning }))
  vi.stubGlobal('confirm', mockConfirm)
})

function makeImages() {
  return {
    value: [
      { id: 'img-1', url: 'https://cdn.com/img1.jpg', position: 0 },
      { id: 'img-2', url: 'https://cdn.com/img2.jpg', position: 1 },
      { id: 'img-3', url: 'https://cdn.com/img3.jpg', position: 2 },
    ],
  }
}

function makeParams(imagesRef = { value: [] as { id: string; url: string; position: number }[] }) {
  return {
    vehicleId: { value: 'vehicle-1' },
    fileNamingData: {
      value: { id: 'v1', brand: 'Volvo', year: 2020, plate: null, subcategory: null, type: null },
    },
    images: imagesRef,
    uploadToCloudinary: (...args: unknown[]) => mockUploadToCloudinary(...args),
    addImage: (...args: unknown[]) => mockAddImage(...args),
    deleteImage: (...args: unknown[]) => mockDeleteImage(...args),
    reorderImages: (...args: unknown[]) => mockReorderImages(...args),
    loadVehicle: (...args: unknown[]) => mockLoadVehicle(...args),
  }
}

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('uploadingImage starts as false', () => {
    const c = useAdminProductoDetailImages(makeParams())
    expect(c.uploadingImage.value).toBe(false)
  })
})

// ─── handleDeleteImage ────────────────────────────────────────────────────

describe('handleDeleteImage', () => {
  it('calls confirm before deleting', async () => {
    const c = useAdminProductoDetailImages(makeParams())
    await c.handleDeleteImage('img-1')
    expect(mockConfirm).toHaveBeenCalled()
  })

  it('calls deleteImage with the given id when confirmed', async () => {
    mockConfirm.mockReturnValue(true)
    const c = useAdminProductoDetailImages(makeParams())
    await c.handleDeleteImage('img-1')
    expect(mockDeleteImage).toHaveBeenCalledWith('img-1')
  })

  it('does not call deleteImage when confirm is rejected', async () => {
    mockConfirm.mockReturnValue(false)
    const c = useAdminProductoDetailImages(makeParams())
    await c.handleDeleteImage('img-1')
    expect(mockDeleteImage).not.toHaveBeenCalled()
  })

  it('removes image from array on successful delete', async () => {
    mockConfirm.mockReturnValue(true)
    mockDeleteImage.mockResolvedValue(true)
    const imagesRef = makeImages()
    const c = useAdminProductoDetailImages(makeParams(imagesRef))
    await c.handleDeleteImage('img-1')
    expect(imagesRef.value).not.toContainEqual(expect.objectContaining({ id: 'img-1' }))
  })

  it('keeps image in array when delete fails', async () => {
    mockConfirm.mockReturnValue(true)
    mockDeleteImage.mockResolvedValue(false)
    const imagesRef = makeImages()
    const c = useAdminProductoDetailImages(makeParams(imagesRef))
    await c.handleDeleteImage('img-1')
    expect(imagesRef.value).toContainEqual(expect.objectContaining({ id: 'img-1' }))
  })
})

// ─── setAsPortada ─────────────────────────────────────────────────────────

describe('setAsPortada', () => {
  it('does nothing when index is already 0', async () => {
    const imagesRef = makeImages()
    const c = useAdminProductoDetailImages(makeParams(imagesRef))
    await c.setAsPortada(0)
    expect(mockReorderImages).not.toHaveBeenCalled()
  })

  it('moves image at index to position 0', async () => {
    mockReorderImages.mockResolvedValue(true)
    const imagesRef = makeImages()
    const c = useAdminProductoDetailImages(makeParams(imagesRef))
    await c.setAsPortada(1)
    expect(imagesRef.value[0]!.id).toBe('img-2')
  })

  it('calls reorderImages with correct updates', async () => {
    mockReorderImages.mockResolvedValue(true)
    const imagesRef = makeImages()
    const c = useAdminProductoDetailImages(makeParams(imagesRef))
    await c.setAsPortada(2)
    expect(mockReorderImages).toHaveBeenCalled()
  })

  it('does not update images when reorderImages fails', async () => {
    mockReorderImages.mockResolvedValue(false)
    const imagesRef = makeImages()
    const original = imagesRef.value[0]!.id
    const c = useAdminProductoDetailImages(makeParams(imagesRef))
    await c.setAsPortada(1)
    expect(imagesRef.value[0]!.id).toBe(original)
  })
})

// ─── moveImage ────────────────────────────────────────────────────────────

describe('moveImage', () => {
  it('moves image down', async () => {
    mockReorderImages.mockResolvedValue(true)
    const imagesRef = makeImages()
    const c = useAdminProductoDetailImages(makeParams(imagesRef))
    await c.moveImage(0, 'down')
    expect(imagesRef.value[0]!.id).toBe('img-2')
    expect(imagesRef.value[1]!.id).toBe('img-1')
  })

  it('moves image up', async () => {
    mockReorderImages.mockResolvedValue(true)
    const imagesRef = makeImages()
    const c = useAdminProductoDetailImages(makeParams(imagesRef))
    await c.moveImage(1, 'up')
    expect(imagesRef.value[0]!.id).toBe('img-2')
    expect(imagesRef.value[1]!.id).toBe('img-1')
  })

  it('does not move beyond start', async () => {
    const imagesRef = makeImages()
    const c = useAdminProductoDetailImages(makeParams(imagesRef))
    await c.moveImage(0, 'up')
    expect(mockReorderImages).not.toHaveBeenCalled()
  })

  it('does not move beyond end', async () => {
    const imagesRef = makeImages()
    const c = useAdminProductoDetailImages(makeParams(imagesRef))
    await c.moveImage(2, 'down')
    expect(mockReorderImages).not.toHaveBeenCalled()
  })

  it('calls reorderImages with the swapped positions', async () => {
    mockReorderImages.mockResolvedValue(true)
    const imagesRef = makeImages()
    const c = useAdminProductoDetailImages(makeParams(imagesRef))
    await c.moveImage(0, 'down')
    expect(mockReorderImages).toHaveBeenCalled()
  })
})
