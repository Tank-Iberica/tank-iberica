import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockSetResponseHeader } = vi.hoisted(() => ({
  mockSetResponseHeader: vi.fn(),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  setResponseHeader: mockSetResponseHeader,
}))

import handler from '../../../server/middleware/request-id'

function makeEvent(headers: Record<string, string> = {}) {
  return {
    context: {} as Record<string, unknown>,
    node: { req: { headers } },
  } as any
}

describe('request-id middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('assigns a requestId to event.context', () => {
    const event = makeEvent()
    handler(event)
    expect(typeof event.context.requestId).toBe('string')
    expect(event.context.requestId.length).toBeGreaterThan(0)
  })

  it('uses existing x-request-id header when present', () => {
    const event = makeEvent({ 'x-request-id': 'my-trace-id' })
    handler(event)
    expect(event.context.requestId).toBe('my-trace-id')
  })

  it('generates an 8-char UUID when no header present', () => {
    const event = makeEvent()
    handler(event)
    expect(event.context.requestId).toHaveLength(8)
  })

  it('sets x-request-id response header', () => {
    const event = makeEvent()
    handler(event)
    expect(mockSetResponseHeader).toHaveBeenCalledWith(event, 'x-request-id', expect.any(String))
  })

  it('response header matches context.requestId', () => {
    const event = makeEvent({ 'x-request-id': 'trace-abc' })
    handler(event)
    expect(mockSetResponseHeader).toHaveBeenCalledWith(event, 'x-request-id', 'trace-abc')
    expect(event.context.requestId).toBe('trace-abc')
  })

  it('generates unique IDs for consecutive requests without header', () => {
    const event1 = makeEvent()
    const event2 = makeEvent()
    handler(event1)
    handler(event2)
    expect(event1.context.requestId).not.toBe(event2.context.requestId)
  })
})
