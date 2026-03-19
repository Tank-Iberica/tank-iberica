#!/usr/bin/env node
/**
 * Classify test files as BEHAVIORAL, STRUCTURAL, or MIXED.
 *
 * Heuristics:
 * - BEHAVIORAL: imports from source code (server/, app/, scripts/) and executes functions
 * - STRUCTURAL: only reads files with readFileSync/existsSync + toContain assertions
 * - MIXED: has both source imports AND readFileSync patterns
 *
 * Usage: node scripts/classify-tests.mjs [--json] [--structural-only]
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, relative } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const TESTS_DIR = resolve(ROOT, 'tests/unit')
const args = process.argv.slice(2)
const jsonOutput = args.includes('--json')
const structuralOnly = args.includes('--structural-only')

function getAllTestFiles(dir) {
  const results = []
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

function classifyTest(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const rel = relative(ROOT, filePath)

  // The quality gate itself contains structural pattern strings in its code —
  // skip meta-classification to avoid false positive.
  if (rel.includes('test-quality-gate')) {
    const testCount = (content.match(/\bit\(/g) || []).length
    return { file: rel, type: 'BEHAVIORAL', testCount }
  }

  // Detect source imports (behavioral indicator)
  const sourceImportPatterns = [
    /import\s+.*from\s+['"]\.\.\/.*(?:server|app|scripts)\//,
    /import\s+.*from\s+['"].*(?:server|app)\/(?:utils|composables|components|services|api)\//,
  ]
  const hasSourceImports = sourceImportPatterns.some(p => p.test(content))

  // Detect readFileSync usage (structural indicator)
  const hasReadFileSync = content.includes('readFileSync')
  const hasExistsSync = content.includes('existsSync')

  // Detect toContain on file content (structural pattern)
  // Only check these patterns when readFileSync is present — otherwise
  // variables like `content` may be function output, not file content.
  const structuralPatterns = [
    /readFileSync\(.*\)[\s\S]*?expect\(.*\)\.toContain\(/,
    /content\)\.toContain\(/,
    /sql\)\.toContain\(/,
    /source\)\.toContain\(/,
  ]
  // Also detect audit patterns: readFileSync + .includes() used as assertion proxy
  // Note: globSync/readdirSync alone is too broad (catches the quality gate itself)
  const auditPatterns = [
    /readFileSync\(.*\)[\s\S]*?\.includes\([\s\S]*?expect\(.*\)\.toBe\(true\)/,
    /readFileSync\(.*\)[\s\S]*?\.match\([\s\S]*?expect\(.*\)\.toEqual\(\[\]\)/,
    /globSync.*readFileSync/, // scanning dirs + reading source files = audit
  ]
  const hasAuditPatterns = hasReadFileSync && auditPatterns.some(p => p.test(content))
  const hasStructuralAssertions = hasReadFileSync && (structuralPatterns.some(p => p.test(content)) || hasAuditPatterns)

  // Detect behavioral patterns
  const behavioralPatterns = [
    /expect\(.*\)\.toBe\(/,
    /expect\(.*\)\.toEqual\(/,
    /expect\(.*\)\.toBeCloseTo\(/,
    /expect\(.*\)\.toHaveBeenCalledWith\(/,
    /expect\(.*\)\.rejects\.toThrow\(/,
    /await\s+\w+\(/,  // async function calls
    /\.mockResolvedValue/,
    /\.mockReturnValue/,
  ]
  const hasBehavioralPatterns = behavioralPatterns.some(p => p.test(content))

  // Classify
  let type
  if (hasSourceImports && hasStructuralAssertions) {
    type = 'MIXED'
  } else if (hasSourceImports && hasBehavioralPatterns) {
    type = 'BEHAVIORAL'
  } else if (hasReadFileSync && hasStructuralAssertions && !hasSourceImports) {
    type = 'STRUCTURAL'
  } else if (hasSourceImports) {
    type = 'BEHAVIORAL'
  } else if ((hasReadFileSync || hasExistsSync) && !hasBehavioralPatterns) {
    type = 'STRUCTURAL' // reads files with no behavioral assertions
  } else if (hasReadFileSync && hasBehavioralPatterns && !hasStructuralAssertions) {
    type = 'BEHAVIORAL' // reads files + parses/asserts structure (config tests)
  } else if (hasExistsSync && !hasBehavioralPatterns) {
    type = 'STRUCTURAL' // only checks file existence
  } else {
    type = 'BEHAVIORAL' // no file reading, likely imports and tests
  }

  // Count test cases
  const testCount = (content.match(/\bit\(/g) || []).length

  return { file: rel, type, testCount }
}

// ── Main ──────────────────────────────────────────────────────────────────

const testFiles = getAllTestFiles(TESTS_DIR)
const results = testFiles.map(classifyTest)

const structural = results.filter(r => r.type === 'STRUCTURAL')
const behavioral = results.filter(r => r.type === 'BEHAVIORAL')
const mixed = results.filter(r => r.type === 'MIXED')

if (jsonOutput) {
  console.log(JSON.stringify({ structural, behavioral, mixed, summary: {
    total: results.length,
    structural: structural.length,
    behavioral: behavioral.length,
    mixed: mixed.length,
    structuralTests: structural.reduce((s, r) => s + r.testCount, 0),
    behavioralTests: behavioral.reduce((s, r) => s + r.testCount, 0),
    mixedTests: mixed.reduce((s, r) => s + r.testCount, 0),
  }}, null, 2))
} else if (structuralOnly) {
  console.log(`\n🔍 STRUCTURAL test files (${structural.length}):\n`)
  for (const r of structural.sort((a, b) => b.testCount - a.testCount)) {
    console.log(`  ${r.file} (${r.testCount} tests)`)
  }
  console.log(`\n  Total: ${structural.reduce((s, r) => s + r.testCount, 0)} structural tests across ${structural.length} files`)
} else {
  console.log('\n📊 Test Classification Report\n')
  console.log('─'.repeat(60))
  console.log(`  Total test files:  ${results.length}`)
  console.log(`  BEHAVIORAL:        ${behavioral.length} files (${behavioral.reduce((s, r) => s + r.testCount, 0)} tests)`)
  console.log(`  STRUCTURAL:        ${structural.length} files (${structural.reduce((s, r) => s + r.testCount, 0)} tests)`)
  console.log(`  MIXED:             ${mixed.length} files (${mixed.reduce((s, r) => s + r.testCount, 0)} tests)`)
  console.log('─'.repeat(60))

  if (structural.length > 0) {
    console.log(`\n🔴 STRUCTURAL (read file + toContain only — ${structural.length} files):\n`)
    for (const r of structural.sort((a, b) => b.testCount - a.testCount)) {
      console.log(`  ${String(r.testCount).padStart(3)} tests  ${r.file}`)
    }
  }

  if (mixed.length > 0) {
    console.log(`\n🟡 MIXED (source imports + readFileSync — ${mixed.length} files):\n`)
    for (const r of mixed.sort((a, b) => b.testCount - a.testCount)) {
      console.log(`  ${String(r.testCount).padStart(3)} tests  ${r.file}`)
    }
  }

  console.log(`\n🟢 BEHAVIORAL (imports + executes source code — ${behavioral.length} files):\n`)
  for (const r of behavioral.sort((a, b) => b.testCount - a.testCount)) {
    console.log(`  ${String(r.testCount).padStart(3)} tests  ${r.file}`)
  }
}
