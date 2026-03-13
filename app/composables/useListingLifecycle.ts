/**
 * useListingLifecycle — Stub for Agent D worktree.
 * The real implementation lives on agent-e/bloque-16 (#135).
 * This stub provides the types and interfaces needed by
 * useListingRenewal.ts so tests can compile in this worktree.
 */

export type VehicleStatus =
  | 'draft'
  | 'published'
  | 'paused'
  | 'expired'
  | 'sold'
  | 'archived'
  | 'rented'
  | 'maintenance'

export interface TransitionResult {
  success: boolean
  error?: string
}

export interface BulkTransitionResult {
  succeeded: string[]
  failed: Array<{ id: string; error: string }>
}

export const STATUS_TRANSITIONS: Partial<Record<VehicleStatus, VehicleStatus[]>> = {
  draft: ['published', 'archived'],
  published: ['paused', 'expired', 'sold', 'rented', 'archived'],
  paused: ['published', 'archived'],
  expired: ['published', 'archived'],
  rented: ['published', 'archived'],
  maintenance: ['published', 'archived'],
}

export const STATUS_META: Record<VehicleStatus, { label: string; color: string; icon: string }> = {
  draft: { label: 'Draft', color: '#6b7280', icon: '📝' },
  published: { label: 'Published', color: '#10b981', icon: '✅' },
  paused: { label: 'Paused', color: '#f59e0b', icon: '⏸️' },
  expired: { label: 'Expired', color: '#ef4444', icon: '⏰' },
  sold: { label: 'Sold', color: '#8b5cf6', icon: '🏷️' },
  archived: { label: 'Archived', color: '#374151', icon: '📦' },
  rented: { label: 'Rented', color: '#3b82f6', icon: '🔑' },
  maintenance: { label: 'Maintenance', color: '#f97316', icon: '🔧' },
}

export function isValidTransition(from: VehicleStatus, to: VehicleStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

export function getValidTargets(from: VehicleStatus): VehicleStatus[] {
  return STATUS_TRANSITIONS[from] ?? []
}

export function useListingLifecycle() {
  const transitioning = ref(false)
  const error = ref<string | null>(null)

  async function transition(
    _vehicleId: string,
    _to: VehicleStatus,
    _opts?: Record<string, unknown>,
  ): Promise<TransitionResult> {
    return { success: true }
  }

  async function bulkTransition(
    _ids: string[],
    _to: VehicleStatus,
    _opts?: Record<string, unknown>,
  ): Promise<BulkTransitionResult> {
    return { succeeded: _ids, failed: [] }
  }

  async function getTransitionHistory(_vehicleId: string) {
    return []
  }

  return {
    transitioning: readonly(transitioning),
    error: readonly(error),
    transition,
    bulkTransition,
    getTransitionHistory,
  }
}
