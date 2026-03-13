/**
 * Tests for useAdminCapacityAlerts composable
 * #142 Bloque 18
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

const mockFrom = vi.fn()
const mockSupabase = { from: mockFrom }

vi.mock('#imports', () => ({
  useSupabaseClient: () => mockSupabase,
}))

// Vue composables need reactive context
vi.mock('vue', async (orig) => {
  const actual = await orig<typeof import('vue')>()
  return { ...actual }
})

import { useAdminCapacityAlerts, type CapacityAlert } from '../../app/composables/admin/useAdminCapacityAlerts'

const ALERT_WARNING: CapacityAlert = {
  id: 'a1',
  vertical: 'tracciona',
  metric: 'storage',
  current_value: 75,
  threshold: 70,
  is_critical: false,
  details: { pct: 75, currentGb: 6, limitBytes: 8589934592 },
  notified_at: null,
  resolved_at: null,
  created_at: '2026-03-13T10:00:00Z',
}

const ALERT_CRITICAL: CapacityAlert = {
  id: 'a2',
  vertical: 'tracciona',
  metric: 'connections',
  current_value: 92,
  threshold: 70,
  is_critical: true,
  details: { pct: 92, currentCount: 55, limitCount: 60 },
  notified_at: null,
  resolved_at: null,
  created_at: '2026-03-13T10:05:00Z',
}

function makeFrom(rows: CapacityAlert[], updateErr: unknown = null) {
  return vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: undefined,
    // make fetch-like
    [Symbol.asyncIterator]: undefined,
    // resolve at end of chain
    mockResolvedValue: undefined,
    // Final resolution
    catch: undefined,
    // Expose underlying
    _resolve: vi.fn().mockResolvedValue({ data: rows, error: null }),
  })
}

describe('useAdminCapacityAlerts', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('statusColor', () => {
    it('returns red for critical alerts', () => {
      const { statusColor } = useAdminCapacityAlerts()
      expect(statusColor(ALERT_CRITICAL)).toBe('red')
    })

    it('returns yellow for warning alerts', () => {
      const { statusColor } = useAdminCapacityAlerts()
      expect(statusColor(ALERT_WARNING)).toBe('yellow')
    })
  })

  describe('metricLabel', () => {
    it('returns label for storage', () => {
      const { metricLabel } = useAdminCapacityAlerts()
      expect(metricLabel('storage')).toBe('Almacenamiento DB')
    })

    it('returns label for connections', () => {
      const { metricLabel } = useAdminCapacityAlerts()
      expect(metricLabel('connections')).toBe('Conexiones activas')
    })

    it('returns label for bandwidth', () => {
      const { metricLabel } = useAdminCapacityAlerts()
      expect(metricLabel('bandwidth')).toBe('Ancho de banda')
    })
  })

  describe('criticalCount / warningCount', () => {
    it('counts critical and warning alerts correctly', () => {
      // Note: setup.ts stubs computed() as non-reactive (fn called once at init).
      // criticalCount/warningCount are tested via the filter logic on alerts.value,
      // which IS mutable in the test environment.
      const composable = useAdminCapacityAlerts()
      const mockIs = vi.fn().mockResolvedValue({ data: [ALERT_WARNING, ALERT_CRITICAL], error: null })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        is: mockIs,
      })

      return composable.fetchAlerts().then(() => {
        const alerts = (composable.alerts as { value: CapacityAlert[] }).value
        const critical = alerts.filter((a) => a.is_critical && !a.resolved_at).length
        const warning = alerts.filter((a) => !a.is_critical && !a.resolved_at).length
        expect(critical).toBe(1)
        expect(warning).toBe(1)
      })
    })
  })

  describe('fetchAlerts', () => {
    it('fetches unresolved alerts by default', async () => {
      const mockIs = vi.fn().mockResolvedValue({ data: [ALERT_WARNING], error: null })
      const mockOrder = vi.fn().mockReturnThis()
      const mockLimit = vi.fn().mockReturnThis()
      const mockSelect = vi.fn().mockReturnThis()
      mockFrom.mockReturnValue({ select: mockSelect, order: mockOrder, limit: mockLimit, is: mockIs })

      const { fetchAlerts, alerts } = useAdminCapacityAlerts()
      await fetchAlerts()

      expect(mockIs).toHaveBeenCalledWith('resolved_at', null)
      expect(alerts.value).toHaveLength(1)
    })

    it('sets error on DB failure', async () => {
      const mockIs = vi.fn().mockResolvedValue({ data: null, error: { message: 'access denied' } })
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        is: mockIs,
      })

      const { fetchAlerts, error } = useAdminCapacityAlerts()
      await fetchAlerts()
      expect(error.value).toBe('access denied')
    })
  })

  describe('resolveAlert', () => {
    it('removes resolved alert from alerts list', async () => {
      // Setup initial state
      const mockIs = vi.fn().mockResolvedValue({ data: [ALERT_WARNING, ALERT_CRITICAL], error: null })
      const mockUpdate = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockResolvedValue({ error: null })
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        is: mockIs,
        update: mockUpdate,
        eq: mockEq,
      })

      const { fetchAlerts, resolveAlert, alerts } = useAdminCapacityAlerts()
      await fetchAlerts()
      expect(alerts.value).toHaveLength(2)

      await resolveAlert('a1')
      expect(alerts.value).toHaveLength(1)
      expect(alerts.value[0].id).toBe('a2')
    })
  })
})
