import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Verifies dealer response time indicator on the vehicle detail page.
 * Tests the badge display logic and i18n keys.
 */

const ROOT = resolve(__dirname, '../../..')

function readFile(relPath: string): string {
  return readFileSync(resolve(ROOT, relPath), 'utf-8')
}

describe('Dealer response time badge on vehicle detail', () => {
  const detailSeller = readFile('app/components/vehicle/DetailSeller.vue')
  const vehicleDetail = readFile('app/composables/useVehicleDetail.ts')

  describe('SellerInfo includes response time', () => {
    it('SellerInfo interface has avg_response_minutes', () => {
      expect(vehicleDetail).toContain('avg_response_minutes: number | null')
    })

    it('query selects avg_response_minutes', () => {
      expect(vehicleDetail).toContain('avg_response_minutes')
      expect(vehicleDetail).toMatch(/select\([^)]*avg_response_minutes/)
    })
  })

  describe('DetailSeller shows response badge', () => {
    it('renders response badge element', () => {
      expect(detailSeller).toContain('response-badge')
    })

    it('has CSS classes for fast/good/slow badges', () => {
      expect(detailSeller).toContain('response-badge--fast')
      expect(detailSeller).toContain('response-badge--good')
      expect(detailSeller).toContain('response-badge--slow')
    })

    it('conditionally shows badge (v-if="responseLabel")', () => {
      expect(detailSeller).toContain('v-if="responseLabel"')
    })
  })

  describe('Response badge logic', () => {
    it('classifies <60 min as fast', () => {
      expect(detailSeller).toContain("minutes < 60) return 'fast'")
    })

    it('classifies <240 min as good', () => {
      expect(detailSeller).toContain("minutes < 240) return 'good'")
    })

    it('classifies >=240 min as slow', () => {
      // Default fallback is slow
      expect(detailSeller).toContain("return 'slow'")
    })

    it('hides badge for unknown (null response time)', () => {
      expect(detailSeller).toContain("'unknown'")
      expect(detailSeller).toContain("badge === 'unknown') return null")
    })
  })

  describe('i18n keys exist', () => {
    const esJson = readFile('i18n/es.json')
    const enJson = readFile('i18n/en.json')

    it('vehicle.responseTimeFast in ES', () => {
      expect(esJson).toContain('"responseTimeFast": "Responde en menos de 1h"')
    })

    it('vehicle.responseTimeGood in ES', () => {
      expect(esJson).toContain('"responseTimeGood": "Responde en menos de 4h"')
    })

    it('vehicle.responseTimeSlow in ES', () => {
      expect(esJson).toContain('"responseTimeSlow": "Responde en más de 4h"')
    })

    it('vehicle.responseTimeFast in EN', () => {
      expect(enJson).toContain('"responseTimeFast": "Responds in less than 1h"')
    })

    it('vehicle.responseTimeGood in EN', () => {
      expect(enJson).toContain('"responseTimeGood": "Responds in less than 4h"')
    })

    it('vehicle.responseTimeSlow in EN', () => {
      expect(enJson).toContain('"responseTimeSlow": "Responds in more than 4h"')
    })
  })
})
