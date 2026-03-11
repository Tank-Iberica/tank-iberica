import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  appendEvent,
  getEvents,
  addToDeadLetter,
  getPendingRetries,
  resolveDeadLetter,
  retryDeadLetter,
  replayEvents,
  getEventsByType,
} from '../../../server/utils/eventStore'
import type { DomainEvent, StoredEvent, ReplayHandler } from '../../../server/utils/eventStore'

// Mock Supabase client builder
function createMockClient(overrides: Record<string, unknown> = {}) {
  const chainable: Record<string, unknown> = {
    from: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    lte: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    single: vi.fn(),
    ...overrides,
  }

  // Make all methods return the chainable object by default
  for (const key of Object.keys(chainable)) {
    if (typeof chainable[key] === 'function' && !overrides[key]) {
      ;(chainable[key] as ReturnType<typeof vi.fn>).mockReturnValue(chainable)
    }
  }

  return chainable as unknown as Parameters<typeof appendEvent>[0]
}

describe('Event Store — appendEvent', () => {
  it('appends event with auto-incremented version', async () => {
    const client = createMockClient({
      single: vi
        .fn()
        // First call: get max version
        .mockResolvedValueOnce({ data: { version: 3 }, error: null })
        // Second call: insert result
        .mockResolvedValueOnce({
          data: {
            id: 10,
            aggregate_type: 'payment',
            aggregate_id: 'pay-1',
            event_type: 'payment.completed',
            event_data: { amount: 100 },
            metadata: { actorId: 'u1' },
            version: 4,
            created_at: '2026-01-01T00:00:00Z',
          },
          error: null,
        }),
    })

    const event: DomainEvent = {
      aggregateType: 'payment',
      aggregateId: 'pay-1',
      eventType: 'payment.completed',
      eventData: { amount: 100 },
      metadata: { actorId: 'u1' },
    }

    const result = await appendEvent(client, event)
    expect(result.id).toBe(10)
    expect(result.version).toBe(4)
    expect(result.aggregateType).toBe('payment')
    expect(result.eventType).toBe('payment.completed')
    expect(result.eventData).toEqual({ amount: 100 })
    expect(result.createdAt).toBe('2026-01-01T00:00:00Z')
  })

  it('starts at version 1 when no prior events', async () => {
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 1,
            aggregate_type: 'auction',
            aggregate_id: 'auc-1',
            event_type: 'auction.created',
            event_data: {},
            metadata: {},
            version: 1,
            created_at: '2026-01-01T00:00:00Z',
          },
          error: null,
        }),
      }),
    })

    const client = createMockClient({
      single: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
      insert: insertMock,
    })

    const event: DomainEvent = {
      aggregateType: 'auction',
      aggregateId: 'auc-1',
      eventType: 'auction.created',
      eventData: {},
    }

    const result = await appendEvent(client, event)
    expect(result.version).toBe(1)

    // Verify insert was called with version 1
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ version: 1 }))
  })

  it('throws on insert error', async () => {
    const client = createMockClient({
      single: vi
        .fn()
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'version conflict' } }),
    })

    const event: DomainEvent = {
      aggregateType: 'payment',
      aggregateId: 'pay-1',
      eventType: 'payment.completed',
      eventData: {},
    }

    await expect(appendEvent(client, event)).rejects.toThrow(
      'Failed to append event: version conflict',
    )
  })
})

describe('Event Store — getEvents', () => {
  it('returns mapped events in order', async () => {
    const mockData = [
      {
        id: 1,
        aggregate_type: 'vehicle',
        aggregate_id: 'v-1',
        event_type: 'vehicle.created',
        event_data: { make: 'Volvo' },
        metadata: {},
        version: 1,
        created_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 2,
        aggregate_type: 'vehicle',
        aggregate_id: 'v-1',
        event_type: 'vehicle.published',
        event_data: {},
        metadata: { actorId: 'u1' },
        version: 2,
        created_at: '2026-01-01T01:00:00Z',
      },
    ]

    const client = createMockClient({
      order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    })

    const events = await getEvents(client, 'vehicle', 'v-1')
    expect(events).toHaveLength(2)
    expect(events[0].eventType).toBe('vehicle.created')
    expect(events[0].aggregateType).toBe('vehicle')
    expect(events[1].version).toBe(2)
  })

  it('returns empty array when no events', async () => {
    const client = createMockClient({
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })

    const events = await getEvents(client, 'vehicle', 'nonexistent')
    expect(events).toEqual([])
  })

  it('throws on query error', async () => {
    const client = createMockClient({
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'db error' } }),
    })

    await expect(getEvents(client, 'vehicle', 'v-1')).rejects.toThrow(
      'Failed to get events: db error',
    )
  })
})

