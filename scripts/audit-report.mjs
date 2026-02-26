#!/usr/bin/env node
/**
 * Audit Report Consolidator
 * Reads artifacts from the daily audit workflow and generates a summary.
 */
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs'
import { join } from 'node:path'

const ARTIFACTS_DIR = 'audit-artifacts'

function readJSON(path) {
  try {
    if (!existsSync(path)) return null
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return null
  }
}

function readText(path) {
  try {
    if (!existsSync(path)) return ''
    return readFileSync(path, 'utf-8')
  } catch {
    return ''
  }
}

// ── Semgrep ──
const semgrepPath = join(ARTIFACTS_DIR, 'semgrep-results', 'semgrep-results.json')
const semgrepData = readJSON(semgrepPath)
const semgrepErrors = semgrepData?.results?.filter(r => r.extra?.severity === 'ERROR')?.length || 0
const semgrepWarnings = semgrepData?.results?.filter(r => r.extra?.severity === 'WARNING')?.length || 0
const semgrepTotal = semgrepData?.results?.length || 0

// ── npm audit ──
const npmPath = join(ARTIFACTS_DIR, 'npm-audit-results', 'npm-audit.json')
const npmData = readJSON(npmPath)
const npmVulns = npmData?.metadata?.vulnerabilities || {}
const npmCritical = npmVulns.critical || 0
const npmHigh = npmVulns.high || 0
const npmModerate = npmVulns.moderate || 0

// ── ESLint ──
const eslintPath = join(ARTIFACTS_DIR, 'lint-typecheck', 'eslint-report.json')
const eslintData = readJSON(eslintPath)
let eslintErrors = 0
let eslintWarnings = 0
if (Array.isArray(eslintData)) {
  for (const file of eslintData) {
    eslintErrors += file.errorCount || 0
    eslintWarnings += file.warningCount || 0
  }
}

// ── Typecheck ──
const typecheckPath = join(ARTIFACTS_DIR, 'lint-typecheck', 'typecheck.log')
const typecheckLog = readText(typecheckPath)
const typecheckErrors = (typecheckLog.match(/error TS/g) || []).length

// ── Extensibility ──
const extPath = join(ARTIFACTS_DIR, 'extensibility-report', 'extensibility-report.txt')
const extReport = readText(extPath)
const hardcodedLines = extReport.split('\n').filter(l => l.match(/^\s*\w/) && !l.startsWith('===') && !l.startsWith('##') && !l.includes('None found')).length

// ── Build ──
// Build job outcome is inferred: if build-failure-log artifact exists, it failed
const buildFailed = existsSync(join(ARTIFACTS_DIR, 'build-failure-log'))

// ── Overall status ──
let overall = 'green'
if (npmCritical > 0 || semgrepErrors > 0 || buildFailed) {
  overall = 'red'
} else if (npmHigh > 0 || semgrepWarnings > 5 || eslintErrors > 20 || typecheckErrors > 50 || hardcodedLines > 10) {
  overall = 'yellow'
}

const summary = {
  date: new Date().toISOString().slice(0, 10),
  semgrep: { errors: semgrepErrors, warnings: semgrepWarnings, total: semgrepTotal },
  npm: { critical: npmCritical, high: npmHigh, moderate: npmModerate },
  eslint: { errors: eslintErrors, warnings: eslintWarnings },
  typecheck: { errors: typecheckErrors },
  extensibility: { hardcoded_count: hardcodedLines },
  build: buildFailed ? 'fail' : 'pass',
  overall,
}

console.log('=== Audit Summary ===')
console.log(JSON.stringify(summary, null, 2))

writeFileSync('audit-summary.json', JSON.stringify(summary, null, 2))

// Set GitHub Actions env var
if (overall !== 'green' && process.env.GITHUB_ENV) {
  appendFileSync(process.env.GITHUB_ENV, 'AUDIT_HAS_ISSUES=true\n')
}

console.log(`\nOverall status: ${overall}`)
