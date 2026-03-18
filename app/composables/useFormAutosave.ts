/**
 * Generic form autosave composable.
 *
 * Saves form state to localStorage at regular intervals and on beforeunload.
 * On mount, checks for a saved draft and offers restore.
 *
 * Usage:
 *   const { hasDraft, restoreDraft, clearDraft } = useFormAutosave('contrato', form, {
 *     interval: 30_000,  // autosave every 30s (default)
 *     onRestore: () => toast.info('Borrador restaurado')
 *   })
 *   // In template: show "Hay un borrador guardado" banner when hasDraft.value
 */

const STORAGE_PREFIX = 'tracciona_draft_'

export interface FormAutosaveOptions<T> {
  /** Autosave interval in ms. Default: 30_000 (30s) */
  interval?: number
  /** Called after draft is restored */
  onRestore?: (data: T) => void
  /** Transform function before saving (to exclude sensitive data) */
  beforeSave?: (data: T) => Partial<T>
}

/** Auto-saves form data to localStorage as the user types. */
export function useFormAutosave<T extends Record<string, unknown>>(
  key: string,
  form: Ref<T>,
  options: FormAutosaveOptions<T> = {},
) {
  const { interval = 30_000, onRestore, beforeSave } = options
  const storageKey = `${STORAGE_PREFIX}${key}`

  const hasDraft = ref(false)
  let intervalId: ReturnType<typeof setInterval> | null = null

  function saveDraft(): void {
    if (!import.meta.client) return
    try {
      const data = beforeSave ? beforeSave(form.value) : form.value
      const entry = { data, savedAt: Date.now() }
      localStorage.setItem(storageKey, JSON.stringify(entry))
    } catch {
      // Quota exceeded or serialization error — fail silently
    }
  }

  function loadDraft(): T | null {
    if (!import.meta.client) return null
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return null
      const entry = JSON.parse(raw) as { data: T; savedAt: number }
      return entry.data
    } catch {
      return null
    }
  }

  function restoreDraft(): void {
    const data = loadDraft()
    if (!data) return
    form.value = { ...form.value, ...data }
    hasDraft.value = false
    onRestore?.(data)
    clearDraft()
  }

  function clearDraft(): void {
    if (!import.meta.client) return
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // ignore
    }
    hasDraft.value = false
  }

  function draftSavedAt(): Date | null {
    if (!import.meta.client) return null
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return null
      const entry = JSON.parse(raw) as { data: T; savedAt: number }
      return new Date(entry.savedAt)
    } catch {
      return null
    }
  }

  onMounted(() => {
    // Check for existing draft
    const draft = loadDraft()
    if (draft) {
      hasDraft.value = true
    }

    // Start autosave interval
    intervalId = setInterval(saveDraft, interval)

    // Save on page unload
    window.addEventListener('beforeunload', saveDraft)
  })

  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId)
    }
    window.removeEventListener('beforeunload', saveDraft)
  })

  return {
    hasDraft,
    saveDraft,
    restoreDraft,
    clearDraft,
    draftSavedAt,
  }
}
