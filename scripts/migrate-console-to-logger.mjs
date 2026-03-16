#!/usr/bin/env node
/**
 * migrate-console-to-logger.mjs
 *
 * Migra console.error/warn → logger.error/warn en server/ de Tracciona.
 *
 * Uso:
 *   node scripts/migrate-console-to-logger.mjs            # ejecutar migración
 *   node scripts/migrate-console-to-logger.mjs --dry-run  # previsualizar sin modificar
 *   node scripts/migrate-console-to-logger.mjs --rollback # restaurar todos los .bak
 *   node scripts/migrate-console-to-logger.mjs --verbose  # output detallado
 *
 * Funcionalidades:
 *   - Detección automática de ruta relativa al logger (cualquier nivel)
 *   - Dedup de imports (no duplica si ya existe)
 *   - Handles multiline console calls (trailing comma, indented arg)
 *   - 3 patrones: single-arg, two-arg(err), two-arg(JSON.stringify)
 *   - Backup automático (.bak) antes de modificar
 *   - Rollback: restaura todos los .bak + elimina manifest
 *   - Idempotente: no reprocesa archivos ya sin console.error/warn
 *   - Reporte final detallado con conteos y errores
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { globSync } from 'glob'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

const DRY_RUN = process.argv.includes('--dry-run')
const ROLLBACK = process.argv.includes('--rollback')
const VERBOSE = process.argv.includes('--verbose')
const MANIFEST_FILE = path.join(__dirname, 'migrate-log.json')

// Files to never touch
const SKIP_FILES = [
  path.join(PROJECT_ROOT, 'server', 'utils', 'logger.ts'), // logger definition itself
]

// ─── Rollback mode ─────────────────────────────────────────────────────────────
if (ROLLBACK) {
  const bakPattern = path.join(PROJECT_ROOT, 'server/**/*.ts.bak').replace(/\\/g, '/')
  const bakFiles = globSync(bakPattern)
  if (bakFiles.length === 0) {
    console.log('No .bak files found. Nothing to rollback.')
    process.exit(0)
  }
  console.log(`Rolling back ${bakFiles.length} file(s)...\n`)
  for (const bak of bakFiles) {
    const original = bak.replace(/\.bak$/, '')
    fs.copyFileSync(bak, original)
    fs.unlinkSync(bak)
    console.log(`  ↩  ${path.relative(PROJECT_ROOT, original)}`)
  }
  if (fs.existsSync(MANIFEST_FILE)) fs.unlinkSync(MANIFEST_FILE)
  console.log('\n✅ Rollback complete.')
  process.exit(0)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Calculate relative import path from a file to server/utils/logger.
 * e.g. server/api/cron/foo.ts → ../../utils/logger
 *      server/services/foo.ts → ../utils/logger
 *      server/utils/foo.ts    → ./logger
 */
function getLoggerImportPath(filePath) {
  const loggerAbsPath = path.join(PROJECT_ROOT, 'server', 'utils', 'logger.ts')
  let rel = path.relative(path.dirname(filePath), loggerAbsPath)
  rel = rel.replace(/\\/g, '/').replace(/\.ts$/, '')
  if (!rel.startsWith('.')) rel = './' + rel
  return rel
}

/**
 * True if the file already imports anything from our logger module.
 */
