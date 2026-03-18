import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')

/** Tables that must be responsive on mobile */
const TABLE_COMPONENTS = [
  'app/components/ui/DataTable.vue',
  'app/components/catalog/VehicleTable.vue',
  'app/components/dashboard/historico/HistoricoTable.vue',
  'app/components/dashboard/herramientas/mantenimientos/MantenimientosTable.vue',
  'app/components/dashboard/herramientas/alquileres/AlquilerTable.vue',
]

describe('Responsive tables on mobile', () => {
  for (const tablePath of TABLE_COMPONENTS) {
    const name = tablePath.split('/').pop()!.replace('.vue', '')

    it(`${name} has horizontal scroll for overflow`, () => {
      const content = readFileSync(resolve(ROOT, tablePath), 'utf-8')
      expect(content).toContain('overflow-x')
    })
  }

  describe('UiDataTable mobile handling', () => {
    const dt = readFileSync(resolve(ROOT, 'app/components/ui/DataTable.vue'), 'utf-8')

    it('has mobile media query', () => {
      expect(dt).toContain('@media (max-width: 767px)')
    })

    it('uses touch-friendly overflow scrolling', () => {
      expect(dt).toContain('-webkit-overflow-scrolling: touch')
    })

    it('provides empty state for zero results', () => {
      expect(dt).toContain('data-table-empty')
    })
  })

  describe('VehicleTable responsive', () => {
    const vt = readFileSync(resolve(ROOT, 'app/components/catalog/VehicleTable.vue'), 'utf-8')

    it('has responsive width handling', () => {
      expect(vt).toContain('overflow')
    })
  })
})
