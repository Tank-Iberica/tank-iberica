import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Stub helpers ──────────────────────────────────────────────────────────────

function makeChain(data: unknown = [], error: unknown = null, count = 0) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'neq', 'or', 'order', 'select', 'gte', 'lte', 'limit', 'filter', 'is', 'not'].forEach((m) => {
    chain[m] = () => chain
  })
  const resolved = { data, error, count }
  chain.single = () => Promise.resolve({ data: Array.isArray(data) ? (data[0] ?? null) : data, error })
  chain.range = () => Promise.resolve(resolved)
  chain.limit = () => Promise.resolve(resolved)
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

async function getMetrics() {
  const mod = await import('../../app/composables/useInfraMetrics')
  return { ...mod.useInfraMetrics(), getStatusColor: mod.useInfraMetrics().getStatusColor }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  // Override setup.ts stub with getter-based computed for reactivity
  vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => makeChain(),
      update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    }),
  }))
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('metrics starts as empty array', async () => {
    const c = await getMetrics()
    expect(c.metrics.value).toHaveLength(0)
  })

  it('alerts starts as empty array', async () => {
    const c = await getMetrics()
    expect(c.alerts.value).toHaveLength(0)
  })

  it('clusters starts as empty array', async () => {
    const c = await getMetrics()
    expect(c.clusters.value).toHaveLength(0)
  })

  it('loading starts as false', async () => {
    const c = await getMetrics()
    expect(c.loading.value).toBe(false)
  })

  it('error starts as empty string', async () => {
    const c = await getMetrics()
    expect(c.error.value).toBe('')
  })

  it('criticalAlertCount is defined', async () => {
    const c = await getMetrics()
    expect(c.criticalAlertCount).toBeDefined()
  })
})

// ─── getStatusColor ───────────────────────────────────────────────────────────

describe('getStatusColor', () => {
  it('returns gray for null usage', async () => {
    const c = await getMetrics()
    expect(c.getStatusColor(null)).toBe('gray')
  })

  it('returns green for usage < 70', async () => {
    const c = await getMetrics()
    expect(c.getStatusColor(50)).toBe('green')
  })

  it('returns yellow for usage between 70 and 89', async () => {
    const c = await getMetrics()
    expect(c.getStatusColor(75)).toBe('yellow')
  })

  it('returns red for usage >= 90', async () => {
    const c = await getMetrics()
    expect(c.getStatusColor(95)).toBe('red')
  })

  it('returns yellow at exactly 70', async () => {
    const c = await getMetrics()
    expect(c.getStatusColor(70)).toBe('yellow')
  })

  it('returns red at exactly 90', async () => {
    const c = await getMetrics()
    expect(c.getStatusColor(90)).toBe('red')
  })
})

// ─── fetchMetrics ─────────────────────────────────────────────────────────────

describe('fetchMetrics', () => {
  it('sets loading to false after success', async () => {
    const c = await getMetrics()
    await c.fetchMetrics()
    expect(c.loading.value).toBe(false)
  })

  it('sets metrics from DB response', async () => {
    vi.resetModules()
    const sampleMetric = {
      id: 'm1',
      vertical: 'tracciona',
      component: 'database',
      metric_name: 'connections',
      metric_value: 45,
      metric_limit: 100,
      usage_percent: 45,
      recorded_at: '2026-01-01T00:00:00Z',
      metadata: {},
    }
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([sampleMetric]),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }))
    const mod = await import('../../app/composables/useInfraMetrics')
    const c = mod.useInfraMetrics()
    await c.fetchMetrics()
    expect(c.metrics.value).toHaveLength(1)
  })

  it('sets error on DB failure', async () => {
    vi.resetModules()
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, new Error('DB error')),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }))
    const mod = await import('../../app/composables/useInfraMetrics')
    const c = mod.useInfraMetrics()
    await c.fetchMetrics()
    expect(c.error.value).toBeTruthy()
  })
})

// ─── getLatest ────────────────────────────────────────────────────────────────

describe('getLatest', () => {
  it('returns null when no metrics', async () => {
    const c = await getMetrics()
    const result = c.getLatest('database', 'connections')
    expect(result).toBeNull()
  })

  it('returns latest metric for component + metric_name', async () => {
    vi.resetModules()
    const metrics = [
      { id: 'm1', component: 'database', metric_name: 'connections', metric_value: 45, recorded_at: '2026-01-01T00:00:00Z', usage_percent: 45 },
      { id: 'm2', component: 'database', metric_name: 'connections', metric_value: 60, recorded_at: '2026-01-02T00:00:00Z', usage_percent: 60 },
      { id: 'm3', component: 'storage', metric_name: 'gb_used', metric_value: 10, recorded_at: '2026-01-01T00:00:00Z', usage_percent: 10 },
    ]
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(metrics),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }))
    const mod = await import('../../app/composables/useInfraMetrics')
    const c = mod.useInfraMetrics()
    await c.fetchMetrics()
    const latest = c.getLatest('database', 'connections')
    // Returns first match (find, not sort)
    expect(latest).toBeDefined()
    expect(latest?.metric_value).toBe(45)
  })
})

