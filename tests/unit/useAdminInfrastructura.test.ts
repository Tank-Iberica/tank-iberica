import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (before import) ─────────────────────────────────────────────────

const mockMetrics = { value: [] as unknown[] }
const mockAlerts = { value: [] as unknown[] }
const mockClusters = { value: [] as unknown[] }
const mockInfraLoading = { value: false }
const mockInfraError = { value: null as string | null }
const mockCriticalAlertCount = { value: 0 }
const mockFetchMetrics = vi.fn().mockResolvedValue(undefined)
const mockFetchAlerts = vi.fn().mockResolvedValue(undefined)
const mockFetchClusters = vi.fn().mockResolvedValue(undefined)
const mockAcknowledgeAlert = vi.fn().mockResolvedValue(undefined)
const mockGetLatest = vi.fn().mockReturnValue(null)
const mockGetStatusColor = vi.fn().mockReturnValue('gray')

vi.stubGlobal('useInfraMetrics', () => ({
  metrics: mockMetrics,
  alerts: mockAlerts,
  clusters: mockClusters,
  loading: mockInfraLoading,
  error: mockInfraError,
  fetchMetrics: mockFetchMetrics,
  fetchAlerts: mockFetchAlerts,
  fetchClusters: mockFetchClusters,
  acknowledgeAlert: mockAcknowledgeAlert,
  getLatest: mockGetLatest,
  getStatusColor: mockGetStatusColor,
  criticalAlertCount: mockCriticalAlertCount,
}))

const mockGetRecommendation = vi.fn().mockReturnValue(null)
vi.stubGlobal('useInfraRecommendations', () => ({
  getRecommendation: mockGetRecommendation,
}))

const mockUseFetch = vi.fn().mockResolvedValue({
  data: { value: null },
  error: { value: null },
})
vi.stubGlobal('useFetch', mockUseFetch)

import { useAdminInfrastructura } from '../../app/composables/admin/useAdminInfrastructura'

// ─── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockMetrics.value = []
  mockAlerts.value = []
  mockClusters.value = []
  mockInfraLoading.value = false
  mockInfraError.value = null
  mockCriticalAlertCount.value = 0
  mockFetchMetrics.mockResolvedValue(undefined)
  mockFetchAlerts.mockResolvedValue(undefined)
  mockFetchClusters.mockResolvedValue(undefined)
  mockAcknowledgeAlert.mockResolvedValue(undefined)
  mockGetLatest.mockReturnValue(null)
  mockGetRecommendation.mockReturnValue(null)
  mockUseFetch.mockResolvedValue({ data: { value: null }, error: { value: null } })
})

// ─── Initial state ─────────────────────────────────────────────────────────

describe('initial state', () => {
  it('activeTab starts as "status"', () => {
    const c = useAdminInfrastructura()
    expect(c.activeTab.value).toBe('status')
  })

  it('pipelineMode starts as "hybrid"', () => {
    const c = useAdminInfrastructura()
    expect(c.pipelineMode.value).toBe('hybrid')
  })

  it('cloudinaryOnlyCount starts 0', () => {
    const c = useAdminInfrastructura()
    expect(c.cloudinaryOnlyCount.value).toBe(0)
  })

  it('cfImagesCount starts 0', () => {
    const c = useAdminInfrastructura()
    expect(c.cfImagesCount.value).toBe(0)
  })

  it('migratingImages starts false', () => {
    const c = useAdminInfrastructura()
    expect(c.migratingImages.value).toBe(false)
  })

  it('configuringVariants starts false', () => {
    const c = useAdminInfrastructura()
    expect(c.configuringVariants.value).toBe(false)
  })

  it('pipelineMessage starts empty string', () => {
    const c = useAdminInfrastructura()
    expect(c.pipelineMessage.value).toBe('')
  })

  it('pipelineMessageType starts "success"', () => {
    const c = useAdminInfrastructura()
    expect(c.pipelineMessageType.value).toBe('success')
  })
})

// ─── Tabs ─────────────────────────────────────────────────────────────────

describe('tabs', () => {
  it('has 5 tabs', () => {
    const c = useAdminInfrastructura()
    expect(c.tabs.value).toHaveLength(5)
  })

  it('tab keys match expected values', () => {
    const c = useAdminInfrastructura()
    const keys = c.tabs.value.map((t) => t.key)
    expect(keys).toContain('status')
    expect(keys).toContain('alerts')
    expect(keys).toContain('history')
    expect(keys).toContain('migration')
    expect(keys).toContain('crons')
  })

  it('activeTab can be changed', () => {
    const c = useAdminInfrastructura()
    c.activeTab.value = 'history'
    expect(c.activeTab.value).toBe('history')
  })
})

// ─── componentCards ────────────────────────────────────────────────────────

