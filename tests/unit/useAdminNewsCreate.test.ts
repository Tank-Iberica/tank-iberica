import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminNewsCreate } from '../../app/composables/admin/useAdminNewsCreate'

// ─── Module mocks ─────────────────────────────────────────────────────────

let mockCreateNews: ReturnType<typeof vi.fn>

vi.mock('~/composables/admin/useAdminNews', () => ({
  useAdminNews: () => ({
    saving: { value: false },
    error: { value: null },
    createNews: (...args: unknown[]) => mockCreateNews(...args),
  }),
}))

vi.mock('~/composables/admin/useSeoScore', () => ({
  useSeoScore: () => ({
    analysis: { value: { score: 50, level: 'warning', criteria: [] } },
  }),
}))

vi.mock('~/composables/admin/useCloudinaryUpload', () => ({
  useCloudinaryUpload: () => ({
    upload: vi.fn().mockResolvedValue(null),
    uploading: { value: false },
    progress: { value: 0 },
    error: { value: null },
  }),
}))

vi.mock('~/utils/fileNaming', () => ({
  slugify: (s: string) => s.toLowerCase().replace(/\s+/g, '-'),
}))

// ─── Setup ────────────────────────────────────────────────────────────────

let mockPush: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockCreateNews = vi.fn().mockResolvedValue(null)
  mockPush = vi.fn()
  vi.stubGlobal('useRouter', () => ({ push: mockPush }))
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('formData.title_es starts as empty string', () => {
    const c = useAdminNewsCreate()
    expect(c.formData.value.title_es).toBe('')
  })

  it('formData.content_es starts as empty string', () => {
    const c = useAdminNewsCreate()
    expect(c.formData.value.content_es).toBe('')
  })

  it('formData.slug starts as empty string', () => {
    const c = useAdminNewsCreate()
    expect(c.formData.value.slug).toBe('')
  })

  it('formData.hashtags starts as empty array', () => {
    const c = useAdminNewsCreate()
    expect(c.formData.value.hashtags).toEqual([])
  })

  it('formData.faq_schema starts as null', () => {
    const c = useAdminNewsCreate()
    expect(c.formData.value.faq_schema).toBeNull()
  })

  it('formData.status starts as "draft"', () => {
    const c = useAdminNewsCreate()
    expect(c.formData.value.status).toBe('draft')
  })

  it('sections.seoPanel starts as true', () => {
    const c = useAdminNewsCreate()
    expect(c.sections.seoPanel).toBe(true)
  })

  it('sections.english starts as false', () => {
    const c = useAdminNewsCreate()
    expect(c.sections.english).toBe(false)
  })

  it('sections.faq starts as false', () => {
    const c = useAdminNewsCreate()
    expect(c.sections.faq).toBe(false)
  })

  it('hashtagInput starts as empty string', () => {
    const c = useAdminNewsCreate()
    expect(c.hashtagInput.value).toBe('')
  })

  it('relatedCategoryInput starts as empty string', () => {
    const c = useAdminNewsCreate()
    expect(c.relatedCategoryInput.value).toBe('')
  })

  it('isValid starts as false (all fields empty)', () => {
    const c = useAdminNewsCreate()
    expect(c.isValid.value).toBe(false)
  })

  it('contentWordCount starts as 0', () => {
    const c = useAdminNewsCreate()
    expect(c.contentWordCount.value).toBe(0)
  })

  it('titleLengthClass starts as empty string', () => {
    const c = useAdminNewsCreate()
    expect(c.titleLengthClass.value).toBe('')
  })

  it('descLengthClass starts as empty string', () => {
    const c = useAdminNewsCreate()
    expect(c.descLengthClass.value).toBe('')
  })

  it('imagePreviewUrl starts as null', () => {
    const c = useAdminNewsCreate()
    expect(c.imagePreviewUrl.value).toBeNull()
  })
})

// ─── addHashtag ───────────────────────────────────────────────────────────

