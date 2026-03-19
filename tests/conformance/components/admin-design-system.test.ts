import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const PAGE = readFileSync(resolve(ROOT, 'app/pages/admin/design-system.vue'), 'utf-8')

describe('/admin/design-system page', () => {
  it('uses admin layout', () => {
    expect(PAGE).toContain("layout: 'admin'")
  })

  it('uses admin middleware', () => {
    expect(PAGE).toContain("middleware: 'admin'")
  })

  it('has colors section', () => {
    expect(PAGE).toContain('designSystem.colors')
    expect(PAGE).toContain('--color-primary')
  })

  it('has typography section', () => {
    expect(PAGE).toContain('designSystem.typography')
  })

  it('has spacing section', () => {
    expect(PAGE).toContain('designSystem.spacing')
  })

  it('has buttons section with variants', () => {
    expect(PAGE).toContain('designSystem.buttons')
  })

  it('has forms section with inputs', () => {
    expect(PAGE).toContain('designSystem.forms')
  })

  it('has badges section', () => {
    expect(PAGE).toContain('designSystem.badges')
  })

  it('has skeletons section', () => {
    expect(PAGE).toContain('designSystem.skeletons')
  })

  it('has breakpoints section', () => {
    expect(PAGE).toContain('designSystem.breakpoints')
  })

  it('uses i18n for all labels', () => {
    // All section titles use $t()
    const sectionTitleMatches = PAGE.match(/t\('admin\.designSystem\.\w+'\)/g)
    expect(sectionTitleMatches).not.toBeNull()
    expect(sectionTitleMatches!.length).toBeGreaterThanOrEqual(8)
  })

  it('showcases CSS custom properties (design tokens)', () => {
    const tokenMatches = PAGE.match(/var\(--[a-z-]+\)/g)
    expect(tokenMatches).not.toBeNull()
    expect(tokenMatches!.length).toBeGreaterThanOrEqual(5)
  })
})
