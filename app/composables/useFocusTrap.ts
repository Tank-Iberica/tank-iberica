/**
 * useFocusTrap — Traps focus within a container element.
 * Tab cycles through focusable elements; Shift+Tab goes backwards.
 * Restores focus to the previously focused element on deactivation.
 *
 * Usage:
 *   const { activate, deactivate } = useFocusTrap()
 *   // When modal opens: activate(modalRef.value)
 *   // When modal closes: deactivate()
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function useFocusTrap() {
  let container: HTMLElement | null = null
  let previouslyFocused: HTMLElement | null = null
  let onKeyDown: ((e: KeyboardEvent) => void) | null = null

  function getFocusableElements(): HTMLElement[] {
    if (!container) return []
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return

    const focusable = getFocusableElements()
    if (focusable.length === 0) {
      e.preventDefault()
      return
    }

    const first = focusable[0]!
    const last = focusable.at(-1)!

    if (e.shiftKey) {
      // Shift+Tab: if on first element, wrap to last
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else if (document.activeElement === last) {
      // Tab: if on last element, wrap to first
      e.preventDefault()
      first.focus()
    }
  }

  function activate(el: HTMLElement | null) {
    if (!el) return
    container = el
    previouslyFocused = document.activeElement as HTMLElement | null

    onKeyDown = handleKeyDown
    document.addEventListener('keydown', onKeyDown)

    // Focus the first focusable element (or the container itself)
    nextTick(() => {
      const focusable = getFocusableElements()
      if (focusable.length) {
        focusable[0]!.focus()
      } else {
        container?.focus()
      }
    })
  }

  function deactivate() {
    if (onKeyDown) {
      document.removeEventListener('keydown', onKeyDown)
      onKeyDown = null
    }

    // Restore focus
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus()
    }

    container = null
    previouslyFocused = null
  }

  // Clean up on unmount
  onUnmounted(deactivate)

  return { activate, deactivate }
}