// ─── fetchMetrics with opts ──────────────────────────────────────────────────

describe('fetchMetrics with options', () => {
  it('filters by component when opts.component provided', async () => {
    vi.resetModules()
    const spyEq = vi.fn().mockReturnThis()
    const chain = makeChain([{ id: 'm1', component: 'database', metric_name: 'connections', metric_value: 45, recorded_at: '2026-01-01', usage_percent: 45 }])
    chain.eq = spyEq.mockReturnValue(chain)
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({ select: () => chain, update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }),
    }))
    const mod = await import('../../app/composables/useInfraMetrics')
    const c = mod.useInfraMetrics()
    await c.fetchMetrics({ component: 'database' })
    expect(spyEq).toHaveBeenCalledWith('component', 'database')
  })

  it('filters by period when opts.period provided', async () => {
    vi.resetModules()
    const spyGte = vi.fn().mockReturnThis()
    const chain = makeChain([])
    chain.gte = spyGte.mockReturnValue(chain)
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({ select: () => chain, update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }),
    }))
    const mod = await import('../../app/composables/useInfraMetrics')
    const c = mod.useInfraMetrics()
    await c.fetchMetrics({ period: '7d' })
    expect(spyGte).toHaveBeenCalledWith('recorded_at', expect.any(String))
  })

  it('sets error on thrown exception', async () => {
    vi.resetModules()
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => { throw new Error('Connection failed') },
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }))
    const mod = await import('../../app/composables/useInfraMetrics')
    const c = mod.useInfraMetrics()
    await c.fetchMetrics()
    expect(c.error.value).toBe('Connection failed')
    expect(c.loading.value).toBe(false)
  })
})

// ─── fetchAlerts ─────────────────────────────────────────────────────────────

describe('fetchAlerts', () => {
  it('sets alerts from DB response', async () => {
    vi.resetModules()
    const sampleAlert = { id: 'a1', component: 'database', metric_name: 'connections', alert_level: 'critical', message: 'High usage', usage_percent: 95, sent_at: '2026-01-01', acknowledged_at: null, acknowledged_by: null }
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([sampleAlert]),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }))
    const mod = await import('../../app/composables/useInfraMetrics')
    const c = mod.useInfraMetrics()
    await c.fetchAlerts()
    expect(c.alerts.value).toHaveLength(1)
    expect(c.alerts.value[0].alert_level).toBe('critical')
    expect(c.loading.value).toBe(false)
  })

  it('filters unacknowledged by default (no opts.all)', async () => {
    vi.resetModules()
    const spyIs = vi.fn().mockReturnThis()
    const chain = makeChain([])
    chain.is = spyIs.mockReturnValue(chain)
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({ select: () => chain, update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }),
    }))
    const mod = await import('../../app/composables/useInfraMetrics')
    const c = mod.useInfraMetrics()
    await c.fetchAlerts()
    expect(spyIs).toHaveBeenCalledWith('acknowledged_at', null)
  })

  it('skips acknowledged_at filter when opts.all=true', async () => {
    vi.resetModules()
    const spyIs = vi.fn().mockReturnThis()
    const chain = makeChain([])
    chain.is = spyIs.mockReturnValue(chain)
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({ select: () => chain, update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }),
    }))
    const mod = await import('../../app/composables/useInfraMetrics')
    const c = mod.useInfraMetrics()
    await c.fetchAlerts({ all: true })
    expect(spyIs).not.toHaveBeenCalled()
  })

  it('filters by component when opts.component provided', async () => {
    vi.resetModules()
    const spyEq = vi.fn().mockReturnThis()
    const chain = makeChain([])
    chain.eq = spyEq.mockReturnValue(chain)
    chain.is = vi.fn().mockReturnValue(chain)
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({ select: () => chain, update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }),
    }))
    const mod = await import('../../app/composables/useInfraMetrics')
    const c = mod.useInfraMetrics()
    await c.fetchAlerts({ component: 'storage' })
    expect(spyEq).toHaveBeenCalledWith('component', 'storage')
  })

  it('sets error on DB failure', async () => {
    vi.resetModules()
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, { message: 'Alert DB error' }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }))
    const mod = await import('../../app/composables/useInfraMetrics')
    const c = mod.useInfraMetrics()
    await c.fetchAlerts()
    expect(c.error.value).toBe('Alert DB error')
  })

  it('sets error on thrown exception', async () => {
    vi.resetModules()
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => { throw new Error('Network failure') },
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }))
    const mod = await import('../../app/composables/useInfraMetrics')
    const c = mod.useInfraMetrics()
    await c.fetchAlerts()
    expect(c.error.value).toBe('Network failure')
    expect(c.loading.value).toBe(false)
  })
})

// ─── acknowledgeAlert ────────────────────────────────────────────────────────

