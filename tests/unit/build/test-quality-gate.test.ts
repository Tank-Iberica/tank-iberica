import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, relative } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const TESTS_DIR = resolve(ROOT, 'tests/unit')

/**
 * Test quality gate — prevents regression from BEHAVIORAL → STRUCTURAL tests.
 *
 * Classifies all test files and enforces:
 * 1. Structural test ratio must not exceed threshold
 * 2. New test files should be behavioral (import + execute code)
 *
 * Run classification report: node scripts/classify-tests.mjs
 */

function getAllTestFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...getAllTestFiles(full))
    } else if (entry.name.endsWith('.test.ts')) {
      results.push(full)
    }
  }
  return results
}

function classifyTest(filePath: string): {
  file: string
  type: 'BEHAVIORAL' | 'STRUCTURAL' | 'MIXED'
  testCount: number
} {
  const content = readFileSync(filePath, 'utf-8')
  const rel = relative(ROOT, filePath)

  // Skip self — this file contains structural pattern strings in its code
  if (rel.includes('test-quality-gate')) {
    const testCount = (content.match(/\bit\(/g) || []).length
    return { file: rel, type: 'BEHAVIORAL', testCount }
  }

  const sourceImportPatterns = [
    /import\s+(?:\S.*)?from\s+['"]\.\.\/.*(?:server|app|scripts)\//,
    /import\s+(?:\S.*)?from\s+['"].*(?:server|app)\/(?:utils|composables|components|services|api)\//,
  ]
  const hasSourceImports = sourceImportPatterns.some((p) => p.test(content))

  const hasReadFileSync = content.includes('readFileSync')
  const hasExistsSync = content.includes('existsSync')

  const structuralPatterns = [
    /content\)\.toContain\(/,
    /sql\)\.toContain\(/,
    /source\)\.toContain\(/,
  ]
  // Only check structural patterns when readFileSync is present —
  // otherwise `content` may be function output, not file content.
  const hasStructuralAssertions = hasReadFileSync && structuralPatterns.some((p) => p.test(content))

  const behavioralPatterns = [
    /expect\(.*\)\.toBe\(/,
    /expect\(.*\)\.toEqual\(/,
    /expect\(.*\)\.toHaveBeenCalledWith\(/,
    /await\s+\w+\(/,
    /\.mockResolvedValue/,
    /\.mockReturnValue/,
  ]
  const hasBehavioralPatterns = behavioralPatterns.some((p) => p.test(content))

  let type: 'BEHAVIORAL' | 'STRUCTURAL' | 'MIXED'
  if (hasSourceImports && hasStructuralAssertions) {
    type = 'MIXED'
  } else if (hasSourceImports) {
    type = 'BEHAVIORAL'
  } else if (hasReadFileSync && hasStructuralAssertions && !hasSourceImports) {
    type = 'STRUCTURAL'
  } else if ((hasReadFileSync || hasExistsSync) && !hasBehavioralPatterns) {
    type = 'STRUCTURAL'
  } else if (hasReadFileSync && hasBehavioralPatterns && !hasStructuralAssertions) {
    type = 'BEHAVIORAL' // reads files + parses/asserts structure (config tests)
  } else if (hasExistsSync && !hasBehavioralPatterns) {
    type = 'STRUCTURAL'
  } else {
    type = 'BEHAVIORAL'
  }

  const testCount = (content.match(/\bit\(/g) || []).length
  return { file: rel, type, testCount }
}

describe('Test Quality Gate', () => {
  const testFiles = getAllTestFiles(TESTS_DIR)
  const results = testFiles.map(classifyTest)

  const structural = results.filter((r) => r.type === 'STRUCTURAL')
  const behavioral = results.filter((r) => r.type === 'BEHAVIORAL')
  const mixed = results.filter((r) => r.type === 'MIXED')

  const structuralTestCount = structural.reduce((s, r) => s + r.testCount, 0)
  const totalTestCount = results.reduce((s, r) => s + r.testCount, 0)
  const structuralRatio = structuralTestCount / totalTestCount

  it('zero structural tests in tests/unit/', () => {
    // ENFORCED: 0% structural in tests/unit/
    // Structural tests belong in tests/conformance/ or scripts/audits/
    expect(structuralRatio).toBe(0)
    expect(structural.length).toBe(0)
  })

  it('zero mixed tests in tests/unit/', () => {
    expect(mixed.length).toBe(0)
  })

  it('no structural regression', () => {
    if (structural.length > 0) {
      const structuralFiles = structural.map((s) => s.file).sort()
      throw new Error(
        `${structuralFiles.length} structural file(s) in tests/unit/:\n` +
          structuralFiles.map((f) => `  - ${f}`).join('\n') +
          '\n\nMove to tests/conformance/ or convert to behavioral.',
      )
    }
  })

  it('reports current classification', () => {
    // This test always passes — it logs the current state for visibility
    console.log(
      `\n📊 Test Quality: ${behavioral.length} behavioral, ${structural.length} structural, ${mixed.length} mixed`,
    )
    console.log(
      `   Structural ratio: ${(structuralRatio * 100).toFixed(1)}% (${structuralTestCount}/${totalTestCount})`,
    )
    expect(true).toBe(true)
  })
})
