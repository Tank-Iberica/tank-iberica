import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')

describe('E2E Playwright journeys inventory (#80)', () => {
  const JOURNEYS_DIR = resolve(ROOT, 'tests/e2e/journeys')

  it('journeys directory exists', () => {
    expect(existsSync(JOURNEYS_DIR)).toBe(true)
  })

  it('has at least 7 journey spec files', () => {
    const specs = readdirSync(JOURNEYS_DIR).filter((f) => f.endsWith('.spec.ts'))
    expect(specs.length).toBeGreaterThanOrEqual(7)
  })

  const requiredJourneys = [
    'anonymous-browse', // visitor search→ficha
    'dealer-publish', // dealer publish→dashboard
    'buyer-register', // subscription purchase
    'buyer-contact', // buyer favorites→alert
    'admin-approve', // admin approve→publish
    'auction-flow', // subasta completa
    'reservation-flow', // reserva completa
  ]

  for (const journey of requiredJourneys) {
    it(`has ${journey} journey spec`, () => {
      const specs = readdirSync(JOURNEYS_DIR)
      const found = specs.some((f) => f.includes(journey))
      expect(found).toBe(true)
    })
  }

  it('all journey specs have test() blocks', () => {
    const specs = readdirSync(JOURNEYS_DIR).filter((f) => f.endsWith('.spec.ts'))
    for (const spec of specs) {
      const content = readFileSync(resolve(JOURNEYS_DIR, spec), 'utf-8')
      expect(content).toContain('test(')
    }
  })
})

describe('k6 Load Test Infrastructure (#286-292)', () => {
  const LOAD_DIR = resolve(ROOT, 'tests/load')

  it('load test directory exists', () => {
    expect(existsSync(LOAD_DIR)).toBe(true)
  })

  it('has k6-full.js main entry', () => {
    expect(existsSync(resolve(LOAD_DIR, 'k6-full.js'))).toBe(true)
  })

  it('has k6.config.js with BASE_URL', () => {
    const config = readFileSync(resolve(LOAD_DIR, 'k6.config.js'), 'utf-8')
    expect(config).toContain('BASE_URL')
  })

  const requiredScenarios = [
    'catalog.js',
    'vehicle-detail.js',
    'api-public.js',
    'realistic-peak.js',
    'write-stress.js',
    'spike-test.js',
  ]

  for (const scenario of requiredScenarios) {
    it(`has ${scenario} scenario`, () => {
      expect(existsSync(resolve(LOAD_DIR, 'scenarios', scenario))).toBe(true)
    })
  }

  it('k6-full.js supports smoke/load/stress/soak/peak profiles', () => {
    const content = readFileSync(resolve(LOAD_DIR, 'k6-full.js'), 'utf-8')
    expect(content).toContain('smoke')
    expect(content).toContain('load')
    expect(content).toContain('stress')
    expect(content).toContain('soak')
    expect(content).toContain('peak')
  })

  it('k6-full.js has thresholds configured', () => {
    const content = readFileSync(resolve(LOAD_DIR, 'k6-full.js'), 'utf-8')
    expect(content).toContain('thresholds')
  })

  it('write-stress.js has VU ramp-up stages', () => {
    const content = readFileSync(resolve(LOAD_DIR, 'scenarios/write-stress.js'), 'utf-8')
    expect(content).toContain('ramping-vus')
    expect(content).toContain('stages')
  })

  it('spike-test.js simulates sudden traffic spike', () => {
    const content = readFileSync(resolve(LOAD_DIR, 'scenarios/spike-test.js'), 'utf-8')
    expect(content).toContain('spike')
    expect(content).toContain('target: 500')
  })
})

describe('Fiscal Compliance (#447)', () => {
  it('vatRates.ts exists with EU VAT rates', () => {
    const file = resolve(ROOT, 'server/utils/vatRates.ts')
    expect(existsSync(file)).toBe(true)
    const content = readFileSync(file, 'utf-8')
    expect(content).toContain('ES: 0.21')
    expect(content).toContain('DE: 0.19')
    expect(content).toContain('FR: 0.2')
  })

  it('has getVatRate function with country lookup', () => {
    const content = readFileSync(resolve(ROOT, 'server/utils/vatRates.ts'), 'utf-8')
    expect(content).toContain('export function getVatRate')
    expect(content).toContain('countryCode')
  })

  it('has calculateTaxFromGross function', () => {
    const content = readFileSync(resolve(ROOT, 'server/utils/vatRates.ts'), 'utf-8')
    expect(content).toContain('export function calculateTaxFromGross')
  })

  it('billing service uses VAT rates', () => {
    const content = readFileSync(resolve(ROOT, 'server/services/billing.ts'), 'utf-8')
    expect(content).toContain('getVatRate')
    expect(content).toContain('calculateTaxFromGross')
  })

  it('invoice endpoint exists', () => {
    expect(existsSync(resolve(ROOT, 'server/api/invoicing/create-invoice.post.ts'))).toBe(true)
  })

  it('covers all 27 EU member states', () => {
    const content = readFileSync(resolve(ROOT, 'server/utils/vatRates.ts'), 'utf-8')
    const euCountries = [
      'ES',
      'DE',
      'FR',
      'IT',
      'PT',
      'BE',
      'NL',
      'AT',
      'PL',
      'SE',
      'DK',
      'FI',
      'IE',
      'GR',
      'CZ',
      'HU',
      'RO',
      'BG',
      'HR',
      'SK',
      'SI',
      'LT',
      'LV',
      'EE',
      'LU',
      'CY',
      'MT',
    ]
    for (const country of euCountries) {
      expect(content).toContain(`${country}:`)
    }
  })
})
