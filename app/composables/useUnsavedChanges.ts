/**
 * Composable to warn users before leaving a page with unsaved changes.
 *
 * Usage:
 *   const { markDirty, markClean } = useUnsavedChanges()
 *   // Call markDirty() when form data changes
 *   // Call markClean() after successful save
 */
export function useUnsavedChanges() {
  const isDirty = ref(false)

  function onBeforeUnload(e: BeforeUnloadEvent) {
    if (!isDirty.value) return
    e.preventDefault()
  }

  onMounted(() => {
    window.addEventListener('beforeunload', onBeforeUnload)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', onBeforeUnload)
  })

  function markDirty() {
    isDirty.value = true
  }

  function markClean() {
    isDirty.value = false
  }

  return { isDirty: readonly(isDirty), markDirty, markClean }
}
