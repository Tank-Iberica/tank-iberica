/**
 * POST /api/cron/recalculate-landings
 *
 * Weekly cron: recalculates the active_landings table.
 * Generates landing page combinations (type, type+province, type+brand),
 * counts vehicles, calculates overlap with parent landing, activates/deactivates.
 * Also generates intro_text_es/en from real catalog data (count, price range, top brands).
 *
 * Backlog #62 — Motor recalculo active_landings
 * Backlog #164 — Texto auto-generado en landings con datos reales
 */
import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { logger } from '../../utils/logger'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036F]/g, '') // strip diacritics
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '')
}

function calcThreshold(parentCount: number): number {
  if (parentCount <= 10) return 40
  if (parentCount <= 30) return 50
  if (parentCount <= 50) return 60
  return 70
}

// ─── Intro text helpers (exported for testing) ───────────────────────────────

export function updatePriceRange(
  entry: { minPrice: number | null; maxPrice: number | null },
  price: number | null,
): void {
  if (price === null || price <= 0) return
  if (entry.minPrice === null || price < entry.minPrice) entry.minPrice = price
  if (entry.maxPrice === null || price > entry.maxPrice) entry.maxPrice = price
}

export function incrementBrandCount(brandCounts: Map<string, number>, brand: string | null): void {
  if (!brand) return
  brandCounts.set(brand, (brandCounts.get(brand) ?? 0) + 1)
}

export function getTopBrands(brandCounts: Map<string, number>, n = 3): string[] {
  return [...brandCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([brand]) => brand)
}

export function formatPrice(price: number, locale: 'es' | 'en'): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    maximumFractionDigits: 0,
  }).format(price)
}

function buildPriceTextEs(minPrice: number | null, maxPrice: number | null): string {
  if (minPrice === null || maxPrice === null) return ''
  if (minPrice === maxPrice) return ` Precio: ${formatPrice(minPrice, 'es')}€.`
  return ` Precios desde ${formatPrice(minPrice, 'es')}€ hasta ${formatPrice(maxPrice, 'es')}€.`
}

function buildPriceTextEn(minPrice: number | null, maxPrice: number | null): string {
  if (minPrice === null || maxPrice === null) return ''
  if (minPrice === maxPrice) return ` Price: €${formatPrice(minPrice, 'en')}.`
  return ` Priced from €${formatPrice(minPrice, 'en')} to €${formatPrice(maxPrice, 'en')}.`
}

export function buildTypeIntroEs(
  nameEs: string,
  count: number,
  minPrice: number | null,
  maxPrice: number | null,
  topBrands: string[],
): string {
  const type = nameEs.toLowerCase()
  let text = `En Tracciona encontrarás ${count} ${type} de segunda mano.`
  text += buildPriceTextEs(minPrice, maxPrice)
  if (topBrands.length > 0) text += ` Las marcas más habituales son ${topBrands.join(', ')}.`
  text += ' Compra directamente a propietarios y empresas verificadas de toda España.'
  return text
}

export function buildTypeIntroEn(
  nameEn: string,
  count: number,
  minPrice: number | null,
  maxPrice: number | null,
  topBrands: string[],
): string {
  const type = nameEn.toLowerCase()
  let text = `Tracciona has ${count} used ${type} for sale.`
  text += buildPriceTextEn(minPrice, maxPrice)
  if (topBrands.length > 0) text += ` Top brands include ${topBrands.join(', ')}.`
  text += ' Buy directly from verified owners and businesses across Spain.'
  return text
}

export function buildTypeProvinceIntroEs(
  nameEs: string,
  province: string,
  count: number,
  minPrice: number | null,
  maxPrice: number | null,
  topBrands: string[],
): string {
  const type = nameEs.toLowerCase()
  let text = `Disponemos de ${count} ${type} de segunda mano en ${province}.`
  text += buildPriceTextEs(minPrice, maxPrice)
  if (topBrands.length > 0) text += ` Marcas disponibles: ${topBrands.join(', ')}.`
  return text
}