describe('addHashtag', () => {
  it('adds a tag to hashtags array', () => {
    const c = useAdminNewsCreate()
    c.hashtagInput.value = 'trucks'
    c.addHashtag()
    expect(c.formData.value.hashtags).toContain('trucks')
  })

  it('strips leading # from tag', () => {
    const c = useAdminNewsCreate()
    c.hashtagInput.value = '#trucks'
    c.addHashtag()
    expect(c.formData.value.hashtags).toContain('trucks')
    expect(c.formData.value.hashtags).not.toContain('#trucks')
  })

  it('lowercases the tag', () => {
    const c = useAdminNewsCreate()
    c.hashtagInput.value = 'TRUCKS'
    c.addHashtag()
    expect(c.formData.value.hashtags).toContain('trucks')
  })

  it('does not add duplicate tags', () => {
    const c = useAdminNewsCreate()
    c.formData.value.hashtags = ['trucks']
    c.hashtagInput.value = 'trucks'
    c.addHashtag()
    expect(c.formData.value.hashtags).toHaveLength(1)
  })

  it('clears hashtagInput after adding', () => {
    const c = useAdminNewsCreate()
    c.hashtagInput.value = 'trucks'
    c.addHashtag()
    expect(c.hashtagInput.value).toBe('')
  })

  it('does not add empty tag', () => {
    const c = useAdminNewsCreate()
    c.hashtagInput.value = '   '
    c.addHashtag()
    expect(c.formData.value.hashtags).toHaveLength(0)
  })
})

// ─── removeHashtag ────────────────────────────────────────────────────────

describe('removeHashtag', () => {
  it('removes the specified tag', () => {
    const c = useAdminNewsCreate()
    c.formData.value.hashtags = ['trucks', 'logistics']
    c.removeHashtag('trucks')
    expect(c.formData.value.hashtags).not.toContain('trucks')
    expect(c.formData.value.hashtags).toContain('logistics')
  })

  it('does nothing when tag not present', () => {
    const c = useAdminNewsCreate()
    c.formData.value.hashtags = ['logistics']
    c.removeHashtag('trucks')
    expect(c.formData.value.hashtags).toHaveLength(1)
  })
})

// ─── addFaqItem ───────────────────────────────────────────────────────────

describe('addFaqItem', () => {
  it('appends empty FAQ item when faq_schema is null', () => {
    const c = useAdminNewsCreate()
    c.addFaqItem()
    expect(c.formData.value.faq_schema).toHaveLength(1)
    expect(c.formData.value.faq_schema![0]).toEqual({ question: '', answer: '' })
  })

  it('appends to existing FAQ items', () => {
    const c = useAdminNewsCreate()
    c.formData.value.faq_schema = [{ question: 'Q1', answer: 'A1' }]
    c.addFaqItem()
    expect(c.formData.value.faq_schema).toHaveLength(2)
  })
})

// ─── removeFaqItem ────────────────────────────────────────────────────────

describe('removeFaqItem', () => {
  it('removes FAQ item at specified index', () => {
    const c = useAdminNewsCreate()
    c.formData.value.faq_schema = [
      { question: 'Q1', answer: 'A1' },
      { question: 'Q2', answer: 'A2' },
    ]
    c.removeFaqItem(0)
    expect(c.formData.value.faq_schema).toHaveLength(1)
    expect(c.formData.value.faq_schema![0]!.question).toBe('Q2')
  })

  it('sets faq_schema to null when removing last item', () => {
    const c = useAdminNewsCreate()
    c.formData.value.faq_schema = [{ question: 'Q1', answer: 'A1' }]
    c.removeFaqItem(0)
    expect(c.formData.value.faq_schema).toBeNull()
  })

  it('does nothing when faq_schema is null', () => {
    const c = useAdminNewsCreate()
    expect(() => c.removeFaqItem(0)).not.toThrow()
  })
})

// ─── addRelatedCategory ───────────────────────────────────────────────────

describe('addRelatedCategory', () => {
  it('adds trimmed lowercase category', () => {
    const c = useAdminNewsCreate()
    c.relatedCategoryInput.value = '  Trucks  '
    c.addRelatedCategory()
    expect(c.formData.value.related_categories).toContain('trucks')
  })

  it('does not add duplicate categories', () => {
    const c = useAdminNewsCreate()
    c.formData.value.related_categories = ['trucks']
    c.relatedCategoryInput.value = 'trucks'
    c.addRelatedCategory()
    expect(c.formData.value.related_categories).toHaveLength(1)
  })

  it('clears relatedCategoryInput after adding', () => {
    const c = useAdminNewsCreate()
    c.relatedCategoryInput.value = 'trucks'
    c.addRelatedCategory()
    expect(c.relatedCategoryInput.value).toBe('')
  })

  it('does not add empty category', () => {
    const c = useAdminNewsCreate()
    c.relatedCategoryInput.value = '   '
    c.addRelatedCategory()
    expect(c.formData.value.related_categories).toBeNull()
  })
})

