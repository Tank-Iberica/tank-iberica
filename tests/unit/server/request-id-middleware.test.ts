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

  describe('Sentry distributed trace headers (#302)', () => {
    it('extracts sentry-trace header into context.sentryTrace', () => {
      const traceValue = '3e15cd22-e1f7-42b7-b06e-f4a3e9d7e2a1-1'
      const event = makeEvent({ 'sentry-trace': traceValue })
      handler(event)
      expect(event.context.sentryTrace).toBe(traceValue)
    })

    it('sets context.sentryTrace to undefined when header absent', () => {
      const event = makeEvent()
      handler(event)
      expect(event.context.sentryTrace).toBeUndefined()
    })

    it('extracts baggage header into context.baggage', () => {
      const baggageValue = 'sentry-environment=production,sentry-release=1.0.0'
      const event = makeEvent({ baggage: baggageValue })
      handler(event)
      expect(event.context.baggage).toBe(baggageValue)
    })

    it('sets context.baggage to undefined when header absent', () => {
      const event = makeEvent()
      handler(event)
      expect(event.context.baggage).toBeUndefined()
    })

    it('propagates both sentry-trace and baggage together', () => {
      const event = makeEvent({
        'sentry-trace': 'abc123-1',
        baggage: 'sentry-environment=staging',
      })
      handler(event)
      expect(event.context.sentryTrace).toBe('abc123-1')
      expect(event.context.baggage).toBe('sentry-environment=staging')
    })
  })
})
