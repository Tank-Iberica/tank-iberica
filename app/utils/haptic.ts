/**
 * Haptic feedback via the Vibration API.
 * Silently no-ops on devices/browsers that don't support it.
 *
 * Usage:
 *   import { hapticLight, hapticSuccess, hapticError } from '~/utils/haptic'
 *   await hapticSuccess() // after saving
 *   await hapticError()   // on form error
 */

function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

/** Short tap — general feedback (links, toggles) */
export function hapticLight(): void {
  vibrate(10)
}

/** Double tap — confirm / success */
export function hapticSuccess(): void {
  vibrate([10, 50, 10])
}

/** Long tap — error / destructive action */
export function hapticError(): void {
  vibrate([30, 20, 30])
}

/** Medium tap — important action (send, save, submit) */
export function hapticMedium(): void {
  vibrate(20)
}
