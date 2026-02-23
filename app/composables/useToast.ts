/**
 * useToast - Simple toast notification composable
 *
 * Provides a reactive toast notification system using Nuxt's
 * built-in state management. Supports success, error, warning, and info types.
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: number
  message: string
  type: ToastType
  duration?: number
}

const toasts = ref<Toast[]>([])
let toastIdCounter = 0

export function useToast() {
  const { t } = useI18n()

  /**
   * Show a toast notification
   * @param message - The message to display (can be an i18n key)
   * @param type - The type of toast (success, error, warning, info)
   * @param duration - How long to show the toast in ms (default: 5000)
   */
  function show(message: string, type: ToastType = 'info', duration = 5000) {
    const id = ++toastIdCounter

    // Try to translate the message if it's an i18n key
    const translatedMessage = t(message, message)

    const toast: Toast = {
      id,
      message: translatedMessage,
      type,
      duration,
    }

    toasts.value.push(toast)

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }
  }

  /**
   * Remove a toast by ID
   */
  function remove(id: number) {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  /**
   * Clear all toasts
   */
  function clear() {
    toasts.value = []
  }

  /**
   * Convenience methods for different toast types
   */
  function success(message: string, duration?: number) {
    show(message, 'success', duration)
  }

  function error(message: string, duration?: number) {
    show(message, 'error', duration)
  }

  function warning(message: string, duration?: number) {
    show(message, 'warning', duration)
  }

  function info(message: string, duration?: number) {
    show(message, 'info', duration)
  }

  return {
    toasts: readonly(toasts),
    show,
    remove,
    clear,
    success,
    error,
    warning,
    info,
  }
}