describe('acknowledgeAlert', () => {
  it('updates alert in local state after success', async () => {
    vi.resetModules()
    const alertData = { id: 'a1', component: 'db', metric_name: 'cpu', alert_level: 'critical', message: 'High', usage_percent: 95, sent_at: '2026-01-01', acknowledged_at: null, acknowledged_by: null }
    const alertChain = makeChain([alertData])
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'infra_alerts') return {
          select: () => alertChain,
          update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        }
        return { select: () => makeChain([]), update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }
      },
      auth: { getUser: () => Promise.resolve({ data: { user: { id: 'user-1' } } }) },
    }))
    const mod = await import('../../app/composables/useInfraMetrics')
    const c = mod.useInfraMetrics()
    await c.fetchAlerts()
    expect(c.alerts.value).toHaveLength(1)
    await c.acknowledgeAlert('a1')
    expect(c.alerts.value[0].acknowledged_at).toBeTruthy()
    expect(c.alerts.value[0].acknowledged_by).toBe('user-1')
  })

  it('sets error when update fails', async () => {
    vi.resetModules()
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: { message: 'Update failed' } }) }),
      }),
      auth: { getUser: () => Promise.resolve({ data: { user: { id: 'user-1' } } }) },
    }))
    const mod = await import('../../app/composables/useInfraMetrics')
    const c = mod.useInfraMetrics()
    await c.acknowledgeAlert('a1')
    expect(c.error.value).toBe('Update failed')
  })

  it('sets error on thrown exception', async () => {
    vi.resetModules()
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        update: () => { throw new Error('Acknowledge error') },
      }),
      auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
    }))
    const mod = await import('../../app/composables/useInfraMetrics')
    const c = mod.useInfraMetrics()
    await c.acknowledgeAlert('nonexistent')
    expect(c.error.value).toBe('Acknowledge error')
  })
})

// ─── fetchClusters ───────────────────────────────────────────────────────────

describe('fetchClusters', () => {
  it('sets clusters from DB response', async () => {
    vi.resetModules()
    const cluster = { id: 'c1', name: 'main', supabase_url: 'https://main.supabase.co', verticals: ['tracciona'], weight_used: 50, weight_limit: 100, status: 'active' }
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([cluster]),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }))
    const mod = await import('../../app/composables/useInfraMetrics')
    const c = mod.useInfraMetrics()
    await c.fetchClusters()
    expect(c.clusters.value).toHaveLength(1)
    expect(c.clusters.value[0].name).toBe('main')
    expect(c.loading.value).toBe(false)
  })

  it('sets error on DB failure', async () => {
    vi.resetModules()
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, { message: 'Cluster DB error' }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }))
    const mod = await import('../../app/composables/useInfraMetrics')
    const c = mod.useInfraMetrics()
    await c.fetchClusters()
    expect(c.error.value).toBe('Cluster DB error')
  })

  it('sets error on thrown exception', async () => {
    vi.resetModules()
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => { throw new Error('Cluster fetch error') },
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }))
    const mod = await import('../../app/composables/useInfraMetrics')
    const c = mod.useInfraMetrics()
    await c.fetchClusters()
    expect(c.error.value).toBe('Cluster fetch error')
    expect(c.loading.value).toBe(false)
  })
})

// ─── criticalAlertCount ──────────────────────────────────────────────────────

describe('criticalAlertCount', () => {
  it('counts unacknowledged critical and emergency alerts', async () => {
    vi.resetModules()
    const alertsData = [
      { id: 'a1', component: 'db', metric_name: 'cpu', alert_level: 'critical', message: '', usage_percent: 95, sent_at: '2026-01-01', acknowledged_at: null, acknowledged_by: null },
      { id: 'a2', component: 'db', metric_name: 'mem', alert_level: 'emergency', message: '', usage_percent: 99, sent_at: '2026-01-01', acknowledged_at: null, acknowledged_by: null },
      { id: 'a3', component: 'db', metric_name: 'disk', alert_level: 'warning', message: '', usage_percent: 75, sent_at: '2026-01-01', acknowledged_at: null, acknowledged_by: null },
      { id: 'a4', component: 'db', metric_name: 'io', alert_level: 'critical', message: '', usage_percent: 92, sent_at: '2026-01-01', acknowledged_at: '2026-01-02', acknowledged_by: 'u1' },
    ]
    const alertChain = makeChain(alertsData)
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => alertChain,
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }))
    const mod = await import('../../app/composables/useInfraMetrics')
    const c = mod.useInfraMetrics()
    await c.fetchAlerts({ all: true })
    // a1 (critical, unack) + a2 (emergency, unack) = 2. a3=warning (excluded), a4=acked (excluded)
    expect(c.criticalAlertCount.value).toBe(2)
  })

  it('returns 0 when no alerts', async () => {
    const c = await getMetrics()
    expect(c.criticalAlertCount.value).toBe(0)
  })
})
