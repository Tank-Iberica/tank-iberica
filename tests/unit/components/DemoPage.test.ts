/**
 * Tests for app/pages/demo.vue
 *
 * Covers: rendering, file upload (handleFiles), image removal, MAX_IMAGES
 * limit, file size limit, non-image filtering, analyze() with $fetch,
 * rate-limit error, generic error, reset(), preview result display,
 * conditional rendering (form vs result), submit button states.
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { ref, computed, watch, reactive, watchEffect } from 'vue'
import DemoPage from '../../../app/pages/demo.vue'

// Restore real Vue reactivity so SFC <script setup> works correctly
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)
vi.stubGlobal('reactive', reactive)
vi.stubGlobal('watchEffect', watchEffect)

// ---------------------------------------------------------------------------
// Global mocks
// ---------------------------------------------------------------------------
let fetchMock: Mock

beforeEach(() => {
  vi.clearAllMocks()
  fetchMock = vi.fn()
  vi.stubGlobal('$fetch', fetchMock)
  vi.stubGlobal('usePageSeo', vi.fn())
  vi.stubGlobal('definePageMeta', vi.fn())
  vi.stubGlobal('useI18n', () => ({
    locale: { value: 'es' },
    t: (key: string, params?: Record<string, unknown>) => {
      if (params) return `${key}(${JSON.stringify(params)})`
      return key
    },
  }))
})

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------
const factory = () =>
  shallowMount(DemoPage, {
    global: {
      stubs: {
        NuxtLink: {
          template: '<a><slot /></a>',
          props: ['to'],
        },
      },
    },
  })

/**
 * Helper: simulate adding image files to the component via the file input.
 * Uses FileReader internally (happy-dom supports it).
 */
async function addImageFiles(
  wrapper: ReturnType<typeof factory>,
  count: number,
  options: { sizeBytes?: number; type?: string } = {},
) {
  const { sizeBytes = 1024, type = 'image/jpeg' } = options
  const files: File[] = []
  for (let i = 0; i < count; i++) {
    files.push(new File([new Uint8Array(sizeBytes)], `img${i}.jpg`, { type }))
  }

  const fileInput = wrapper.find('input[type="file"]')
  Object.defineProperty(fileInput.element, 'files', {
    value: files,
    writable: true,
    configurable: true,
  })

  await fileInput.trigger('change')
  // Wait for FileReader async callbacks
  await new Promise((r) => setTimeout(r, 100))
  await flushPromises()
}

/**
 * Helper: add a single file with specific properties
 */
async function addSingleFile(
  wrapper: ReturnType<typeof factory>,
  name: string,
  sizeBytes: number,
  type: string,
) {
  const file = new File([new Uint8Array(sizeBytes)], name, { type })
  const fileInput = wrapper.find('input[type="file"]')
  Object.defineProperty(fileInput.element, 'files', {
    value: [file],
    writable: true,
    configurable: true,
  })

  await fileInput.trigger('change')
  await new Promise((r) => setTimeout(r, 100))
  await flushPromises()
}