describe('Event Store — addToDeadLetter', () => {
  it('inserts DLQ entry without throwing', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    const client = createMockClient({ insert: insertMock })

    await addToDeadLetter(client, 5, 'payment.completed', { amount: 100 }, 'timeout')

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event_id: 5,
        event_type: 'payment.completed',
        error_message: 'timeout',
      }),
    )
  })

  it('handles null event_id', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    const client = createMockClient({ insert: insertMock })

    await addToDeadLetter(client, null, 'auction.bid', {}, 'error')

    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ event_id: null }))
  })

  it('logs error but does not throw on DLQ failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const client = createMockClient({
      insert: vi.fn().mockResolvedValue({ error: { message: 'DLQ insert failed' } }),
    })

    await addToDeadLetter(client, 1, 'test', {}, 'err')
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('DLQ insert failed'))
    consoleSpy.mockRestore()
  })
})

describe('Event Store — getPendingRetries', () => {
  it('returns mapped pending entries', async () => {
    const mockData = [
      {
        id: 1,
        event_type: 'payment.completed',
        event_data: { amount: 50 },
        retry_count: 1,
        max_retries: 3,
      },
      { id: 2, event_type: 'auction.bid', event_data: {}, retry_count: 0, max_retries: 3 },
    ]

    const client = createMockClient({
      limit: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    })

    const retries = await getPendingRetries(client, 5)
    expect(retries).toHaveLength(2)
    expect(retries[0].eventType).toBe('payment.completed')
    expect(retries[0].retryCount).toBe(1)
    expect(retries[1].maxRetries).toBe(3)
  })

  it('throws on query error', async () => {
    const client = createMockClient({
      limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'query failed' } }),
    })

    await expect(getPendingRetries(client)).rejects.toThrow('Failed to get pending retries')
  })
})

describe('Event Store — resolveDeadLetter', () => {
  it('updates status to resolved', async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    const client = createMockClient({ update: updateMock })

    await resolveDeadLetter(client, 42)

    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'resolved' }))
  })
})

describe('Event Store — retryDeadLetter', () => {
  it('increments retry count with exponential backoff', async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    const client = createMockClient({ update: updateMock })

    await retryDeadLetter(client, 1, 1, 3, 'timeout')

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        retry_count: 2,
        status: 'retrying',
        error_message: 'timeout',
      }),
    )
  })

  it('marks as exhausted when max retries reached', async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    const client = createMockClient({ update: updateMock })

    await retryDeadLetter(client, 1, 2, 3)

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        retry_count: 3,
        status: 'exhausted',
        next_retry_at: null,
      }),
    )
  })
})

// ---- Replay & Versioning Tests ----

function makeStoredEvents(count: number): StoredEvent[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    aggregateType: 'payment' as const,
    aggregateId: 'pay-1',
    eventType: i % 2 === 0 ? 'payment.created' : 'payment.completed',
    eventData: { step: i + 1 },
    metadata: {},
    version: i + 1,
    schemaVersion: 1,
    createdAt: `2026-01-0${i + 1}T00:00:00Z`,
  }))
}

