import { describe, it, expect, vi, beforeEach } from 'vitest'

// Reset module state between tests for clean isolation — the handler Map is
// module-level state, so re-importing gives us a fresh registry each test.
let on: typeof import('../../../server/utils/eventBus').on
let off: typeof import('../../../server/utils/eventBus').off
let emit: typeof import('../../../server/utils/eventBus').emit
let listEvents: typeof import('../../../server/utils/eventBus').listEvents

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('../../../server/utils/eventBus')
  on = mod.on
  off = mod.off
  emit = mod.emit
  listEvents = mod.listEvents
})

// ── on / emit — typed events ─────────────────────────────────────────────────

describe('on / emit', () => {
  it('calls registered handler with payload (vehicle:created)', async () => {
    const handler = vi.fn()
    on('vehicle:created', handler)
    await emit('vehicle:created', { vehicleId: 'v1', dealerId: 'd1', title: 'Volvo FH16' })
    expect(handler).toHaveBeenCalledWith({ vehicleId: 'v1', dealerId: 'd1', title: 'Volvo FH16' })
  })

  it('calls registered handler with payload (vehicle:sold)', async () => {
    const handler = vi.fn()
    on('vehicle:sold', handler)
    await emit('vehicle:sold', { vehicleId: 'v2', dealerId: 'd2', title: 'MAN TGX' })
    expect(handler).toHaveBeenCalledWith({ vehicleId: 'v2', dealerId: 'd2', title: 'MAN TGX' })
  })

  it('calls registered handler with payload (dealer:registered)', async () => {
    const handler = vi.fn()
    on('dealer:registered', handler)
    await emit('dealer:registered', { dealerId: 'd3', email: 'a@b.com', companyName: 'ACME' })
    expect(handler).toHaveBeenCalledWith({ dealerId: 'd3', email: 'a@b.com', companyName: 'ACME' })
  })

  it('calls registered handler with payload (subscription:changed)', async () => {
    const handler = vi.fn()
    on('subscription:changed', handler)
    await emit('subscription:changed', {
      dealerId: 'd4',
      previousPlan: 'basic',
      newPlan: 'premium',
      action: 'upgraded',
    })
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'upgraded', newPlan: 'premium' }),
    )
  })

  it('calls registered handler with payload (job:dead_letter)', async () => {
    const handler = vi.fn()
    on('job:dead_letter', handler)
    await emit('job:dead_letter', { jobId: 'j1', jobType: 'email', error: 'Timeout' })
    expect(handler).toHaveBeenCalledWith({ jobId: 'j1', jobType: 'email', error: 'Timeout' })
  })

  it('calls multiple handlers for the same event', async () => {
    const h1 = vi.fn()
    const h2 = vi.fn()
    on('vehicle:created', h1)
    on('vehicle:created', h2)
    await emit('vehicle:created', { vehicleId: 'v5', dealerId: 'd5', title: 'Multi' })
    expect(h1).toHaveBeenCalledOnce()
    expect(h2).toHaveBeenCalledOnce()
  })

  it('does not call handlers for different events', async () => {
    const handler = vi.fn()
    on('dealer:registered', handler)
    await emit('vehicle:created', { vehicleId: 'v6', dealerId: 'd6', title: 'Other' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('does nothing when no handlers registered', async () => {
    await expect(
      emit('vehicle:created', { vehicleId: 'v7', dealerId: 'd7', title: 'Empty' }),
    ).resolves.toBeUndefined()
  })

  it('continues calling remaining handlers when one throws', async () => {
    const errorHandler = vi.fn().mockRejectedValue(new Error('handler error'))
    const goodHandler = vi.fn()
    on('vehicle:created', errorHandler)
    on('vehicle:created', goodHandler)

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await emit('vehicle:created', { vehicleId: 'v8', dealerId: 'd8', title: 'Error' })
    expect(goodHandler).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('logs error to console when handler throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    on('vehicle:sold', async () => {
      throw new Error('boom')
    })
    await emit('vehicle:sold', { vehicleId: 'v9', dealerId: 'd9', title: 'Boom' })
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('passes optional fields in vehicle:created payload', async () => {
    const handler = vi.fn()
    on('vehicle:created', handler)
    await emit('vehicle:created', {
      vehicleId: 'v10',
      dealerId: 'd10',
      title: 'With Vertical',
      vertical: 'tracciona',
    })
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ vertical: 'tracciona' }))
  })
})

// ── off() ────────────────────────────────────────────────────────────────────

describe('off', () => {
  it('removes a specific handler', async () => {
    const handler = vi.fn()
    on('vehicle:created', handler)
    off('vehicle:created', handler)
    await emit('vehicle:created', { vehicleId: 'v11', dealerId: 'd11', title: 'Removed' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('does nothing when removing handler for event with no handlers', () => {
    expect(() => off('dealer:registered', vi.fn())).not.toThrow()
  })

  it('does not remove other handlers for same event', async () => {
    const h1 = vi.fn()
    const h2 = vi.fn()
    on('vehicle:created', h1)
    on('vehicle:created', h2)
    off('vehicle:created', h1)
    await emit('vehicle:created', { vehicleId: 'v12', dealerId: 'd12', title: 'Partial' })
    expect(h1).not.toHaveBeenCalled()
    expect(h2).toHaveBeenCalledOnce()
  })

  it('does nothing when handler reference is not in the list', () => {
    on('vehicle:created', vi.fn())
    expect(() => off('vehicle:created', vi.fn())).not.toThrow()
  })
})

// ── listEvents() ─────────────────────────────────────────────────────────────

describe('listEvents', () => {
  it('returns empty array when no events registered', () => {
    expect(listEvents()).toHaveLength(0)
  })

  it('returns registered event names', () => {
    on('vehicle:created', vi.fn())
    on('vehicle:sold', vi.fn())
    const events = listEvents()
    expect(events).toContain('vehicle:created')
    expect(events).toContain('vehicle:sold')
  })

  it('does not list duplicate event names', () => {
    on('vehicle:created', vi.fn())
    on('vehicle:created', vi.fn())
    const events = listEvents()
    const count = events.filter((e) => e === 'vehicle:created').length
    expect(count).toBe(1)
  })
})
