import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, readonly } from 'vue'

// Mock vue reactivity
vi.stubGlobal('ref', ref)
vi.stubGlobal('readonly', readonly)

/**
 * Testing the A/B test composable's pure logic.
 * Since import.meta.client is a compile-time transform,
 * we test by importing and invoking on server-side mode (SSR fallback).
 */
describe('useAbTest', () => {
  let useAbTest: typeof import('../../app/composables/useAbTest').useAbTest

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    const mod = await import('../../app/composables/useAbTest')
    useAbTest = mod.useAbTest
  })

  it('assigns a variant from the list in client mode', () => {
    const { variant } = useAbTest('test-exp', ['control', 'variant-a'])
    // import.meta.client → (true) via vitest transform, so variant is assigned via hash
    expect(['control', 'variant-a']).toContain(variant.value)
  })

  it('isVariant returns true for the assigned variant', () => {
    const { variant, isVariant } = useAbTest('test-exp', ['control', 'variant-a'])
    // The assigned variant should match isVariant check
    expect(isVariant(variant.value!)).toBe(true)
  })

  it('exposes experimentId', () => {
    const { experimentId } = useAbTest('my-exp', ['a', 'b'])
    expect(experimentId).toBe('my-exp')
  })

  it('handles empty variants', () => {
    const { variant } = useAbTest('empty', [])
    expect(variant.value).toBeNull()
  })

  it('handles single variant', () => {
    const { variant } = useAbTest('single', ['only-one'])
    expect(variant.value).toBe('only-one')
  })

  it('returns a ref for variant', () => {
    const { variant } = useAbTest('test', ['a', 'b'])
    expect(variant.value).toBeDefined()
    expect(typeof variant.value).toBe('string')
  })

  it('different experiments can coexist', () => {
    const exp1 = useAbTest('exp-1', ['ctrl', 'var-a'])
    const exp2 = useAbTest('exp-2', ['ctrl', 'var-b'])
    expect(exp1.experimentId).toBe('exp-1')
    expect(exp2.experimentId).toBe('exp-2')
  })
})
