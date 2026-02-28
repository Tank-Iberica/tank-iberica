export interface SearchAlert {
  id: string
  filters: Record<string, unknown>
  frequency: 'instant' | 'daily' | 'weekly'
  active: boolean
  created_at: string
}

export interface AlertEditForm {
  frequency: string
  filters: Record<string, unknown>
}

export function usePerfilAlertas() {
  const { t } = useI18n()
  const supabase = useSupabaseClient()
  const { userId } = useAuth()

  const alerts = ref<SearchAlert[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)
  const editingAlert = ref<SearchAlert | null>(null)
  const editForm = ref<AlertEditForm>({ frequency: 'daily', filters: {} })

  async function loadAlerts() {
    if (!userId.value) return
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('search_alerts')
        .select('id, filters, frequency, active, created_at')
        .eq('user_id', userId.value)
        .order('created_at', { ascending: false })
      if (err) throw err
      alerts.value = (data ?? []) as SearchAlert[]
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading alerts'
    } finally {
      loading.value = false
    }
  }

  async function toggleActive(alert: SearchAlert) {
    const newValue = !alert.active
    try {
      const { error: err } = await supabase
        .from('search_alerts')
        .update({ active: newValue } as never)
        .eq('id', alert.id)
      if (err) throw err
      alert.active = newValue
    } catch {
      // revert on failure — silent
    }
  }

  async function deleteAlert(alertId: string) {
    try {
      const { error: err } = await supabase.from('search_alerts').delete().eq('id', alertId)
      if (err) throw err
      alerts.value = alerts.value.filter((a) => a.id !== alertId)
    } catch {
      // silent fail
    }
  }

  function filterSummary(filters: Record<string, unknown>): string {
    const parts: string[] = []
    if (filters.brand) parts.push(String(filters.brand))
    if (filters.model) parts.push(String(filters.model))
    if (filters.category) parts.push(String(filters.category))
    if (filters.price_min || filters.price_max) {
      const min = filters.price_min ? `${Number(filters.price_min).toLocaleString()}` : '0'
      const max = filters.price_max ? `${Number(filters.price_max).toLocaleString()}` : '...'
      parts.push(`${min} - ${max} \u20AC`)
    }
    if (filters.year_min || filters.year_max) {
      parts.push(`${filters.year_min ?? '...'} - ${filters.year_max ?? '...'}`)
    }
    return parts.length > 0 ? parts.join(' \u00B7 ') : t('profile.alerts.noFilters')
  }

  function frequencyLabel(frequency: string): string {
    return t(`profile.alerts.freq_${frequency}`)
  }

  function openEdit(alert: SearchAlert) {
    editingAlert.value = alert
    editForm.value = { frequency: alert.frequency, filters: { ...alert.filters } }
  }

  function closeEdit() {
    editingAlert.value = null
  }

  function updateEditField(field: string, value: string) {
    if (field === 'frequency') {
      editForm.value.frequency = value
    } else {
      editForm.value.filters[field] =
        value === ''
          ? undefined
          : ['price_min', 'price_max', 'year_min', 'year_max'].includes(field)
            ? Number(value)
            : value
    }
  }

  async function saveEdit() {
    if (!editingAlert.value) return
    try {
      const { error: err } = await supabase
        .from('search_alerts')
        .update({
          frequency: editForm.value.frequency,
          filters: editForm.value.filters,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', editingAlert.value.id)
      if (err) throw err
      const idx = alerts.value.findIndex((a) => a.id === editingAlert.value!.id)
      if (idx !== -1) {
        alerts.value[idx].frequency = editForm.value.frequency as SearchAlert['frequency']
        alerts.value[idx].filters = { ...editForm.value.filters }
      }
      editingAlert.value = null
    } catch {
      // silent fail
    }
  }

  return {
    alerts,
    loading,
    error,
    editingAlert,
    editForm,
    loadAlerts,
    toggleActive,
    deleteAlert,
    filterSummary,
    frequencyLabel,
    openEdit,
    closeEdit,
    updateEditField,
    saveEdit,
  }
}
