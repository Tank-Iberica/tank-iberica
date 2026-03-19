import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')

describe('Interactive Dependency Graph (F45)', () => {
  it('script executes without errors', () => {
    const output = execSync('node scripts/dependency-graph-html.mjs', {
      cwd: ROOT,
      encoding: 'utf-8',
    })
    expect(output).toContain('Dependency graph generated')
  })

  it('generates HTML file', () => {
    expect(existsSync(resolve(ROOT, 'docs/dependency-graph.html'))).toBe(true)
  })

  it('HTML contains Mermaid diagram', () => {
    const html = readFileSync(resolve(ROOT, 'docs/dependency-graph.html'), 'utf-8')
    expect(html).toContain('mermaid')
    expect(html).toContain('flowchart LR')
  })

  it('HTML has filter controls', () => {
    const html = readFileSync(resolve(ROOT, 'docs/dependency-graph.html'), 'utf-8')
    expect(html).toContain('filterGraph')
    expect(html).toContain('filterModule')
    expect(html).toContain('<input')
    expect(html).toContain('<select')
  })

  it('reports cycle count', () => {
    const html = readFileSync(resolve(ROOT, 'docs/dependency-graph.html'), 'utf-8')
    expect(html).toContain('Cycles:')
  })

  it('has module subgraphs', () => {
    const html = readFileSync(resolve(ROOT, 'docs/dependency-graph.html'), 'utf-8')
    expect(html).toContain('subgraph')
  })

  it('includes graph data as JSON for interactivity', () => {
    const html = readFileSync(resolve(ROOT, 'docs/dependency-graph.html'), 'utf-8')
    expect(html).toContain('graphData')
    expect(html).toContain('"nodes"')
    expect(html).toContain('"edges"')
  })
})
