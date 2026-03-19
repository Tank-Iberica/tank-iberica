import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.hoisted(() => {
  ;(globalThis as any).defineEventHandler = (fn: Function) => fn
})

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getQuery: vi.fn(() => ({})),
}))

vi.mock('../../../server/utils/rbac', () => ({
  requireRole: vi.fn(),
}))

const mockGetTopSlowest = vi.fn(() => [
  { path: '/api/vehicles', p50: 120, p95: 350, p99: 800, count: 500 },
  { path: '/api/leads', p50: 80, p95: 200, p99: 400, count: 200 },
])
const mockGetEndpointMetrics = vi.fn(() => ({
  p50: 120,
  p95: 350,
  p99: 800,
  count: 500,
  avg: 150,
}))
const mockGetGlobalMetrics = vi.fn(() => ({
  totalRequests: 10000,
  avgLatency: 95,
  p50: 80,
  p95: 300,
  p99: 700,
}))

vi.mock('../../../server/utils/latencyMetrics', () => ({
  getTopSlowest: (...args: any[]) => mockGetTopSlowest(...args),
  getEndpointMetrics: (...args: any[]) => mockGetEndpointMetrics(...args),
  getGlobalMetrics: (...args: any[]) => mockGetGlobalMetrics(...args),
}))

import handler from '../../../server/api/admin/latency-metrics.get'
import { getQuery } from 'h3'
import { requireRole } from '../../../server/utils/rbac'

const mockEvent = { context: {} } as any

describe('Admin latency-metrics endpoint (#140)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getQuery).mockReturnValue({})
  })

  it('requires admin role', async () => {
    await handler(mockEvent)
    expect(requireRole).toHaveBeenCalledWith(mockEvent, 'admin')
  })

  it('returns global metrics and endpoints list without path filter', async () => {
    const result = (await handler(mockEvent)) as any
    expect(result).toHaveProperty('global')
    expect(result).toHaveProperty('endpoints')
    expect(result).toHaveProperty('count')
    expect(result.global.totalRequests).toBe(10000)
    expect(result.endpoints).toHaveLength(2)
  })

  it('returns single endpoint metrics with path filter', async () => {
    vi.mocked(getQuery).mockReturnValue({ path: '/api/vehicles' })
    const result = (await handler(mockEvent)) as any
    expect(result.path).toBe('/api/vehicles')
    expect(result.found).toBe(true)
    expect(result.metrics).toHaveProperty('p50')
  })

  it('returns found=false for unknown path', async () => {
    mockGetEndpointMetrics.mockReturnValueOnce(null as any)
    vi.mocked(getQuery).mockReturnValue({ path: '/api/unknown' })
    const result = (await handler(mockEvent)) as any
    expect(result.found).toBe(false)
    expect(result.metrics).toBeNull()
  })

  it('clamps top parameter between 1 and 100', async () => {
    vi.mocked(getQuery).mockReturnValue({ top: '500' })
    await handler(mockEvent)
    expect(mockGetTopSlowest).toHaveBeenCalledWith(100)

    vi.mocked(getQuery).mockReturnValue({ top: '-5' })
    await handler(mockEvent)
    expect(mockGetTopSlowest).toHaveBeenCalledWith(1)
  })

  it('defaults top to 20', async () => {
    await handler(mockEvent)
    expect(mockGetTopSlowest).toHaveBeenCalledWith(20)
  })
})
