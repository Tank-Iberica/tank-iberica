import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('h3', async () => {
  const actual = await vi.importActual<typeof import('h3')>('h3')
  return {
    ...actual,
    createError: (opts: { statusCode: number; statusMessage: string }) => {
      const err = new Error(opts.statusMessage) as Error & { statusCode: number }
      err.statusCode = opts.statusCode
      return err
    },
  }
})

vi.mock('../../../server/utils/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

const mockSingle = vi.fn()
const mockNeq = vi.fn(() => ({ select: vi.fn().mockReturnThis(), single: mockSingle }))
const mockEqChain = vi.fn().mockReturnThis()
const mockSelect = vi.fn(() => ({
  eq: vi.fn(() => ({
    eq: vi.fn(() => ({
      eq: vi.fn(() => ({ single: mockSingle })),
      single: mockSingle,
    })),
    single: mockSingle,
    neq: mockNeq,
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
  })),
}))
const mockInsert = vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) }))
const mockUpdate = vi.fn(() => ({
  eq: vi.fn(() => ({
    eq: vi.fn(() => ({
      neq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: mockSingle,
        })),
      })),
      select: vi.fn(() => ({ single: mockSingle })),
    })),
  })),
}))
const mockClient = {
  from: vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
  })),
}
vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: vi.fn(() => mockClient),
}))

import {
  requireDealerRole,
  getDealerTeamMembers,
  inviteDealerTeamMember,
  updateDealerTeamMemberRole,
  revokeDealerTeamMember,
  type DealerTeamRole,
} from '../../../server/utils/dealerTeamAuth'

// ── Helpers ────────────────────────────────────────────────────────────────

function mockEventWithUser(userId: string | null): H3Event {
  return {
    context: userId ? { user: { id: userId } } : {},
  } as unknown as H3Event
}

describe('Multi-user Dealer Accounts (D17)', () => {
  describe('requireDealerRole', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('throws 401 when no user in event context', async () => {
      const event = mockEventWithUser(null)
      await expect(requireDealerRole(event, 'dealer-1')).rejects.toThrow('Authentication required')
    })

    it('throws 403 when user is not a team member', async () => {
      const event = mockEventWithUser('user-1')
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })

      await expect(requireDealerRole(event, 'dealer-1')).rejects.toThrow(
        'No access to this dealer account',
      )
    })

    it('throws 403 when role is insufficient (viewer trying manager)', async () => {
      const event = mockEventWithUser('user-1')
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 1,
          dealer_id: 'dealer-1',
          user_id: 'user-1',
          email: 'viewer@x.com',
          role: 'viewer',
          status: 'active',
          invite_token: null,
          invited_by: null,
          invited_at: '2026-01-01',
          accepted_at: '2026-01-01',
          revoked_at: null,
        },
        error: null,
      })

      await expect(requireDealerRole(event, 'dealer-1', 'manager')).rejects.toThrow(
        'Requires "manager" role',
      )
    })

    it('returns member when role is sufficient', async () => {
      const event = mockEventWithUser('user-1')
      const memberData = {
        id: 1,
        dealer_id: 'dealer-1',
        user_id: 'user-1',
        email: 'owner@x.com',
        role: 'owner',
        status: 'active',
        invite_token: null,
        invited_by: null,
        invited_at: '2026-01-01',
        accepted_at: '2026-01-01',
        revoked_at: null,
      }
      mockSingle.mockResolvedValueOnce({ data: memberData, error: null })

      const result = await requireDealerRole(event, 'dealer-1', 'manager')
      expect(result.role).toBe('owner')
      expect(result.user_id).toBe('user-1')
    })

    it('owner satisfies any role requirement', async () => {
      const event = mockEventWithUser('user-1')
      const ownerData = {
        id: 1,
        dealer_id: 'dealer-1',
        user_id: 'user-1',
        email: 'owner@x.com',
        role: 'owner',
        status: 'active',
        invite_token: null,
        invited_by: null,
        invited_at: '2026-01-01',
        accepted_at: '2026-01-01',
        revoked_at: null,
      }
      mockSingle.mockResolvedValueOnce({ data: ownerData, error: null })
      const result = await requireDealerRole(event, 'dealer-1', 'viewer')
      expect(result.role).toBe('owner')
    })
  })

  describe('inviteDealerTeamMember', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('throws when trying to invite as owner', async () => {
      const event = mockEventWithUser('owner-1')
      // First call: requireDealerRole succeeds
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 1,
          dealer_id: 'dealer-1',
          user_id: 'owner-1',
          email: 'o@x.com',
          role: 'owner',
          status: 'active',
          invite_token: null,
          invited_by: null,
          invited_at: '2026-01-01',
          accepted_at: '2026-01-01',
          revoked_at: null,
        },
        error: null,
      })

      await expect(inviteDealerTeamMember(event, 'dealer-1', 'new@x.com', 'owner')).rejects.toThrow(
        'Cannot invite as owner',
      )
    })
  })

  describe('Role hierarchy logic', () => {
    it('role hierarchy: owner(3) > manager(2) > viewer(1)', async () => {
      const event = mockEventWithUser('user-1')

      // Manager trying viewer-required action → should pass
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 1,
          dealer_id: 'd1',
          user_id: 'user-1',
          email: 'm@x.com',
          role: 'manager',
          status: 'active',
          invite_token: null,
          invited_by: null,
          invited_at: '2026-01-01',
          accepted_at: '2026-01-01',
          revoked_at: null,
        },
        error: null,
      })
      const result = await requireDealerRole(event, 'd1', 'viewer')
      expect(result.role).toBe('manager')
    })

    it('viewer cannot access manager-required actions', async () => {
      const event = mockEventWithUser('user-1')
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 1,
          dealer_id: 'd1',
          user_id: 'user-1',
          email: 'v@x.com',
          role: 'viewer',
          status: 'active',
          invite_token: null,
          invited_by: null,
          invited_at: '2026-01-01',
          accepted_at: '2026-01-01',
          revoked_at: null,
        },
        error: null,
      })
      await expect(requireDealerRole(event, 'd1', 'manager')).rejects.toThrow(
        'Requires "manager" role',
      )
    })

    it('viewer cannot access owner-required actions', async () => {
      const event = mockEventWithUser('user-1')
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 1,
          dealer_id: 'd1',
          user_id: 'user-1',
          email: 'v@x.com',
          role: 'viewer',
          status: 'active',
          invite_token: null,
          invited_by: null,
          invited_at: '2026-01-01',
          accepted_at: '2026-01-01',
          revoked_at: null,
        },
        error: null,
      })
      await expect(requireDealerRole(event, 'd1', 'owner')).rejects.toThrow('Requires "owner" role')
    })
  })
})
