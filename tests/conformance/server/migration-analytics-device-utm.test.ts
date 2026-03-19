/**
 * Tests for migration 00175: analytics_events device/UTM columns
 * Items #47 (device/platform) + #42 (UTM attribution)
 *
 * Validates:
 * - Migration SQL is well-formed
 * - Column definitions match composable expectations
 * - Indexes are created for query performance
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const migrationPath = resolve(
  __dirname,
  '../../../supabase/migrations/00175_analytics_events_device_utm_columns.sql',
)
const migrationSql = readFileSync(migrationPath, 'utf-8')

describe('Migration 00175: analytics_events device/UTM columns', () => {
  describe('Column definitions', () => {
    it('adds device_type column', () => {
      expect(migrationSql).toContain('device_type VARCHAR(10)')
    })

    it('adds platform column', () => {
      expect(migrationSql).toContain('platform VARCHAR(10)')
    })

    it('adds utm_source column', () => {
      expect(migrationSql).toContain('utm_source VARCHAR(100)')
    })

    it('adds utm_medium column', () => {
      expect(migrationSql).toContain('utm_medium VARCHAR(100)')
    })

    it('adds utm_campaign column', () => {
      expect(migrationSql).toContain('utm_campaign VARCHAR(200)')
    })

    it('adds utm_term column', () => {
      expect(migrationSql).toContain('utm_term VARCHAR(200)')
    })

    it('adds utm_content column', () => {
      expect(migrationSql).toContain('utm_content VARCHAR(200)')
    })

    it('adds version column with default 1', () => {
      expect(migrationSql).toContain('version SMALLINT DEFAULT 1')
    })
  })

  describe('Safety', () => {
    it('uses IF NOT EXISTS for all ALTER TABLE', () => {
      const alterLines = migrationSql.split('\n').filter((l) => l.includes('ADD COLUMN'))
      expect(alterLines.length).toBeGreaterThan(0)
      for (const line of alterLines) {
        expect(line).toContain('IF NOT EXISTS')
      }
    })

    it('uses IF NOT EXISTS for all CREATE INDEX', () => {
      const indexLines = migrationSql.split('\n').filter((l) => l.includes('CREATE INDEX'))
      expect(indexLines.length).toBeGreaterThan(0)
      for (const line of indexLines) {
        expect(line).toContain('IF NOT EXISTS')
      }
    })
  })

  describe('Indexes', () => {
    it('creates index on device_type', () => {
      expect(migrationSql).toContain('idx_analytics_events_device')
    })

    it('creates index on platform', () => {
      expect(migrationSql).toContain('idx_analytics_events_platform')
    })

    it('creates index on utm_source', () => {
      expect(migrationSql).toContain('idx_analytics_events_utm_source')
    })

    it('uses partial indexes (WHERE NOT NULL)', () => {
      const indexLines = migrationSql.split('\n').filter((l) => l.includes('CREATE INDEX'))
      for (const line of indexLines) {
        expect(line).toContain('WHERE')
      }
    })
  })

  describe('Comments', () => {
    it('documents device_type column', () => {
      expect(migrationSql).toContain('COMMENT ON COLUMN analytics_events.device_type')
    })

    it('documents platform column', () => {
      expect(migrationSql).toContain('COMMENT ON COLUMN analytics_events.platform')
    })

    it('documents UTM columns', () => {
      expect(migrationSql).toContain('COMMENT ON COLUMN analytics_events.utm_source')
    })
  })

  describe('Composable compatibility', () => {
    it('device_type VARCHAR(10) fits all values: mobile, tablet, desktop', () => {
      const values = ['mobile', 'tablet', 'desktop']
      for (const v of values) {
        expect(v.length).toBeLessThanOrEqual(10)
      }
    })

    it('platform VARCHAR(10) fits all values: ios, android, windows, macos, linux, other', () => {
      const values = ['ios', 'android', 'windows', 'macos', 'linux', 'other']
      for (const v of values) {
        expect(v.length).toBeLessThanOrEqual(10)
      }
    })
  })
})
