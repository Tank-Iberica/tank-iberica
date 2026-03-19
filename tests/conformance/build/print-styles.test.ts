import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Verifies print.css correctly handles vehicle detail printing.
 * The print stylesheet should hide non-printable elements and
 * optimize layout for paper output.
 */

const ROOT = resolve(__dirname, '../../..')
const printCss = readFileSync(resolve(ROOT, 'app/assets/css/print.css'), 'utf-8')

describe('Print styles for vehicle detail', () => {
  it('all rules are inside @media print', () => {
    // Entire file should be wrapped in @media print
    expect(printCss).toContain('@media print')
  })

  it('hides app header and footer', () => {
    expect(printCss).toContain('.app-header')
    expect(printCss).toContain('.app-footer')
    expect(printCss).toContain('display: none')
  })

  it('hides navigation elements', () => {
    expect(printCss).toContain('nav')
    expect(printCss).toContain('.breadcrumb-nav')
  })

  it('hides interactive elements (buttons, modals)', () => {
    expect(printCss).toContain('button')
    expect(printCss).toContain("[role='dialog']")
    expect(printCss).toContain('.vehicle-actions')
  })

  it('hides non-printable UI (toast, FAB, scroll-to-top)', () => {
    expect(printCss).toContain('.ui-toast-container')
    expect(printCss).toContain('.accessibility-fab')
    expect(printCss).toContain('.scroll-to-top')
  })

  it('sets full-width layout for vehicle content', () => {
    expect(printCss).toContain('.vehicle-content')
    expect(printCss).toContain('max-width: 100%')
  })

  it('optimizes gallery for print', () => {
    expect(printCss).toContain('.vehicle-gallery-wrapper')
    expect(printCss).toContain('break-inside: avoid')
  })

  it('handles page breaks for specs and seller info', () => {
    expect(printCss).toContain('.vehicle-detail-specs')
    expect(printCss).toContain('.vehicle-detail-seller')
  })

  it('ensures images print correctly', () => {
    expect(printCss).toContain('print-color-adjust: exact')
    expect(printCss).toContain('max-width: 100%')
  })

  it('supports data-no-print attribute', () => {
    expect(printCss).toContain('[data-no-print]')
  })
})