// ─── removeRelatedCategory ────────────────────────────────────────────────

describe('removeRelatedCategory', () => {
  it('removes the specified category', () => {
    const c = useAdminNewsCreate()
    c.formData.value.related_categories = ['trucks', 'logistics']
    c.removeRelatedCategory('trucks')
    expect(c.formData.value.related_categories).not.toContain('trucks')
  })

  it('sets null when removing last category', () => {
    const c = useAdminNewsCreate()
    c.formData.value.related_categories = ['trucks']
    c.removeRelatedCategory('trucks')
    expect(c.formData.value.related_categories).toBeNull()
  })

  it('does nothing when related_categories is null', () => {
    const c = useAdminNewsCreate()
    expect(() => c.removeRelatedCategory('trucks')).not.toThrow()
  })
})

// ─── removeImage ──────────────────────────────────────────────────────────

describe('removeImage', () => {
  it('sets image_url to null', () => {
    const c = useAdminNewsCreate()
    c.formData.value.image_url = 'https://res.cloudinary.com/test.jpg'
    c.removeImage()
    expect(c.formData.value.image_url).toBeNull()
  })

  it('sets imagePreviewUrl to null', () => {
    const c = useAdminNewsCreate()
    c.imagePreviewUrl.value = 'blob:https://example.com/preview'
    // Patch URL.revokeObjectURL to avoid errors in test
    vi.stubGlobal('URL', { ...URL, revokeObjectURL: vi.fn(), createObjectURL: vi.fn() })
    c.removeImage()
    expect(c.imagePreviewUrl.value).toBeNull()
  })
})

// ─── handleSave ───────────────────────────────────────────────────────────

describe('handleSave', () => {
  it('does not call createNews when isValid is false', async () => {
    const c = useAdminNewsCreate()
    // isValid.value = false (empty form)
    await c.handleSave()
    expect(mockCreateNews).not.toHaveBeenCalled()
  })

  it('calls createNews when isValid is true', async () => {
    const c = useAdminNewsCreate()
    c.isValid.value = true
    mockCreateNews.mockResolvedValue('new-news-id')
    await c.handleSave()
    expect(mockCreateNews).toHaveBeenCalledWith(c.formData.value)
  })

  it('pushes to /admin/noticias on successful save', async () => {
    const c = useAdminNewsCreate()
    c.isValid.value = true
    mockCreateNews.mockResolvedValue('new-news-id')
    await c.handleSave()
    expect(mockPush).toHaveBeenCalledWith('/admin/noticias')
  })

  it('does not push route when createNews returns null', async () => {
    const c = useAdminNewsCreate()
    c.isValid.value = true
    mockCreateNews.mockResolvedValue(null)
    await c.handleSave()
    expect(mockPush).not.toHaveBeenCalled()
  })
})

// ─── handleCancel ─────────────────────────────────────────────────────────

describe('handleCancel', () => {
  it('pushes to /admin/noticias', () => {
    const c = useAdminNewsCreate()
    c.handleCancel()
    expect(mockPush).toHaveBeenCalledWith('/admin/noticias')
  })
})

// ─── getLevelLabel ────────────────────────────────────────────────────────

describe('getLevelLabel', () => {
  it('returns "Bueno" for "good"', () => {
    const c = useAdminNewsCreate()
    expect(c.getLevelLabel('good')).toBe('Bueno')
  })

  it('returns "Mejorable" for "warning"', () => {
    const c = useAdminNewsCreate()
    expect(c.getLevelLabel('warning')).toBe('Mejorable')
  })

  it('returns "Necesita trabajo" for "bad"', () => {
    const c = useAdminNewsCreate()
    expect(c.getLevelLabel('bad')).toBe('Necesita trabajo')
  })

  it('returns empty string for unknown level', () => {
    const c = useAdminNewsCreate()
    expect(c.getLevelLabel('unknown')).toBe('')
  })
})
