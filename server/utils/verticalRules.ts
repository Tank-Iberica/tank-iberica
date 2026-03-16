/**
 * Vertical Rules — Per-vertical compliance, stock limits, and feature flags
 *
 * Reads compliance_rules, stock_limits, and feature flags from
 * vertical_config + feature_flags tables.
 */

import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComplianceRules {
  require_vehicle_images: boolean
  min_images: number
  max_images: number
  require_price: boolean
  min_price_cents: number
  max_price_cents: number
  require_description: boolean
  min_description_length: number
  allowed_currencies: string[]
  require_iva_info: boolean
  max_listing_days: number
  auto_unpublish_stale: boolean
}

export interface PlanStockLimits {
  max_vehicles: number
  max_images_per_vehicle: number
}

export type StockLimits = Record<string, PlanStockLimits>

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_COMPLIANCE: ComplianceRules = {
  require_vehicle_images: true,
  min_images: 3,
  max_images: 30,
  require_price: true,
  min_price_cents: 100,
  max_price_cents: 99_999_900,
  require_description: true,
  min_description_length: 50,
  allowed_currencies: ['EUR'],
  require_iva_info: true,
  max_listing_days: 180,
  auto_unpublish_stale: true,
}

const DEFAULT_STOCK_LIMITS: StockLimits = {
  free: { max_vehicles: 3, max_images_per_vehicle: 10 },
  basic: { max_vehicles: 20, max_images_per_vehicle: 20 },
  premium: { max_vehicles: -1, max_images_per_vehicle: 30 },
  founding: { max_vehicles: -1, max_images_per_vehicle: 30 },
}

// ---------------------------------------------------------------------------
// Fetch vertical rules
// ---------------------------------------------------------------------------

export async function getVerticalComplianceRules(
  event: H3Event,
  vertical: string,
): Promise<ComplianceRules> {
  const client = serverSupabaseServiceRole(event)

  const { data } = (await client
    .from('vertical_config')
    .select('compliance_rules')
    .eq('vertical', vertical)
    .single()) as { data: Record<string, unknown> | null }

  if (!data?.compliance_rules) return { ...DEFAULT_COMPLIANCE }

  return { ...DEFAULT_COMPLIANCE, ...(data.compliance_rules as Partial<ComplianceRules>) }
}

export async function getVerticalStockLimits(
  event: H3Event,
  vertical: string,
): Promise<StockLimits> {
  const client = serverSupabaseServiceRole(event)

  const { data } = (await client
    .from('vertical_config')
    .select('stock_limits')
    .eq('vertical', vertical)
    .single()) as { data: Record<string, unknown> | null }

  if (!data?.stock_limits) return { ...DEFAULT_STOCK_LIMITS }

  const limits = Object.fromEntries(
    Object.entries(data.stock_limits as Record<string, unknown>).filter(([, v]) => v !== undefined),
  ) as Partial<StockLimits>

  return { ...DEFAULT_STOCK_LIMITS, ...limits } as StockLimits
}

// ---------------------------------------------------------------------------
// Feature flag check (server-side)
// ---------------------------------------------------------------------------

export async function isVerticalFeatureEnabled(
  event: H3Event,
  featureKey: string,
  vertical?: string,
): Promise<boolean> {
  const client = serverSupabaseServiceRole(event)

  // Check vertical-specific flag first
  if (vertical) {
    const { data: verticalFlag } = await client
      .from('feature_flags')
      .select('enabled')
      .eq('key', featureKey)
      .eq('vertical', vertical)
      .single()

    if (verticalFlag) return verticalFlag.enabled
  }

  // Fall back to global flag
  const { data: globalFlag } = await client
    .from('feature_flags')
    .select('enabled')
    .eq('key', featureKey)
    .is('vertical', null)
    .single()

  return globalFlag?.enabled ?? false
}

// ---------------------------------------------------------------------------
// Validate vehicle against compliance rules
// ---------------------------------------------------------------------------

export interface ComplianceViolation {
  field: string
  rule: string
  message: string
}

type ComplianceVehicle = {
  price?: number
  images?: string[]
  description?: string
  currency?: string
}

function validatePrice(vehicle: ComplianceVehicle, rules: ComplianceRules): ComplianceViolation[] {
  const violations: ComplianceViolation[] = []
  if (rules.require_price && (!vehicle.price || vehicle.price <= 0)) {
    violations.push({ field: 'price', rule: 'require_price', message: 'Price is required' })
  }
  if (vehicle.price) {
    if (vehicle.price < rules.min_price_cents) {
      violations.push({
        field: 'price',
        rule: 'min_price_cents',
        message: `Price must be at least ${rules.min_price_cents} cents`,
      })
    }
    if (vehicle.price > rules.max_price_cents) {
      violations.push({
        field: 'price',
        rule: 'max_price_cents',
        message: `Price must not exceed ${rules.max_price_cents} cents`,
      })
    }
  }
  return violations
}

function validateImages(vehicle: ComplianceVehicle, rules: ComplianceRules): ComplianceViolation[] {
  const violations: ComplianceViolation[] = []
  const imageCount = vehicle.images?.length ?? 0
  if (rules.require_vehicle_images && imageCount < rules.min_images) {
    violations.push({
      field: 'images',
      rule: 'min_images',
      message: `At least ${rules.min_images} images required`,
    })
  }
  if (imageCount > rules.max_images) {
    violations.push({
      field: 'images',
      rule: 'max_images',
      message: `Maximum ${rules.max_images} images allowed`,
    })
  }
  return violations
}

export function validateVehicleCompliance(
  vehicle: ComplianceVehicle,
  rules: ComplianceRules,
): ComplianceViolation[] {
  const violations: ComplianceViolation[] = [
    ...validatePrice(vehicle, rules),
    ...validateImages(vehicle, rules),
  ]

  if (rules.require_description) {
    const descLen = vehicle.description?.length ?? 0
    if (descLen < rules.min_description_length) {
      violations.push({
        field: 'description',
        rule: 'min_description_length',
        message: `Description must be at least ${rules.min_description_length} characters`,
      })
    }
  }

  if (vehicle.currency && !rules.allowed_currencies.includes(vehicle.currency)) {
    violations.push({
      field: 'currency',
      rule: 'allowed_currencies',
      message: `Currency must be one of: ${rules.allowed_currencies.join(', ')}`,
    })
  }

  return violations
}