describe('componentCards', () => {
  it('returns 6 component cards (one per service)', () => {
    const c = useAdminInfrastructura()
    expect(c.componentCards.value).toHaveLength(6)
  })

  it('each card has key, name, icon, overallStatus, metrics', () => {
    const c = useAdminInfrastructura()
    for (const card of c.componentCards.value) {
      expect(card.key).toBeTruthy()
      expect(card.name).toBeTruthy()
      expect(card.icon).toBeTruthy()
      expect(['green', 'yellow', 'red', 'gray']).toContain(card.overallStatus)
      expect(Array.isArray(card.metrics)).toBe(true)
    }
  })

  it('all cards have overallStatus "gray" when no metrics data', () => {
    const c = useAdminInfrastructura()
    // getLatest returns null → no metrics → all gray
    for (const card of c.componentCards.value) {
      expect(card.overallStatus).toBe('gray')
    }
  })

  it('supabase card is first', () => {
    const c = useAdminInfrastructura()
    expect(c.componentCards.value[0]!.key).toBe('supabase')
  })
})

// ─── historyChartDataSets ─────────────────────────────────────────────────

describe('historyChartDataSets', () => {
  it('is empty when metrics is empty', () => {
    const c = useAdminInfrastructura()
    expect(c.historyChartDataSets.value).toEqual([])
  })
})

// ─── chartOptions ─────────────────────────────────────────────────────────

describe('chartOptions', () => {
  it('is a plain object with responsive=true', () => {
    const c = useAdminInfrastructura()
    expect(c.chartOptions.responsive).toBe(true)
  })

  it('has y-axis tick callback', () => {
    const c = useAdminInfrastructura()
    const cb = c.chartOptions.scales?.y?.ticks?.callback
    expect(typeof cb).toBe('function')
  })

  it('y-axis callback formats millions', () => {
    const c = useAdminInfrastructura()
    const cb = c.chartOptions.scales?.y?.ticks?.callback as (v: number) => string
    expect(cb(1_500_000)).toBe('1.5M')
  })

  it('y-axis callback formats thousands', () => {
    const c = useAdminInfrastructura()
    const cb = c.chartOptions.scales?.y?.ticks?.callback as (v: number) => string
    expect(cb(5500)).toBe('5.5K')
  })

  it('y-axis callback returns number as string for small values', () => {
    const c = useAdminInfrastructura()
    const cb = c.chartOptions.scales?.y?.ticks?.callback as (v: number) => string
    expect(cb(999)).toBe('999')
  })
})

// ─── Migration Wizard ──────────────────────────────────────────────────────

describe('wizard initial state', () => {
  it('wizardOpen starts false', () => {
    const c = useAdminInfrastructura()
    expect(c.wizardOpen.value).toBe(false)
  })

  it('wizardStep starts 0', () => {
    const c = useAdminInfrastructura()
    expect(c.wizardStep.value).toBe(0)
  })

  it('wizardExecuting starts false', () => {
    const c = useAdminInfrastructura()
    expect(c.wizardExecuting.value).toBe(false)
  })

  it('wizardComplete starts false', () => {
    const c = useAdminInfrastructura()
    expect(c.wizardComplete.value).toBe(false)
  })

  it('wizardProgress starts 0', () => {
    const c = useAdminInfrastructura()
    expect(c.wizardProgress.value).toBe(0)
  })

  it('wizardResult starts "success"', () => {
    const c = useAdminInfrastructura()
    expect(c.wizardResult.value).toBe('success')
  })
})

describe('openMigrationWizard', () => {
  it('sets wizardOpen to true and resets all wizard state', () => {
    const c = useAdminInfrastructura()
    // Dirty state
    c.wizardStep.value = 3
    c.wizardVertical.value = 'tracciona'
    c.wizardConfirmed.value = true
    c.wizardComplete.value = true
    c.wizardProgress.value = 80
    c.wizardErrorMessage.value = 'prev error'
    c.openMigrationWizard()
    expect(c.wizardOpen.value).toBe(true)
    expect(c.wizardStep.value).toBe(0)
    expect(c.wizardVertical.value).toBe('')
    expect(c.wizardTargetCluster.value).toBe('')
    expect(c.wizardConfirmed.value).toBe(false)
    expect(c.wizardExecuting.value).toBe(false)
    expect(c.wizardComplete.value).toBe(false)
    expect(c.wizardProgress.value).toBe(0)
    expect(c.wizardResult.value).toBe('success')
    expect(c.wizardErrorMessage.value).toBe('')
  })
})

describe('closeWizard', () => {
  it('sets wizardOpen to false', () => {
    const c = useAdminInfrastructura()
    c.openMigrationWizard()
    c.closeWizard()
    expect(c.wizardOpen.value).toBe(false)
  })
})

// ─── executeMigration ─────────────────────────────────────────────────────

