#!/usr/bin/env node
/**
 * seo-check.mjs — SEO validation script
 *
 * Checks:
 * 1. JSON-LD structured data validity in page components
 * 2. OG meta tags presence in all public pages
 * 3. Canonical URLs configured
 * 4. Sitemap source endpoint exists
 * 5. robots.txt configuration
 *
 * Usage: node scripts/seo-check.mjs
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const RED = '\x1B[31m'
const GREEN = '\x1B[32m'
const YELLOW = '\x1B[33m'
const NC = '\x1B[0m'

let pass = 0
let warn = 0
let fail = 0

function ok(msg) { console.log(`  ${GREEN}✅ ${msg}${NC}`); pass++ }
function warning(msg) { console.log(`  ${YELLOW}⚠️  ${msg}${NC}`); warn++ }
function error(msg) { console.log(`  ${RED}❌ ${msg}${NC}`); fail++ }

function getVueFiles(dir, files = []) {
  if (!existsSync(dir)) return files
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      // Skip admin, dashboard, auth, perfil dirs (not public SEO pages)
      if (!['admin', 'dashboard', 'auth', 'perfil'].includes(entry)) {
        getVueFiles(full, files)
      }
    } else if (entry.endsWith('.vue')) {
      files.push(full)
    }
  }
  return files
}

console.log('╔══════════════════════════════════════════════════╗')
console.log('║       SEO Validation — Tracciona                ║')
console.log('╚══════════════════════════════════════════════════╝')
console.log('')

// ── 1. robots.txt ──
console.log('1. robots.txt:')
if (existsSync('public/robots.txt')) {
  const robots = readFileSync('public/robots.txt', 'utf-8')
  ok('robots.txt exists')
  if (robots.includes('Sitemap:')) ok('Contains Sitemap directive')
  else warning('Missing Sitemap directive')
  if (robots.includes('Disallow: /admin/')) ok('Disallows /admin/')
  else warning('Does not disallow /admin/')
  if (robots.includes('Disallow: /api/')) ok('Disallows /api/')
  else warning('Does not disallow /api/')
} else {
  error('robots.txt MISSING')
}
console.log('')

// ── 2. Sitemap configuration ──
console.log('2. Sitemap configuration:')
if (existsSync('nuxt.config.ts')) {
  const config = readFileSync('nuxt.config.ts', 'utf-8')
  if (config.includes("'@nuxtjs/sitemap'")) ok('@nuxtjs/sitemap module registered')
  else error('@nuxtjs/sitemap not in modules')
  if (config.includes('/api/__sitemap')) ok('Dynamic sitemap source configured')
  else warning('No dynamic sitemap source')
}
if (existsSync('server/api/__sitemap.ts')) {
  const sitemap = readFileSync('server/api/__sitemap.ts', 'utf-8')
  ok('server/api/__sitemap.ts exists')
  if (sitemap.includes('vehicles')) ok('Vehicles included in sitemap')
  else warning('Vehicles not in sitemap')
} else {
  error('server/api/__sitemap.ts MISSING')
}
console.log('')

// ── 3. Public pages SEO audit ──
console.log('3. Public pages — SEO meta audit:')
const publicPages = getVueFiles('app/pages')
const seoIssues = []

for (const file of publicPages) {
  const content = readFileSync(file, 'utf-8')
  const rel = relative('app/pages', file).replace(/\\/g, '/')
  const issues = []

  // Check for SEO meta
  const hasUseSeoMeta = content.includes('useSeoMeta')
  const hasUsePageSeo = content.includes('usePageSeo')

  if (!hasUseSeoMeta && !hasUsePageSeo) {
    issues.push('no useSeoMeta/usePageSeo')
  }

  // Skip further checks for error.vue and offline.vue
  if (rel === 'offline.vue' || rel === 'confirm.vue') continue

  if (issues.length > 0) {
    seoIssues.push({ file: rel, issues })
  }
}

if (seoIssues.length === 0) {
  ok('All public pages have SEO meta configured')
} else {
  for (const { file, issues } of seoIssues) {
    warning(`${file}: ${issues.join(', ')}`)
  }
}
console.log('')

// ── 4. JSON-LD structured data ──
console.log('4. JSON-LD structured data:')
const jsonLdPages = []
for (const file of publicPages) {
  const content = readFileSync(file, 'utf-8')
  const rel = relative('app/pages', file).replace(/\\/g, '/')
  if (content.includes('application/ld+json') || content.includes('useJsonLd') || content.includes('jsonLd')) {
    jsonLdPages.push(rel)
  }
}

if (jsonLdPages.length > 0) {
  ok(`${jsonLdPages.length} pages with JSON-LD structured data:`)
  for (const p of jsonLdPages) {
    console.log(`     → ${p}`)
  }
} else {
  warning('No pages with JSON-LD found')
}

// Check key schemas exist
const vehiclePage = existsSync('app/pages/vehiculo/[slug].vue')
  ? readFileSync('app/pages/vehiculo/[slug].vue', 'utf-8')
  : ''
if (vehiclePage.includes("'Vehicle'") || vehiclePage.includes('"Vehicle"')) {
  ok('Vehicle schema in vehicle detail page')
} else {
  error('Vehicle schema MISSING in vehicle detail page')
}

if (vehiclePage.includes('BreadcrumbList')) {
  ok('BreadcrumbList schema in vehicle detail page')
} else {
  warning('BreadcrumbList schema missing in vehicle detail page')
}

const indexPage = existsSync('app/pages/index.vue')
  ? readFileSync('app/pages/index.vue', 'utf-8')
  : ''
if (indexPage.includes('WebSite') || indexPage.includes('SearchAction')) {
  ok('WebSite/SearchAction schema in homepage')
} else {
  warning('WebSite schema missing in homepage')
}

// Organization schema (global)
const appVue = existsSync('app/app.vue')
  ? readFileSync('app/app.vue', 'utf-8')
  : ''
if (appVue.includes('Organization') || appVue.includes('buildOrganizationSchema')) {
  ok('Organization schema injected globally')
} else {
  warning('Organization schema not found in app.vue')
}
console.log('')

// ── 5. Open Graph tags ──
console.log('5. Open Graph tags:')
const composable = existsSync('app/composables/usePageSeo.ts')
  ? readFileSync('app/composables/usePageSeo.ts', 'utf-8')
  : ''
if (composable.includes('ogTitle')) ok('usePageSeo includes ogTitle')
else warning('usePageSeo missing ogTitle')
if (composable.includes('ogImage')) ok('usePageSeo includes ogImage')
else warning('usePageSeo missing ogImage')
if (composable.includes('twitterCard')) ok('usePageSeo includes twitterCard')
else warning('usePageSeo missing twitterCard')
if (composable.includes('ogLocale') || composable.includes('og:locale')) {
  ok('usePageSeo includes ogLocale')
} else {
  warning('usePageSeo missing ogLocale (set per-page in useSeoMeta)')
}
console.log('')

// ── 6. Hreflang ──
console.log('6. Hreflang configuration:')
if (composable.includes('hreflang') || composable.includes('alternate')) {
  ok('Hreflang alternates in usePageSeo')
} else {
  warning('Hreflang not found in usePageSeo')
}
if (existsSync('app/composables/useHreflang.ts')) {
  ok('useHreflang composable exists')
}
console.log('')

// ── 7. Canonical URLs ──
console.log('7. Canonical URLs:')
if (composable.includes('canonical')) {
  ok('Canonical URL in usePageSeo')
} else {
  warning('Canonical URL not found in usePageSeo')
}
console.log('')

// ── 8. Share buttons ──
console.log('8. Social sharing:')
if (existsSync('app/components/ui/ShareButtons.vue')) {
  ok('ShareButtons component exists')
  const share = readFileSync('app/components/ui/ShareButtons.vue', 'utf-8')
  if (share.includes('wa.me')) ok('WhatsApp sharing')
  if (share.includes('linkedin.com')) ok('LinkedIn sharing')
  if (share.includes('mailto:')) ok('Email sharing')
  if (share.includes('clipboard')) ok('Copy link functionality')
} else {
  warning('ShareButtons component not found')
}
console.log('')

// ── 9. Image alt text audit ──
console.log('9. Image alt text audit:')
const imgIssues = []
for (const file of publicPages) {
  const content = readFileSync(file, 'utf-8')
  const rel = relative('app/pages', file).replace(/\\/g, '/')

  // Find <img> and <NuxtImg> tags without alt attribute
  // Extract full tag text by tracking quote state to handle > inside attributes
  const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/)
  if (templateMatch) {
    const tmpl = templateMatch[1]
    const tagStarts = [...tmpl.matchAll(/<(img|NuxtImg)\b/g)]

    for (const start of tagStarts) {
      let pos = start.index + start[0].length
      let inQuote = ''
      // Walk forward to find the real closing > (not inside quotes)
      while (pos < tmpl.length) {
        const ch = tmpl[pos]
        if (inQuote) {
          if (ch === inQuote) inQuote = ''
        } else if (ch === '"' || ch === "'") {
          inQuote = ch
        } else if (ch === '>') {
          break
        }
        pos++
      }
      const fullTag = tmpl.slice(start.index, pos + 1)
      if (!fullTag.includes('alt=') && !fullTag.includes(':alt=')) {
        const suffix = start[1] === 'NuxtImg' ? ` (${start[1]})` : ''
        imgIssues.push(`${rel}${suffix}`)
        break
      }
    }
  }
}

if (imgIssues.length === 0) {
  ok('All public page images have alt attributes')
} else {
  for (const f of imgIssues) {
    error(`Missing alt attribute in: ${f}`)
  }
}
console.log('')

// ── 10. Single <h1> per page ──
console.log('10. Single <h1> per page:')
const h1Issues = []
for (const file of publicPages) {
  const content = readFileSync(file, 'utf-8')
  const rel = relative('app/pages', file).replace(/\\/g, '/')
  if (rel === 'offline.vue' || rel === 'confirm.vue') continue

  const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/)
  if (templateMatch) {
    const template = templateMatch[1]
    const h1Count = (template.match(/<h1[\s>]/g) || []).length
    if (h1Count > 1) {
      h1Issues.push({ file: rel, count: h1Count })
    }
  }
}

if (h1Issues.length === 0) {
  ok('All public pages have at most one <h1>')
} else {
  for (const { file, count } of h1Issues) {
    warning(`${file}: ${count} <h1> tags found (should be 1)`)
  }
}
console.log('')

// ── 11. Links without href ──
console.log('11. Links without href:')
const hrefIssues = []
for (const file of publicPages) {
  const content = readFileSync(file, 'utf-8')
  const rel = relative('app/pages', file).replace(/\\/g, '/')

  const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/)
  if (templateMatch) {
    const template = templateMatch[1]
    // Find <a> tags without href or :href
    const aTags = template.match(/<a\b[^>]*>/g) || []
    for (const a of aTags) {
      if (!a.includes('href=') && !a.includes(':href=')) {
        hrefIssues.push(rel)
        break
      }
    }
  }
}

if (hrefIssues.length === 0) {
  ok('All <a> tags have href attributes')
} else {
  for (const f of hrefIssues) {
    error(`<a> without href in: ${f}`)
  }
}
console.log('')

// ── 12. Internal linking components ──
console.log('12. Internal linking:')
if (existsSync('app/components/vehicle/RelatedVehicles.vue')) {
  ok('RelatedVehicles component exists')
} else {
  warning('RelatedVehicles component missing')
}
if (existsSync('app/components/vehicle/CategoryLinks.vue')) {
  ok('CategoryLinks component exists')
} else {
  warning('CategoryLinks component missing')
}
console.log('')

// ── Summary ──
console.log('════════════════════════════════════════')
console.log(`Results: ${GREEN}${pass} passed${NC}, ${YELLOW}${warn} warnings${NC}, ${RED}${fail} failed${NC}`)
if (fail > 0) {
  console.log(`${RED}SEO check has failures — review above${NC}`)
  process.exit(1)
} else {
  console.log(`${GREEN}SEO check passed${NC}`)
}
console.log('════════════════════════════════════════')
