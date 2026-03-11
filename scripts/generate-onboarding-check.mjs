#!/usr/bin/env node
/**
 * generate-onboarding-check.mjs
 *
 * Auto-generates an onboarding verification report by checking the actual
 * state of the development environment against requirements.
 *
 * Usage: node scripts/generate-onboarding-check.mjs [--json] [--fix]
 *
 * Checks:
 * - Required CLI tools (node, git, docker, gh, supabase, etc.)
 * - Node version compatibility
 * - npm dependencies installed
 * - .env file presence and required keys
 * - Husky hooks configured
 * - Policy engine compiled
 * - Project structure integrity (key dirs/files exist)
 */

import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const OUTPUT_MD = join(ROOT, 'docs', 'tracciona-docs', 'referencia', 'ONBOARDING-CHECK.md')
const outputJson = process.argv.includes('--json')

const checks = []

// ---- Helpers ----
function check(category, name, fn) {
  try {
    const result = fn()
    checks.push({ category, name, ...result })
  } catch (e) {
    checks.push({ category, name, ok: false, detail: `Error: ${e.message}` })
  }
}

function cmdVersion(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', timeout: 5000 }).trim()
  } catch {
    return null
  }
}

function fileExists(relPath) {
  return existsSync(join(ROOT, relPath))
}

// ---- 1. CLI Tools ----
const tools = [
  { name: 'Node.js', cmd: 'node --version', minMajor: 20, required: true },
  { name: 'npm', cmd: 'npm --version', required: true },
  { name: 'Git', cmd: 'git --version', required: true },
  { name: 'Docker', cmd: 'docker --version', required: false },
  { name: 'GitHub CLI', cmd: 'gh --version', required: false },
  { name: 'Supabase CLI', cmd: 'supabase --version', required: false },
  { name: 'k6', cmd: 'k6 version', required: false },
]

for (const tool of tools) {
  check('CLI Tools', tool.name, () => {
    const ver = cmdVersion(tool.cmd)
    if (!ver) {
      return {
        ok: !tool.required,
        detail: tool.required ? 'NOT INSTALLED (required)' : 'Not installed (optional)',
      }
    }
    // Check minimum version for Node
    if (tool.minMajor) {
      const match = ver.match(/v?(\d+)/)
      if (match && parseInt(match[1]) < tool.minMajor) {
        return { ok: false, detail: `${ver} (need v${tool.minMajor}+)` }
      }
    }
    return { ok: true, detail: ver.split('\n')[0] }
  })
}

// ---- 2. Project Structure ----
const requiredPaths = [
  'package.json',
  'nuxt.config.ts',
  'app/app.vue',
  'server/utils/eventStore.ts',
  'supabase/migrations',
  'i18n/es.json',
  'i18n/en.json',
  'CLAUDE.md',
  'CONTRIBUTING.md',
  '.husky/pre-commit',
  '.claude/policy/SECURITY_POLICY.md',
  'shared/types/index.ts',
]

for (const path of requiredPaths) {
  check('Project Structure', path, () => ({
    ok: fileExists(path),
    detail: fileExists(path) ? 'exists' : 'MISSING',
  }))
}

// ---- 3. Dependencies ----
check('Dependencies', 'node_modules', () => ({
  ok: fileExists('node_modules'),
  detail: fileExists('node_modules') ? 'installed' : 'Run: npm install',
}))

check('Dependencies', 'package-lock.json', () => ({
  ok: fileExists('package-lock.json'),
  detail: fileExists('package-lock.json') ? 'exists' : 'MISSING — run npm install',
}))

// ---- 4. Environment ----
check('Environment', '.env file', () => {
  if (!fileExists('.env')) {
    return { ok: false, detail: 'MISSING — copy .env.example → .env' }
  }
  return { ok: true, detail: 'exists' }
})

if (fileExists('.env')) {
  const envContent = readFileSync(join(ROOT, '.env'), 'utf-8')
  const requiredKeys = [
    'SUPABASE_URL',
    'SUPABASE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'RESEND_API_KEY',
    'CRON_SECRET',
  ]

  for (const key of requiredKeys) {
    check('Environment', key, () => {
      const hasKey = envContent.includes(`${key}=`)
      const hasValue = envContent.match(new RegExp(`^${key}=.+`, 'm'))
      if (!hasKey) return { ok: false, detail: 'KEY MISSING from .env' }
      if (!hasValue) return { ok: false, detail: 'Key present but EMPTY' }
      return { ok: true, detail: 'configured' }
    })
  }
}

