import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useInfraRecommendations } from '../../app/composables/useInfraRecommendations'

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── getRecommendation ────────────────────────────────────────────────────────

describe('getRecommendation', () => {
  it('returns null when usage is below all thresholds', () => {
    const c = useInfraRecommendations()
    const result = c.getRecommendation('supabase', 'db_size_bytes', 50)
    expect(result).toBeNull()
  })

  it('returns warning recommendation at warning threshold', () => {
    const c = useInfraRecommendations()
    const result = c.getRecommendation('supabase', 'monthly_active_users', 80)
    expect(result).not.toBeNull()
    expect(result?.level).toBe('warning')
  })

  it('returns critical recommendation at critical threshold', () => {
    const c = useInfraRecommendations()
    const result = c.getRecommendation('supabase', 'db_size_bytes', 80)
    expect(result).not.toBeNull()
    expect(result?.level).toBe('critical')
  })

  it('returns emergency recommendation at 90% for db_size_bytes', () => {
    const c = useInfraRecommendations()
    const result = c.getRecommendation('supabase', 'db_size_bytes', 90)
    expect(result).not.toBeNull()
    expect(result?.level).toBe('emergency')
  })

  it('returns the highest threshold match (emergency over critical)', () => {
    const c = useInfraRecommendations()
    // At 95%, both 80 and 90 thresholds match → returns the 90 one (emergency)
    const result = c.getRecommendation('supabase', 'db_size_bytes', 95)
    expect(result?.level).toBe('emergency')
  })

  it('returns null for unknown component', () => {
    const c = useInfraRecommendations()
    const result = c.getRecommendation('unknown_component', 'some_metric', 100)
    expect(result).toBeNull()
  })

  it('returns null for unknown metric', () => {
    const c = useInfraRecommendations()
    const result = c.getRecommendation('supabase', 'unknown_metric', 100)
    expect(result).toBeNull()
  })

  it('cloudinary transformations warning at 70', () => {
    const c = useInfraRecommendations()
    const result = c.getRecommendation('cloudinary', 'transformations_used', 70)
    expect(result?.level).toBe('warning')
  })

  it('cloudinary transformations critical at 90', () => {
    const c = useInfraRecommendations()
    const result = c.getRecommendation('cloudinary', 'transformations_used', 90)
    expect(result?.level).toBe('critical')
  })

  it('cloudflare workers_requests_day warning at 70', () => {
    const c = useInfraRecommendations()
    const result = c.getRecommendation('cloudflare', 'workers_requests_day', 70)
    expect(result?.level).toBe('warning')
  })

  it('result contains component and metric', () => {
    const c = useInfraRecommendations()
    const result = c.getRecommendation('supabase', 'db_size_bytes', 85)
    expect(result?.component).toBe('supabase')
    expect(result?.metric).toBe('db_size_bytes')
  })

  it('result contains message and action', () => {
    const c = useInfraRecommendations()
    const result = c.getRecommendation('supabase', 'db_size_bytes', 85)
    expect(result?.message).toBeTruthy()
    expect(result?.action).toBeTruthy()
  })
})

// ─── getAllRecommendations ────────────────────────────────────────────────────

describe('getAllRecommendations', () => {
  it('returns empty array when all metrics are below thresholds', () => {
    const c = useInfraRecommendations()
    const metrics: Array<{ component: string; metric_name: string; usage_percent: number | null }> = [
      { component: 'supabase', metric_name: 'db_size_bytes', usage_percent: 20 },
      { component: 'cloudinary', metric_name: 'transformations_used', usage_percent: 30 },
    ]
    const result = c.getAllRecommendations(metrics as Parameters<typeof c.getAllRecommendations>[0])
    expect(result).toHaveLength(0)
  })

  it('returns recommendations for metrics above thresholds', () => {
    const c = useInfraRecommendations()
    const metrics: Array<{ component: string; metric_name: string; usage_percent: number | null }> = [
      { component: 'supabase', metric_name: 'db_size_bytes', usage_percent: 85 },
      { component: 'cloudinary', metric_name: 'transformations_used', usage_percent: 75 },
    ]
    const result = c.getAllRecommendations(metrics as Parameters<typeof c.getAllRecommendations>[0])
    expect(result.length).toBeGreaterThan(0)
  })

  it('skips metrics with null usage_percent', () => {
    const c = useInfraRecommendations()
    const metrics: Array<{ component: string; metric_name: string; usage_percent: number | null }> = [
      { component: 'supabase', metric_name: 'db_size_bytes', usage_percent: null },
    ]
    const result = c.getAllRecommendations(metrics as Parameters<typeof c.getAllRecommendations>[0])
    expect(result).toHaveLength(0)
  })

  it('returns multiple recommendations for multiple exceeded metrics', () => {
    const c = useInfraRecommendations()
    const metrics: Array<{ component: string; metric_name: string; usage_percent: number | null }> = [
      { component: 'supabase', metric_name: 'db_size_bytes', usage_percent: 95 },
      { component: 'cloudinary', metric_name: 'transformations_used', usage_percent: 95 },
      { component: 'cloudflare', metric_name: 'workers_requests_day', usage_percent: 95 },
    ]
    const result = c.getAllRecommendations(metrics as Parameters<typeof c.getAllRecommendations>[0])
    expect(result.length).toBe(3)
  })
})
