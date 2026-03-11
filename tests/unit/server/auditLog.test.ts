import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockWarn } = vi.hoisted(() => ({ mockWarn: vi.fn() }))
vi.mock('../../../server/utils/logger', () => ({ logger: { warn: mockWarn } }))

import { logAdminAction } from '../../../server/utils/auditLog'

function makeEvent(opts: { ip?: string; ua?: string } = {}) {
  return {
    node: {
      req: {
        headers: {
          'x-forwarded-for': opts.ip,
          'user-agent': opts.ua,
        },
        socket: { remoteAddress: undefined },
      },
    },
  } as any
}

function makeSupabase(insertError: unknown = null) {
  const insert = vi.fn().mockResolvedValue({ error: insertError })
  const from = vi.fn().mockReturnValue({ insert })
  return { client: { from }, insert }
}

describe('logAdminAction', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserts into admin_audit_log with correct fields', async () => {
    const { client, insert } = makeSupabase()
    const event = makeEvent({ ip: '1.2.3.4', ua: 'TestAgent/1.0' })

    await logAdminAction(client, event, {
      action: 'vehicle.delete',
      resourceType: 'vehicle',
      resourceId: 'veh-123',
      actorId: 'user-abc',
      actorEmail: 'admin@example.com',
      metadata: { brand: 'Volvo' },
    })

    expect(client.from).toHaveBeenCalledWith('admin_audit_log')
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_id: 'user-abc',
        actor_email: 'admin@example.com',
        action: 'vehicle.delete',
        resource_type: 'vehicle',
        resource_id: 'veh-123',
        metadata: { brand: 'Volvo' },
        ip: '1.2.3.4',
        user_agent: 'TestAgent/1.0',
      }),
    )
  })

  it('sets null for optional fields when omitted', async () => {
    const { client, insert } = makeSupabase()
    const event = makeEvent()

    await logAdminAction(client, event, {
      action: 'dealer.suspend',
      resourceType: 'dealer',
    })

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_id: null,
        actor_email: null,
        resource_id: null,
        metadata: {},
      }),
    )
  })

  it('defaults metadata to {} when not provided', async () => {
    const { client, insert } = makeSupabase()
    await logAdminAction(client, makeEvent(), {
      action: 'user.ban',
      resourceType: 'user',
    })
    const [payload] = insert.mock.calls[0]
    expect(payload.metadata).toEqual({})
  })

  it('extracts first IP from x-forwarded-for with multiple IPs', async () => {
    const { client, insert } = makeSupabase()
    const event = makeEvent({ ip: '10.0.0.1, 10.0.0.2, 10.0.0.3' })

    await logAdminAction(client, event, { action: 'news.delete', resourceType: 'news' })

    const [payload] = insert.mock.calls[0]
    expect(payload.ip).toBe('10.0.0.1')
  })

  it('does not throw when supabase insert fails', async () => {
    const { client } = makeSupabase(new Error('DB connection lost'))
    // Override insert to throw (not just return error)
    client.from.mockReturnValue({ insert: vi.fn().mockRejectedValue(new Error('DB down')) })

    await expect(
      logAdminAction(client, makeEvent(), { action: 'vehicle.create', resourceType: 'vehicle' }),
    ).resolves.toBeUndefined()
  })

  it('logs a warning when insert throws', async () => {
    const { client } = makeSupabase()
    client.from.mockReturnValue({
      insert: vi.fn().mockRejectedValue(new Error('timeout')),
    })

    await logAdminAction(client, makeEvent(), { action: 'auction.cancel', resourceType: 'auction' })

    expect(mockWarn).toHaveBeenCalledWith(expect.stringContaining('timeout'))
  })

  it('does not throw when insert returns an error object (non-throw path)', async () => {
    const { client } = makeSupabase({ message: 'constraint violation' })
    await expect(
      logAdminAction(client, makeEvent(), { action: 'user.unban', resourceType: 'user' }),
    ).resolves.toBeUndefined()
  })

  it('sets ip from socket.remoteAddress when x-forwarded-for is absent', async () => {
    const { client, insert } = makeSupabase()
    const event = {
      node: {
        req: {
          headers: {},
          socket: { remoteAddress: '192.168.1.50' },
        },
      },
    } as any

    await logAdminAction(client, event, { action: 'news.publish', resourceType: 'news' })

    const [payload] = insert.mock.calls[0]
    expect(payload.ip).toBe('192.168.1.50')
  })
})