// ---- 5. Git & Hooks ----
check('Git & Hooks', 'Git repository', () => ({
  ok: fileExists('.git'),
  detail: fileExists('.git') ? 'initialized' : 'NOT a git repo',
}))

check('Git & Hooks', 'Husky hooks', () => {
  const hookPath = join(ROOT, '.husky', 'pre-commit')
  if (!existsSync(hookPath)) return { ok: false, detail: 'pre-commit hook MISSING' }
  const content = readFileSync(hookPath, 'utf-8')
  return {
    ok: content.includes('lint-staged') || content.includes('eslint'),
    detail: content.includes('lint-staged') ? 'lint-staged configured' : 'hook exists',
  }
})

// ---- 6. Policy Engine ----
check('Policy Engine', 'Compiled policy', () => ({
  ok: fileExists('.claude/policy/compiled-policy.json'),
  detail: fileExists('.claude/policy/compiled-policy.json')
    ? 'compiled'
    : 'Run: node .claude/policy/compile-policy.mjs',
}))

check('Policy Engine', 'Policy source', () => ({
  ok: fileExists('.claude/policy/SECURITY_POLICY.md'),
  detail: fileExists('.claude/policy/SECURITY_POLICY.md') ? 'exists' : 'MISSING',
}))

// ---- 7. Migrations count ----
check('Database', 'Migrations', () => {
  const migDir = join(ROOT, 'supabase', 'migrations')
  if (!existsSync(migDir)) return { ok: false, detail: 'migrations dir MISSING' }
  try {
    const files = execSync(`ls "${migDir}" | wc -l`, { encoding: 'utf-8' }).trim()
    return { ok: parseInt(files) > 0, detail: `${files} migration files` }
  } catch {
    return { ok: false, detail: 'could not list migrations' }
  }
})

// ---- 8. Test infrastructure ----
check('Tests', 'Vitest config', () => ({
  ok: fileExists('vitest.config.ts') || fileExists('vitest.config.mts'),
  detail: fileExists('vitest.config.ts') ? 'vitest.config.ts' : fileExists('vitest.config.mts') ? 'vitest.config.mts' : 'MISSING',
}))

check('Tests', 'Test files exist', () => {
  try {
    const count = execSync('find tests -name "*.test.ts" -o -name "*.spec.ts" 2>/dev/null | wc -l', { encoding: 'utf-8' }).trim()
    return { ok: parseInt(count) > 0, detail: `${count} test files` }
  } catch {
    return { ok: false, detail: 'could not count test files' }
  }
})

// ---- Output ----
const passed = checks.filter(c => c.ok).length
const failed = checks.filter(c => !c.ok).length
const total = checks.length

if (outputJson) {
  console.log(JSON.stringify({ passed, failed, total, checks }, null, 2))
  process.exit(failed > 0 ? 1 : 0)
}

// Markdown output
const categories = [...new Set(checks.map(c => c.category))]

let md = `# Onboarding Check — Tracciona

> Auto-generado por \`scripts/generate-onboarding-check.mjs\`
> Generado: ${new Date().toISOString().split('T')[0]}

## Resultado: ${passed}/${total} checks OK${failed > 0 ? ` (${failed} problemas)` : ' — todo correcto'}

`

for (const cat of categories) {
  const catChecks = checks.filter(c => c.category === cat)
  const catPassed = catChecks.filter(c => c.ok).length
  md += `### ${cat} (${catPassed}/${catChecks.length})\n\n`
  md += `| Check | Estado | Detalle |\n|---|---|---|\n`
  for (const c of catChecks) {
    const icon = c.ok ? 'OK' : 'FAIL'
    md += `| ${c.name} | ${icon} | ${c.detail} |\n`
  }
  md += '\n'
}

// Action items
const failures = checks.filter(c => !c.ok)
if (failures.length > 0) {
  md += `## Acciones necesarias\n\n`
  for (const f of failures) {
    md += `- **${f.name}**: ${f.detail}\n`
  }
  md += '\n'
}

md += `## Referencia\n\nPara instrucciones de instalación completas, ver: \`docs/tracciona-docs/referencia/ENTORNO-DESARROLLO.md\`\n`

writeFileSync(OUTPUT_MD, md, 'utf-8')
console.log(`Onboarding check: ${OUTPUT_MD}`)
console.log(`  ${passed}/${total} passed${failed > 0 ? `, ${failed} FAILED` : ' — all good'}`)

process.exit(failed > 0 ? 1 : 0)