export function buildTypeProvinceIntroEn(
  nameEn: string,
  province: string,
  count: number,
  minPrice: number | null,
  maxPrice: number | null,
  topBrands: string[],
): string {
  const type = nameEn.toLowerCase()
  let text = `We have ${count} used ${type} for sale in ${province}.`
  text += buildPriceTextEn(minPrice, maxPrice)
  if (topBrands.length > 0) text += ` Available brands: ${topBrands.join(', ')}.`
  return text
}

export function buildTypeBrandIntroEs(
  nameEs: string,
  brand: string,
  count: number,
  minPrice: number | null,
  maxPrice: number | null,
): string {
  const type = nameEs.toLowerCase()
  let text = `Encuentra ${count} ${brand} ${type} de segunda mano en Tracciona.`
  text += buildPriceTextEs(minPrice, maxPrice)
  text += ' Todos los anuncios revisados con descripción completa.'
  return text
}

export function buildTypeBrandIntroEn(
  nameEn: string,
  brand: string,
  count: number,
  minPrice: number | null,
  maxPrice: number | null,
): string {
  const type = nameEn.toLowerCase()
  let text = `Find ${count} used ${brand} ${type} on Tracciona.`
  text += buildPriceTextEn(minPrice, maxPrice)
  text += ' All listings reviewed with full description.'
  return text
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface SubcategoryRow {
  id: string
  slug: string
  name_es: string
  name_en: string | null
}

interface VehicleRow {
  id: string
  brand: string | null
  location_province: string | null
  subcategory_id: string | null
  price: number | null
  subcategories: SubcategoryRow | null
}

interface TypeEntry {
  sub: SubcategoryRow
  count: number
  minPrice: number | null
  maxPrice: number | null
  brandCounts: Map<string, number>
}

interface TypeProvinceEntry {
  sub: SubcategoryRow
  province: string
  count: number
  minPrice: number | null
  maxPrice: number | null
  brandCounts: Map<string, number>
}

interface TypeBrandEntry {
  sub: SubcategoryRow
  brand: string
  count: number
  minPrice: number | null
  maxPrice: number | null
}

interface LandingUpsert {
  slug: string
  vertical: string
  vehicle_count: number
  parent_slug: string | null
  overlap_percentage: number
  overlap_threshold: number
  is_active: boolean
  filters_json: Record<string, string>
  meta_title_es: string
  meta_title_en: string
  meta_description_es: string
  meta_description_en: string
  intro_text_es: string
  intro_text_en: string
  last_calculated: string
}

interface DimensionMaps {
  typeCounts: Map<string, TypeEntry>
  typeProvinceCounts: Map<string, TypeProvinceEntry>
  typeBrandCounts: Map<string, TypeBrandEntry>
}

// ─── Overlap calculation ──────────────────────────────────────────────────────

function calcOverlap(
  count: number,
  parentCount: number,
): { overlapPct: number; threshold: number; isActive: boolean } {
  const overlapPct = parentCount > 0 ? (count / parentCount) * 100 : 0
  const threshold = calcThreshold(parentCount)
  return { overlapPct, threshold, isActive: count >= 3 && overlapPct < threshold }
}

// ─── Dimension map builders ───────────────────────────────────────────────────

function buildDimensionMaps(vehicles: VehicleRow[]): DimensionMaps {
  const typeCounts = new Map<string, TypeEntry>()
  const typeProvinceCounts = new Map<string, TypeProvinceEntry>()
  const typeBrandCounts = new Map<string, TypeBrandEntry>()

  for (const v of vehicles) {
    const sub = v.subcategories
    if (!sub) continue
    const typeSlug = sub.slug

    // type
    const typeEntry = typeCounts.get(typeSlug)
    if (typeEntry) {
      typeEntry.count++
      updatePriceRange(typeEntry, v.price)
      incrementBrandCount(typeEntry.brandCounts, v.brand)
    } else {
      const entry: TypeEntry = {
        sub,
        count: 1,
        minPrice: null,
        maxPrice: null,
        brandCounts: new Map(),
      }
      updatePriceRange(entry, v.price)
      incrementBrandCount(entry.brandCounts, v.brand)
      typeCounts.set(typeSlug, entry)
    }

    // type+province
    if (v.location_province) {
      const key = `${typeSlug}-${slugify(v.location_province)}`
      const tpEntry = typeProvinceCounts.get(key)
      if (tpEntry) {
        tpEntry.count++
        updatePriceRange(tpEntry, v.price)
        incrementBrandCount(tpEntry.brandCounts, v.brand)
      } else {
        const entry: TypeProvinceEntry = {
          sub,
          province: v.location_province,
          count: 1,
          minPrice: null,
          maxPrice: null,
          brandCounts: new Map(),
        }
        updatePriceRange(entry, v.price)
        incrementBrandCount(entry.brandCounts, v.brand)
        typeProvinceCounts.set(key, entry)
      }
    }

    // type+brand
    if (v.brand) {
      const key = `${typeSlug}-${slugify(v.brand)}`
      const tbEntry = typeBrandCounts.get(key)
      if (tbEntry) {
        tbEntry.count++
        updatePriceRange(tbEntry, v.price)
      } else {
        const entry: TypeBrandEntry = {
          sub,
          brand: v.brand,
          count: 1,
          minPrice: null,
          maxPrice: null,
        }
        updatePriceRange(entry, v.price)
        typeBrandCounts.set(key, entry)
      }
    }
  }

  return { typeCounts, typeProvinceCounts, typeBrandCounts }
}

// ─── Landing builders ─────────────────────────────────────────────────────────

function buildTypeLandings(typeCounts: Map<string, TypeEntry>, now: string): LandingUpsert[] {
  const landings: LandingUpsert[] = []
  for (const [slug, { sub, count, minPrice, maxPrice, brandCounts }] of typeCounts) {
    const nameEs = sub.name_es
    const nameEn = sub.name_en || nameEs
    const topBrands = getTopBrands(brandCounts)
    landings.push({
      slug,
      vertical: 'tracciona',
      vehicle_count: count,
      parent_slug: null,
      overlap_percentage: 0,
      overlap_threshold: calcThreshold(count),
      is_active: count >= 3,
      filters_json: { subcategory_id: sub.id },
      meta_title_es: `${nameEs} de Segunda Mano — Compra y Venta | Tracciona`,
      meta_title_en: `Used ${nameEn} for Sale | Tracciona`,
      meta_description_es: `Compra y vende ${nameEs.toLowerCase()} de segunda mano. ${count} vehículos disponibles en Tracciona.`,
      meta_description_en: `Buy and sell used ${nameEn.toLowerCase()}. ${count} vehicles available on Tracciona.`,
      intro_text_es: buildTypeIntroEs(nameEs, count, minPrice, maxPrice, topBrands),
      intro_text_en: buildTypeIntroEn(nameEn, count, minPrice, maxPrice, topBrands),
      last_calculated: now,
    })
  }
  return landings
}

function buildTypeProvinceLandings(
  typeProvinceCounts: Map<string, TypeProvinceEntry>,
  typeCounts: Map<string, TypeEntry>,
  now: string,
): LandingUpsert[] {
  const landings: LandingUpsert[] = []
  for (const [
    slug,
    { sub, province, count, minPrice, maxPrice, brandCounts },
  ] of typeProvinceCounts) {
    const nameEs = sub.name_es
    const nameEn = sub.name_en || nameEs
    const parentCount = typeCounts.get(sub.slug)?.count ?? 0
    const { overlapPct, threshold, isActive } = calcOverlap(count, parentCount)
    const topBrands = getTopBrands(brandCounts)
    landings.push({
      slug,
      vertical: 'tracciona',
      vehicle_count: count,
      parent_slug: sub.slug,
      overlap_percentage: Math.round(overlapPct * 100) / 100,
      overlap_threshold: threshold,
      is_active: isActive,
      filters_json: { subcategory_id: sub.id, location_province_eq: province },
      meta_title_es: `${nameEs} de Segunda Mano en ${province} | Tracciona`,
      meta_title_en: `Used ${nameEn} in ${province} | Tracciona`,
      meta_description_es: `${count} ${nameEs.toLowerCase()} de segunda mano en ${province}. Compra directa a propietario.`,
      meta_description_en: `${count} used ${nameEn.toLowerCase()} in ${province}. Buy directly from the owner.`,
      intro_text_es: buildTypeProvinceIntroEs(
        nameEs,
        province,
        count,
        minPrice,
        maxPrice,
        topBrands,
      ),
      intro_text_en: buildTypeProvinceIntroEn(
        nameEn,
        province,
        count,
        minPrice,
        maxPrice,
        topBrands,
      ),
      last_calculated: now,
    })
  }
  return landings
}

function buildTypeBrandLandings(
  typeBrandCounts: Map<string, TypeBrandEntry>,
  typeCounts: Map<string, TypeEntry>,
  now: string,
): LandingUpsert[] {
  const landings: LandingUpsert[] = []
  for (const [slug, { sub, brand, count, minPrice, maxPrice }] of typeBrandCounts) {
    const nameEs = sub.name_es
    const nameEn = sub.name_en || nameEs
    const parentCount = typeCounts.get(sub.slug)?.count ?? 0
    const { overlapPct, threshold, isActive } = calcOverlap(count, parentCount)
    landings.push({
      slug,
      vertical: 'tracciona',
      vehicle_count: count,
      parent_slug: sub.slug,
      overlap_percentage: Math.round(overlapPct * 100) / 100,
      overlap_threshold: threshold,
      is_active: isActive,
      filters_json: { subcategory_id: sub.id, brand },
      meta_title_es: `${nameEs} ${brand} de Segunda Mano | Tracciona`,
      meta_title_en: `Used ${brand} ${nameEn} for Sale | Tracciona`,
      meta_description_es: `${count} ${nameEs.toLowerCase()} ${brand} de segunda mano. Ofertas actualizadas en Tracciona.`,
      meta_description_en: `${count} used ${brand} ${nameEn.toLowerCase()} for sale. Updated listings on Tracciona.`,
      intro_text_es: buildTypeBrandIntroEs(nameEs, brand, count, minPrice, maxPrice),
      intro_text_en: buildTypeBrandIntroEn(nameEn, brand, count, minPrice, maxPrice),
      last_calculated: now,
    })
  }
  return landings
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const body = await readBody<{ secret?: string }>(event).catch(() => ({}) as { secret?: string })
  verifyCronSecret(event, body?.secret)

  const supabase = serverSupabaseServiceRole(event)
  const now = new Date().toISOString()

  // Fetch all published vehicles with subcategory info, price and brand for intro text
  const { data: rawVehicles, error: fetchError } = await supabase
    .from('vehicles')
    .select(
      'id, brand, location_province, subcategory_id, price, subcategories(id, slug, name_es, name_en)',
    )
    .eq('status', 'published')
    .not('subcategory_id', 'is', null)

  if (fetchError) {
    logger.error('[recalculate-landings] Fetch error:', { error: String(fetchError.message) })
    return { ok: false, error: fetchError.message }
  }

  const vehicles = (rawVehicles || []) as VehicleRow[]

  // Build dimension → count/price/brand maps
  const { typeCounts, typeProvinceCounts, typeBrandCounts } = buildDimensionMaps(vehicles)

  const landings: LandingUpsert[] = [
    ...buildTypeLandings(typeCounts, now),
    ...buildTypeProvinceLandings(typeProvinceCounts, typeCounts, now),
    ...buildTypeBrandLandings(typeBrandCounts, typeCounts, now),
  ]

  if (landings.length === 0) {
    logger.warn(
      '[recalculate-landings] No landings generated — no published vehicles with subcategory?',
    )
    return { ok: true, total: 0, active: 0, upserted: 0 }
  }

  // Upsert in batches of 100
  const BATCH = 100
  let upserted = 0
  for (let i = 0; i < landings.length; i += BATCH) {
    const { error: upsertErr } = await supabase
      .from('active_landings')
      .upsert(landings.slice(i, i + BATCH), { onConflict: 'slug' })
    if (upsertErr) {
      logger.error('[recalculate-landings] Upsert error:', { error: String(upsertErr.message) })
    } else {
      upserted += Math.min(BATCH, landings.length - i)
    }
  }

  // Deactivate stale slugs: anything with last_calculated < now wasn't touched
  await supabase
    .from('active_landings')
    .update({ is_active: false })
    .eq('vertical', 'tracciona')
    .lt('last_calculated', now)

  const activeCount = landings.filter((l) => l.is_active).length
  logger.info('[recalculate-landings] Done', {
    total: landings.length,
    active: activeCount,
    upserted,
  })
  return { ok: true, total: landings.length, active: activeCount, upserted }
})
