/**
 * Tests for useDashboardMercado composable — pure utility functions.
 */
import { describe, it, expect } from 'vitest'
import {
  positionClass,
  positionIcon,
  formatDeviation,
} from '../../app/composables/dashboard/useDashboardMercado'

describe('positionClass', () => {
  it('returns pos-below for below position', () => {
    expect(positionClass('below')).toBe('pos-below')
  })

  it('returns pos-above for above position', () => {
    expect(positionClass('above')).toBe('pos-above')
  })

  it('returns pos-average for average position', () => {
    expect(positionClass('average')).toBe('pos-average')
  })
})

describe('positionIcon', () => {
  it('returns down arrow for below', () => {
    expect(positionIcon('below')).toBe('↓')
  })

  it('returns up arrow for above', () => {
    expect(positionIcon('above')).toBe('↑')
  })

  it('returns equals sign for average', () => {
    expect(positionIcon('average')).toBe('=')
  })
})

describe('formatDeviation', () => {
  it('formats zero as 0%', () => {
    expect(formatDeviation(0)).toBe('0%')
  })

  it('formats positive deviation with + prefix', () => {
    expect(formatDeviation(15.5)).toBe('+15.5%')
  })

  it('formats negative deviation without + prefix', () => {
    expect(formatDeviation(-8.3)).toBe('-8.3%')
  })

  it('formats exact integer', () => {
    expect(formatDeviation(10)).toBe('+10.0%')
  })

  it('formats negative integer', () => {
    expect(formatDeviation(-25)).toBe('-25.0%')
  })

  it('rounds to 1 decimal place', () => {
    expect(formatDeviation(12.567)).toBe('+12.6%')
  })
})
