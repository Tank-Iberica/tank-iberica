import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, join, relative } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const SELECT_STAR_REGEX = /\.select\(\s*['"]?\*['"]?\s*\)/g

/**
 * Audit test: ensures select('*') is only used in documented, intentional locations.
 * New code should use explicit column selects. Exceptions are documented below.
 */

// Files where select('*') is intentionally correct
const ALLOWED_FILES = new Set([
  // GDPR export: must export ALL user data columns
  'app/composables/useUserProfile.ts',
  // Extensible config: dynamic columns per vertical (JSONB, [key: string]: unknown)
  'app/composables/useVerticalConfig.ts',
  'app/composables/admin/useAdminVerticalConfig.ts',
  // Cluster migration: copies entire table data between clusters
  'server/api/infra/clusters/[id]/execute-migration.post.ts',
  'server/api/infra/clusters/[id]/prepare-migration.post.ts',
])

// Test directories are excluded — RLS tests use select('*') intentionally
const EXCLUDED_DIRS = ['tests/', 'node_modules/', '.nuxt/', '.output/']

function collectFiles(dir: string, ext: string): string[] {
  const files: string[] = []
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      const rel = relative(ROOT, full).replace(/\\/g, '/')
      if (EXCLUDED_DIRS.some((d) => rel.startsWith(d))) continue
      try {
        const stat = statSync(full)
        if (stat.isDirectory()) files.push(...collectFiles(full, ext))
        else if (entry.endsWith(ext)) files.push(full)
      } catch {
        // skip inaccessible
      }
    }
  } catch {
    // skip inaccessible dirs
  }
  return files
}

describe('select(*) audit', () => {
  const tsFiles = [
    ...collectFiles(resolve(ROOT, 'app'), '.ts'),
    ...collectFiles(resolve(ROOT, 'app'), '.vue'),
    ...collectFiles(resolve(ROOT, 'server'), '.ts'),
  ]

  it('found source files to audit', () => {
    expect(tsFiles.length).toBeGreaterThan(100)
  })

  it('no unauthorized select(*) in source code', () => {
    const violations: string[] = []

    for (const file of tsFiles) {
      const rel = relative(ROOT, file).replace(/\\/g, '/')
      const content = readFileSync(file, 'utf-8')
      const matches = content.match(SELECT_STAR_REGEX)
      if (matches && !ALLOWED_FILES.has(rel)) {
        violations.push(`${rel}: ${matches.length} instance(s)`)
      }
    }

    expect(violations).toEqual([])
  })

  it('allowed files document WHY select(*) is used', () => {
    for (const rel of ALLOWED_FILES) {
      const full = resolve(ROOT, rel)
      const content = readFileSync(full, 'utf-8')
      // Each allowed file should have a comment explaining why select('*') is intentional
      expect(
        content.includes('intentional') ||
          content.includes('GDPR') ||
          content.includes('extensible'),
        `${rel} should document why select('*') is used`,
      ).toBe(true)
    }
  })

  it('allowed list has exactly 5 files', () => {
    // If a new file needs select('*'), add it here with justification
    expect(ALLOWED_FILES.size).toBe(5)
  })

  it('all allowed files actually contain select(*)', () => {
    for (const rel of ALLOWED_FILES) {
      const full = resolve(ROOT, rel)
      const content = readFileSync(full, 'utf-8')
      expect(content).toMatch(SELECT_STAR_REGEX)
    }
  })
})
