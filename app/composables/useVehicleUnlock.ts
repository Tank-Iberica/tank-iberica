/**
 * Composable for early-access vehicle unlock (1 credit).
 * Backlog #9 — vehicle_unlocks early access
 */

export function useVehicleUnlock(vehicleId: Ref<string | undefined>) {
  const user = useSupabaseUser()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabaseClient() as any

  const loading = ref(false)
  const error = ref('')
  const unlocked = ref(false)
  const creditsRemaining = ref<number | null>(null)

  /** Check if this user has already unlocked this vehicle */
  async function checkExistingUnlock(): Promise<void> {
    if (!user.value || !vehicleId.value) return
    const { data } = await supabase
      .from('vehicle_unlocks')
      .select('id')
      .eq('user_id', user.value.id)
      .eq('vehicle_id', vehicleId.value)
      .limit(1)
    unlocked.value = Array.isArray(data) && !!data.length
  }

  watch([user, vehicleId], checkExistingUnlock, { immediate: true })

  async function unlock(): Promise<boolean> {
    if (!vehicleId.value) return false
    loading.value = true
    error.value = ''
    try {
      const res = await $fetch<{
        unlocked?: boolean
        alreadyUnlocked?: boolean
        alreadyVisible?: boolean
        creditsRemaining?: number
      }>('/api/credits/unlock-vehicle', {
        method: 'POST',
        headers: { 'x-requested-with': 'XMLHttpRequest' },
        body: { vehicleId: vehicleId.value },
      })
      if (res.unlocked || res.alreadyUnlocked || res.alreadyVisible) {
        unlocked.value = true
        if (typeof res.creditsRemaining === 'number') {
          creditsRemaining.value = res.creditsRemaining
        }
        return true
      }
      return false
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode
      if (status === 402) {
        error.value = 'No tienes créditos suficientes. Consigue más en /precios.'
      } else if (status === 401) {
        navigateTo('/login')
      } else {
        error.value = 'No se pudo desbloquear. Inténtalo de nuevo.'
      }
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    unlocked: readonly(unlocked),
    creditsRemaining: readonly(creditsRemaining),
    unlock,
    checkExistingUnlock,
  }
}
