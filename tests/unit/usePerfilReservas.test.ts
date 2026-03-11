import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePerfilReservas } from '../../app/composables/usePerfilReservas'

// ─── Stubs ────────────────────────────────────────────────────────────────────

function stubReservation({
  reservations = [] as unknown[],
  cancelError = null as unknown,
  confirmError = null as unknown,
} = {}) {
  vi.stubGlobal('useReservation', () => ({
    reservations: { value: reservations },
    loading: { value: false },
    fetchMyReservations: vi.fn().mockResolvedValue(undefined),
    cancelReservation: cancelError
      ? vi.fn().mockRejectedValue(cancelError)
      : vi.fn().mockResolvedValue(undefined),
    confirmReservation: confirmError
      ? vi.fn().mockRejectedValue(confirmError)
      : vi.fn().mockResolvedValue(undefined),
    timeRemaining: (_r: unknown) => '23h 59m',
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }))
  stubReservation()
  vi.stubGlobal('setInterval', (_fn: () => void, _ms: number) => 1)
  vi.stubGlobal('clearInterval', (_id: unknown) => {})
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('cancelling starts as null', () => {
    const c = usePerfilReservas()
    expect(c.cancelling.value).toBeNull()
  })

  it('confirming starts as null', () => {
    const c = usePerfilReservas()
    expect(c.confirming.value).toBeNull()
  })

  it('error starts as null', () => {
    const c = usePerfilReservas()
    expect(c.error.value).toBeNull()
  })

  it('countdowns starts as empty object', () => {
    const c = usePerfilReservas()
    expect(Object.keys(c.countdowns.value)).toHaveLength(0)
  })
})

// ─── getStatusConfig ──────────────────────────────────────────────────────────

describe('getStatusConfig', () => {
  it('returns pending config for pending status', () => {
    const c = usePerfilReservas()
    const cfg = c.getStatusConfig('pending')
    expect(cfg.labelKey).toBe('reservations.statusPending')
    expect(cfg.cssClass).toBe('status--pending')
  })

  it('returns active config for active status', () => {
    const c = usePerfilReservas()
    const cfg = c.getStatusConfig('active')
    expect(cfg.labelKey).toBe('reservations.statusActive')
  })

  it('returns completed config for completed status', () => {
    const c = usePerfilReservas()
    const cfg = c.getStatusConfig('completed')
    expect(cfg.labelKey).toBe('reservations.statusCompleted')
    expect(cfg.cssClass).toBe('status--completed')
  })

  it('returns expired config for expired status', () => {
    const c = usePerfilReservas()
    const cfg = c.getStatusConfig('expired')
    expect(cfg.labelKey).toBe('reservations.statusExpired')
  })

  it('returns refunded config for refunded status', () => {
    const c = usePerfilReservas()
    const cfg = c.getStatusConfig('refunded')
    expect(cfg.labelKey).toBe('reservations.statusRefunded')
  })

  it('returns forfeited config for forfeited status', () => {
    const c = usePerfilReservas()
    const cfg = c.getStatusConfig('forfeited')
    expect(cfg.labelKey).toBe('reservations.statusForfeited')
  })

  it('returns unknown config for unknown status', () => {
    const c = usePerfilReservas()
    const cfg = c.getStatusConfig('invalid-status')
    expect(cfg.labelKey).toBe('reservations.statusUnknown')
    expect(cfg.cssClass).toBe('')
  })

  it('returns seller_responded config', () => {
    const c = usePerfilReservas()
    const cfg = c.getStatusConfig('seller_responded')
    expect(cfg.labelKey).toBe('reservations.statusSellerResponded')
  })
})

// ─── formatDeposit ────────────────────────────────────────────────────────────

describe('formatDeposit', () => {
  it('converts cents to euros with 2 decimal places', () => {
    const c = usePerfilReservas()
    const result = c.formatDeposit(10000)
    expect(result).toContain('100')
    expect(result).toContain('00')
  })

  it('formats 2900 cents as 29.00', () => {
    const c = usePerfilReservas()
    const result = c.formatDeposit(2900)
    expect(result).toContain('29')
  })

  it('formats 0 cents', () => {
    const c = usePerfilReservas()
    const result = c.formatDeposit(0)
    expect(result).toContain('0')
  })
})

