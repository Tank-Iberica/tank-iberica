import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminNoticiaForm } from '../../app/composables/admin/useAdminNoticiaForm'

// ─── Module mocks ─────────────────────────────────────────────────────────

let mockFetchById: ReturnType<typeof vi.fn>
let mockUpdateNews: ReturnType<typeof vi.fn>
let mockDeleteNews: ReturnType<typeof vi.fn>
let mockUpload: ReturnType<typeof vi.fn>

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
    analysis: { value: { score: 0, checks: [], level: 'bad' } },
  }),
}))

vi.mock('~/composables/admin/useCloudinaryUpload', () => ({
  useCloudinaryUpload: () => ({
    upload: (...args: unknown[]) => mockUpload(...args),
    uploading: { value: false },
    progress: { value: 0 },
    error: { value: null },
  }),
}))

// ─── Global stubs ─────────────────────────────────────────────────────────

let mockPush: ReturnType<typeof vi.fn>

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockFetchById = vi.fn().mockResolvedValue(null)
  mockUpdateNews = vi.fn().mockResolvedValue(true)
  mockDeleteNews = vi.fn().mockResolvedValue(true)
  mockUpload = vi.fn().mockResolvedValue(null)
  mockPush = vi.fn()
  vi.stubGlobal('useRouter', () => ({ push: mockPush }))
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn().mockReturnValue('blob:mock'),
    revokeObjectURL: vi.fn(),
  })
})

function makeNewsId(id = 'news-1') {
  return { value: id }
}

function makeArticle(overrides: Record<string, unknown> = {}) {
  return {
    id: 'n-1',
    title_es: 'Título de prueba',
    title_en: null,
    slug: 'titulo-de-prueba',
    category: 'general',
    image_url: null,
    description_es: 'Descripción',
    description_en: null,
    content_es: 'Contenido del artículo',
    content_en: null,
    hashtags: [],
    status: 'draft',
    published_at: null,
    ...overrides,
  }
}

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('loading is false', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.loading.value).toBe(false)
  })

  it('saving is false', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.saving.value).toBe(false)
  })

  it('error is null', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.error.value).toBeNull()
  })

  it('article starts as null', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.article.value).toBeNull()
  })

  it('hashtagInput starts as empty string', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.hashtagInput.value).toBe('')
  })

  it('relatedCategoryInput starts as empty string', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.relatedCategoryInput.value).toBe('')
  })

  it('sections.english starts as false', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.sections.english).toBe(false)
  })

  it('sections.seoPanel starts as true', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.sections.seoPanel).toBe(true)
  })

  it('sections.info starts as false', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.sections.info).toBe(false)
  })

  it('sections.faq starts as false', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.sections.faq).toBe(false)
  })

  it('sections.social starts as false', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.sections.social).toBe(false)
  })

  it('deleteModal starts as false', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.deleteModal.value).toBe(false)
  })

  it('deleteConfirmText starts as empty string', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.deleteConfirmText.value).toBe('')
  })

  it('imagePreviewUrl starts as null', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.imagePreviewUrl.value).toBeNull()
  })

  it('formData.title_es starts as empty string', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.formData.value.title_es).toBe('')
  })

  it('formData.status starts as draft', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.formData.value.status).toBe('draft')
  })

  it('formData.hashtags starts as empty array', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.formData.value.hashtags).toEqual([])
  })

  it('formData.section starts as noticias', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.formData.value.section).toBe('noticias')
  })

  it('isValid starts as false (empty title/content/slug)', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.isValid.value).toBe(false)
  })

  it('contentWordCount starts as 0', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.contentWordCount.value).toBe(0)
  })

  it('titleLengthClass starts as empty string', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.titleLengthClass.value).toBe('')
  })
})

// ─── addHashtag ───────────────────────────────────────────────────────────

