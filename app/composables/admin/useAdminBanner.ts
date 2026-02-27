/**
 * Admin Banner Page Composable
 * Manages all state and logic for the admin banner configuration page.
 */
import { useAdminConfig, type BannerConfig } from '~/composables/admin/useAdminConfig'
import { useToast } from '~/composables/useToast'

export type { BannerConfig }

export interface EmojiCategory {
  name: string
  emojis: string[]
}

export interface UserPanelBannerForm {
  text_es: string
  text_en: string
  url: string
  active: boolean
  from_date: string | null
  to_date: string | null
}

export type BannerLang = 'es' | 'en'

const emojiCategories: EmojiCategory[] = [
  {
    name: 'Vehiculos y Transporte',
    emojis: [
      '\u{1F69A}',
      '\u{1F69B}',
      '\u{1F690}',
      '\u{1F68C}',
      '\u{1F68D}',
      '\u{1F68E}',
      '\u{1F697}',
      '\u{1F695}',
      '\u{1F3CE}\uFE0F',
      '\u{1F69C}',
    ],
  },
  {
    name: 'Maquinaria y Logistica',
    emojis: [
      '\u{1F3D7}\uFE0F',
      '\u2699\uFE0F',
      '\u{1F527}',
      '\u{1F529}',
      '\u{1F6E0}\uFE0F',
      '\u26FD',
      '\u{1F6E2}\uFE0F',
      '\u{1F4E6}',
      '\u{1F3ED}',
      '\u{1F6A7}',
    ],
  },
  {
    name: 'Trafico y Senales',
    emojis: [
      '\u{1F6A6}',
      '\u{1F6A5}',
      '\u{1F6D1}',
      '\u26D4',
      '\u{1F6AB}',
      '\u{1F6E3}\uFE0F',
      '\u{1F6E4}\uFE0F',
      '\u{1F5FA}\uFE0F',
      '\u{1F9ED}',
      '\u{1F4CD}',
    ],
  },
  {
    name: 'Leyes y Documentos',
    emojis: [
      '\u{1F4CB}',
      '\u{1F4C4}',
      '\u{1F4DD}',
      '\u{1F4D1}',
      '\u{1F5C2}\uFE0F',
      '\u2696\uFE0F',
      '\u{1F3DB}\uFE0F',
      '\u{1F4DC}',
      '\u270D\uFE0F',
      '\u{1F50F}',
    ],
  },
  {
    name: 'Alertas y Actualizaciones',
    emojis: [
      '\u{1F514}',
      '\u{1F4E2}',
      '\u{1F4E3}',
      '\u26A0\uFE0F',
      '\u{1F6A8}',
      '\u2757',
      '\u2753',
      '\u2139\uFE0F',
      '\u{1F195}',
      '\u{1F199}',
    ],
  },
  {
    name: 'Dinero y Negocios',
    emojis: [
      '\u{1F4B0}',
      '\u{1F4B5}',
      '\u{1F4B6}',
      '\u{1F4B3}',
      '\u{1F3F7}\uFE0F',
      '\u{1F91D}',
      '\u{1F4C8}',
      '\u{1F4C9}',
      '\u{1F4B9}',
      '\u{1F3AF}',
    ],
  },
  {
    name: 'Celebracion y Positivos',
    emojis: [
      '\u2705',
      '\u2728',
      '\u{1F389}',
      '\u{1F38A}',
      '\u{1F3C6}',
      '\u2B50',
      '\u{1F31F}',
      '\u{1F4AF}',
      '\u{1F525}',
      '\u{1F4AA}',
    ],
  },
  {
    name: 'Internacional',
    emojis: [
      '\u{1F30D}',
      '\u{1F30E}',
      '\u{1F30F}',
      '\u{1F1EA}\u{1F1F8}',
      '\u{1F1EC}\u{1F1E7}',
      '\u{1F1EA}\u{1F1FA}',
      '\u{1F1EB}\u{1F1F7}',
      '\u{1F1E9}\u{1F1EA}',
      '\u{1F1EE}\u{1F1F9}',
      '\u{1F1F5}\u{1F1F9}',
    ],
  },
  {
    name: 'Tiempo y Calendario',
    emojis: [
      '\u{1F4C5}',
      '\u{1F4C6}',
      '\u{1F5D3}\uFE0F',
      '\u23F0',
      '\u23F3',
      '\u{1F550}',
      '\u{1F4DE}',
      '\u{1F4E7}',
      '\u{1F4A1}',
      '\u{1F381}',
    ],
  },
]

const quickEmojis: string[] = [
  '\u{1F514}',
  '\u{1F4E2}',
  '\u26A0\uFE0F',
  '\u{1F389}',
  '\u{1F69B}',
  '\u2705',
]

