/**
 * Admin News Create Composable
 * Extracts all form logic for the news article creation page (nuevo.vue)
 */
import { useAdminNews, type NewsFormData } from '~/composables/admin/useAdminNews'
import { useSeoScore, type SeoInput } from '~/composables/admin/useSeoScore'
import { useCloudinaryUpload } from '~/composables/admin/useCloudinaryUpload'
import { slugify } from '~/utils/fileNaming'

export type { NewsFormData }

export interface CreateSections {
  english: boolean
  seoPanel: boolean
  faq: boolean
  social: boolean
}

export function useAdminNewsCreate() {
  const router = useRouter()

  const { saving, error, createNews } = useAdminNews()
  const {
    upload: uploadToCloudinary,
    uploading: uploadingImage,
    progress: uploadProgress,
    error: uploadError,
  } = useCloudinaryUpload()

  // Form data
  const formData = ref<NewsFormData>({
    title_es: '',
    title_en: null,
    slug: '',
    category: 'general',
    image_url: null,
    description_es: null,
    description_en: null,
    content_es: '',
    content_en: null,
    hashtags: [],
    status: 'draft',
    published_at: null,
    section: 'noticias',
    faq_schema: null,
    excerpt_es: null,
    excerpt_en: null,
    scheduled_at: null,
    social_post_text: null,
    related_categories: null,
    target_markets: null,
  })

  // Hashtag input
  const hashtagInput = ref('')

  // Related category input
  const relatedCategoryInput = ref('')

  // Collapsible sections
  const sections = reactive<CreateSections>({
    english: false,
    seoPanel: true,
    faq: false,
    social: false,
  })

  // SEO scoring
  const seoInput = computed<SeoInput>(() => ({
    title_es: formData.value.title_es,
    title_en: formData.value.title_en,
    slug: formData.value.slug,
    description_es: formData.value.description_es,
    content_es: formData.value.content_es,
    content_en: formData.value.content_en,
    image_url: formData.value.image_url,
    hashtags: formData.value.hashtags,
    faq_schema: formData.value.faq_schema,
    excerpt_es: formData.value.excerpt_es,
    related_categories: formData.value.related_categories,
    social_post_text: formData.value.social_post_text,
    section: formData.value.section,
  }))

  const { analysis } = useSeoScore(seoInput)

  // Auto-generate slug from title
  let previousAutoSlug = ''

  function generateSlugFromTitle(title: string): string {
    return slugify(title)
  }

  watch(
    () => formData.value.title_es,
    (title) => {
      if (!formData.value.slug || formData.value.slug === previousAutoSlug) {
        formData.value.slug = generateSlugFromTitle(title)
        previousAutoSlug = formData.value.slug
      }
    },
  )

  // Validation
  const isValid = computed(
    () =>
      formData.value.title_es.trim().length > 0 &&
      formData.value.content_es.trim().length > 0 &&
      formData.value.slug.trim().length > 0,
  )

  // Character counts
  const titleLengthClass = computed(() => {
    const len = formData.value.title_es.length
    if (len >= 30 && len <= 60) return 'count-good'
    if (len >= 20 && len <= 70) return 'count-warning'
    return len > 0 ? 'count-bad' : ''
  })

  const descLengthClass = computed(() => {
    const len = (formData.value.description_es || '').length
    if (len >= 120 && len <= 160) return 'count-good'
    if (len >= 80 && len <= 200) return 'count-warning'
    return len > 0 ? 'count-bad' : ''
  })

  // Word counter for content
  const contentWordCount = computed(() => {
    const text = formData.value.content_es.trim()
    if (!text) return 0
    return text.split(/\s+/).filter((w) => w.length > 0).length
  })

  const wordCountClass = computed(() => {
    if (contentWordCount.value >= 300) return 'count-good'
    if (contentWordCount.value >= 150) return 'count-warning'
    return contentWordCount.value > 0 ? 'count-bad' : ''
  })

  // Excerpt length class
  const excerptLengthClass = computed(() => {
    const len = (formData.value.excerpt_es || '').length
    if (len >= 120 && len <= 200) return 'count-good'
    if (len >= 80 && len <= 250) return 'count-warning'
    return len > 0 ? 'count-bad' : ''
  })

  // FAQ management
  function addFaqItem() {
    const current = formData.value.faq_schema || []
    formData.value.faq_schema = [...current, { question: '', answer: '' }]
  }

  function removeFaqItem(index: number) {
    if (!formData.value.faq_schema) return
    formData.value.faq_schema = formData.value.faq_schema.filter((_, i) => i !== index)
    if (formData.value.faq_schema.length === 0) formData.value.faq_schema = null
  }

  // Related categories management
  function addRelatedCategory() {
    const cat = relatedCategoryInput.value.trim().toLowerCase()
    if (!cat) return
    const current = formData.value.related_categories || []
    if (!current.includes(cat)) {
      formData.value.related_categories = [...current, cat]
    }
    relatedCategoryInput.value = ''
  }

  function removeRelatedCategory(cat: string) {
    if (!formData.value.related_categories) return
    formData.value.related_categories = formData.value.related_categories.filter((c) => c !== cat)
    if (formData.value.related_categories.length === 0) formData.value.related_categories = null
  }

  // Image upload
  const imagePreviewUrl = ref<string | null>(null)

  async function handleImageFile(e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files?.length) return

    const file = input.files[0] as File
    imagePreviewUrl.value = URL.createObjectURL(file as Blob)

    const result = await uploadToCloudinary(file)
    if (result) {
      formData.value.image_url = result.secure_url
    }

    input.value = ''
  }

  function removeImage() {
    formData.value.image_url = null
    if (imagePreviewUrl.value) {
      URL.revokeObjectURL(imagePreviewUrl.value)
      imagePreviewUrl.value = null
    }
  }

  // Save
  async function handleSave() {
    if (!isValid.value) return
    const id = await createNews(formData.value)
    if (id) router.push('/admin/noticias')
  }

  function handleCancel() {
    router.push('/admin/noticias')
  }

  // Hashtag management
  function addHashtag() {
    const tag = hashtagInput.value.trim().replace(/^#/, '').toLowerCase()
    if (!tag) return
    if (!formData.value.hashtags.includes(tag)) {
      formData.value.hashtags = [...formData.value.hashtags, tag]
    }
    hashtagInput.value = ''
  }

  function removeHashtag(tag: string) {
    formData.value.hashtags = formData.value.hashtags.filter((t) => t !== tag)
  }

  // SEO level labels
  function getLevelLabel(level: string): string {
    switch (level) {
      case 'good':
        return 'Bueno'
      case 'warning':
        return 'Mejorable'
      case 'bad':
        return 'Necesita trabajo'
      default:
        return ''
    }
  }

  return {
    // State
    saving,
    error,
    formData,
    hashtagInput,
    relatedCategoryInput,
    sections,
    analysis,
    isValid,
    imagePreviewUrl,
    uploadingImage,
    uploadProgress,
    uploadError,

    // Computed
    titleLengthClass,
    descLengthClass,
    contentWordCount,
    wordCountClass,
    excerptLengthClass,

    // Methods
    addFaqItem,
    removeFaqItem,
    addRelatedCategory,
    removeRelatedCategory,
    addHashtag,
    removeHashtag,
    handleImageFile,
    removeImage,
    handleSave,
    handleCancel,
    getLevelLabel,
  }
}