describe('executeMigration', () => {
  it('sets wizardExecuting true during execution then false after', async () => {
    mockUseFetch.mockResolvedValue({ data: { value: {} }, error: { value: null } })
    const c = useAdminInfrastructura()
    await c.executeMigration()
    expect(c.wizardExecuting.value).toBe(false)
    expect(c.wizardComplete.value).toBe(true)
  })

  it('sets wizardResult "success" on successful fetch', async () => {
    mockUseFetch.mockResolvedValue({ data: { value: {} }, error: { value: null } })
    const c = useAdminInfrastructura()
    await c.executeMigration()
    expect(c.wizardResult.value).toBe('success')
    expect(c.wizardStep.value).toBe(4)
  })

  it('sets wizardResult "error" when fetchError has value', async () => {
    mockUseFetch.mockResolvedValue({
      data: { value: null },
      error: { value: { message: 'Migration failed' } },
    })
    const c = useAdminInfrastructura()
    await c.executeMigration()
    expect(c.wizardResult.value).toBe('error')
    expect(c.wizardErrorMessage.value).toBeTruthy()
    expect(c.wizardComplete.value).toBe(true)
  })

  it('sets wizardProgress to 100 after completion', async () => {
    mockUseFetch.mockResolvedValue({ data: { value: {} }, error: { value: null } })
    const c = useAdminInfrastructura()
    await c.executeMigration()
    expect(c.wizardProgress.value).toBe(100)
  })
})

// ─── handleAcknowledge ────────────────────────────────────────────────────

describe('handleAcknowledge', () => {
  it('calls acknowledgeAlert with the given id', async () => {
    const c = useAdminInfrastructura()
    await c.handleAcknowledge('alert-123')
    expect(mockAcknowledgeAlert).toHaveBeenCalledWith('alert-123')
  })
})

// ─── changePeriod ─────────────────────────────────────────────────────────

describe('changePeriod', () => {
  it('calls fetchMetrics with the new period', async () => {
    const c = useAdminInfrastructura()
    await c.changePeriod('30d')
    expect(mockFetchMetrics).toHaveBeenCalledWith({ period: '30d' })
  })

  it('calls fetchMetrics with 24h period', async () => {
    const c = useAdminInfrastructura()
    await c.changePeriod('24h')
    expect(mockFetchMetrics).toHaveBeenCalledWith({ period: '24h' })
  })
})

// ─── migrateImages ────────────────────────────────────────────────────────

describe('migrateImages', () => {
  it('sets pipelineMessageType to "success" on success', async () => {
    mockUseFetch.mockResolvedValue({
      data: { value: { migrated: 3 } },
      error: { value: null },
    })
    const c = useAdminInfrastructura()
    await c.migrateImages()
    expect(c.pipelineMessageType.value).toBe('success')
    expect(c.migratingImages.value).toBe(false)
  })

  it('sets pipelineMessageType to "error" when fetchError has value', async () => {
    mockUseFetch.mockResolvedValue({
      data: { value: null },
      error: { value: { message: 'Upload failed' } },
    })
    const c = useAdminInfrastructura()
    await c.migrateImages()
    expect(c.pipelineMessageType.value).toBe('error')
    expect(c.migratingImages.value).toBe(false)
  })

  it('sets pipelineMessage on success', async () => {
    mockUseFetch.mockResolvedValue({
      data: { value: { migrated: 7 } },
      error: { value: null },
    })
    const c = useAdminInfrastructura()
    await c.migrateImages()
    expect(c.pipelineMessage.value).toBeTruthy()
  })
})

// ─── setupCfVariants ──────────────────────────────────────────────────────

describe('setupCfVariants', () => {
  it('sets pipelineMessageType to "success" on success', async () => {
    mockUseFetch.mockResolvedValue({
      data: { value: { count: 4 } },
      error: { value: null },
    })
    const c = useAdminInfrastructura()
    await c.setupCfVariants()
    expect(c.pipelineMessageType.value).toBe('success')
    expect(c.configuringVariants.value).toBe(false)
  })

  it('sets pipelineMessageType to "error" when fetchError has value', async () => {
    mockUseFetch.mockResolvedValue({
      data: { value: null },
      error: { value: { message: 'Variants failed' } },
    })
    const c = useAdminInfrastructura()
    await c.setupCfVariants()
    expect(c.pipelineMessageType.value).toBe('error')
    expect(c.configuringVariants.value).toBe(false)
  })
})

// ─── init ─────────────────────────────────────────────────────────────────

describe('init', () => {
  it('calls fetchMetrics, fetchAlerts, fetchClusters', async () => {
    const c = useAdminInfrastructura()
    await c.init()
    expect(mockFetchMetrics).toHaveBeenCalledOnce()
    expect(mockFetchAlerts).toHaveBeenCalledOnce()
    expect(mockFetchClusters).toHaveBeenCalledOnce()
  })

  it('calls fetchMetrics with default period 7d', async () => {
    const c = useAdminInfrastructura()
    await c.init()
    expect(mockFetchMetrics).toHaveBeenCalledWith({ period: '7d' })
  })

  it('calls fetchAlerts with all=false', async () => {
    const c = useAdminInfrastructura()
    await c.init()
    expect(mockFetchAlerts).toHaveBeenCalledWith({ all: false })
  })

  it('resolves even if one sub-call fails', async () => {
    mockFetchMetrics.mockRejectedValue(new Error('Network error'))
    const c = useAdminInfrastructura()
    await expect(c.init()).resolves.not.toThrow()
  })
})
