import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'

describe('Product status generation script', () => {
  const scriptPath = resolve(__dirname, '../../scripts/generate-product-status.mjs')
  const outputPath = resolve(__dirname, '../../docs/ESTADO-REAL-PRODUCTO.md')

  it('script file exists', () => {
    expect(existsSync(scriptPath)).toBe(true)
  })

  it('script executes without errors', () => {
    const result = execSync(`node ${scriptPath}`, {
      encoding: 'utf-8',
      cwd: resolve(__dirname, '../..'),
    })
    expect(result).toContain('Generated')
  })

  it('output file is generated', () => {
    expect(existsSync(outputPath)).toBe(true)
  })

  it('output contains expected sections', () => {
    const content = readFileSync(outputPath, 'utf-8')

    expect(content).toContain('# Estado Real del Producto')
    expect(content).toContain('## Métricas del Código')
    expect(content).toContain('## Git')
    expect(content).toContain('## Stack')
    expect(content).toContain('## Arquitectura')
  })

  it('output contains non-zero metrics', () => {
    const content = readFileSync(outputPath, 'utf-8')

    // Pages should be > 50
    const pagesMatch = content.match(/\*\*Páginas \(total\)\*\*\s*\|\s*(\d+)/)
    expect(pagesMatch).not.toBeNull()
    expect(Number(pagesMatch![1])).toBeGreaterThan(50)

    // Components should be > 100
    const compMatch = content.match(/\*\*Componentes Vue\*\*\s*\|\s*(\d+)/)
    expect(compMatch).not.toBeNull()
    expect(Number(compMatch![1])).toBeGreaterThan(100)

    // Composables should be > 100
    const composMatch = content.match(/\*\*Composables\*\*\s*\|\s*(\d+)/)
    expect(composMatch).not.toBeNull()
    expect(Number(composMatch![1])).toBeGreaterThan(100)

    // Tests should be > 100
    const testsMatch = content.match(/\*\*Tests unitarios\*\*\s*\|\s*(\d+)/)
    expect(testsMatch).not.toBeNull()
    expect(Number(testsMatch![1])).toBeGreaterThan(100)
  })
})
