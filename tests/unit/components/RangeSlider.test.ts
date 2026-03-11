/**
 * Tests for app/components/ui/RangeSlider.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { computed } from 'vue'

beforeAll(() => {
  vi.stubGlobal('computed', computed)
})

import RangeSlider from '../../../app/components/ui/RangeSlider.vue'

describe('RangeSlider', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(RangeSlider, {
      props: {
        min: 0,
        max: 100,
        modelMin: null,
        modelMax: null,
        ...overrides,
      },
    })

  it('renders range-slider container', () => {
    const w = factory()
    expect(w.find('.range-slider').exists()).toBe(true)
  })

  it('renders two range inputs', () => {
    const w = factory()
    expect(w.findAll('input[type="range"]')).toHaveLength(2)
  })

  it('shows min label as min value when modelMin is null', () => {
    const w = factory({ min: 0, max: 100, modelMin: null })
    expect(w.find('.range-slider__val--min').text()).toBe('0')
  })

  it('shows max label as max value when modelMax is null', () => {
    const w = factory({ min: 0, max: 100, modelMax: null })
    expect(w.find('.range-slider__val--max').text()).toBe('100')
  })

  it('shows modelMin value in label when set', () => {
    const w = factory({ modelMin: 25 })
    expect(w.find('.range-slider__val--min').text()).toBe('25')
  })

  it('shows modelMax value in label when set', () => {
    const w = factory({ modelMax: 75 })
    expect(w.find('.range-slider__val--max').text()).toBe('75')
  })

  it('uses formatLabel when provided', () => {
    const w = factory({
      modelMin: 5000,
      modelMax: 50000,
      formatLabel: (n: number) => `${n}€`,
    })
    expect(w.find('.range-slider__val--min').text()).toBe('5000€')
    expect(w.find('.range-slider__val--max').text()).toBe('50000€')
  })

  it('emits update:modelMin on min input', async () => {
    const w = factory({ modelMin: null, modelMax: null })
    const minInput = w.find('.range-slider__input--min')
    Object.defineProperty(minInput.element, 'value', { value: '30', writable: true })
    await minInput.trigger('input')
    expect(w.emitted('update:modelMin')).toBeTruthy()
    expect(w.emitted('update:modelMin')![0]).toEqual([30])
  })

  it('emits update:modelMax on max input', async () => {
    const w = factory({ modelMin: null, modelMax: null })
    const maxInput = w.find('.range-slider__input--max')
    Object.defineProperty(maxInput.element, 'value', { value: '70', writable: true })
    await maxInput.trigger('input')
    expect(w.emitted('update:modelMax')).toBeTruthy()
    expect(w.emitted('update:modelMax')![0]).toEqual([70])
  })

  it('emits null for modelMin when value equals min', async () => {
    const w = factory({ min: 0, max: 100, modelMin: 10 })
    const minInput = w.find('.range-slider__input--min')
    Object.defineProperty(minInput.element, 'value', { value: '0', writable: true })
    await minInput.trigger('input')
    expect(w.emitted('update:modelMin')![0]).toEqual([null])
  })

  it('emits null for modelMax when value equals max', async () => {
    const w = factory({ min: 0, max: 100, modelMax: 90 })
    const maxInput = w.find('.range-slider__input--max')
    Object.defineProperty(maxInput.element, 'value', { value: '100', writable: true })
    await maxInput.trigger('input')
    expect(w.emitted('update:modelMax')![0]).toEqual([null])
  })

  it('renders active track bar', () => {
    const w = factory()
    expect(w.find('.range-slider__track-active').exists()).toBe(true)
  })

  it('has step attribute on inputs', () => {
    const w = factory({ step: 5 })
    const inputs = w.findAll('input[type="range"]')
    expect(inputs[0].attributes('step')).toBe('5')
    expect(inputs[1].attributes('step')).toBe('5')
  })
})
