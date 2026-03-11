/**
 * Locks body scroll while a modal/overlay is open.
 * Automatically restores scroll on unmount.
 *
 * Usage: useScrollLock(toRef(props, 'show'))
 */
export function useScrollLock(active: Ref<boolean>) {
  watchEffect(() => {
    if (import.meta.server) return
    document.body.style.overflow = active.value ? 'hidden' : ''
  })

  onUnmounted(() => {
    if (import.meta.client) {
      document.body.style.overflow = ''
    }
  })
}