function alreadyImportsLogger(content) {
  return /from\s+['"][./]*utils\/logger['"]/.test(content)
}

/**
 * True if the file has any console.error or console.warn call.
 */
function hasConsoleCalls(content) {
  return /console\.(?:error|warn)\(/.test(content)
}

/**
 * Insert importLine after the last import statement in content.
 * Handles both single-line and multi-line imports (brace depth tracking).
 */
function addImportAfterLastImport(content, importLine) {
  const lines = content.split('\n')
  let lastImportEndIdx = -1
  let depth = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (depth === 0 && /^import\s/.test(line)) {
      lastImportEndIdx = i
      const opens = (line.match(/\{/g) || []).length
      const closes = (line.match(/\}/g) || []).length
      depth += opens - closes
    } else if (depth > 0) {
      const opens = (line.match(/\{/g) || []).length
      const closes = (line.match(/\}/g) || []).length
      depth += opens - closes
      if (depth <= 0) {
        lastImportEndIdx = i
        depth = 0
      }
    }
  }

  if (lastImportEndIdx === -1) {
    // No imports found — prepend
    return importLine + '\n' + content
  }
  lines.splice(lastImportEndIdx + 1, 0, importLine)
  return lines.join('\n')
}

/**
 * Apply all console.error/warn → logger.error/warn replacements.
 *
 * Pattern order (most specific → least specific):
 *   1. console.X('msg', JSON.stringify(obj)) → logger.X('msg', obj)
 *   2. console.X('msg', errVar)              → logger.X('msg', { error: String(errVar) })
 *   3. console.X('msg')                      → logger.X('msg')
 *
 * All patterns support:
 *   - single-line and multiline calls (trailing comma, indented arg)
 *   - single quotes, double quotes, template literals
 */
function applyReplacements(content) {
  let replaced = 0

  // Shared: match any string or template literal arg (single-line or multiline)
  // [^`]* matches newlines because it means "not a backtick"
  // [^']* matches newlines similarly
  const STR = /`[^`]*`|'[^']*'|"[^"]*"/

  // Pattern 1: console.X(msg, JSON.stringify(identifier)) → logger.X(msg, identifier)
  // Handles trailing comma before the closing paren (common in multiline calls)
  const P1 = new RegExp(
    `console\\.(error|warn)\\(\\s*(${STR.source})\\s*,\\s*JSON\\.stringify\\((\\w+)\\),?\\s*\\)`,
    'gs',
  )
  content = content.replace(P1, (_, method, msg, obj) => {
    replaced++
    return `logger.${method}(${msg}, ${obj})`
  })

  // Pattern 2: console.X(msg, expr) → logger.X(msg, { error: String(expr) })
  // Handles: identifier, member.access (e.g. err.message, obj.prop.field)
  // Excludes matches already handled by pattern 1 (they're already replaced)
  const P2 = new RegExp(
    `console\\.(error|warn)\\(\\s*(${STR.source})\\s*,\\s*(\\w+(?:\\.\\w+)*)\\s*\\)`,
    'gs',
  )
  content = content.replace(P2, (_, method, msg, expr) => {
    replaced++
    return `logger.${method}(${msg}, { error: String(${expr}) })`
  })

  // Pattern 3: console.X(msg) — single arg, optional trailing comma
  const P3 = new RegExp(
    `console\\.(error|warn)\\(\\s*(${STR.source}),?\\s*\\)`,
    'gs',
  )
  content = content.replace(P3, (_, method, msg) => {
    replaced++
    return `logger.${method}(${msg})`
  })

  return { content, replaced }
}

// ─── Main migration ────────────────────────────────────────────────────────────

const pattern = path.join(PROJECT_ROOT, 'server/**/*.ts').replace(/\\/g, '/')
const files = globSync(pattern).filter((f) => {
  const normalized = f.replace(/\\/g, '/')
  if (normalized.includes('.test.ts')) return false
  if (SKIP_FILES.some((skip) => normalized === skip.replace(/\\/g, '/'))) return false
  return true
})

const report = {
  totalScanned: files.length,
  skippedNoConsole: 0,
  migrated: 0,
  totalReplacements: 0,
  errors: [],
  details: [],
}

if (DRY_RUN) {
  console.log('─'.repeat(60))
  console.log('DRY RUN — no files will be modified')
  console.log('─'.repeat(60) + '\n')
}

for (const file of files) {
  const relFile = path.relative(PROJECT_ROOT, file).replace(/\\/g, '/')
  let content

  try {
    content = fs.readFileSync(file, 'utf8')
  } catch (err) {
    console.error(`  ✗ Cannot read ${relFile}: ${err.message}`)
    report.errors.push({ file: relFile, error: `read error: ${err.message}` })
    continue
  }

  // Skip if no console calls at all
  if (!hasConsoleCalls(content)) {
    report.skippedNoConsole++
    if (VERBOSE) console.log(`  ─  ${relFile} (no console calls)`)
    continue
  }

  const loggerPath = getLoggerImportPath(file)

  if (DRY_RUN) {
    const { content: newContent, replaced } = applyReplacements(content)
    if (replaced > 0) {
      console.log(`  ✓  ${relFile} (${replaced} replacement${replaced > 1 ? 's' : ''})`)
      if (VERBOSE) {
        // Show diff-like output
        const oldLines = content.split('\n')
        const newLines = newContent.split('\n')
        oldLines.forEach((line, i) => {
          if (line !== newLines[i]) {
            console.log(`     - ${line.trim()}`)
            console.log(`     + ${newLines[i]?.trim() ?? '(removed)'}`)
          }
        })
      }
    } else {
      console.log(`  ?  ${relFile} (has console calls but no pattern matched — manual review)`)
    }
    continue
  }

  // ── Real migration ──────────────────────────────────────────────────────────

  // 1. Backup
  try {
    fs.copyFileSync(file, file + '.bak')
  } catch (err) {
    console.error(`  ✗  ${relFile}: backup failed — ${err.message}`)
    report.errors.push({ file: relFile, error: `backup: ${err.message}` })
    continue
  }

  try {
    // 2. Apply replacements
    const { content: replaced, replaced: count } = applyReplacements(content)

    if (count === 0) {
      // Patterns didn't match anything — keep file as-is, remove backup
      fs.unlinkSync(file + '.bak')
      console.log(`  ?  ${relFile} (has console calls but no pattern matched — manual review)`)
      continue
    }

    // 3. Add import if not already present
    let finalContent = replaced
    if (!alreadyImportsLogger(finalContent)) {
      const importLine = `import { logger } from '${loggerPath}'`
      finalContent = addImportAfterLastImport(finalContent, importLine)
    }

    // 4. Write
    fs.writeFileSync(file, finalContent, 'utf8')

    report.migrated++
    report.totalReplacements += count
    report.details.push({ file: relFile, replacements: count })

    console.log(`  ✓  ${relFile} (${count} replacement${count > 1 ? 's' : ''})`)
  } catch (err) {
    // Rollback this single file
    if (fs.existsSync(file + '.bak')) {
      try {
        fs.copyFileSync(file + '.bak', file)
        fs.unlinkSync(file + '.bak')
      } catch {
        // Best effort
      }
    }
    console.error(`  ✗  ${relFile}: ${err.message}`)
    report.errors.push({ file: relFile, error: err.message })
  }
}

// ─── Save manifest ─────────────────────────────────────────────────────────────
if (!DRY_RUN && report.migrated > 0) {
  const manifest = {
    migratedAt: new Date().toISOString(),
    files: report.details,
  }
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2))
}

// ─── Final report ──────────────────────────────────────────────────────────────
const hr = '─'.repeat(60)
console.log('\n' + hr)
console.log('Migration Report')
console.log(hr)
console.log(`  Files scanned:       ${report.totalScanned}`)
console.log(`  Skipped (no console):${report.skippedNoConsole}`)
console.log(`  Migrated:            ${report.migrated}`)
console.log(`  Total replacements:  ${report.totalReplacements}`)
if (report.errors.length > 0) {
  console.log(`  Errors:              ${report.errors.length}`)
  for (const e of report.errors) {
    console.log(`    ✗ ${e.file}: ${e.error}`)
  }
}
if (DRY_RUN) {
  console.log('\n  ⚠  DRY RUN — no files were modified')
}
console.log(hr)

if (report.errors.length > 0) process.exit(1)
