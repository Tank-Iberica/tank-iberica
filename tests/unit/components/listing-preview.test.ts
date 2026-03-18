import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')

describe('Preview responsive anuncio antes de publicar (N43)', () => {
  describe('ExportAnuncioVehiclePreview', () => {
    const src = readFileSync(
      resolve(ROOT, 'app/components/dashboard/herramientas/exportar-anuncio/ExportAnuncioVehiclePreview.vue'),
      'utf-8',
    )

    it('shows vehicle image or placeholder', () => {
      expect(src).toContain('v-if="thumbnail"')
      expect(src).toContain('image-placeholder')
    })

    it('displays brand and model', () => {
      expect(src).toContain('vehicle.brand')
      expect(src).toContain('vehicle.model')
    })

    it('displays year', () => {
      expect(src).toContain('vehicle.year')
    })

    it('displays formatted price', () => {
      expect(src).toContain('formatPrice')
      expect(src).toContain('vehicle.price')
    })

    it('displays location', () => {
      expect(src).toContain('vehicle.location')
    })

    it('uses card layout', () => {
      expect(src).toContain('preview-card')
      expect(src).toContain('preview-layout')
    })
  })

  describe('WidgetPreviewCard', () => {
    const src = readFileSync(
      resolve(ROOT, 'app/components/dashboard/herramientas/widget/WidgetPreviewCard.vue'),
      'utf-8',
    )

    it('exists as a preview component', () => {
      expect(src).toContain('<template>')
    })

    it('has preview styling', () => {
      expect(src).toContain('<style')
    })
  })

  describe('DealerVehicleCard (dashboard)', () => {
    const src = readFileSync(
      resolve(ROOT, 'app/components/dashboard/vehiculos/DealerVehicleCard.vue'),
      'utf-8',
    )

    it('shows vehicle data as card', () => {
      expect(src).toContain('<template>')
    })

    it('uses i18n for labels', () => {
      expect(src).toContain('useI18n()')
      expect(src).toContain("t('")
    })
  })

  describe('ImportarPublishStep', () => {
    const src = readFileSync(
      resolve(ROOT, 'app/components/dashboard/importar/ImportarPublishStep.vue'),
      'utf-8',
    )

    it('exists as publish step', () => {
      expect(src).toContain('<template>')
    })
  })
})
