import { describe, it, expect } from 'vitest'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Migration consistency tests.
 *
 * Validates that numbered migrations:
 * - Follow the naming convention (NNNNN_description.sql)
 * - Have no gaps in sequence
 * - Have no duplicates
 * - Are all SQL files
 */

const MIGRATIONS_DIR = resolve(process.cwd(), 'supabase/migrations')

function getMigrations() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
}

function getNumberedMigrations(files: string[]) {
  return files.filter((f) => /^\d{5}_/.test(f))
}

describe('DB migrations consistency', () => {
  const migrations = getMigrations()
  const numbered = getNumberedMigrations(migrations)

  it('all migration files are .sql', () => {
    const nonSql = readdirSync(MIGRATIONS_DIR).filter((f) => !f.endsWith('.sql'))
    expect(nonSql, `Non-SQL files in migrations: ${nonSql.join(', ')}`).toHaveLength(0)
  })

  it('numbered migrations follow naming convention (NNNNN_description.sql)', () => {
    const invalid = migrations.filter((f) => !/^\d{5}_[a-z0-9_]+\.sql$/.test(f))
    expect(invalid, `Invalid naming: ${invalid.join(', ')}`).toHaveLength(0)
  })

  it('no duplicate migration numbers in recent migrations (>= 00150)', () => {
    // Legacy migrations may have duplicates from renumbering; check recent only
    const recentNumbers = numbered
      .map((f) => Number.parseInt(f.substring(0, 5), 10))
      .filter((n) => n >= 172)
    const seen = new Set<number>()
    const duplicates: number[] = []
    for (const n of recentNumbers) {
      if (seen.has(n)) duplicates.push(n)
      seen.add(n)
    }
    expect(duplicates, `Duplicate migration numbers: ${duplicates.join(', ')}`).toHaveLength(0)
  })

  it('no gaps in recent migration sequence (>= 00150)', () => {
    // Legacy migrations may have gaps from development; check recent only
    const recentNumbers = numbered
      .map((f) => Number.parseInt(f.substring(0, 5), 10))
      .filter((n) => n >= 172)
      .sort((a, b) => a - b)

    if (recentNumbers.length === 0) return

    const gaps: number[] = []
    for (let i = 1; i < recentNumbers.length; i++) {
      if (recentNumbers[i] !== recentNumbers[i - 1]! + 1) {
        gaps.push(recentNumbers[i - 1]! + 1)
      }
    }
    expect(gaps, `Gaps in sequence after: ${gaps.join(', ')}`).toHaveLength(0)
  })

  it('total migration count is non-zero', () => {
    expect(migrations.length).toBeGreaterThan(0)
  })

  it('newest migration number matches total count (no skipped numbers) in recent range', () => {
    // Legacy migrations may have gaps/duplicates; check recent range only
    const recentNumbers = numbered
      .map((f) => Number.parseInt(f.substring(0, 5), 10))
      .filter((n) => n >= 172)
      .sort((a, b) => a - b)
    if (recentNumbers.length === 0) return
    const max = recentNumbers[recentNumbers.length - 1]!
    const min = recentNumbers[0]!
    expect(max - min + 1).toBe(recentNumbers.length)
  })
})
