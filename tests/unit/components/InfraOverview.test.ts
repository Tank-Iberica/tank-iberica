/**
 * Tests for app/components/admin/infra/InfraOverview.vue
 */
import { vi, describe, it, expect } from 'vitest'
import { computed } from 'vue'

vi.stubGlobal('computed', computed)

import { shallowMount } from '@vue/test-utils'
import InfraOverview from '../../../app/components/admin/infra/InfraOverview.vue'

const componentCards = [
  {
    key: 'supabase',
    name: 'Supabase',
    icon: '🗄️',
    overallStatus: 'green' as const,
    metrics: [
      {
        name: 'db_size',
        label: 'Base de datos',
        value: 250_000_000,
        limit: 500_000_000,
        percent: 50,
        recommendation: null,
      },
    ],
  },
  {
    key: 'cloudinary',
    name: 'Cloudinary',
    icon: '🖼️',
    overallStatus: 'yellow' as const,
    metrics: [
      {
        name: 'transforms',
        label: 'Transformaciones',
        value: 18000,
        limit: 25000,
        percent: 72,
        recommendation: { level: 'warning', message: 'Uso alto', action: 'Optimizar imágenes' },
      },
    ],
  },
  {
    key: 'sentry',
    name: 'Sentry',
    icon: '🐛',
    overallStatus: 'gray' as const,
    metrics: [],
  },
]

const clusters = [
  {
    id: 'c1',
    name: 'Cluster A',
    status: 'active',
    verticals: ['tracciona'],
    weight_used: 40,
    weight_limit: 100,
  },
]

describe('InfraOverview', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(InfraOverview, {
      props: {
        componentCards,
        clusters,
        pipelineMode: 'cloudinary',
        cloudinaryOnlyCount: 10,
        cfImagesCount: 5,
        migratingImages: false,
        configuringVariants: false,
        pipelineMessage: '',
        pipelineMessageType: 'success' as const,
        getStatusColor: (p: number | null) => {
          if (p === null) return 'gray' as const
          if (p < 70) return 'green' as const
          if (p < 90) return 'yellow' as const
          return 'red' as const
        },
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string, fallback: string) => fallback || k },
      },
    })

  it('renders overview section', () => {
    expect(factory().find('.infra-overview').exists()).toBe(true)
  })

  it('shows stack status heading', () => {
    expect(factory().find('.stack-summary .section-heading').text()).toBe('Estado del stack')
  })

  it('shows component status heading', () => {
    const headings = factory().findAll('.section-heading')
    expect(headings[1].text()).toBe('Estado de componentes')
  })

  it('renders summary table', () => {
    expect(factory().find('.summary-table').exists()).toBe(true)
  })

  it('renders table rows for live + static services', () => {
    // 3 componentCards + 2 static (Stripe, GitHub Actions) = 5
    const rows = factory().findAll('.summary-table tbody tr')
    expect(rows).toHaveLength(5)
  })

  it('shows service name in table', () => {
    expect(factory().find('.col-service').text()).toContain('Supabase')
  })

  it('shows plan info in table', () => {
    expect(factory().html()).toContain('Free (500 MB / 50K MAU)')
  })

  it('shows usage percent for services with metrics', () => {
    expect(factory().find('.usage-label').text()).toBe('50%')
  })

  it('shows dash for services without metrics', () => {
    expect(factory().find('.usage-na').exists()).toBe(true)
  })

  it('shows OK for healthy services', () => {
    expect(factory().find('.next-ok').text()).toBe('OK')
  })

  it('shows action for services with recommendation', () => {
    expect(factory().html()).toContain('Optimizar imágenes')
  })

  it('renders component cards', () => {
    expect(factory().findAll('.component-card')).toHaveLength(3)
  })

  it('shows component name', () => {
    expect(factory().find('.component-name').text()).toBe('Supabase')
  })

  it('shows status dot with class', () => {
    const dots = factory().findAll('.status-dot')
    expect(dots[0].classes()).toContain('status-green')
  })

  it('shows not configured for empty metrics', () => {
    const cards = factory().findAll('.component-card')
    expect(cards[2].find('.component-not-configured').exists()).toBe(true)
  })

  it('shows metric labels', () => {
    expect(factory().find('.metric-label').text()).toBe('Base de datos')
  })

  it('shows metric values formatted', () => {
    // 250_000_000 → "250.0 MB", 500_000_000 → "500.0 MB"
    expect(factory().find('.metric-value-text').text()).toContain('250.0 MB')
  })

  it('shows progress bar with color class', () => {
    expect(factory().find('.progress-bar-fill').classes()).toContain('progress-green')
  })

  it('shows recommendation when present', () => {
    expect(factory().find('.metric-recommendation').exists()).toBe(true)
    expect(factory().find('.rec-message').text()).toBe('Uso alto')
  })

  it('applies recommendation level class', () => {
    expect(factory().find('.metric-recommendation').classes()).toContain('rec-warning')
  })

  it('formats values in K', () => {
    // cloudinary: 18000 → "18.0K"
    const html = factory().html()
    expect(html).toContain('18.0K')
  })

  it('stubs child InfraImagePipeline component', () => {
    const html = factory().html()
    expect(html).toContain('infraimagepipeline')
  })

  it('stubs child InfraClusters component', () => {
    const html = factory().html()
    expect(html).toContain('infraclusters')
  })
})