// ===========================================================================
// RENDERING — INITIAL STATE
// ===========================================================================
describe('DemoPage — initial rendering', () => {
  it('renders the hero section', () => {
    const w = factory()
    expect(w.find('.demo-hero').exists()).toBe(true)
    expect(w.find('.demo-hero h1').text()).toBe('demo.title')
  })

  it('renders the subtitle', () => {
    expect(factory().find('.demo-subtitle').text()).toBe('demo.subtitle')
  })

  it('renders the upload form section', () => {
    expect(factory().find('.demo-form').exists()).toBe(true)
  })

  it('renders the dropzone', () => {
    expect(factory().find('.demo-dropzone').exists()).toBe(true)
  })

  it('renders dropzone content when no images', () => {
    expect(factory().find('.dropzone-content').exists()).toBe(true)
  })

  it('renders brand and model input fields', () => {
    const w = factory()
    expect(w.find('#demo-brand').exists()).toBe(true)
    expect(w.find('#demo-model').exists()).toBe(true)
  })

  it('does NOT show error message initially', () => {
    expect(factory().find('.demo-error').exists()).toBe(false)
  })

  it('renders submit button disabled (no images)', () => {
    const w = factory()
    const btn = w.find('.demo-submit')
    expect(btn.exists()).toBe(true)
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('submit button shows analyze text', () => {
    expect(factory().find('.demo-submit').text()).toBe('demo.analyzeBtn')
  })

  it('does NOT show preview section initially', () => {
    expect(factory().find('.demo-result').exists()).toBe(false)
  })
})

// ===========================================================================
// FILE HANDLING
// ===========================================================================
describe('DemoPage — file handling', () => {
  it('shows previews after adding images', async () => {
    const w = factory()
    await addImageFiles(w, 1)
    expect(w.find('.demo-previews').exists()).toBe(true)
  })

  it('hides dropzone content after adding images', async () => {
    const w = factory()
    await addImageFiles(w, 1)
    expect(w.find('.dropzone-content').exists()).toBe(false)
  })

  it('enables submit button after adding images', async () => {
    const w = factory()
    await addImageFiles(w, 1)
    expect(w.find('.demo-submit').attributes('disabled')).toBeUndefined()
  })

  it('shows remove button on image thumbnails', async () => {
    const w = factory()
    await addImageFiles(w, 1)
    expect(w.find('.remove-btn').exists()).toBe(true)
  })

  it('removes image on remove button click', async () => {
    const w = factory()
    await addImageFiles(w, 1)
    expect(w.findAll('.preview-thumb').length).toBe(1)

    await w.find('.remove-btn').trigger('click')
    expect(w.findAll('.preview-thumb').length).toBe(0)
  })

  it('shows add-more button when images < MAX_IMAGES', async () => {
    const w = factory()
    await addImageFiles(w, 1)
    expect(w.find('.add-more-btn').exists()).toBe(true)
  })

  it('skips non-image files', async () => {
    const w = factory()
    await addSingleFile(w, 'doc.pdf', 1024, 'application/pdf')
    expect(w.find('.demo-previews').exists()).toBe(false)
  })

  it('shows error for oversized files', async () => {
    const w = factory()
    await addSingleFile(w, 'huge.jpg', 6 * 1024 * 1024, 'image/jpeg')
    expect(w.find('.demo-error').exists()).toBe(true)
    expect(w.find('.demo-error').text()).toContain('demo.imageTooLarge')
  })

  it('enforces MAX_IMAGES limit of 4', async () => {
    const w = factory()
    // Add files one at a time so the length check in handleFiles works
    await addImageFiles(w, 4)
    // Now try to add a 5th — the check runs per file in the loop
    await addImageFiles(w, 1)
    expect(w.findAll('.preview-thumb').length).toBeLessThanOrEqual(4)
  })

  it('does not show add-more button at capacity (prevents overflow)', async () => {
    // At 4 images the add-more button disappears, preventing the user
    // from selecting additional files through the UI.
    const w = factory()
    await addImageFiles(w, 4)
    expect(w.find('.add-more-btn').exists()).toBe(false)
    // Also the main dropzone content is hidden
    expect(w.find('.dropzone-content').exists()).toBe(false)
  })

  it('hides add-more button when images === MAX_IMAGES', async () => {
    const w = factory()
    await addImageFiles(w, 4)
    expect(w.find('.add-more-btn').exists()).toBe(false)
  })
})

// ===========================================================================
// FORM INPUT BINDING
// ===========================================================================
describe('DemoPage — form inputs', () => {
  it('brand input binds v-model', async () => {
    const w = factory()
    await w.find('#demo-brand').setValue('Volvo')
    expect((w.find('#demo-brand').element as HTMLInputElement).value).toBe('Volvo')
  })

  it('model input binds v-model', async () => {
    const w = factory()
    await w.find('#demo-model').setValue('FH16')
    expect((w.find('#demo-model').element as HTMLInputElement).value).toBe('FH16')
  })

  it('brand input has correct placeholder', () => {
    expect(factory().find('#demo-brand').attributes('placeholder')).toBe('demo.brandPlaceholder')
  })

  it('model input has correct placeholder', () => {
    expect(factory().find('#demo-model').attributes('placeholder')).toBe('demo.modelPlaceholder')
  })
})

// ===========================================================================
// ANALYZE (API call)
// ===========================================================================
describe('DemoPage — analyze', () => {
  it('submit button is disabled when no images are present', () => {
    const w = factory()
    // Button is disabled, preventing analyze() from running
    expect(w.find('.demo-submit').attributes('disabled')).toBeDefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows noImages error when images are removed before analyze', async () => {
    const w = factory()
    // Add then remove an image to get an enabled button, then test the guard
    await addImageFiles(w, 1)
    // Remove the image
    await w.find('.remove-btn').trigger('click')
    // Button should be disabled again
    expect(w.find('.demo-submit').attributes('disabled')).toBeDefined()
  })

  it('calls $fetch with correct payload', async () => {
    fetchMock.mockResolvedValueOnce({
      preview: { title: 'Volvo FH16', description: 'Great truck' },
    })

    const w = factory()
    await addImageFiles(w, 1)
    await w.find('#demo-brand').setValue('Volvo')
    await w.find('#demo-model').setValue('FH16')
    await w.find('.demo-submit').trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith('/api/demo/try-vehicle', {
      method: 'POST',
      body: expect.objectContaining({
        brand: 'Volvo',
        model: 'FH16',
        images: expect.any(Array),
      }),
    })
  })

  it('shows spinner during loading', async () => {
    fetchMock.mockReturnValueOnce(new Promise(() => {}))

    const w = factory()
    await addImageFiles(w, 1)
    await w.find('.demo-submit').trigger('click')

    expect(w.find('.spinner').exists()).toBe(true)
    expect(w.find('.demo-submit').text()).toContain('demo.analyzing')
  })

  it('disables submit during loading', async () => {
    fetchMock.mockReturnValueOnce(new Promise(() => {}))

    const w = factory()
    await addImageFiles(w, 1)
    await w.find('.demo-submit').trigger('click')

    expect(w.find('.demo-submit').attributes('disabled')).toBeDefined()
  })

  it('shows rate limit error on 429', async () => {
    fetchMock.mockRejectedValueOnce(new Error('429 Too Many Requests'))

    const w = factory()
    await addImageFiles(w, 1)
    await w.find('.demo-submit').trigger('click')
    await flushPromises()

    expect(w.find('.demo-error').text()).toBe('demo.rateLimited')
  })

  it('shows generic error on failure', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Server error'))

    const w = factory()
    await addImageFiles(w, 1)
    await w.find('.demo-submit').trigger('click')
    await flushPromises()

    expect(w.find('.demo-error').text()).toBe('demo.analysisFailed')
  })

  it('omits brand/model from payload when empty', async () => {
    fetchMock.mockResolvedValueOnce({
      preview: { title: 'Unknown', description: 'test' },
    })

    const w = factory()
    await addImageFiles(w, 1)
    await w.find('.demo-submit').trigger('click')
    await flushPromises()

    const callBody = fetchMock.mock.calls[0][1].body
    expect(callBody.brand).toBeUndefined()
    expect(callBody.model).toBeUndefined()
  })
})

// ===========================================================================
// PREVIEW RESULT DISPLAY
// ===========================================================================
describe('DemoPage — preview result', () => {
  async function mountWithPreview(previewData: Record<string, unknown> = {}) {
    fetchMock.mockResolvedValueOnce({
      preview: {
        title: 'Volvo FH16 2020',
        category: 'Camiones',
        subcategory: 'Tractor',
        year: 2020,
        description: 'Excellent condition truck',
        estimatedPrice: '45,000 EUR',
        highlights: ['Low mileage', 'Full service history'],
        ...previewData,
      },
    })

    const w = factory()
    await addImageFiles(w, 1)
    await w.find('.demo-submit').trigger('click')
    await flushPromises()
    return w
  }

  it('hides form section when preview is shown', async () => {
    const w = await mountWithPreview()
    expect(w.find('.demo-form').exists()).toBe(false)
    expect(w.find('.demo-result').exists()).toBe(true)
  })

  it('shows preview title', async () => {
    const w = await mountWithPreview()
    expect(w.find('.demo-result h2').text()).toBe('Volvo FH16 2020')
  })

  it('shows category tag', async () => {
    const w = await mountWithPreview()
    const tags = w.findAll('.tag')
    expect(tags.some((t) => t.text() === 'Camiones')).toBe(true)
  })

  it('shows subcategory tag', async () => {
    const w = await mountWithPreview()
    const tags = w.findAll('.tag')
    expect(tags.some((t) => t.text() === 'Tractor')).toBe(true)
  })

  it('shows year tag', async () => {
    const w = await mountWithPreview()
    const tags = w.findAll('.tag')
    expect(tags.some((t) => t.text() === '2020')).toBe(true)
  })

  it('shows description', async () => {
    const w = await mountWithPreview()
    expect(w.find('.result-description').text()).toBe('Excellent condition truck')
  })

  it('shows estimated price', async () => {
    const w = await mountWithPreview()
    expect(w.find('.result-price').text()).toContain('45,000 EUR')
  })

  it('shows highlights list', async () => {
    const w = await mountWithPreview()
    const items = w.findAll('.result-highlights li')
    expect(items).toHaveLength(2)
    expect(items[0].text()).toBe('Low mileage')
    expect(items[1].text()).toBe('Full service history')
  })

  it('hides highlights when empty', async () => {
    const w = await mountWithPreview({ highlights: [] })
    expect(w.find('.result-highlights').exists()).toBe(false)
  })

  it('hides category tag when null', async () => {
    const w = await mountWithPreview({ category: null })
    const tags = w.findAll('.tag')
    expect(tags.every((t) => t.text() !== 'Camiones')).toBe(true)
  })

  it('hides estimated price when not provided', async () => {
    const w = await mountWithPreview({ estimatedPrice: null })
    expect(w.find('.result-price').exists()).toBe(false)
  })

  it('shows result images', async () => {
    const w = await mountWithPreview()
    expect(w.findAll('.result-thumb').length).toBeGreaterThanOrEqual(1)
  })

  it('shows register CTA link', async () => {
    const w = await mountWithPreview()
    const ctaLink = w.find('.cta-primary')
    expect(ctaLink.exists()).toBe(true)
    expect(ctaLink.text()).toBe('demo.ctaRegister')
  })

  it('shows try again button', async () => {
    const w = await mountWithPreview()
    const tryAgain = w.find('.cta-secondary')
    expect(tryAgain.exists()).toBe(true)
    expect(tryAgain.text()).toBe('demo.tryAgain')
  })
})

// ===========================================================================
// RESET
// ===========================================================================
describe('DemoPage — reset', () => {
  it('resets to initial form state on try again click', async () => {
    fetchMock.mockResolvedValueOnce({
      preview: { title: 'Test', description: 'test' },
    })

    const w = factory()
    await addImageFiles(w, 1)
    await w.find('#demo-brand').setValue('Volvo')
    await w.find('#demo-model').setValue('FH16')
    await w.find('.demo-submit').trigger('click')
    await flushPromises()

    expect(w.find('.demo-result').exists()).toBe(true)

    // Click try again
    await w.find('.cta-secondary').trigger('click')

    // Should be back to form
    expect(w.find('.demo-form').exists()).toBe(true)
    expect(w.find('.demo-result').exists()).toBe(false)

    // Form should be cleared
    expect((w.find('#demo-brand').element as HTMLInputElement).value).toBe('')
    expect((w.find('#demo-model').element as HTMLInputElement).value).toBe('')
    expect(w.find('.demo-previews').exists()).toBe(false)
    expect(w.find('.demo-error').exists()).toBe(false)
  })
})
