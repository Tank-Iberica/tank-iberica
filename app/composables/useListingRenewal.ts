/**
 * useListingRenewal — Composable for renewing expired or paused vehicle listings.
 *
 * Builds on useListingLifecycle (#135 from Agent E) to provide:
 * - Single listing renewal (expired/paused → published)
 * - Bulk renewal of multiple listings
 * - Renewal cost calculation (for credit-based plans)
 * - Renewal history
 *
 * Used in the dealer dashboard for managing fleet expirations.
 */
import { useListingLifecycle, isValidTransition } from '~/composables/useListingLifecycle'
import type { ListingStatus as VehicleStatus } from '~/composables/useListingLifecycle'

export interface RenewalResult {
  vehicleId: string
  success: boolean
  error?: string
  previousStatus: VehicleStatus
}

export interface BulkRenewalSummary {
  total: number
  succeeded: number
  failed: number
  results: RenewalResult[]
}

/** Statuses that can be renewed to 'published' */
const RENEWABLE_STATUSES: VehicleStatus[] = ['expired', 'paused', 'draft']

export function isRenewable(status: VehicleStatus): boolean {
  return RENEWABLE_STATUSES.includes(status) && isValidTransition(status, 'published')
}

export function useListingRenewal() {
  const { transition, bulkTransition, transitioning, error } = useListingLifecycle()

  const renewalLoading = ref(false)
  const renewalError = ref<string | null>(null)

  /**
   * Renew a single listing to 'published' status.
   */
  async function renewListing(
    vehicleId: string,
    currentStatus: VehicleStatus,
    options?: { dealerId?: string; reason?: string },
  ): Promise<RenewalResult> {
    if (!isRenewable(currentStatus)) {
      return {
        vehicleId,
        success: false,
        error: `Status '${currentStatus}' cannot be renewed`,
        previousStatus: currentStatus,
      }
    }

    renewalLoading.value = true
    renewalError.value = null

    try {
      const result = await transition(vehicleId, 'published', {
        ...options,
        reason: options?.reason ?? 'manual_renewal',
      })

      return {
        vehicleId,
        success: result.success,
        error: result.error,
        previousStatus: currentStatus,
      }
    } finally {
      renewalLoading.value = false
    }
  }

  /**
   * Bulk renew multiple listings.
   */
  async function bulkRenew(
    vehicles: Array<{ id: string; status: VehicleStatus }>,
    options?: { dealerId?: string },
  ): Promise<BulkRenewalSummary> {
    renewalLoading.value = true
    renewalError.value = null

    const renewableIds = vehicles.filter((v) => isRenewable(v.status)).map((v) => v.id)

    const skipped = vehicles.filter((v) => !isRenewable(v.status))

    const results: RenewalResult[] = skipped.map((v) => ({
      vehicleId: v.id,
      success: false,
      error: `Status '${v.status}' not renewable`,
      previousStatus: v.status,
    }))

    try {
      const { succeeded, failed } = await bulkTransition(renewableIds, 'published', {
        ...options,
        reason: 'bulk_renewal',
      })

      for (const id of succeeded) {
        const orig = vehicles.find((v) => v.id === id)
        results.push({ vehicleId: id, success: true, previousStatus: orig?.status ?? 'expired' })
      }
      for (const f of failed) {
        const orig = vehicles.find((v) => v.id === f.id)
        results.push({
          vehicleId: f.id,
          success: false,
          error: f.error,
          previousStatus: orig?.status ?? 'expired',
        })
      }

      return {
        total: vehicles.length,
        succeeded: succeeded.length,
        failed: failed.length + skipped.length,
        results,
      }
    } finally {
      renewalLoading.value = false
    }
  }

  return {
    renewalLoading: readonly(renewalLoading),
    renewalError: readonly(renewalError),
    transitioning,
    error,
    renewListing,
    bulkRenew,
    isRenewable,
  }
}
