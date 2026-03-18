/**
 * useUndoAction — Undo snackbar for destructive actions.
 *
 * Pattern: When user performs a destructive action (delete, remove),
 * show a snackbar with "Undo" button for UNDO_TIMEOUT_MS.
 * If user clicks undo, revert the action. If timeout expires, execute permanently.
 *
 * Backlog N4 — Undo snackbar acciones destructivas
 *
 * @example
 * const { performWithUndo, pendingActions, cancelAction } = useUndoAction()
 *
 * async function deleteFavorite(vehicleId: string) {
 *   await performWithUndo({
 *     message: 'Favorito eliminado',
 *     execute: () => removeFavoriteFromDB(vehicleId),
 *     undo: () => restoreFavoriteInDB(vehicleId),
 *     optimistic: () => { favorites.value = favorites.value.filter(f => f.id !== vehicleId) },
 *     rollback: () => { favorites.value.push(vehicle) },
 *   })
 * }
 */

const UNDO_TIMEOUT_MS = 8000

export interface UndoActionConfig {
  /** Message shown in the snackbar */
  message: string
  /** Execute the permanent action (called after timeout) */
  execute: () => void | Promise<void>
  /** Undo handler (called when user clicks undo) */
  undo: () => void | Promise<void>
  /** Optimistic UI update (called immediately) */
  optimistic?: () => void
  /** Rollback optimistic UI update (called on undo) */
  rollback?: () => void
  /** Timeout in ms before permanent execution (default: 8000) */
  timeoutMs?: number
}

export interface PendingAction {
  id: number
  message: string
  createdAt: number
  timeoutMs: number
  timerId: ReturnType<typeof setTimeout>
}

let _actionIdCounter = 0

/**
 * Composable for undo snackbar on destructive actions with configurable timeout.
 * @returns Reactive undo action state and execute/dismiss methods
 */
export function useUndoAction() {
  const pendingActions = useState<PendingAction[]>('undo-actions', () => [])

  /**
   * Perform a destructive action with undo capability.
   * Applies optimistic update immediately, delays permanent execution.
   */
  function performWithUndo(config: UndoActionConfig): number {
    const id = ++_actionIdCounter
    const timeoutMs = config.timeoutMs ?? UNDO_TIMEOUT_MS

    // Apply optimistic UI update immediately
    config.optimistic?.()

    // Schedule permanent execution after timeout
    const timerId = setTimeout(async () => {
      // Remove from pending
      removePending(id)
      // Execute permanent action
      try {
        await config.execute()
      } catch (err) {
        // If permanent execution fails, rollback
        config.rollback?.()
        console.error('[UndoAction] Permanent execution failed:', err)
      }
    }, timeoutMs)

    // Store pending action
    const action: PendingAction = {
      id,
      message: config.message,
      createdAt: Date.now(),
      timeoutMs,
      timerId,
    }
    pendingActions.value.push(action)

    // Store undo handler in closure map
    _undoHandlers.set(id, { undo: config.undo, rollback: config.rollback })

    return id
  }

  /**
   * Cancel (undo) a pending action before it executes permanently.
   */
  async function cancelAction(actionId: number): Promise<boolean> {
    const action = pendingActions.value.find((a) => a.id === actionId)
    if (!action) return false

    // Clear timeout to prevent permanent execution
    clearTimeout(action.timerId)
    removePending(actionId)

    // Execute undo + rollback
    const handlers = _undoHandlers.get(actionId)
    if (handlers) {
      handlers.rollback?.()
      try {
        await handlers.undo()
      } catch (err) {
        console.error('[UndoAction] Undo failed:', err)
      }
      _undoHandlers.delete(actionId)
    }

    return true
  }

  /** Remove action from pending list */
  function removePending(id: number): void {
    const idx = pendingActions.value.findIndex((a) => a.id === id)
    if (idx !== -1) pendingActions.value.splice(idx, 1)
    _undoHandlers.delete(id)
  }

  /** Check if any actions are pending */
  function hasPending(): boolean {
    return pendingActions.value.length > 0
  }

  return {
    performWithUndo,
    cancelAction,
    pendingActions: readonly(pendingActions),
    hasPending,
    UNDO_TIMEOUT_MS,
  }
}

/** Internal map of undo handlers (not reactive, just closures) */
const _undoHandlers = new Map<
  number,
  { undo: () => void | Promise<void>; rollback?: () => void }
>()
