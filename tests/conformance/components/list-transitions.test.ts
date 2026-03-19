import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')

const FILES = {
  favoritos: readFileSync(resolve(ROOT, 'app/pages/perfil/favoritos.vue'), 'utf-8'),
  comparadorContent: readFileSync(
    resolve(ROOT, 'app/components/perfil/comparador/ComparadorContent.vue'),
    'utf-8',
  ),
  catalogActiveFilters: readFileSync(
    resolve(ROOT, 'app/components/catalog/CatalogActiveFilters.vue'),
    'utf-8',
  ),
  toastContainer: readFileSync(resolve(ROOT, 'app/components/ui/ToastContainer.vue'), 'utf-8'),
}

describe('List transitions (TransitionGroup)', () => {
  describe('Favorites page', () => {
    it('uses TransitionGroup for vehicle list', () => {
      expect(FILES.favoritos).toContain('<TransitionGroup')
      expect(FILES.favoritos).toContain('name="list"')
    })

    it('has enter transition CSS', () => {
      expect(FILES.favoritos).toContain('.list-enter-active')
      expect(FILES.favoritos).toContain('.list-enter-from')
    })

    it('has leave transition CSS', () => {
      expect(FILES.favoritos).toContain('.list-leave-active')
      expect(FILES.favoritos).toContain('.list-leave-to')
    })

    it('has move transition for reordering', () => {
      expect(FILES.favoritos).toContain('.list-move')
    })

    it('respects prefers-reduced-motion', () => {
      expect(FILES.favoritos).toContain('@media (prefers-reduced-motion: reduce)')
    })
  })

  describe('Comparator content', () => {
    it('uses TransitionGroup for vehicle cards', () => {
      expect(FILES.comparadorContent).toContain('<TransitionGroup')
      expect(FILES.comparadorContent).toContain('name="list"')
    })

    it('has enter/leave transitions', () => {
      expect(FILES.comparadorContent).toContain('.list-enter-active')
      expect(FILES.comparadorContent).toContain('.list-leave-to')
    })

    it('respects prefers-reduced-motion', () => {
      expect(FILES.comparadorContent).toContain('@media (prefers-reduced-motion: reduce)')
    })
  })

  describe('Catalog active filters', () => {
    it('uses TransitionGroup', () => {
      expect(FILES.catalogActiveFilters).toContain('<TransitionGroup')
    })
  })

  describe('Toast container', () => {
    it('uses TransitionGroup for toasts', () => {
      expect(FILES.toastContainer).toContain('<TransitionGroup')
    })
  })

  describe('All TransitionGroup usage has :key', () => {
    it('favorites v-for items have :key', () => {
      // Ensure every v-for inside TransitionGroup has a :key
      const vForMatch = FILES.favoritos.match(/v-for="[^"]*"[^>]*:key="[^"]*"/g)
      expect(vForMatch).not.toBeNull()
      expect(vForMatch!.length).toBeGreaterThan(0)
    })

    it('comparator v-for items have :key', () => {
      const vForMatch = FILES.comparadorContent.match(/v-for="[^"]*"[^>]*:key="[^"]*"/g)
      expect(vForMatch).not.toBeNull()
      expect(vForMatch!.length).toBeGreaterThan(0)
    })
  })
})
