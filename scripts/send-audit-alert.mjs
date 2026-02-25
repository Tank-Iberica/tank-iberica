#!/usr/bin/env node
/**
 * Send audit alert email via Resend API.
 * Only sends if overall status is 'red' or there are semgrep errors.
 */
import { readFileSync } from 'fs'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const ALERT_EMAIL = process.env.ALERT_EMAIL

if (!RESEND_API_KEY || !ALERT_EMAIL) {
  console.warn('Missing RESEND_API_KEY or ALERT_EMAIL — skipping alert')
  process.exit(0)
}

let summary
try {
  summary = JSON.parse(readFileSync('audit-summary.json', 'utf-8'))
} catch {
  console.error('Could not read audit-summary.json')
  process.exit(1)
}

// Only alert on red status
if (summary.overall !== 'red') {
  console.log(`Status is ${summary.overall}, not red — skipping alert`)
  process.exit(0)
}

const subject = `🚨 Tracciona Audit Alert — ${summary.date}`
const body = [
  `Daily Audit Report — ${summary.date}`,
  `Status: ${summary.overall.toUpperCase()}`,
  '',
  '── Security ──',
  `Semgrep: ${summary.semgrep.errors} errors, ${summary.semgrep.warnings} warnings (${summary.semgrep.total} total findings)`,
  `npm audit: ${summary.npm.critical} critical, ${summary.npm.high} high, ${summary.npm.moderate} moderate`,
  '',
  '── Code Quality ──',
  `ESLint: ${summary.eslint.errors} errors, ${summary.eslint.warnings} warnings`,
  `TypeScript: ${summary.typecheck.errors} errors`,
  '',
  '── Extensibility ──',
  `Hardcoded values found: ${summary.extensibility.hardcoded_count}`,
  '',
  `Build: ${summary.build}`,
  '',
  'Check GitHub Actions for full details.',
].join('\n')

try {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'audit@tracciona.com',
      to: ALERT_EMAIL,
      subject,
      text: body,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`Resend API error: ${res.status} ${text}`)
    process.exit(1)
  }

  console.log('Alert email sent successfully')
} catch (err) {
  console.error('Failed to send alert:', err.message)
  process.exit(1)
}