describe('Event Store — replayEvents', () => {
  it('replays all events for an aggregate', async () => {
    const events = makeStoredEvents(4)
    const orderMock = vi.fn().mockResolvedValue({
      data: events.map((e) => ({
        id: e.id,
        aggregate_type: e.aggregateType,
        aggregate_id: e.aggregateId,
        event_type: e.eventType,
        event_data: e.eventData,
        metadata: e.metadata,
        version: e.version,
        schema_version: e.schemaVersion,
        created_at: e.createdAt,
      })),
      error: null,
    })
    const client = createMockClient({ order: orderMock })

    const handler = vi.fn()
    const result = await replayEvents(client, 'payment', 'pay-1', handler)

    expect(handler).toHaveBeenCalledTimes(4)
    expect(result.replayed).toBe(4)
    expect(result.skipped).toBe(0)
  })

  it('filters by eventTypes', async () => {
    const events = makeStoredEvents(4)
    const orderMock = vi.fn().mockResolvedValue({
      data: events.map((e) => ({
        id: e.id,
        aggregate_type: e.aggregateType,
        aggregate_id: e.aggregateId,
        event_type: e.eventType,
        event_data: e.eventData,
        metadata: e.metadata,
        version: e.version,
        schema_version: e.schemaVersion,
        created_at: e.createdAt,
      })),
      error: null,
    })
    const client = createMockClient({ order: orderMock })

    const handler = vi.fn()
    const result = await replayEvents(client, 'payment', 'pay-1', handler, {
      eventTypes: ['payment.created'],
    })

    expect(result.replayed).toBe(2)
    expect(result.skipped).toBe(2)
  })

  it('filters by fromVersion', async () => {
    const events = makeStoredEvents(4)
    const orderMock = vi.fn().mockResolvedValue({
      data: events.map((e) => ({
        id: e.id,
        aggregate_type: e.aggregateType,
        aggregate_id: e.aggregateId,
        event_type: e.eventType,
        event_data: e.eventData,
        metadata: e.metadata,
        version: e.version,
        schema_version: e.schemaVersion,
        created_at: e.createdAt,
      })),
      error: null,
    })
    const client = createMockClient({ order: orderMock })

    const handler = vi.fn()
    const result = await replayEvents(client, 'payment', 'pay-1', handler, { fromVersion: 3 })

    expect(result.replayed).toBe(2)
    expect(result.skipped).toBe(2)
  })

  it('filters by toVersion', async () => {
    const events = makeStoredEvents(4)
    const orderMock = vi.fn().mockResolvedValue({
      data: events.map((e) => ({
        id: e.id,
        aggregate_type: e.aggregateType,
        aggregate_id: e.aggregateId,
        event_type: e.eventType,
        event_data: e.eventData,
        metadata: e.metadata,
        version: e.version,
        schema_version: e.schemaVersion,
        created_at: e.createdAt,
      })),
      error: null,
    })
    const client = createMockClient({ order: orderMock })

    const handler = vi.fn()
    const result = await replayEvents(client, 'payment', 'pay-1', handler, { toVersion: 2 })

    expect(result.replayed).toBe(2)
    expect(result.skipped).toBe(2)
  })

  it('handles empty event stream', async () => {
    const orderMock = vi.fn().mockResolvedValue({ data: [], error: null })
    const client = createMockClient({ order: orderMock })

    const handler = vi.fn()
    const result = await replayEvents(client, 'payment', 'pay-x', handler)

    expect(handler).not.toHaveBeenCalled()
    expect(result.replayed).toBe(0)
    expect(result.skipped).toBe(0)
  })

  it('supports async handlers', async () => {
    const events = makeStoredEvents(2)
    const orderMock = vi.fn().mockResolvedValue({
      data: events.map((e) => ({
        id: e.id,
        aggregate_type: e.aggregateType,
        aggregate_id: e.aggregateId,
        event_type: e.eventType,
        event_data: e.eventData,
        metadata: e.metadata,
        version: e.version,
        schema_version: e.schemaVersion,
        created_at: e.createdAt,
      })),
      error: null,
    })
    const client = createMockClient({ order: orderMock })

    const collected: number[] = []
    const handler: ReplayHandler = async (event) => {
      await new Promise((r) => setTimeout(r, 1))
      collected.push(event.version)
    }

    await replayEvents(client, 'payment', 'pay-1', handler)
    expect(collected).toEqual([1, 2])
  })
})

describe('Event Store — getEventsByType', () => {
  it('returns events by aggregate type with pagination', async () => {
    const mockData = [
      {
        id: 1,
        aggregate_type: 'payment',
        aggregate_id: 'p-1',
        event_type: 'payment.created',
        event_data: {},
        metadata: {},
        version: 1,
        schema_version: 1,
        created_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 2,
        aggregate_type: 'payment',
        aggregate_id: 'p-2',
        event_type: 'payment.created',
        event_data: {},
        metadata: {},
        version: 1,
        schema_version: 1,
        created_at: '2026-01-02T00:00:00Z',
      },
    ]
    const rangeMock = vi.fn().mockResolvedValue({ data: mockData, error: null })
    const client = createMockClient({ range: rangeMock })

    const events = await getEventsByType(client, 'payment', 10, 0)
    expect(events).toHaveLength(2)
    expect(events[0].aggregateId).toBe('p-1')
    expect(events[1].aggregateId).toBe('p-2')
  })

  it('throws on query error', async () => {
    const rangeMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } })
    const client = createMockClient({ range: rangeMock })

    await expect(getEventsByType(client, 'auction')).rejects.toThrow('Failed to get events by type')
  })
})

describe('Event Store — schema versioning', () => {
  it('appends event with custom schemaVersion', async () => {
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 1,
            aggregate_type: 'payment',
            aggregate_id: 'p-1',
            event_type: 'payment.v2',
            event_data: {},
            metadata: {},
            version: 1,
            schema_version: 2,
            created_at: '2026-01-01',
          },
          error: null,
        }),
      }),
    })
    const singleMock = vi.fn().mockResolvedValueOnce({ data: null, error: null })
    const client = createMockClient({ single: singleMock, insert: insertMock })

    const result = await appendEvent(client, {
      aggregateType: 'payment',
      aggregateId: 'p-1',
      eventType: 'payment.v2',
      eventData: { newField: true },
      schemaVersion: 2,
    })

    expect(result.schemaVersion).toBe(2)
  })

  it('defaults schemaVersion to 1', async () => {
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 1,
            aggregate_type: 'payment',
            aggregate_id: 'p-1',
            event_type: 'payment.created',
            event_data: {},
            metadata: {},
            version: 1,
            schema_version: 1,
            created_at: '2026-01-01',
          },
          error: null,
        }),
      }),
    })
    const singleMock = vi.fn().mockResolvedValueOnce({ data: null, error: null })
    const client = createMockClient({ single: singleMock, insert: insertMock })

    const result = await appendEvent(client, {
      aggregateType: 'payment',
      aggregateId: 'p-1',
      eventType: 'payment.created',
      eventData: {},
    })

    expect(result.schemaVersion).toBe(1)
  })
})
