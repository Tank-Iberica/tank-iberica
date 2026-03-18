import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')

describe('LQIP blur-up placeholder for vehicle images', () => {
  describe('VehicleCard', () => {
    const card = readFileSync(resolve(ROOT, 'app/components/catalog/VehicleCard.vue'), 'utf-8')

    it('uses NuxtImg with placeholder prop', () => {
      expect(card).toContain('<NuxtImg')
      expect(card).toContain('placeholder')
    })

    it('uses cloudinary provider for optimization', () => {
      expect(card).toContain('provider="cloudinary"')
    })

    it('uses webp format', () => {
      expect(card).toContain('format="webp"')
    })

    it('has responsive sizes attribute', () => {
      expect(card).toContain('sizes=')
    })
  })

  describe('ImageGallery', () => {
    const gallery = readFileSync(resolve(ROOT, 'app/components/vehicle/ImageGallery.vue'), 'utf-8')

    it('uses NuxtImg with placeholder prop (main image)', () => {
      expect(gallery).toContain('placeholder')
    })

    it('uses cloudinary provider', () => {
      expect(gallery).toContain('cloudinary')
    })
  })

  describe('Nuxt Image config', () => {
    const config = readFileSync(resolve(ROOT, 'nuxt.config.ts'), 'utf-8')

    it('has image module configured', () => {
      expect(config).toContain('image')
    })

    it('has cloudinary provider configured', () => {
      expect(config).toContain('cloudinary')
    })
  })
})
