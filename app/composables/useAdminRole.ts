export function useAdminRole() {
  const supabase = useSupabaseClient()
  const isAdmin = useState<boolean | null>('admin-role', () => null)
  const lastChecked = useState<number>('admin-role-checked', () => 0)
  const TTL = 5 * 60 * 1000 // 5 minutes

  async function checkAdmin(userId: string): Promise<boolean> {
    const now = Date.now()
    if (isAdmin.value !== null && now - lastChecked.value < TTL) {
      return isAdmin.value
    }

    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single<{ role: string }>()

    if (error || data?.role !== 'admin') {
      isAdmin.value = false
    } else {
      isAdmin.value = true
    }
    lastChecked.value = now
    return isAdmin.value
  }

  function clearCache() {
    isAdmin.value = null
    lastChecked.value = 0
  }

  return { isAdmin, checkAdmin, clearCache }
}