describe('addHashtag', () => {
  it('adds tag to hashtags', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.hashtagInput.value = 'nuevo'
    c.addHashtag()
    expect(c.formData.value.hashtags).toContain('nuevo')
  })

  it('strips leading # from tag', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.hashtagInput.value = '#camion'
    c.addHashtag()
    expect(c.formData.value.hashtags).toContain('camion')
    expect(c.formData.value.hashtags).not.toContain('#camion')
  })

  it('converts to lowercase', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.hashtagInput.value = 'TRANSPORTE'
    c.addHashtag()
    expect(c.formData.value.hashtags).toContain('transporte')
  })

  it('clears hashtagInput after adding', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.hashtagInput.value = 'tag'
    c.addHashtag()
    expect(c.hashtagInput.value).toBe('')
  })

  it('does not add empty tag', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.hashtagInput.value = '   '
    c.addHashtag()
    expect(c.formData.value.hashtags).toHaveLength(0)
  })

  it('does not add duplicate tag', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.formData.value.hashtags = ['existing']
    c.hashtagInput.value = 'existing'
    c.addHashtag()
    expect(c.formData.value.hashtags).toHaveLength(1)
  })
})

// ─── removeHashtag ────────────────────────────────────────────────────────

describe('removeHashtag', () => {
  it('removes specified tag', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.formData.value.hashtags = ['tag1', 'tag2']
    c.removeHashtag('tag1')
    expect(c.formData.value.hashtags).not.toContain('tag1')
    expect(c.formData.value.hashtags).toContain('tag2')
  })

  it('does nothing for unknown tag', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.formData.value.hashtags = ['tag1']
    c.removeHashtag('nonexistent')
    expect(c.formData.value.hashtags).toHaveLength(1)
  })
})

// ─── addRelatedCategory ───────────────────────────────────────────────────

describe('addRelatedCategory', () => {
  it('adds category in lowercase', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.relatedCategoryInput.value = 'Camiones'
    c.addRelatedCategory()
    expect(c.formData.value.related_categories).toContain('camiones')
  })

  it('clears input after adding', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.relatedCategoryInput.value = 'cat'
    c.addRelatedCategory()
    expect(c.relatedCategoryInput.value).toBe('')
  })

  it('does not add empty category', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.relatedCategoryInput.value = '  '
    c.addRelatedCategory()
    expect(c.formData.value.related_categories).toBeNull()
  })

  it('does not add duplicate', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.formData.value.related_categories = ['trucks']
    c.relatedCategoryInput.value = 'trucks'
    c.addRelatedCategory()
    expect(c.formData.value.related_categories).toHaveLength(1)
  })
})

// ─── removeRelatedCategory ────────────────────────────────────────────────

describe('removeRelatedCategory', () => {
  it('removes specified category', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.formData.value.related_categories = ['trucks', 'vans']
    c.removeRelatedCategory('trucks')
    expect(c.formData.value.related_categories).not.toContain('trucks')
    expect(c.formData.value.related_categories).toContain('vans')
  })

  it('sets related_categories to null when last category removed', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.formData.value.related_categories = ['trucks']
    c.removeRelatedCategory('trucks')
    expect(c.formData.value.related_categories).toBeNull()
  })

  it('does nothing when related_categories is null', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(() => c.removeRelatedCategory('cats')).not.toThrow()
  })
})

// ─── addFaqItem / removeFaqItem ───────────────────────────────────────────

describe('addFaqItem', () => {
  it('adds item with empty question and answer', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.addFaqItem()
    expect(c.formData.value.faq_schema).toHaveLength(1)
    expect(c.formData.value.faq_schema![0]).toMatchObject({ question: '', answer: '' })
  })

  it('can add multiple items', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.addFaqItem()
    c.addFaqItem()
    expect(c.formData.value.faq_schema).toHaveLength(2)
  })

  it('initializes from null faq_schema', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.formData.value.faq_schema).toBeNull()
    c.addFaqItem()
    expect(c.formData.value.faq_schema).toHaveLength(1)
  })
})

describe('removeFaqItem', () => {
  it('removes item at index', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.addFaqItem()
    c.addFaqItem()
    c.removeFaqItem(0)
    expect(c.formData.value.faq_schema).toHaveLength(1)
  })

  it('sets faq_schema to null when all items removed', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.addFaqItem()
    c.removeFaqItem(0)
    expect(c.formData.value.faq_schema).toBeNull()
  })

  it('does nothing when faq_schema is null', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(() => c.removeFaqItem(0)).not.toThrow()
  })
})

