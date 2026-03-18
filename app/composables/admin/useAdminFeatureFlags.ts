/**
 * Admin composable for managing feature flags with per-vertical support.
 */

interface FeatureFlag {
  key: string
  enabled: boolean
  description: string | null
  percentage: number
  allowed_dealers: string[] | null
  vertical: string | null
  created_at: string
  updated_at: string
}

/** Composable for admin feature flags. */
export function useAdminFeatureFlags() {
  const client = useSupabaseClient()
  const flags = ref<FeatureFlag[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const saved = ref(false)

  async function loadFlags() {
    loading.value = true
    error.value = ''
    try {
      const { data, error: err } = await client
        .from('feature_flags')
        .select(
          'key, enabled, description, percentage, allowed_dealers, vertical, created_at, updated_at',
        )
        .order('key')

      if (err) throw err
      flags.value = (data as FeatureFlag[]) ?? []
    } catch (e) {
      error.value = String(e)
    } finally {
      loading.value = false
    }
  }

  async function toggleFlag(key: string, vertical: string | null, enabled: boolean) {
    saving.value = true
    error.value = ''
    saved.value = false
    try {
      let query = client
        .from('feature_flags')
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq('key', key)

      if (vertical) {
        query = query.eq('vertical', vertical)
      } else {
        query = query.is('vertical', null)
      }

      const { error: err } = await query
      if (err) throw err

      // Update local state
      const flag = flags.value.find((f) => f.key === key && f.vertical === vertical)
      if (flag) flag.enabled = enabled
      saved.value = true
    } catch (e) {
      error.value = String(e)
    } finally {
      saving.value = false
    }
  }

  async function updateFlag(
    key: string,
    vertical: string | null,
    updates: Partial<
      Pick<FeatureFlag, 'enabled' | 'description' | 'percentage' | 'allowed_dealers'>
    >,
  ) {
    saving.value = true
    error.value = ''
    saved.value = false
    try {
      let query = client
        .from('feature_flags')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('key', key)

      if (vertical) {
        query = query.eq('vertical', vertical)
      } else {
        query = query.is('vertical', null)
      }

      const { error: err } = await query
      if (err) throw err

      await loadFlags()
      saved.value = true
    } catch (e) {
      error.value = String(e)
    } finally {
      saving.value = false
    }
  }

  async function createFlag(flag: {
    key: string
    enabled: boolean
    description: string
    percentage: number
    vertical: string | null
  }) {
    saving.value = true
    error.value = ''
    saved.value = false
    try {
      const { error: err } = await client.from('feature_flags').insert({
        key: flag.key,
        enabled: flag.enabled,
        description: flag.description,
        percentage: flag.percentage,
        vertical: flag.vertical,
      })

      if (err) throw err
      await loadFlags()
      saved.value = true
    } catch (e) {
      error.value = String(e)
    } finally {
      saving.value = false
    }
  }

  async function deleteFlag(key: string, vertical: string | null) {
    saving.value = true
    error.value = ''
    try {
      let query = client.from('feature_flags').delete().eq('key', key)

      if (vertical) {
        query = query.eq('vertical', vertical)
      } else {
        query = query.is('vertical', null)
      }

      const { error: err } = await query
      if (err) throw err

      flags.value = flags.value.filter((f) => !(f.key === key && f.vertical === vertical))
    } catch (e) {
      error.value = String(e)
    } finally {
      saving.value = false
    }
  }

  // Computed: group flags by key (global + per-vertical overrides)
  const groupedFlags = computed(() => {
    const groups = new Map<string, { global: FeatureFlag | null; overrides: FeatureFlag[] }>()

    for (const flag of flags.value) {
      if (!groups.has(flag.key)) {
        groups.set(flag.key, { global: null, overrides: [] })
      }
      const group = groups.get(flag.key)!
      if (flag.vertical) {
        group.overrides.push(flag)
      } else {
        group.global = flag
      }
    }

    return groups
  })

  return {
    flags,
    groupedFlags,
    loading,
    saving,
    error,
    saved,
    loadFlags,
    toggleFlag,
    updateFlag,
    createFlag,
    deleteFlag,
  }
}
