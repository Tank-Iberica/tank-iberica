import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { globSync } from 'tinyglobby'

/**
 * Verifies Chart.js is lazy-loaded via defineAsyncComponent,
 * never imported statically in the public bundle.
 */

const ROOT = resolve(__dirname, '../../..')

function readFile(relPath: string): string {
  return readFileSync(resolve(ROOT, relPath), 'utf-8')
}

describe('Chart.js lazy loading', () => {
  it('no static "import { Chart } from chart.js" in any component', () => {
    const files = globSync(['app/**/*.vue', 'app/**/*.ts'], { cwd: ROOT })
    const staticImports: string[] = []

    for (const file of files) {
      const content = readFile(file)
      // Only flag non-type imports
      if (/import\s+\{[^}]*Chart[^}]*\}\s+from\s+['"]chart\.js['"]/.test(content) &&
          !/import\s+type\s+/.test(content.match(/import\s+.*Chart.*from\s+['"]chart\.js['"]/)?.[0] ?? '')) {
        staticImports.push(file)
      }
    }

    expect(staticImports, `Static Chart.js imports found in: ${staticImports.join(', ')}`).toHaveLength(0)
  })

  it('Chart.js usage is via defineAsyncComponent', () => {
    const chartComponents = [
      'app/components/datos/DatosPriceChart.vue',
      'app/components/admin/dashboard/MetricsChartsGrid.vue',
      'app/components/admin/infra/InfraHistory.vue',
    ]

    for (const file of chartComponents) {
      const fullPath = resolve(ROOT, file)
      if (!existsSync(fullPath)) continue
      const content = readFile(file)
      expect(content, `${file} should use defineAsyncComponent for Chart.js`)
        .toContain('defineAsyncComponent')
      expect(content, `${file} should dynamically import chart.js`)
        .toContain("import('chart.js')")
    }
  })

  it('vue-chartjs is imported dynamically too', () => {
    const chartComponents = [
      'app/components/datos/DatosPriceChart.vue',
      'app/components/admin/dashboard/MetricsChartsGrid.vue',
    ]

    for (const file of chartComponents) {
      const fullPath = resolve(ROOT, file)
      if (!existsSync(fullPath)) continue
      const content = readFile(file)
      expect(content, `${file} should dynamically import vue-chartjs`)
        .toContain("import('vue-chartjs')")
    }
  })

  it('only type imports from chart.js at top level', () => {
    const files = globSync(['app/**/*.{vue,ts}'], { cwd: ROOT })
    const violations: string[] = []

    for (const file of files) {
      const content = readFile(file)
      const lines = content.split('\n')
      for (const line of lines) {
        // Match top-level imports from chart.js that are NOT type-only
        if (line.match(/^import\s+\{/) && line.includes("from 'chart.js'") && !line.includes('import type')) {
          violations.push(file)
        }
      }
    }

    expect(violations, `Non-type chart.js imports: ${violations.join(', ')}`).toHaveLength(0)
  })
})