// ─── removeImage ──────────────────────────────────────────────────────────

describe('removeImage', () => {
  it('sets image_url to null', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.formData.value.image_url = 'https://example.com/img.jpg'
    c.removeImage()
    expect(c.formData.value.image_url).toBeNull()
  })

  it('clears imagePreviewUrl', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.imagePreviewUrl.value = 'blob:preview'
    c.removeImage()
    expect(c.imagePreviewUrl.value).toBeNull()
  })
})

// ─── openDeleteModal / closeDeleteModal ───────────────────────────────────

describe('openDeleteModal', () => {
  it('sets deleteModal to true', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.openDeleteModal()
    expect(c.deleteModal.value).toBe(true)
  })

  it('clears deleteConfirmText', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.deleteConfirmText.value = 'some text'
    c.openDeleteModal()
    expect(c.deleteConfirmText.value).toBe('')
  })
})

describe('closeDeleteModal', () => {
  it('sets deleteModal to false', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.deleteModal.value = true
    c.closeDeleteModal()
    expect(c.deleteModal.value).toBe(false)
  })

  it('clears deleteConfirmText', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.deleteConfirmText.value = 'borrar'
    c.closeDeleteModal()
    expect(c.deleteConfirmText.value).toBe('')
  })
})

// ─── executeDelete ────────────────────────────────────────────────────────

describe('executeDelete', () => {
  it('does nothing when confirm text is not "borrar"', async () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.deleteConfirmText.value = 'wrong'
    await c.executeDelete()
    expect(mockDeleteNews).not.toHaveBeenCalled()
  })

  it('calls deleteNews with newsId when confirm text is "borrar"', async () => {
    const c = useAdminNoticiaForm(makeNewsId('article-99'))
    c.deleteConfirmText.value = 'borrar'
    await c.executeDelete()
    expect(mockDeleteNews).toHaveBeenCalledWith('article-99')
  })

  it('navigates to /admin/noticias on successful delete', async () => {
    mockDeleteNews.mockResolvedValue(true)
    const c = useAdminNoticiaForm(makeNewsId())
    c.deleteConfirmText.value = 'borrar'
    await c.executeDelete()
    expect(mockPush).toHaveBeenCalledWith('/admin/noticias')
  })

  it('does not navigate on failed delete', async () => {
    mockDeleteNews.mockResolvedValue(false)
    const c = useAdminNoticiaForm(makeNewsId())
    c.deleteConfirmText.value = 'borrar'
    await c.executeDelete()
    expect(mockPush).not.toHaveBeenCalledWith('/admin/noticias')
  })

  it('closes modal after execute', async () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.deleteConfirmText.value = 'borrar'
    c.deleteModal.value = true
    await c.executeDelete()
    expect(c.deleteModal.value).toBe(false)
  })
})

// ─── handleSave ───────────────────────────────────────────────────────────

describe('handleSave', () => {
  it('does not call updateNews when isValid is false', async () => {
    const c = useAdminNoticiaForm(makeNewsId())
    await c.handleSave()
    expect(mockUpdateNews).not.toHaveBeenCalled()
  })

  it('calls updateNews with newsId and formData when isValid is true', async () => {
    const c = useAdminNoticiaForm(makeNewsId('article-10'))
    c.isValid.value = true
    await c.handleSave()
    expect(mockUpdateNews).toHaveBeenCalledWith('article-10', c.formData.value)
  })

  it('navigates to /admin/noticias on success', async () => {
    mockUpdateNews.mockResolvedValue(true)
    const c = useAdminNoticiaForm(makeNewsId())
    c.isValid.value = true
    await c.handleSave()
    expect(mockPush).toHaveBeenCalledWith('/admin/noticias')
  })

  it('does not navigate when updateNews fails', async () => {
    mockUpdateNews.mockResolvedValue(false)
    const c = useAdminNoticiaForm(makeNewsId())
    c.isValid.value = true
    await c.handleSave()
    expect(mockPush).not.toHaveBeenCalled()
  })
})

// ─── handleCancel ─────────────────────────────────────────────────────────

describe('handleCancel', () => {
  it('navigates to /admin/noticias', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    c.handleCancel()
    expect(mockPush).toHaveBeenCalledWith('/admin/noticias')
  })
})

