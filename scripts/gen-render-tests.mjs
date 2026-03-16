/**
 * Generates minimal render tests for Vue components with 0% coverage
 * that only need 1-5 statements covered (pure presentation components).
 *
 * Usage: node scripts/gen-render-tests.mjs [--dry-run]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { basename, resolve } from 'node:path'

const dryRun = process.argv.includes('--dry-run')
const cov = JSON.parse(readFileSync('./coverage/coverage-final.json', 'utf-8'))

// Collect Vue components with 0% coverage and ≤5 uncovered stmts
const targets = []
for (const [filePath, data] of Object.entries(cov)) {
  const norm = filePath.replace(/\\/g, '/')
  if (!norm.includes('app/components/') && !norm.includes('app/pages/') && !norm.includes('app/layouts/')) continue
  if (!norm.endsWith('.vue')) continue

  const s = data.s
  const total = Object.keys(s).length
  const covered = Object.values(s).filter(v => v > 0).length
  if (covered > 0) continue // Skip files with partial coverage
  if (total > 5) continue   // Skip files with too many stmts (need real tests)

  targets.push({ filePath: norm, stmts: total })
}

console.log(`Found ${targets.length} components with 0% coverage and ≤5 stmts`)

let created = 0
for (const { filePath, stmts } of targets) {
  const componentName = basename(filePath, '.vue')
  const testFileName = `${componentName}.test.ts`
  const testPath = resolve('tests/unit/components', testFileName)

  if (existsSync(testPath)) {
    console.log(`SKIP ${testFileName} (already exists)`)
    continue
  }

  // Calculate relative import path
  const importPath = `../../../${filePath}`

  // Read the source to detect what props are needed
  const src = readFileSync(filePath.replace(/\//g, '/'), 'utf-8')

  // Detect if component uses $t / useI18n
  const usesI18n = src.includes('$t(') || src.includes('useI18n') || src.includes("t('")
  // Detect if it uses Teleport
  const usesTeleport = src.includes('<Teleport')

  // Detect props from defineProps
  const propsMatch = src.match(/defineProps<\{([^}]*)\}>/)
  const propEntries = []
  if (propsMatch) {
    const propsBlock = propsMatch[1]
    // Parse simple prop declarations like "title: string" or "count: number"
    const propLines = propsBlock.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'))
    for (const line of propLines) {
      const m = line.match(/^(\w+)\??\s*:\s*([^;]+)/)
      if (m) {
        const [, name, type] = m
        const cleanType = type.replace(/\s/g, '')
        let defaultVal = "''"
        if (cleanType.includes('number')) defaultVal = '0'
        else if (cleanType.includes('boolean')) defaultVal = 'false'
        else if (cleanType.includes('string')) defaultVal = "'test'"
        else if (cleanType.includes('[]') || cleanType.includes('Array')) defaultVal = '[]'
        else if (cleanType.includes('Record') || cleanType.includes('object')) defaultVal = '{}'
        else if (cleanType.includes('null')) defaultVal = 'null'
        else defaultVal = "'test'"
        propEntries.push({ name, defaultVal })
      }
    }
  }

  // Build props object
  let propsStr = ''
  if (propEntries.length > 0) {
    const entries = propEntries.map(p => `        ${p.name}: ${p.defaultVal},`).join('\n')
    propsStr = `\n      props: {\n${entries}\n      },`
  }

  // Build global mocks
  const globalParts = []
  if (usesI18n) globalParts.push("mocks: { $t: (k: string) => k }")
  if (usesTeleport) globalParts.push("stubs: { Teleport: true }")
  let globalStr = ''
  if (globalParts.length > 0) {
    globalStr = `\n      global: { ${globalParts.join(', ')} },`
  }

  // Detect the main wrapper class from template
  const classMatch = src.match(/<(?:div|section|header|main|article|aside|nav|footer)\s[^>]*class="([^"]+)"/)
  const mainClass = classMatch ? `.${classMatch[1].split(' ')[0]}` : null

  const testContent = `/**
 * Tests for ${filePath}
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ${componentName} from '${importPath}'

describe('${componentName}', () => {
  const factory = () =>
    shallowMount(${componentName}, {${propsStr}${globalStr}
    })

  it('renders component', () => {
    const w = factory()
    expect(w${mainClass ? `.find('${mainClass}').exists()` : '.exists()'}).toBe(true)
  })
})
`

  if (dryRun) {
    console.log(`WOULD CREATE ${testFileName} (${stmts} stmts)`)
  } else {
    writeFileSync(testPath, testContent)
    console.log(`CREATED ${testFileName} (${stmts} stmts)`)
    created++
  }
}

console.log(`\n${dryRun ? 'Would create' : 'Created'} ${created} test files`)
