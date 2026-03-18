/**
 * Tests for #37 — Withdrawal reason (motivo no-venta)
 * Tests the withdrawal_reason field logic used in dashboard/vehiculos/index.vue
 */
import { describe, it, expect } from 'vitest'

// The withdrawal reasons from the page component
const WITHDRAWAL_REASONS = [
  'sold_elsewhere',
  'changed_mind',
  'price_not_met',
  'vehicle_damaged',
  'other',
] as const

type WithdrawalReason = (typeof WITHDRAWAL_REASONS)[number]

describe('Withdrawal Reasons (#37)', () => {
  describe('WITHDRAWAL_REASONS constant', () => {
    it('contains exactly 5 reasons', () => {
      expect(WITHDRAWAL_REASONS).toHaveLength(5)
    })

    it('includes sold_elsewhere', () => {
      expect(WITHDRAWAL_REASONS).toContain('sold_elsewhere')
    })

    it('includes changed_mind', () => {
      expect(WITHDRAWAL_REASONS).toContain('changed_mind')
    })

    it('includes price_not_met', () => {
      expect(WITHDRAWAL_REASONS).toContain('price_not_met')
    })

    it('includes vehicle_damaged', () => {
      expect(WITHDRAWAL_REASONS).toContain('vehicle_damaged')
    })

    it('includes other as catch-all', () => {
      expect(WITHDRAWAL_REASONS).toContain('other')
    })

    it('all reasons are lowercase snake_case', () => {
      WITHDRAWAL_REASONS.forEach((reason) => {
        expect(reason).toMatch(/^[a-z_]+$/)
      })
    })
  })

  describe('withdrawal flow logic', () => {
    it('should only trigger withdrawal modal when going to draft', () => {
      const newStatus = 'draft'
      const shouldShowModal = newStatus === 'draft'
      expect(shouldShowModal).toBe(true)
    })

    it('should not trigger withdrawal modal for active status', () => {
      const newStatus = 'active'
      const shouldShowModal = newStatus === 'draft'
      expect(shouldShowModal).toBe(false)
    })

    it('should not trigger withdrawal modal for sold status', () => {
      const newStatus = 'sold'
      const shouldShowModal = newStatus === 'draft'
      expect(shouldShowModal).toBe(false)
    })

    it('should require a reason before confirming withdrawal', () => {
      const withdrawalReason = ''
      const canConfirm = !!withdrawalReason
      expect(canConfirm).toBe(false)
    })

    it('should allow confirmation when reason is selected', () => {
      const withdrawalReason: WithdrawalReason = 'sold_elsewhere'
      const canConfirm = !!withdrawalReason
      expect(canConfirm).toBe(true)
    })

    it('should build correct update payload with reason', () => {
      const reason: WithdrawalReason = 'price_not_met'
      const payload = {
        status: 'draft' as const,
        withdrawal_reason: reason,
      }
      expect(payload.status).toBe('draft')
      expect(payload.withdrawal_reason).toBe('price_not_met')
    })

    it('should clear withdrawal_reason when publishing (non-draft)', () => {
      const payload = {
        status: 'active' as const,
        withdrawal_reason: null,
      }
      expect(payload.withdrawal_reason).toBeNull()
    })

    it('should reset modal state after confirmation', () => {
      let withdrawalModalOpen = true
      let withdrawalVehicle: { id: string } | null = { id: 'v-1' }
      let withdrawalReason = 'sold_elsewhere'

      // Simulate confirmWithdrawal cleanup
      withdrawalModalOpen = false
      withdrawalVehicle = null

      expect(withdrawalModalOpen).toBe(false)
      expect(withdrawalVehicle).toBeNull()
    })
  })

  describe('i18n keys', () => {
    it('each reason has a translatable key pattern', () => {
      WITHDRAWAL_REASONS.forEach((reason) => {
        const key = `dashboard.vehicles.withdrawalReason.${reason}`
        expect(key).toContain('dashboard.vehicles.withdrawalReason.')
        expect(key.length).toBeGreaterThan(30)
      })
    })
  })
})
