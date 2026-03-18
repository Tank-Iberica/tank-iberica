#!/usr/bin/env node
/**
 * Automated Vertical Health Check
 * Verifies a vertical deployment is correctly configured.
 *
 * Checks:
 * 1. vertical_config exists for the slug
 * 2. Categories exist (>0)
 * 3. Required config fields are populated
 * 4. Active locales are configured
 * 5. Theme colors are set
 *
 * Usage: node scripts/vertical-health-check.mjs [vertical-slug]
 * Default slug: 'tracciona'
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const verticalSlug = process.argv[2] || 'tracciona'

const results = []
let hasErrors = false

function check(name, pass, detail = '') {
  const status = pass ? '✅' : '❌'
  if (!pass) hasErrors = true
  results.push({ name, status, detail })
  console.log(`${status} ${name}${detail ? ` — ${detail}` : ''}`)
}

async function run() {
  console.log(`\n🔍 Health check for vertical: ${verticalSlug}\n`)

  // 1. vertical_config exists
  const { data: config, error: configError } = await supabase
    .from('vertical_config')
    .select('*')
    .eq('vertical', verticalSlug)
    .single()

  check('vertical_config exists', !configError && !!config, configError?.message || '')

  if (!config) {
    console.log('\n⚠️  Cannot continue without vertical_config. Aborting.\n')
    process.exit(1)
  }

  // 2. Required fields
  check('name is set', !!config.name?.es, config.name?.es || 'missing')
  check('meta_description is set', !!config.meta_description?.es)
  check('theme is configured', !!config.theme && Object.keys(config.theme).length > 0,
    config.theme ? `${Object.keys(config.theme).length} theme vars` : 'missing')
  check('logo_url is set', !!config.logo_url)
  check('active_locales configured', config.active_locales?.length > 0,
    config.active_locales?.join(', ') || 'none')
  check('default_locale set', !!config.default_locale, config.default_locale || 'missing')

  // 3. Categories exist
  const { count: catCount } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })

  check('categories exist (>0)', catCount > 0, `${catCount} categories`)

  // 4. Subcategories exist
  const { count: subCount } = await supabase
    .from('subcategories')
    .select('*', { count: 'exact', head: true })

  check('subcategories exist (>0)', subCount > 0, `${subCount} subcategories`)

  // 5. Active vehicles
  const { count: vehicleCount } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  check('active vehicles exist', vehicleCount > 0, `${vehicleCount} active vehicles`)

  // Summary
  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Results: ${results.filter(r => r.status === '✅').length}/${results.length} passed`)
  if (hasErrors) {
    console.log('⚠️  Some checks failed. Review the issues above.')
    process.exit(1)
  } else {
    console.log('✅ All health checks passed!')
  }
}

run().catch((err) => {
  console.error('Health check failed:', err.message)
  process.exit(1)
})
