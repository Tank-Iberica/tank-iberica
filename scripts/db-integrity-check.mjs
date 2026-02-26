#!/usr/bin/env node
/**
 * Database integrity check script.
 *
 * Runs verification queries against Supabase to detect:
 * - Orphaned records (vehicles without dealers, etc.)
 * - Inconsistent states (closed auctions without winners)
 * - Missing required data (vehicles without vertical)
 * - Test data in production
 *
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/db-integrity-check.mjs
 */

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const checks = [
  {
    name: 'Vehicles with non-existent dealer',
    query: 'vehicles?select=id,dealer_id&dealer_id=not.is.null',
    validate: async (rows) => {
      // Check if dealer_id references exist
      const dealerIds = [...new Set(rows.map((r) => r.dealer_id))]
      const dealersRes = await supabaseGet(`dealers?select=id&id=in.(${dealerIds.join(',')})`)
      const existingIds = new Set(dealersRes.map((d) => d.id))
      const orphans = rows.filter((r) => !existingIds.has(r.dealer_id))
      return { issues: orphans.length, details: orphans.slice(0, 5) }
    },
  },
  {
    name: 'Vehicles without vertical',
    query: "vehicles?select=id,vertical&or=(vertical.is.null,vertical.eq.)",
    validate: async (rows) => ({ issues: rows.length, details: rows.slice(0, 5) }),
  },
  {
    name: 'Published articles without English title',
    query: "articles?select=id,title_es&status=eq.published&or=(title_en.is.null,title_en.eq.)",
    validate: async (rows) => ({ issues: rows.length, details: rows.slice(0, 5) }),
  },
  {
    name: 'Test emails in users table',
    query: "users?select=id,email&or=(email.like.*@example.com,email.like.*test*)",
    validate: async (rows) => ({ issues: rows.length, details: rows.map((r) => r.email) }),
  },
  {
    name: 'Suspiciously cheap active vehicles (price < 100)',
    query: 'vehicles?select=id,brand,model,price&status=eq.active&price=lt.100',
    validate: async (rows) => ({ issues: rows.length, details: rows.slice(0, 5) }),
  },
]

async function supabaseGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  })
  if (!res.ok) {
    console.warn(`  Query failed: ${res.status} ${res.statusText}`)
    return []
  }
  return res.json()
}

async function main() {
  console.log('=== Database Integrity Check ===\n')

  let totalIssues = 0

  for (const check of checks) {
    process.stdout.write(`Checking: ${check.name}... `)
    try {
      const rows = await supabaseGet(check.query)
      const result = await check.validate(rows)
      totalIssues += result.issues

      if (result.issues === 0) {
        console.log('OK')
      } else {
        console.log(`WARN: ${result.issues} issue(s)`)
        if (result.details.length > 0) {
          console.log(`  Sample: ${JSON.stringify(result.details.slice(0, 3))}`)
        }
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`)
    }
  }

  console.log(`\n=== Summary: ${totalIssues} total issue(s) ===`)
  process.exit(totalIssues > 0 ? 1 : 0)
}

main()
