/**
 * Composable for programmatic confirm modal usage.
 *
 * Usage:
 *   const { confirm, isOpen, modalProps, onConfirm, onClose } = useConfirmModal()
 *
 *   // In your action handler:
 *   const confirmed = await confirm({
 *     title: 'Eliminar vehículo',
 *     message: '¿Estás seguro?',
 *     variant: 'danger',
 *     confirmLabel: 'Eliminar',
 *     requireType: 'borrar',
 *   })
 *   if (confirmed) { /* do the thing *\/ }
 *
 *   // In your template:
 *   <UiConfirmModal v-bind="modalProps" @confirm="onConfirm" @close="onClose" />
 */

interface ConfirmOptions {
  title: string
  message?: string
  variant?: 'danger' | 'warning' | 'info'
  confirmLabel?: string
  cancelLabel?: string
  requireType?: string
}

export function useConfirmModal() {
  const isOpen = ref(false)
  const options = ref<ConfirmOptions>({ title: '' })
  let resolvePromise: ((value: boolean) => void) | null = null

  function confirm(opts: ConfirmOptions): Promise<boolean> {
    options.value = opts
    isOpen.value = true
    return new Promise<boolean>((resolve) => {
      resolvePromise = resolve
    })
  }

  function onConfirm() {
    isOpen.value = false
    resolvePromise?.(true)
    resolvePromise = null
  }

  function onClose() {
    isOpen.value = false
    resolvePromise?.(false)
    resolvePromise = null
  }

  const modalProps = computed(() => ({
    show: isOpen.value,
    title: options.value.title,
    message: options.value.message || '',
    variant: options.value.variant || 'danger' as const,
    confirmLabel: options.value.confirmLabel || '',
    cancelLabel: options.value.cancelLabel || '',
    requireType: options.value.requireType || '',
  }))

  return {
    confirm,
    isOpen: readonly(isOpen),
    modalProps,
    onConfirm,
    onClose,
  }
}
