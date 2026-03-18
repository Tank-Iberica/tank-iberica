import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Verifies CSS containment on heavy/repeating components.
 * `contain: layout style paint` isolates layout recalculation,
 * reducing browser paint work for off-screen or unchanged components.
 */

const ROOT = resolve(__dirname, '../../..')

function readFile(relPath: string): string {
  return readFileSync(resolve(ROOT, relPath), 'utf-8')
}

describe('CSS containment on heavy components', () => {
  const heavyComponents = [
    {
      file: 'app/components/catalog/VehicleCard.vue',
      expectation: 'content-visibility: auto',
      desc: 'VehicleCard uses content-visibility (stronger than contain)',
    },
    {
      file: 'app/components/catalog/VehicleTable.vue',
      expectation: 'content-visibility: auto',
      desc: 'VehicleTable uses content-visibility',
    },
    {
      file: 'app/components/dashboard/vehiculos/DealerVehicleCard.vue',
      expectation: 'contain: layout style paint',
      desc: 'DealerVehicleCard has contain',
    },
    {
      file: 'app/components/dashboard/pipeline/PipelineCard.vue',
      expectation: 'contain: layout style paint',
      desc: 'PipelineCard has contain',
    },
    {
      file: 'app/components/dashboard/herramientas/ToolCard.vue',
      expectation: 'contain: layout style paint',
      desc: 'ToolCard has contain',
    },
  ]

  for (const comp of heavyComponents) {
    it(comp.desc, () => {
      const fullPath = resolve(ROOT, comp.file)
      expect(existsSync(fullPath), `${comp.file} exists`).toBe(true)
      const content = readFile(comp.file)
      expect(content).toContain(comp.expectation)
    })
  }

  it('VehicleCard has contain-intrinsic-size for stable scrolling', () => {
    const content = readFile('app/components/catalog/VehicleCard.vue')
    expect(content).toContain('contain-intrinsic-size')
  })
})
