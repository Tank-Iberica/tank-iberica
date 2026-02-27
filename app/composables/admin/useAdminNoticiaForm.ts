/**
 * Admin Noticia Form Composable
 * Extracts all form logic for the news article editor page.
 * Exposes init() instead of calling onMounted internally.
 */
import { useAdminNews, type NewsFormData } from '~/composables/admin/useAdminNews'
import { useSeoScore, type SeoInput } from '~/composables/admin/useSeoScore'
import { useCloudinaryUpload } from '~/composables/admin/useCloudinaryUpload'
import type { News } from '~/composables/useNews'

export interface NoticiaFormSections {
  english: boolean
  seoPanel: boolean
  info: boolean
  faq: boolean
  social: boolean
}

export function useAdminNoticiaForm(newsId: Ref<string>) {
  const router = useRouter()

  const { loading, saving, error, fetchById, updateNews, deleteNews } = useAdminNews()
  const {
    upload: uploadToCloudinary,
    uploading: uploadingImage,
    progress: uploadProgress,
    error: uploadError,
  } = useCloudinaryUpload()

  // Original article data
  const article = ref<News | null>(null)

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
  const sections = reactive<NoticiaFormSections>({
    english: false,
    seoPanel: true,
    info: false,
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

  // Validation
  const isValid = computed(
    () =>
      formData.value.title_es.trim().length > 0 &&
      formData.value.content_es.trim().length > 0 &&
      formData.value.slug.trim().length > 0,
  )

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

  // Delete modal
  const deleteModal = ref(false)
  const deleteConfirmText = ref('')

  function openDeleteModal() {
    deleteConfirmText.value = ''
    deleteModal.value = true
  }

  function closeDeleteModal() {
    deleteModal.value = false
    deleteConfirmText.value = ''
  }

  async function executeDelete() {
    if (deleteConfirmText.value !== 'borrar') return
    const ok = await deleteNews(newsId.value)
    if (ok) router.push('/admin/noticias')
    closeDeleteModal()
  }

  // Save
  async function handleSave() {
    if (!isValid.value) return
    const ok = await updateNews(newsId.value, formData.value)
    if (ok) router.push('/admin/noticias')
  }

  function handleCancel() {
    router.push('/admin/noticias')
  }

  // Format date
  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '\u2014'
    return new Date(dateStr).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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

  // Init function — replaces onMounted
  async function init() {
    const data = await fetchById(newsId.value)
    if (!data) {
      router.push('/admin/noticias')
      return
    }
    article.value = data
    const raw = data as unknown as Record<string, unknown>
    formData.value = {
      title_es: data.title_es,
      title_en: data.title_en,
      slug: data.slug,
      category: data.category,
      image_url: data.image_url,
      description_es: data.description_es || null,
      description_en: data.description_en || null,
      content_es: data.content_es,
      content_en: data.content_en,
      hashtags: data.hashtags || [],
      status: data.status,
      published_at: data.published_at,
      section: (raw.section as string) || 'noticias',
      faq_schema: (raw.faq_schema as Array<{ question: string; answer: string }>) || null,
      excerpt_es: (raw.excerpt_es as string) || null,
      excerpt_en: (raw.excerpt_en as string) || null,
      scheduled_at: (raw.scheduled_at as string) || null,
      social_post_text: (raw.social_post_text as Record<string, string>) || null,
      related_categories: (raw.related_categories as string[]) || null,
      target_markets: (raw.target_markets as string[]) || null,
    }

    // Open English section if content exists
    if (data.title_en || data.content_en) {
      sections.english = true
    }

    // Open FAQ section if FAQ data exists
    if (formData.value.faq_schema && formData.value.faq_schema.length > 0) {
      sections.faq = true
    }

    // Open social section if social data exists
    if (
      formData.value.social_post_text &&
      Object.keys(formData.value.social_post_text).length > 0
    ) {
      sections.social = true
    }
  }

  return {
    // State
    loading,
    saving,
    error,
    article,
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
    deleteModal,
    deleteConfirmText,

    // Computed
    titleLengthClass,
    descLengthClass,
    contentWordCount,
    wordCountClass,
    excerptLengthClass,

    // Methods
    init,
    addFaqItem,
    removeFaqItem,
    addRelatedCategory,
    removeRelatedCategory,
    addHashtag,
    removeHashtag,
    handleImageFile,
    removeImage,
    openDeleteModal,
    closeDeleteModal,
    executeDelete,
    handleSave,
    handleCancel,
    formatDate,
    getLevelLabel,
  }
}