// ─── canCancel ────────────────────────────────────────────────────────────────

describe('canCancel', () => {
  it('returns true for pending status', () => {
    const c = usePerfilReservas()
    expect(c.canCancel('pending')).toBe(true)
  })

  it('returns true for active status', () => {
    const c = usePerfilReservas()
    expect(c.canCancel('active')).toBe(true)
  })

  it('returns false for completed status', () => {
    const c = usePerfilReservas()
    expect(c.canCancel('completed')).toBe(false)
  })

  it('returns false for expired status', () => {
    const c = usePerfilReservas()
    expect(c.canCancel('expired')).toBe(false)
  })

  it('returns false for seller_responded status', () => {
    const c = usePerfilReservas()
    expect(c.canCancel('seller_responded')).toBe(false)
  })
})

// ─── canConfirm ───────────────────────────────────────────────────────────────

describe('canConfirm', () => {
  it('returns true for seller_responded status', () => {
    const c = usePerfilReservas()
    expect(c.canConfirm('seller_responded')).toBe(true)
  })

  it('returns false for pending status', () => {
    const c = usePerfilReservas()
    expect(c.canConfirm('pending')).toBe(false)
  })

  it('returns false for active status', () => {
    const c = usePerfilReservas()
    expect(c.canConfirm('active')).toBe(false)
  })

  it('returns false for completed status', () => {
    const c = usePerfilReservas()
    expect(c.canConfirm('completed')).toBe(false)
  })
})

// ─── isTimerVisible ───────────────────────────────────────────────────────────

describe('isTimerVisible', () => {
  it('returns true for active status', () => {
    const c = usePerfilReservas()
    expect(c.isTimerVisible('active')).toBe(true)
  })

  it('returns true for pending status', () => {
    const c = usePerfilReservas()
    expect(c.isTimerVisible('pending')).toBe(true)
  })

  it('returns false for completed status', () => {
    const c = usePerfilReservas()
    expect(c.isTimerVisible('completed')).toBe(false)
  })

  it('returns false for expired status', () => {
    const c = usePerfilReservas()
    expect(c.isTimerVisible('expired')).toBe(false)
  })
})

// ─── handleCancel ─────────────────────────────────────────────────────────────

describe('handleCancel', () => {
  it('sets cancelling during operation', async () => {
    let capturedValue: string | null = null
    vi.stubGlobal('useReservation', () => ({
      reservations: { value: [] },
      loading: { value: false },
      fetchMyReservations: vi.fn(),
      cancelReservation: vi.fn().mockImplementation(async (id: string) => {
        capturedValue = id
      }),
      confirmReservation: vi.fn(),
      timeRemaining: () => '',
    }))
    const c = usePerfilReservas()
    await c.handleCancel('r1')
    expect(capturedValue).toBe('r1')
    expect(c.cancelling.value).toBeNull()
  })

  it('sets error on cancel failure', async () => {
    stubReservation({ cancelError: new Error('Cancel failed') })
    const c = usePerfilReservas()
    await c.handleCancel('r1')
    expect(c.error.value).toBeTruthy()
    expect(c.cancelling.value).toBeNull()
  })
})

// ─── handleConfirm ────────────────────────────────────────────────────────────

describe('handleConfirm', () => {
  it('sets error on confirm failure', async () => {
    stubReservation({ confirmError: new Error('Confirm failed') })
    const c = usePerfilReservas()
    await c.handleConfirm('r1')
    expect(c.error.value).toBeTruthy()
    expect(c.confirming.value).toBeNull()
  })

  it('clears confirming after success', async () => {
    const c = usePerfilReservas()
    await c.handleConfirm('r1')
    expect(c.confirming.value).toBeNull()
  })
})

// ─── cleanup ──────────────────────────────────────────────────────────────────

describe('cleanup', () => {
  it('calls clearInterval', async () => {
    const mockClear = vi.fn()
    vi.stubGlobal('clearInterval', mockClear)
    vi.stubGlobal('setInterval', (_fn: () => void) => 42)
    const c = usePerfilReservas()
    await c.init()
    c.cleanup()
    expect(mockClear).toHaveBeenCalledWith(42)
  })
})
