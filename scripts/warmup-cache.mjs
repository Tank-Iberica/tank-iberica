#!/usr/bin/env node
/**
 * Post-deploy cache warm-up script.
 * Fetches top pages to pre-populate ISR/SWR and CDN caches.
 *
 * Usage:
 *   node scripts/warmup-cache.mjs [--site https://tracciona.com] [--concurrency 3]
 *
 * Roadmap: N85 — warm-up strategy post-deploy
 */

const SITE_URL = getArg('--site') || process.env.SITE_URL || 'https://tracciona.com'
const CONCURRENCY = Number.parseInt(getArg('--concurrency') || '3', 10)
const TIMEOUT_MS = 15_000

// ── Top pages to warm ──────────────────────────────────────────────────────────

const STATIC_PAGES = [
  '/',
  '/catalogo',
  '/sobre-nosotros',
  '/contacto',
  '/auth/login',
  '/auth/registro',
  '/blog',
  '/offline',
]

const API_ROUTES = [
  '/api/vehicles/featured',
  '/api/vehicles/search?limit=12',
  '/api/articles/latest?limit=6',
]

function getArg(name) {
  const idx = process.argv.indexOf(name)
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : null
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const start = Date.now()
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Tracciona-Warmup/1.0' },
    })
    const elapsed = Date.now() - start
    return { url, status: res.status, elapsed, ok: res.ok }
  } catch (err) {
    const elapsed = Date.now() - start
    return { url, status: 0, elapsed, ok: false, error: err.message }
  } finally {
    clearTimeout(timer)
  }
}

async function warmupBatch(urls, concurrency) {
  const results = []
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map((url) => fetchWithTimeout(url, TIMEOUT_MS)),
    )
    results.push(...batchResults)
  }
  return results
}

async function fetchTopVehicleUrls() {
  try {
    const res = await fetch(`${SITE_URL}/api/vehicles/featured`, {
      signal: AbortSignal.timeout(10_000),
      headers: { 'User-Agent': 'Tracciona-Warmup/1.0' },
    })
    if (!res.ok) return []
    const data = await res.json()
    const vehicles = data?.vehicles || data?.data || data || []
    return vehicles
      .slice(0, 10)
      .filter((v) => v.slug || v.id)
      .map((v) => `/vehiculo/${v.slug || v.id}`)
  } catch {
    return []
  }
}

async function main() {
  console.log(`\n🔥 Cache warm-up starting`)
  console.log(`   Site: ${SITE_URL}`)
  console.log(`   Concurrency: ${CONCURRENCY}`)
  console.log('')

  // Build full URL list
  const allPaths = [...STATIC_PAGES, ...API_ROUTES]

  // Try to add top vehicle detail pages
  const vehiclePaths = await fetchTopVehicleUrls()
  if (vehiclePaths.length > 0) {
    console.log(`   Found ${vehiclePaths.length} top vehicle pages`)
    allPaths.push(...vehiclePaths)
  }

  const urls = allPaths.map((p) => `${SITE_URL}${p}`)
  console.log(`   Total URLs to warm: ${urls.length}\n`)

  const results = await warmupBatch(urls, CONCURRENCY)

  // Summary
  let passed = 0
  let failed = 0
  for (const r of results) {
    const path = r.url.replace(SITE_URL, '')
    if (r.ok) {
      console.log(`  ✅ ${r.status} ${path} (${r.elapsed}ms)`)
      passed++
    } else {
      console.log(`  ❌ ${r.status || 'ERR'} ${path} (${r.elapsed}ms) ${r.error || ''}`)
      failed++
    }
  }

  console.log(`\n📊 Results: ${passed} ok, ${failed} failed out of ${results.length}`)
  const avgTime = Math.round(results.reduce((s, r) => s + r.elapsed, 0) / results.length)
  console.log(`   Average response time: ${avgTime}ms\n`)

  if (failed > results.length / 2) {
    console.error('⚠️  More than half of warm-up requests failed!')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Warm-up script failed:', err.message)
  process.exit(1)
})