// ─── init ─────────────────────────────────────────────────────────────────

describe('init', () => {
  it('calls fetchById with newsId', async () => {
    const c = useAdminNoticiaForm(makeNewsId('article-42'))
    await c.init()
    expect(mockFetchById).toHaveBeenCalledWith('article-42')
  })

  it('navigates to /admin/noticias when article not found', async () => {
    mockFetchById.mockResolvedValue(null)
    const c = useAdminNoticiaForm(makeNewsId())
    await c.init()
    expect(mockPush).toHaveBeenCalledWith('/admin/noticias')
  })

  it('populates formData.title_es from fetched article', async () => {
    mockFetchById.mockResolvedValue(makeArticle({ title_es: 'Título de prueba' }))
    const c = useAdminNoticiaForm(makeNewsId())
    await c.init()
    expect(c.formData.value.title_es).toBe('Título de prueba')
  })

  it('populates formData.slug from fetched article', async () => {
    mockFetchById.mockResolvedValue(makeArticle({ slug: 'mi-slug' }))
    const c = useAdminNoticiaForm(makeNewsId())
    await c.init()
    expect(c.formData.value.slug).toBe('mi-slug')
  })

  it('populates formData.status from fetched article', async () => {
    mockFetchById.mockResolvedValue(makeArticle({ status: 'published' }))
    const c = useAdminNoticiaForm(makeNewsId())
    await c.init()
    expect(c.formData.value.status).toBe('published')
  })

  it('sets article ref from fetched data', async () => {
    const article = makeArticle()
    mockFetchById.mockResolvedValue(article)
    const c = useAdminNoticiaForm(makeNewsId())
    await c.init()
    expect(c.article.value).toBe(article)
  })

  it('opens english section when article has title_en', async () => {
    mockFetchById.mockResolvedValue(makeArticle({ title_en: 'EN Title' }))
    const c = useAdminNoticiaForm(makeNewsId())
    await c.init()
    expect(c.sections.english).toBe(true)
  })

  it('does not open english section when no english content', async () => {
    mockFetchById.mockResolvedValue(makeArticle({ title_en: null, content_en: null }))
    const c = useAdminNoticiaForm(makeNewsId())
    await c.init()
    expect(c.sections.english).toBe(false)
  })

  it('opens faq section when faq_schema has items', async () => {
    mockFetchById.mockResolvedValue(
      makeArticle({ faq_schema: [{ question: 'Q', answer: 'A' }] }),
    )
    const c = useAdminNoticiaForm(makeNewsId())
    await c.init()
    expect(c.sections.faq).toBe(true)
  })

  it('opens social section when social_post_text has keys', async () => {
    mockFetchById.mockResolvedValue(
      makeArticle({ social_post_text: { instagram: 'Post text' } }),
    )
    const c = useAdminNoticiaForm(makeNewsId())
    await c.init()
    expect(c.sections.social).toBe(true)
  })

  it('does not navigate when article is found', async () => {
    mockFetchById.mockResolvedValue(makeArticle())
    const c = useAdminNoticiaForm(makeNewsId())
    await c.init()
    expect(mockPush).not.toHaveBeenCalled()
  })
})

// ─── formatDate ───────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('returns "—" for null', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.formatDate(null)).toBe('—')
  })

  it('returns formatted date string for valid date', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    const result = c.formatDate('2026-03-15T10:30:00Z')
    expect(typeof result).toBe('string')
    expect(result).not.toBe('')
    expect(result).not.toBe('—')
  })
})

// ─── getLevelLabel ────────────────────────────────────────────────────────

describe('getLevelLabel', () => {
  it('returns "Bueno" for "good"', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.getLevelLabel('good')).toBe('Bueno')
  })

  it('returns "Mejorable" for "warning"', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.getLevelLabel('warning')).toBe('Mejorable')
  })

  it('returns "Necesita trabajo" for "bad"', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.getLevelLabel('bad')).toBe('Necesita trabajo')
  })

  it('returns empty string for unknown level', () => {
    const c = useAdminNoticiaForm(makeNewsId())
    expect(c.getLevelLabel('unknown')).toBe('')
  })
})
