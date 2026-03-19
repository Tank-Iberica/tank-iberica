import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DOC_PATH = resolve(
  __dirname,
  '../../docs/tracciona-docs/referencia/BOTTLENECKS-LOAD-TESTING.md',
)
const content = readFileSync(DOC_PATH, 'utf-8')

/**
 * Validates BOTTLENECKS-LOAD-TESTING.md has all required sections and structure.
 * Item 0.2 (#292) — Document bottlenecks from load testing.
 */
describe('BOTTLENECKS-LOAD-TESTING.md completeness (#292)', () => {
  it('has a summary table with risk/impact/priority columns', () => {
    expect(content).toContain('| Área')
    expect(content).toContain('| Riesgo')
    expect(content).toContain('| Impacto')
    expect(content).toContain('| Prioridad')
  })

  it('documents at least 5 bottlenecks (B1-B5+)', () => {
    const bottleneckHeaders = content.match(/## B\d+ —/g) || []
    expect(bottleneckHeaders.length).toBeGreaterThanOrEqual(5)
  })

  it('each bottleneck has Descripción, Evidencia, Impacto, Solución, Coste, Métricas', () => {
    const sections = content.split(/## B\d+ —/).slice(1) // Skip content before first B
    for (const section of sections) {
      expect(section).toContain('Descripción')
      expect(section).toContain('Evidencia')
      expect(section).toContain('Impacto')
      expect(section).toContain('Solución propuesta')
      expect(section).toContain('Coste')
      expect(section).toContain('Métricas a validar')
    }
  })

  it('has an inventory of all k6 scripts', () => {
    expect(content).toContain('Inventario de scripts k6')
    expect(content).toContain('k6-full.js')
    expect(content).toContain('spike-test.js')
    expect(content).toContain('write-stress.js')
    expect(content).toContain('k6-load-test.js')
    expect(content).toContain('k6-stress-test.js')
    expect(content).toContain('k6-soak-test.js')
  })

  it('has a consolidated thresholds table', () => {
    expect(content).toContain('Thresholds consolidados')
    expect(content).toContain('Error rate')
    expect(content).toContain('Cache hit rate')
  })

  it('has a prioritized action plan', () => {
    expect(content).toContain('Plan de acción priorizado')
    expect(content).toContain('Esfuerzo')
    expect(content).toContain('Impacto')
  })

  it('references QUERY-BUDGET.md SLOs', () => {
    expect(content).toContain('QUERY-BUDGET')
    expect(content).toContain('SLO')
  })

  it('documents execution procedure', () => {
    expect(content).toContain('Procedimiento de ejecución')
    expect(content).toContain('smoke')
    expect(content).toContain('k6 run')
  })
})
