import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminNewsForm } from '../../app/composables/admin/useAdminNewsForm'

// ─── Module mocks ─────────────────────────────────────────────────────────

let mockFetchById: ReturnType<typeof vi.fn>
let mockUpdateNews: ReturnType<typeof vi.fn>
let mockDeleteNews: ReturnType<typeof vi.fn>

vi.mock('~/composables/admin/useAdminNews', () => ({
  useAdminNews: () => ({
    loading: { value: false },
    saving: { value: false },
    error: { value: null },
    fetchById: (...args: unknown[]) => mockFetchById(...args),
    updateNews: (...args: unknown[]) => mockUpdateNews(...args),
    deleteNews: (...args: unknown[]) => mockDeleteNews(...args),
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

// ─── Setup ────────────────────────────────────────────────────────────────

let mockPush: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockFetchById = vi.fn().mockResolvedValue(null)
  mockUpdateNews = vi.fn().mockResolvedValue(false)
  mockDeleteNews = vi.fn().mockResolvedValue(false)
  mockPush = vi.fn()
  vi.stubGlobal('useRouter', () => ({ push: mockPush }))
})

function makeNewsId(id = 'news-1') {
  return { value: id }
}

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('formData.title_es starts as empty string', () => {
    const c = useAdminNewsForm(makeNewsId())
    expect(c.formData.value.title_es).toBe('')
  })

  it('formData.hashtags starts as empty array', () => {
    const c = useAdminNewsForm(makeNewsId())
    expect(c.formData.value.hashtags).toEqual([])
  })

  it('formData.faq_schema starts as null', () => {
    const c = useAdminNewsForm(makeNewsId())
    expect(c.formData.value.faq_schema).toBeNull()
  })

  it('formData.social_post_text starts as null', () => {
    const c = useAdminNewsForm(makeNewsId())
    expect(c.formData.value.social_post_text).toBeNull()
  })

  it('sections.seoPanel starts as true', () => {
    const c = useAdminNewsForm(makeNewsId())
    expect(c.sections.seoPanel).toBe(true)
  })

  it('sections.english starts as false', () => {
    const c = useAdminNewsForm(makeNewsId())
    expect(c.sections.english).toBe(false)
  })

  it('hashtagInput starts as empty string', () => {
    const c = useAdminNewsForm(makeNewsId())
    expect(c.hashtagInput.value).toBe('')
  })

  it('isValid starts as false (empty form)', () => {
    const c = useAdminNewsForm(makeNewsId())
    expect(c.isValid.value).toBe(false)
  })

  it('deleteModal starts as false', () => {
    const c = useAdminNewsForm(makeNewsId())
    expect(c.deleteModal.value).toBe(false)
  })

  it('deleteConfirmText starts as empty string', () => {
    const c = useAdminNewsForm(makeNewsId())
    expect(c.deleteConfirmText.value).toBe('')
  })

  it('article starts as null (onMounted is a no-op in tests)', () => {
    const c = useAdminNewsForm(makeNewsId())
    expect(c.article.value).toBeNull()
  })
})

// ─── addHashtag / removeHashtag ───────────────────────────────────────────

describe('addHashtag', () => {
  it('adds tag stripping # and lowercasing', () => {
    const c = useAdminNewsForm(makeNewsId())
    c.hashtagInput.value = '#Trucks'
    c.addHashtag()
    expect(c.formData.value.hashtags).toContain('trucks')
  })

  it('does not add duplicate', () => {
    const c = useAdminNewsForm(makeNewsId())
    c.formData.value.hashtags = ['trucks']
    c.hashtagInput.value = 'trucks'
    c.addHashtag()
    expect(c.formData.value.hashtags).toHaveLength(1)
  })

  it('clears hashtagInput after adding', () => {
    const c = useAdminNewsForm(makeNewsId())
    c.hashtagInput.value = 'test'
    c.addHashtag()
    expect(c.hashtagInput.value).toBe('')
  })

  it('does not add empty tag', () => {
    const c = useAdminNewsForm(makeNewsId())
    c.hashtagInput.value = '  '
    c.addHashtag()
    expect(c.formData.value.hashtags).toHaveLength(0)
  })
})

describe('removeHashtag', () => {
  it('removes the tag', () => {
    const c = useAdminNewsForm(makeNewsId())
    c.formData.value.hashtags = ['trucks', 'logistics']
    c.removeHashtag('trucks')
    expect(c.formData.value.hashtags).toEqual(['logistics'])
  })
})

// ─── addFaqItem / removeFaqItem ───────────────────────────────────────────

describe('addFaqItem', () => {
  it('adds empty FAQ item', () => {
    const c = useAdminNewsForm(makeNewsId())
    c.addFaqItem()
    expect(c.formData.value.faq_schema).toHaveLength(1)
    expect(c.formData.value.faq_schema![0]).toEqual({ question: '', answer: '' })
  })
})

describe('removeFaqItem', () => {
  it('removes item by index', () => {
    const c = useAdminNewsForm(makeNewsId())
    c.formData.value.faq_schema = [
      { question: 'Q1', answer: 'A1' },
      { question: 'Q2', answer: 'A2' },
    ]
    c.removeFaqItem(0)
    expect(c.formData.value.faq_schema![0]!.question).toBe('Q2')
  })

  it('sets null when last item removed', () => {
    const c = useAdminNewsForm(makeNewsId())
    c.formData.value.faq_schema = [{ question: 'Q1', answer: 'A1' }]
    c.removeFaqItem(0)
    expect(c.formData.value.faq_schema).toBeNull()
  })
})

// ─── addRelatedCategory / removeRelatedCategory ───────────────────────────

describe('addRelatedCategory', () => {
  it('adds trimmed lowercase category', () => {
    const c = useAdminNewsForm(makeNewsId())
    c.relatedCategoryInput.value = ' Trucks '
    c.addRelatedCategory()
    expect(c.formData.value.related_categories).toContain('trucks')
  })

  it('clears input after adding', () => {
    const c = useAdminNewsForm(makeNewsId())
    c.relatedCategoryInput.value = 'trucks'
    c.addRelatedCategory()
    expect(c.relatedCategoryInput.value).toBe('')
  })

  it('does not add duplicate', () => {
    const c = useAdminNewsForm(makeNewsId())
    c.formData.value.related_categories = ['trucks']
    c.relatedCategoryInput.value = 'trucks'
    c.addRelatedCategory()
    expect(c.formData.value.related_categories).toHaveLength(1)
  })

  it('skips empty input', () => {
    const c = useAdminNewsForm(makeNewsId())
    c.relatedCategoryInput.value = '  '
    c.addRelatedCategory()
    expect(c.formData.value.related_categories).toBeNull()
  })
})

describe('removeRelatedCategory', () => {
  it('removes the category', () => {
    const c = useAdminNewsForm(makeNewsId())
    c.formData.value.related_categories = ['trucks', 'logistics']
    c.removeRelatedCategory('trucks')
    expect(c.formData.value.related_categories).not.toContain('trucks')
  })

  it('sets null when last category removed', () => {
    const c = useAdminNewsForm(makeNewsId())
    c.formData.value.related_categories = ['trucks']
    c.removeRelatedCategory('trucks')
    expect(c.formData.value.related_categories).toBeNull()
  })
})

// ─── removeImage ──────────────────────────────────────────────────────────

describe('removeImage', () => {
  it('sets image_url to null', () => {
    const c = useAdminNewsForm(makeNewsId())
    c.formData.value.image_url = 'https://res.cloudinary.com/test.jpg'
    c.removeImage()
    expect(c.formData.value.image_url).toBeNull()
  })

  it('sets imagePreviewUrl to null', () => {
    const c = useAdminNewsForm(makeNewsId())
    c.imagePreviewUrl.value = 'blob:preview'
    vi.stubGlobal('URL', { ...URL, revokeObjectURL: vi.fn(), createObjectURL: vi.fn() })
    c.removeImage()
    expect(c.imagePreviewUrl.value).toBeNull()
  })
})

// ─── Social post helpers ──────────────────────────────────────────────────

describe('ensureSocialPostText', () => {
  it('initializes social_post_text if null', () => {
    const c = useAdminNewsForm(makeNewsId())
    const result = c.ensureSocialPostText()
    expect(result).toBeDefined()
    expect(typeof result).toBe('object')
    expect(c.formData.value.social_post_text).not.toBeNull()
  })

  it('returns existing object if already initialized', () => {
    const c = useAdminNewsForm(makeNewsId())
    c.formData.value.social_post_text = { twitter: 'hello' }
    const result = c.ensureSocialPostText()
    expect(result).toHaveProperty('twitter', 'hello')
  })
})

describe('updateSocialField', () => {
  it('sets the platform field value', () => {
    const c = useAdminNewsForm(makeNewsId())
    c.updateSocialField('twitter', 'Hello world')
    expect(c.formData.value.social_post_text!['twitter']).toBe('Hello world')
  })

  it('can update multiple platforms', () => {
    const c = useAdminNewsForm(makeNewsId())
    c.updateSocialField('twitter', 'Tweet')
    c.updateSocialField('linkedin', 'LinkedIn post')
    expect(c.formData.value.social_post_text!['linkedin']).toBe('LinkedIn post')
  })
})

describe('getSocialField', () => {
  it('returns empty string when social_post_text is null', () => {
    const c = useAdminNewsForm(makeNewsId())
    expect(c.getSocialField('twitter')).toBe('')
  })

  it('returns the field value when set', () => {
    const c = useAdminNewsForm(makeNewsId())
    c.formData.value.social_post_text = { twitter: 'My tweet' }
    expect(c.getSocialField('twitter')).toBe('My tweet')
  })

  it('returns empty string for missing platform', () => {
    const c = useAdminNewsForm(makeNewsId())
    c.formData.value.social_post_text = { twitter: 'Tweet' }
    expect(c.getSocialField('linkedin')).toBe('')
  })
})

// ─── Delete modal ─────────────────────────────────────────────────────────

describe('openDeleteModal', () => {
  it('sets deleteModal to true', () => {
    const c = useAdminNewsForm(makeNewsId())
    c.openDeleteModal()
    expect(c.deleteModal.value).toBe(true)
  })

  it('clears deleteConfirmText', () => {
    const c = useAdminNewsForm(makeNewsId())
    c.deleteConfirmText.value = 'some text'
    c.openDeleteModal()
    expect(c.deleteConfirmText.value).toBe('')
  })
})

describe('closeDeleteModal', () => {
  it('sets deleteModal to false', () => {
    const c = useAdminNewsForm(makeNewsId())
    c.deleteModal.value = true
    c.closeDeleteModal()
    expect(c.deleteModal.value).toBe(false)
  })

  it('clears deleteConfirmText', () => {
    const c = useAdminNewsForm(makeNewsId())
    c.deleteConfirmText.value = 'borrar'
    c.closeDeleteModal()
    expect(c.deleteConfirmText.value).toBe('')
  })
})

describe('executeDelete', () => {
  it('does not call deleteNews when confirmText is not "borrar"', async () => {
    const c = useAdminNewsForm(makeNewsId())
    c.deleteConfirmText.value = 'delete'
    await c.executeDelete()
    expect(mockDeleteNews).not.toHaveBeenCalled()
  })

  it('calls deleteNews when confirmText is "borrar"', async () => {
    const c = useAdminNewsForm(makeNewsId())
    c.deleteConfirmText.value = 'borrar'
    mockDeleteNews.mockResolvedValue(true)
    await c.executeDelete()
    expect(mockDeleteNews).toHaveBeenCalledWith('news-1')
  })

  it('pushes to /admin/noticias on successful delete', async () => {
    const c = useAdminNewsForm(makeNewsId())
    c.deleteConfirmText.value = 'borrar'
    mockDeleteNews.mockResolvedValue(true)
    await c.executeDelete()
    expect(mockPush).toHaveBeenCalledWith('/admin/noticias')
  })

  it('closes modal after delete attempt', async () => {
    const c = useAdminNewsForm(makeNewsId())
    c.deleteConfirmText.value = 'borrar'
    c.deleteModal.value = true
    mockDeleteNews.mockResolvedValue(true)
    await c.executeDelete()
    expect(c.deleteModal.value).toBe(false)
  })

  it('does not push route when deleteNews returns false', async () => {
    const c = useAdminNewsForm(makeNewsId())
    c.deleteConfirmText.value = 'borrar'
    mockDeleteNews.mockResolvedValue(false)
    await c.executeDelete()
    expect(mockPush).not.toHaveBeenCalled()
  })
})

// ─── handleSave ───────────────────────────────────────────────────────────

describe('handleSave', () => {
  it('does not call updateNews when isValid is false', async () => {
    const c = useAdminNewsForm(makeNewsId())
    await c.handleSave()
    expect(mockUpdateNews).not.toHaveBeenCalled()
  })

  it('calls updateNews with newsId and formData when isValid is true', async () => {
    const c = useAdminNewsForm(makeNewsId())
    c.isValid.value = true
    mockUpdateNews.mockResolvedValue(true)
    await c.handleSave()
    expect(mockUpdateNews).toHaveBeenCalledWith('news-1', c.formData.value)
  })

  it('pushes to /admin/noticias on successful save', async () => {
    const c = useAdminNewsForm(makeNewsId())
    c.isValid.value = true
    mockUpdateNews.mockResolvedValue(true)
    await c.handleSave()
    expect(mockPush).toHaveBeenCalledWith('/admin/noticias')
  })

  it('does not push when updateNews returns false', async () => {
    const c = useAdminNewsForm(makeNewsId())
    c.isValid.value = true
    mockUpdateNews.mockResolvedValue(false)
    await c.handleSave()
    expect(mockPush).not.toHaveBeenCalled()
  })
})

// ─── handleCancel ─────────────────────────────────────────────────────────

describe('handleCancel', () => {
  it('pushes to /admin/noticias', () => {
    const c = useAdminNewsForm(makeNewsId())
    c.handleCancel()
    expect(mockPush).toHaveBeenCalledWith('/admin/noticias')
  })
})

// ─── formatDate ───────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('returns "—" for null', () => {
    const c = useAdminNewsForm(makeNewsId())
    expect(c.formatDate(null)).toBe('—')
  })

  it('returns formatted string for valid ISO date', () => {
    const c = useAdminNewsForm(makeNewsId())
    const result = c.formatDate('2026-03-15T10:30:00Z')
    expect(typeof result).toBe('string')
    expect(result).not.toBe('—')
  })
})

// ─── getLevelLabel ────────────────────────────────────────────────────────

describe('getLevelLabel', () => {
  it('returns "Bueno" for "good"', () => {
    const c = useAdminNewsForm(makeNewsId())
    expect(c.getLevelLabel('good')).toBe('Bueno')
  })

  it('returns "Mejorable" for "warning"', () => {
    const c = useAdminNewsForm(makeNewsId())
    expect(c.getLevelLabel('warning')).toBe('Mejorable')
  })

  it('returns "Necesita trabajo" for "bad"', () => {
    const c = useAdminNewsForm(makeNewsId())
    expect(c.getLevelLabel('bad')).toBe('Necesita trabajo')
  })

  it('returns empty string for unknown level', () => {
    const c = useAdminNewsForm(makeNewsId())
    expect(c.getLevelLabel('unknown')).toBe('')
  })
})
