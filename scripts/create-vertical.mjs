#!/usr/bin/env node
/**
 * create-vertical.mjs — Scaffold a new vertical for the TradeBase platform.
 *
 * Usage:
 *   node scripts/create-vertical.mjs --name horecaria --domain horecaria.com
 *   node scripts/create-vertical.mjs --name horecaria --domain horecaria.com --dry-run
 *   node scripts/create-vertical.mjs --name horecaria --clone-from tracciona --domain horecaria.com
 *   node scripts/create-vertical.mjs --name horecaria --smoke-test
 *
 * Generates:
 *   1. SQL migration file: supabase/migrations/YYYYMMDDHHMMSS_vertical_<name>.sql
 *   2. Updated .env.example with vertical-specific variables
 *   3. Deploy checklist: docs/deploy-checklist-<name>.md
 */

import { writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// --- CLI args ---
const { values } = parseArgs({
  options: {
    name: { type: 'string', short: 'n' },
    domain: { type: 'string', short: 'd' },
    'clone-from': { type: 'string', short: 'c' },
    'dry-run': { type: 'boolean', default: false },
    'smoke-test': { type: 'boolean', default: false },
    tables: { type: 'string', short: 't' },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
})

if (values.help || !values.name) {
  console.log(`
Usage: node scripts/create-vertical.mjs --name <slug> --domain <domain> [options]

Options:
  --name, -n       Vertical slug (lowercase, no spaces). Required.
  --domain, -d     Domain name (e.g., horecaria.com). Defaults to <name>.com
  --clone-from, -c Clone config/categories from an existing vertical slug.
  --dry-run        Show output without writing files.
  --smoke-test     Run post-creation verification checks.
  --tables, -t     Comma-separated list of sections to include.
                   Options: config,categories,subcategories,attributes,junction
                   Default: all. E.g.: --tables config,categories
  --help, -h       Show this help.

Examples:
  node scripts/create-vertical.mjs --name horecaria --domain horecaria.com --dry-run
  node scripts/create-vertical.mjs --name horecaria --clone-from tracciona
  node scripts/create-vertical.mjs --name horecaria --smoke-test
`)
  process.exit(values.help ? 0 : 1)
}

// ---------------------------------------------------------------------------
// Name validation (strict)
// ---------------------------------------------------------------------------

const RESERVED_SLUGS = ['admin', 'api', 'auth', 'dashboard', 'perfil', 'public', 'server', 'static', 'test', 'www']

function validateSlug(raw) {
  const errors = []

  // Only allow lowercase letters, digits, hyphens
  if (!/^[a-z][a-z0-9-]*$/.test(raw)) {
    errors.push('Must start with a letter and contain only lowercase a-z, 0-9, hyphens')
  }

  // No consecutive hyphens
  if (/--/.test(raw)) {
    errors.push('Must not contain consecutive hyphens (--)')
  }

  // No trailing hyphen
  if (raw.endsWith('-')) {
    errors.push('Must not end with a hyphen')
  }

  // Length
  if (raw.length < 3 || raw.length > 30) {
    errors.push('Must be 3-30 characters')
  }

  // Reserved names
  if (RESERVED_SLUGS.includes(raw)) {
    errors.push(`"${raw}" is a reserved name and cannot be used`)
  }

  return errors
}

const slug = values.name.toLowerCase().trim()
const validationErrors = validateSlug(slug)
if (validationErrors.length > 0) {
  console.error('Error: Invalid vertical name:')
  validationErrors.forEach((e) => console.error(`  - ${e}`))
  process.exit(1)
}

const domain = values.domain || `${slug}.com`
const dryRun = values['dry-run'] || false
const cloneFrom = values['clone-from'] || null
const smokeTest = values['smoke-test'] || false
const displayName = slug.charAt(0).toUpperCase() + slug.slice(1)

// Parse --tables for selective migration
const ALL_SECTIONS = ['config', 'categories', 'subcategories', 'junction', 'attributes']
const selectedSections = values.tables
  ? values.tables.split(',').map((s) => s.trim().toLowerCase())
  : ALL_SECTIONS

// Validate section names
for (const s of selectedSections) {
  if (!ALL_SECTIONS.includes(s)) {
    console.error(`Error: Unknown section "${s}". Valid: ${ALL_SECTIONS.join(', ')}`)
    process.exit(1)
  }
}
const includeSection = (name) => selectedSections.includes(name)

// Check for collision with existing migration files
const migrationsDir = resolve(ROOT, 'supabase', 'migrations')
if (existsSync(migrationsDir)) {
  const existingMigrations = readdirSync(migrationsDir)
  const collision = existingMigrations.find((f) => f.includes(`_vertical_${slug}.sql`))
  if (collision) {
    console.error(`Error: Migration already exists for vertical "${slug}": ${collision}`)
    console.error('  If you want to recreate, delete the existing migration first.')
    process.exit(1)
  }
}

// ---------------------------------------------------------------------------
// SQL generation
// ---------------------------------------------------------------------------

const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
const migrationFilename = `${timestamp}_vertical_${slug}.sql`
const migrationPath = resolve(ROOT, 'supabase', 'migrations', migrationFilename)

function generateCloneSQL(sourceVertical, targetSlug, targetDisplayName) {
  return `-- Migration: Clone vertical "${targetSlug}" from "${sourceVertical}"
-- Generated by: node scripts/create-vertical.mjs --name ${targetSlug} --clone-from ${sourceVertical}
-- Date: ${new Date().toISOString()}

-- 1. Clone vertical_config (all settings from source, new slug)
INSERT INTO vertical_config (
  vertical, name, tagline, meta_description,
  theme, font_preset, active_locales, default_locale,
  active_actions, require_vehicle_approval, require_article_approval,
  auto_translate_on_publish, auto_publish_social,
  hero_title, hero_subtitle, hero_cta_text, hero_cta_url,
  subscription_prices, commission_rates
)
SELECT
  '${targetSlug}',
  jsonb_build_object('es', '${targetDisplayName}', 'en', '${targetDisplayName}'),
  tagline,
  meta_description,
  theme,
  font_preset,
  active_locales,
  default_locale,
  active_actions,
  require_vehicle_approval,
  require_article_approval,
  auto_translate_on_publish,
  auto_publish_social,
  hero_title,
  hero_subtitle,
  hero_cta_text,
  hero_cta_url,
  subscription_prices,
  commission_rates
FROM vertical_config
WHERE vertical = '${sourceVertical}'
ON CONFLICT (vertical) DO NOTHING;

-- 2. Clone categories
INSERT INTO categories (name, name_es, name_en, slug, vertical, status, sort_order)
SELECT
  name,
  name_es,
  name_en,
  replace(slug, '${sourceVertical}', '${targetSlug}'),
  '${targetSlug}',
  status,
  sort_order
FROM categories
WHERE vertical = '${sourceVertical}'
ON CONFLICT (slug) DO NOTHING;

-- 3. Clone subcategories
INSERT INTO subcategories (name, name_es, name_en, slug, vertical, status, sort_order)
SELECT
  name,
  name_es,
  name_en,
  replace(slug, '${sourceVertical}', '${targetSlug}'),
  '${targetSlug}',
  status,
  sort_order
FROM subcategories
WHERE vertical = '${sourceVertical}'
ON CONFLICT (slug) DO NOTHING;

-- 4. Clone subcategory-category junction
INSERT INTO subcategory_categories (subcategory_id, category_id)
SELECT new_sub.id, new_cat.id
FROM subcategory_categories sc
JOIN subcategories old_sub ON old_sub.id = sc.subcategory_id AND old_sub.vertical = '${sourceVertical}'
JOIN categories old_cat ON old_cat.id = sc.category_id AND old_cat.vertical = '${sourceVertical}'
JOIN subcategories new_sub ON new_sub.slug = replace(old_sub.slug, '${sourceVertical}', '${targetSlug}')
JOIN categories new_cat ON new_cat.slug = replace(old_cat.slug, '${sourceVertical}', '${targetSlug}')
ON CONFLICT DO NOTHING;

-- 5. Clone attributes
DO $$
BEGIN
  INSERT INTO attributes (vertical, name, type, label_es, label_en, label, unit, options, is_extra, is_hidden, sort_order, status)
  SELECT
    '${targetSlug}', name, type, label_es, label_en, label, unit, options, is_extra, is_hidden, sort_order, status
  FROM attributes
  WHERE vertical = '${sourceVertical}'
  AND NOT EXISTS (
    SELECT 1 FROM attributes a2 WHERE a2.vertical = '${targetSlug}' AND a2.name = attributes.name
  );
END $$;

-- NOTE: Logo, favicon, OG image, and email templates are NOT cloned.
-- Customize these in admin > config > branding after deployment.
`
}

function generateFreshSQL(targetSlug, targetDisplayName, targetDomain) {
  const parts = []
  const isSelective = selectedSections.length < ALL_SECTIONS.length

  parts.push(`-- Migration: Scaffold vertical "${targetSlug}"
-- Generated by: node scripts/create-vertical.mjs --name ${targetSlug} --domain ${targetDomain}${isSelective ? ` --tables ${selectedSections.join(',')}` : ''}
-- Date: ${new Date().toISOString()}
${isSelective ? `-- Selective migration: only ${selectedSections.join(', ')} sections included` : ''}`)

  if (includeSection('config')) {
    parts.push(`
-- 1. Insert vertical_config
INSERT INTO vertical_config (
  vertical, name, tagline, meta_description,
  theme, font_preset, active_locales, default_locale,
  active_actions, require_vehicle_approval, require_article_approval,
  auto_translate_on_publish, auto_publish_social,
  hero_title, hero_subtitle, hero_cta_text, hero_cta_url,
  subscription_prices, commission_rates
) VALUES (
  '${targetSlug}',
  '{"es": "${targetDisplayName}", "en": "${targetDisplayName}"}'::jsonb,
  '{"es": "Marketplace de ${targetDisplayName}", "en": "${targetDisplayName} Marketplace"}'::jsonb,
  '{"es": "Compra y vende en ${targetDisplayName}", "en": "Buy and sell on ${targetDisplayName}"}'::jsonb,
  '{"primary": "#23424A", "primary_hover": "#1a3338", "accent": "#d4a853", "bg_primary": "#FFFFFF", "bg_secondary": "#F5F7F6", "text_primary": "#1A1E1C", "text_secondary": "#4A524E", "border_color": "#D8DDD9", "success": "#0B6E3B", "warning": "#C47A1A", "error": "#C23A3A"}'::jsonb,
  'default',
  ARRAY['es', 'en'],
  'es',
  ARRAY['venta', 'alquiler'],
  false,
  false,
  true,
  false,
  '{"es": "Bienvenido a ${targetDisplayName}", "en": "Welcome to ${targetDisplayName}"}'::jsonb,
  '{"es": "El marketplace profesional", "en": "The professional marketplace"}'::jsonb,
  '{"es": "Ver catálogo", "en": "Browse catalog"}'::jsonb,
  '/catalogo',
  '{"free": {"monthly_cents": 0, "annual_cents": 0}, "basic": {"monthly_cents": 2900, "annual_cents": 29000}, "premium": {"monthly_cents": 7900, "annual_cents": 79000}, "founding": {"monthly_cents": 0, "annual_cents": 0}}'::jsonb,
  '{"sale_pct": 0, "auction_buyer_premium_pct": 8.0, "transport_commission_pct": 10.0, "transfer_commission_pct": 15.0, "verification_level1_cents": 0, "verification_level2_cents": 4900, "verification_level3_cents": 14900}'::jsonb
)
ON CONFLICT (vertical) DO NOTHING;`)
  }

  if (includeSection('categories')) {
    parts.push(`
-- 2. Insert categories (customize names/slugs for your vertical)
INSERT INTO categories (name, name_es, name_en, slug, vertical, status, sort_order)
VALUES
  ('{"es": "General", "en": "General"}'::jsonb,      'General',     'General',     '${targetSlug}-general',     '${targetSlug}', 'published', 1),
  ('{"es": "Equipamiento", "en": "Equipment"}'::jsonb,'Equipamiento','Equipment',   '${targetSlug}-equipamiento','${targetSlug}', 'published', 2),
  ('{"es": "Servicios", "en": "Services"}'::jsonb,    'Servicios',   'Services',    '${targetSlug}-servicios',   '${targetSlug}', 'published', 3)
ON CONFLICT (slug) DO NOTHING;`)
  }

  if (includeSection('subcategories')) {
    parts.push(`
-- 3. Insert subcategories (customize for your vertical)
INSERT INTO subcategories (name, name_es, name_en, slug, vertical, status, sort_order)
VALUES
  ('{"es": "Nuevo", "en": "New"}'::jsonb,           'Nuevo',           'New',           '${targetSlug}-nuevo',           '${targetSlug}', 'published', 1),
  ('{"es": "Segunda mano", "en": "Used"}'::jsonb,   'Segunda mano',    'Used',          '${targetSlug}-segunda-mano',    '${targetSlug}', 'published', 2),
  ('{"es": "Reacondicionado", "en": "Refurb"}'::jsonb,'Reacondicionado','Refurbished',  '${targetSlug}-reacondicionado', '${targetSlug}', 'published', 3)
ON CONFLICT (slug) DO NOTHING;`)
  }

  if (includeSection('junction')) {
    parts.push(`
-- 4. Link subcategories to categories via junction table
INSERT INTO subcategory_categories (subcategory_id, category_id)
SELECT s.id, c.id
FROM subcategories s, categories c
WHERE s.vertical = '${targetSlug}' AND c.vertical = '${targetSlug}'
AND c.slug = '${targetSlug}-general'
ON CONFLICT DO NOTHING;`)
  }

  if (includeSection('attributes')) {
    parts.push(`
-- 5. Insert common attributes
DO $$
BEGIN
  INSERT INTO attributes (vertical, name, type, label_es, label_en, label, unit, options, is_extra, is_hidden, sort_order, status)
  SELECT vals.*
  FROM (VALUES
    ('${targetSlug}'::varchar, 'estado',    'desplegable'::filter_type, 'Estado',    'Condition', '{"es": "Estado",    "en": "Condition"}'::jsonb, NULL::text, '["Nuevo", "Semi-nuevo", "Usado - bueno", "Usado - funcional", "Para piezas"]'::jsonb, false, false, 1, 'published'::vehicle_status),
    ('${targetSlug}',          'anio',      'slider'::filter_type,      'Ano',       'Year',      '{"es": "Ano",       "en": "Year"}'::jsonb,      NULL,       '{}',                                                                                   false, false, 2, 'published'::vehicle_status),
    ('${targetSlug}',          'marca',     'caja'::filter_type,        'Marca',     'Brand',     '{"es": "Marca",     "en": "Brand"}'::jsonb,     NULL,       '{}',                                                                                   false, false, 3, 'published'::vehicle_status),
    ('${targetSlug}',          'modelo',    'caja'::filter_type,        'Modelo',    'Model',     '{"es": "Modelo",    "en": "Model"}'::jsonb,     NULL,       '{}',                                                                                   false, false, 4, 'published'::vehicle_status),
    ('${targetSlug}',          'ubicacion', 'caja'::filter_type,        'Ubicacion', 'Location',  '{"es": "Ubicacion", "en": "Location"}'::jsonb,  NULL,       '{}',                                                                                   true,  false, 5, 'published'::vehicle_status)
  ) AS vals(vertical, name, type, label_es, label_en, label, unit, options, is_extra, is_hidden, sort_order, status)
  WHERE NOT EXISTS (
    SELECT 1 FROM attributes a WHERE a.vertical = vals.vertical AND a.name = vals.name
  );
END $$;`)
  }

  parts.push(`
-- RLS policies — existing RLS uses .eq('vertical', getVerticalSlug()), no additional needed

-- IMPORTANT: After running this migration:
-- 1. Customize category/subcategory names and slugs for your domain
-- 2. Add domain-specific attributes
-- 3. Update vertical_config theme colors and branding in admin panel
-- 4. Upload logo, favicon, and OG image via admin > config > branding
-- 5. Configure DNS for ${targetDomain} pointing to Cloudflare Pages
-- 6. Add ${targetDomain} as custom domain in Cloudflare Pages dashboard
`)

  return parts.join('\n')
}

const migrationSQL = cloneFrom
  ? generateCloneSQL(cloneFrom, slug, displayName)
  : generateFreshSQL(slug, displayName, domain)

// --- 2. .env.example update ---
const envExamplePath = resolve(ROOT, '.env.example')
const envBlock = `
# --- Vertical: ${slug} ---
# ${slug.toUpperCase()}_DOMAIN=${domain}
# ${slug.toUpperCase()}_SUPABASE_URL=https://xxx.supabase.co
# ${slug.toUpperCase()}_SUPABASE_ANON_KEY=eyJ...
# ${slug.toUpperCase()}_CLOUDINARY_CLOUD_NAME=
# ${slug.toUpperCase()}_GOOGLE_ANALYTICS_ID=
`

// --- 3. Deploy checklist ---
const checklistPath = resolve(ROOT, 'docs', `deploy-checklist-${slug}.md`)
const checklistContent = `# Deploy Checklist — ${displayName} (${domain})

Generated: ${new Date().toISOString().slice(0, 10)}
${cloneFrom ? `Cloned from: ${cloneFrom}\n` : ''}
## Pre-deploy

- [ ] Migration applied: \`${migrationFilename}\`
- [ ] Vertical config customized (theme, branding, subscription prices)
- [ ] Logo uploaded (logo_url, logo_dark_url, favicon_url, og_image_url)
- [ ] Base categories reviewed and customized
- [ ] .env variables set for ${slug}

## DNS & Hosting

- [ ] DNS A/CNAME record for \`${domain}\` pointing to Cloudflare Pages
- [ ] Custom domain added in Cloudflare Pages dashboard
- [ ] SSL certificate provisioned (automatic via Cloudflare)
- [ ] Redirect www.${domain} configured

## Configuration

- [ ] \`NUXT_PUBLIC_VERTICAL=${slug}\` in Cloudflare Pages env vars
- [ ] Supabase project URL and anon key set
- [ ] Cloudinary cloud name configured
- [ ] Google Analytics ID set (if applicable)
- [ ] Stripe products/prices created for ${slug} subscription tiers

## Content

- [ ] Homepage hero content set (title, subtitle, CTA, image)
- [ ] Header/footer links configured
- [ ] Social links set
- [ ] At least 5 seed vehicles/products published
- [ ] Email templates customized (welcome, invoice, notifications)

## Verification

- [ ] \`curl https://${domain}/api/health\` returns 200
- [ ] Homepage loads with correct branding
- [ ] Catalog page shows ${slug} products only (vertical isolation)
- [ ] Registration flow works end-to-end
- [ ] Dealer onboarding flow works
- [ ] Lighthouse mobile score >= 90

## Post-deploy

- [ ] Google Search Console verified
- [ ] Sitemap submitted: \`https://${domain}/sitemap.xml\`
- [ ] Monitor error rate for 24h (target: <0.5%)
- [ ] Announce launch
`

// ---------------------------------------------------------------------------
// Smoke tests (post-creation verification)
// ---------------------------------------------------------------------------

function runSmokeTests() {
  console.log('\n--- Smoke Tests ---\n')
  let passed = 0
  let failed = 0

  function check(label, condition, detail) {
    if (condition) {
      console.log(`  PASS  ${label}`)
      passed++
    } else {
      console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
      failed++
    }
  }

  // 1. Migration file exists
  check(
    'Migration file exists',
    existsSync(migrationPath),
    `Expected: ${migrationPath}`,
  )

  // 2. Migration contains vertical_config INSERT
  if (existsSync(migrationPath)) {
    const sql = readFileSync(migrationPath, 'utf-8')
    check('Migration has vertical_config INSERT', sql.includes("INSERT INTO vertical_config"))
    check('Migration has categories INSERT', sql.includes("INSERT INTO categories"))
    check('Migration has subcategories INSERT', sql.includes("INSERT INTO subcategories"))
    check('Migration has attributes INSERT', sql.includes("INSERT INTO attributes"))
    check('Migration uses correct slug', sql.includes(`'${slug}'`))

    if (cloneFrom) {
      check('Clone migration references source', sql.includes(`'${cloneFrom}'`))
    }
  }

  // 3. Deploy checklist exists
  check(
    'Deploy checklist exists',
    existsSync(checklistPath),
    `Expected: ${checklistPath}`,
  )

  // 4. .env.example contains vertical block
  if (existsSync(envExamplePath)) {
    const env = readFileSync(envExamplePath, 'utf-8')
    check(
      '.env.example contains vertical variables',
      env.includes(`${slug.toUpperCase()}_DOMAIN`),
    )
  }

  // 5. Slug validation
  check('Slug passes validation', validateSlug(slug).length === 0)
  check('Slug is lowercase', slug === slug.toLowerCase())
  check('Slug has no spaces', !slug.includes(' '))
  check('Slug is not reserved', !RESERVED_SLUGS.includes(slug))

  // 6. No collision with existing verticals in migrations
  if (existsSync(migrationsDir)) {
    const migrations = readdirSync(migrationsDir)
    const otherMigrations = migrations.filter(
      (f) => f.includes(`_vertical_${slug}.sql`) && f !== migrationFilename,
    )
    check(
      'No duplicate migration files',
      otherMigrations.length === 0,
      otherMigrations.join(', '),
    )
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed, ${passed + failed} total`)

  if (failed > 0) {
    console.error('\nSmoke tests FAILED. Review the issues above before applying migration.')
    process.exit(1)
  } else {
    console.log('\nAll smoke tests passed.')
  }
}

// --- Output ---
console.log(`\nScaffolding vertical: ${slug} (${domain})${cloneFrom ? ` [cloned from ${cloneFrom}]` : ''}\n`)

if (dryRun) {
  console.log('--- DRY RUN MODE (no files written) ---\n')
}

// Migration
console.log(`Migration: ${migrationFilename}`)
if (dryRun) {
  console.log(migrationSQL)
} else {
  if (!existsSync(migrationsDir)) {
    console.warn(`  Warning: Directory not found: supabase/migrations/ — printing SQL instead`)
    console.log(migrationSQL)
  } else {
    writeFileSync(migrationPath, migrationSQL, 'utf-8')
    console.log(`  Written to: supabase/migrations/${migrationFilename}`)
  }
}

// .env.example
console.log(`\n.env.example update:`)
if (dryRun) {
  console.log(envBlock)
} else {
  if (existsSync(envExamplePath)) {
    const current = readFileSync(envExamplePath, 'utf-8')
    if (current.includes(`${slug.toUpperCase()}_DOMAIN`)) {
      console.log(`  Already contains ${slug} variables — skipped`)
    } else {
      writeFileSync(envExamplePath, current + envBlock, 'utf-8')
      console.log(`  Appended to .env.example`)
    }
  } else {
    console.warn(`  Warning: .env.example not found — printing block instead`)
    console.log(envBlock)
  }
}

// Deploy checklist
console.log(`\nDeploy checklist: docs/deploy-checklist-${slug}.md`)
if (dryRun) {
  console.log(checklistContent)
} else {
  writeFileSync(checklistPath, checklistContent, 'utf-8')
  console.log(`  Written to: docs/deploy-checklist-${slug}.md`)
}

console.log(`\nScaffold complete for "${slug}".`)
if (!dryRun) {
  console.log(`\nNext steps:`)
  console.log(`  1. Review and customize the migration SQL`)
  console.log(`  2. Apply migration: supabase migration up (or via MCP)`)
  console.log(`  3. Configure branding in admin panel`)
  console.log(`  4. Follow the deploy checklist`)
}

// Run smoke tests if requested
if (smokeTest && !dryRun) {
  runSmokeTests()
}