export function useAdminBanner() {
  const toast = useToast()
  const { loading, saving, error, banner, fetchBanner, saveBanner, getBannerPreviewHtml } =
    useAdminConfig()

  // Form state
  const formData = ref<BannerConfig>({
    text_es: '',
    text_en: '',
    url: null,
    from_date: null,
    to_date: null,
    active: false,
  })

  // Preview state
  const showPreview = ref(false)
  const previewLang = ref<BannerLang>('es')

  // Emoji picker state
  const showEmojiPicker = ref(false)
  const emojiPickerTarget = ref<BannerLang | null>(null)

  // User panel banner state
  const userPanelForm = ref<UserPanelBannerForm>({
    text_es: '',
    text_en: '',
    url: '',
    active: false,
    from_date: null,
    to_date: null,
  })
  const userPanelSaving = ref(false)

  // --- Init (replaces onMounted) ---
  async function init() {
    await fetchBanner()
    formData.value = { ...banner.value }
    await fetchUserPanelBanner()
  }

  // --- Watch banner changes ---
  watch(
    banner,
    (newBanner) => {
      if (!saving.value) {
        formData.value = { ...newBanner }
      }
    },
    { deep: true },
  )

  // --- User panel banner ---
  async function fetchUserPanelBanner() {
    const supabase = useSupabaseClient()
    const { data } = await (supabase
      .from('config')
      .select('value')
      .eq('key', 'user_panel_banner')
      .single() as never as Promise<{ data: { value: unknown } | null }>)
    if (data?.value) {
      const config =
        typeof data.value === 'string'
          ? (JSON.parse(data.value) as UserPanelBannerForm)
          : (data.value as UserPanelBannerForm)
      Object.assign(userPanelForm.value, config)
    }
  }

  async function saveUserPanelBanner() {
    userPanelSaving.value = true
    try {
      const supabase = useSupabaseClient()
      await (supabase
        .from('config')
        .upsert({
          key: 'user_panel_banner',
          value: userPanelForm.value,
        }) as never as Promise<unknown>)
      toast.success('admin.banner.saved')
    } catch {
      toast.error('admin.banner.saveError')
    } finally {
      userPanelSaving.value = false
    }
  }

  // --- Main banner save ---
  async function handleSave() {
    const success = await saveBanner(formData.value)
    if (success) {
      toast.success('toast.bannerSaved')
    }
  }

  // --- Preview ---
  function togglePreview() {
    showPreview.value = !showPreview.value
  }

  // --- Emoji picker ---
  function openEmojiPicker(target: BannerLang) {
    emojiPickerTarget.value = target
    showEmojiPicker.value = true
  }

  function closeEmojiPicker() {
    showEmojiPicker.value = false
    emojiPickerTarget.value = null
  }

  function insertEmoji(emoji: string, target?: BannerLang) {
    const fieldTarget = target || emojiPickerTarget.value
    if (!fieldTarget) return

    const fieldId = fieldTarget === 'es' ? 'bannerEs' : 'bannerEn'
    const input = document.getElementById(fieldId) as HTMLInputElement | null
    if (!input) return

    const start = input.selectionStart || 0
    const end = input.selectionEnd || 0
    const fieldKey: 'text_es' | 'text_en' = fieldTarget === 'es' ? 'text_es' : 'text_en'
    const currentValue = formData.value[fieldKey] || ''

    formData.value[fieldKey] = currentValue.slice(0, start) + emoji + currentValue.slice(end)

    if (showEmojiPicker.value) {
      closeEmojiPicker()
    }

    nextTick(() => {
      input.focus()
      input.setSelectionRange(start + emoji.length, start + emoji.length)
    })
  }

  // --- Date formatting utilities ---
  function formatDatetimeLocal(dateStr: string | null): string {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toISOString().slice(0, 16)
  }

  function parseDatetimeLocal(value: string): string | null {
    if (!value) return null
    return new Date(value).toISOString()
  }

  // --- Form field updater ---
  function updateFormField(key: keyof BannerConfig, value: string | boolean | null) {
    if (key === 'active') {
      formData.value[key] = value as boolean
    } else {
      formData.value[key] = value as string | null
    }
  }

  // --- User panel field updater ---
  function updateUserPanelField(key: keyof UserPanelBannerForm, value: string | boolean | null) {
    if (key === 'active') {
      ;(userPanelForm.value as Record<string, unknown>)[key] = value as boolean
    } else {
      ;(userPanelForm.value as Record<string, unknown>)[key] = value
    }
  }

  // --- Computed ---
  const previewHtml = computed(() => {
    return getBannerPreviewHtml(previewLang.value)
  })

  const statusText = computed(() => {
    if (!formData.value.active) return 'Banner desactivado'
    if (!formData.value.text_es && !formData.value.text_en) return 'Sin texto configurado'

    const now = new Date()

    if (formData.value.from_date) {
      const fromDate = new Date(formData.value.from_date)
      if (now < fromDate) {
        return `Programado para: ${fromDate.toLocaleDateString('es-ES')} ${fromDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
      }
    }

    if (formData.value.to_date) {
      const toDate = new Date(formData.value.to_date)
      if (now > toDate) {
        return 'Periodo expirado'
      }
      return `Activo hasta: ${toDate.toLocaleDateString('es-ES')} ${toDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
    }

    return 'Activo ahora'
  })

  const statusClass = computed(() => {
    if (!formData.value.active) return 'status-inactive'
    if (!formData.value.text_es && !formData.value.text_en) return 'status-inactive'

    const now = new Date()

    if (formData.value.from_date && now < new Date(formData.value.from_date)) {
      return 'status-scheduled'
    }

    if (formData.value.to_date && now > new Date(formData.value.to_date)) {
      return 'status-expired'
    }

    return 'status-active'
  })

  return {
    // State
    formData,
    showPreview,
    previewLang,
    showEmojiPicker,
    emojiPickerTarget,
    userPanelForm,
    userPanelSaving,

    // Constants
    emojiCategories,
    quickEmojis,

    // From useAdminConfig
    loading,
    saving,
    error,

    // Computed
    previewHtml,
    statusText,
    statusClass,

    // Actions
    init,
    handleSave,
    togglePreview,
    openEmojiPicker,
    closeEmojiPicker,
    insertEmoji,
    formatDatetimeLocal,
    parseDatetimeLocal,
    updateFormField,
    updateUserPanelField,
    saveUserPanelBanner,
  }
}
