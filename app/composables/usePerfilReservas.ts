export interface ReservationItem {
  id: string
  vehicle_id: string
  vehicle_title: string | null
  vehicle_image: string | null
  seller_name: string | null
  created_at: string
  status: string
  deposit_cents: number
  subscription_freebie: boolean
  seller_response: string | null
  seller_responded_at: string | null
}

type StatusKey =
  | 'pending'
  | 'active'
  | 'seller_responded'
  | 'completed'
  | 'expired'
  | 'refunded'
  | 'forfeited'

const statusConfig: Record<StatusKey, { labelKey: string; cssClass: string }> = {
  pending: { labelKey: 'reservations.statusPending', cssClass: 'status--pending' },
  active: { labelKey: 'reservations.statusActive', cssClass: 'status--active' },
  seller_responded: {
    labelKey: 'reservations.statusSellerResponded',
    cssClass: 'status--responded',
  },
  completed: { labelKey: 'reservations.statusCompleted', cssClass: 'status--completed' },
  expired: { labelKey: 'reservations.statusExpired', cssClass: 'status--expired' },
  refunded: { labelKey: 'reservations.statusRefunded', cssClass: 'status--refunded' },
  forfeited: { labelKey: 'reservations.statusForfeited', cssClass: 'status--expired' },
}

export function usePerfilReservas() {
  const { t } = useI18n()

  const {
    reservations,
    loading,
    fetchMyReservations,
    cancelReservation,
    confirmReservation,
    timeRemaining,
  } = useReservation()

  const cancelling = ref<string | null>(null)
  const confirming = ref<string | null>(null)
  const error = ref<string | null>(null)
  const countdowns = ref<Record<string, string>>({})
  let countdownInterval: ReturnType<typeof setInterval> | null = null

  function getStatusConfig(status: string): { labelKey: string; cssClass: string } {
    return (
      statusConfig[status as StatusKey] ?? {
        labelKey: 'reservations.statusUnknown',
        cssClass: '',
      }
    )
  }

  function formatDeposit(cents: number): string {
    return (cents / 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  function canCancel(status: string): boolean {
    return status === 'pending' || status === 'active'
  }

  function canConfirm(status: string): boolean {
    return status === 'seller_responded'
  }

  function isTimerVisible(status: string): boolean {
    return status === 'active' || status === 'pending'
  }

  function updateCountdowns(): void {
    const updated: Record<string, string> = {}
    for (const reservation of reservations.value) {
      if (isTimerVisible(reservation.status)) {
        updated[reservation.id] = timeRemaining(reservation)
      }
    }
    countdowns.value = updated
  }

  async function handleCancel(reservationId: string): Promise<void> {
    cancelling.value = reservationId
    error.value = null
    try {
      await cancelReservation(reservationId)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : t('reservations.errorCancel')
    } finally {
      cancelling.value = null
    }
  }

  async function handleConfirm(reservationId: string): Promise<void> {
    confirming.value = reservationId
    error.value = null
    try {
      await confirmReservation(reservationId)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : t('reservations.errorConfirm')
    } finally {
      confirming.value = null
    }
  }

  async function init(): Promise<void> {
    await fetchMyReservations()
    updateCountdowns()
    countdownInterval = setInterval(updateCountdowns, 60_000)
  }

  function cleanup(): void {
    if (countdownInterval) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }
  }

  return {
    reservations,
    loading,
    cancelling,
    confirming,
    error,
    countdowns,
    getStatusConfig,
    formatDeposit,
    canCancel,
    canConfirm,
    isTimerVisible,
    handleCancel,
    handleConfirm,
    init,
    cleanup,
  }
}
