/**
 * Test fixtures factory.
 *
 * Provides factory functions for creating realistic mock objects used across
 * unit and integration tests. Each factory accepts an optional `overrides`
 * parameter so individual fields can be customized per-test.
 *
 * Usage:
 *   import { createMockVehicle, createMockDealer } from '@/tests/helpers/factories'
 *
 *   const v = createMockVehicle({ price: 99000 })
 *   const d = createMockDealer({ company_name: 'ACME Trucks' })
 */

// ── Re-exports of domain types ─────────────────────────────────────────────────
// Inline types mirror the composable definitions so tests stay self-contained.

export interface MockVehicleImage {
  id: string
  url: string
  thumbnail_url: string | null
  position: number
  alt_text: string | null
}

export interface MockVehicleSubcategory {
  id: string
  name: Record<string, string> | null
  name_singular: Record<string, string> | null
  name_es: string
  name_en: string | null
  name_singular_es: string | null
  name_singular_en: string | null
  slug: string
}

export interface MockVehicle {
  id: string
  slug: string
  brand: string
  model: string
  year: number | null
  price: number | null
  rental_price: number | null
  category: 'alquiler' | 'venta' | 'terceros'
  action_id: string | null
  category_id: string | null
  location: string | null
  location_en: string | null
  location_data: Record<string, string> | null
  description_es: string | null
  description_en: string | null
  attributes_json: Record<string, unknown>
  location_country: string | null
  location_province: string | null
  location_region: string | null
  status: string
  featured: boolean
  created_at: string
  updated_at: string
  vehicle_images: MockVehicleImage[]
  subcategories: MockVehicleSubcategory | null
}

export interface MockDealer {
  id: string
  user_id: string
  company_name: string | null
  slug: string | null
  bio: string | null
  logo_url: string | null
  phone: string | null
  email: string | null
  website: string | null
  location: string | null
  theme_primary: string | null
  theme_accent: string | null
  social_links: Record<string, string> | null
  certifications: string[] | null
  auto_reply_message: string | null
  onboarding_completed: boolean
  created_at: string | null
  subscription_type: string | null
  status: string | null
}

export interface MockAuction {
  id: string
  vehicle_id: string
  dealer_id: string
  title: string | null
  description: string | null
  starting_price: number
  reserve_price: number | null
  current_bid: number | null
  bid_increment: number
  deposit_amount: number
  buyer_premium_pct: number
  status: string
  starts_at: string
  ends_at: string
  created_at: string
  updated_at: string
  vehicle?: Partial<MockVehicle>
}

export interface MockLead {
  id: string
  vehicle_id: string | null
  dealer_id: string
  user_id: string | null
  buyer_name: string | null
  buyer_email: string | null
  buyer_phone: string | null
  message: string | null
  status: string
  source: string | null
  created_at: string
  updated_at: string
}

export interface MockSubscription {
  id: string
  dealer_id: string
  plan: string
  status: string
  stripe_subscription_id: string | null
  current_period_start: string
  current_period_end: string
  created_at: string
}

// ── Counter for unique IDs ────────────────────────────────────────────────────
let _counter = 0
function nextId(): string {
  return `mock-id-${++_counter}`
}

/** Reset the counter (useful in beforeEach to get deterministic IDs) */
export function resetFactoryCounter(): void {
  _counter = 0
}

// ── Factories ────────────────────────────────────────────────────────────────

/**
 * Creates a mock VehicleImage with sensible defaults.
 */
export function createMockImage(overrides: Partial<MockVehicleImage> = {}): MockVehicleImage {
  return {
    id: nextId(),
    url: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
    thumbnail_url: 'https://res.cloudinary.com/demo/image/upload/c_thumb,w_200/v1/sample.jpg',
    position: 0,
    alt_text: null,
    ...overrides,
  }
}

/**
 * Creates a mock Vehicle with sensible defaults.
 * Includes one image by default.
 */
export function createMockVehicle(overrides: Partial<MockVehicle> = {}): MockVehicle {
  const id = overrides.id ?? nextId()
  const brand = overrides.brand ?? 'Volvo'
  const model = overrides.model ?? 'FH16'
  return {
    id,
    slug: overrides.slug ?? `${brand.toLowerCase()}-${model.toLowerCase()}-${id}`,
    brand,
    model,
    year: overrides.year ?? 2021,
    price: overrides.price ?? 85000,
    rental_price: overrides.rental_price ?? null,
    category: overrides.category ?? 'venta',
    action_id: overrides.action_id ?? null,
    category_id: overrides.category_id ?? 'cat-001',
    location: overrides.location ?? 'Madrid',
    location_en: overrides.location_en ?? 'Madrid',
    location_data: overrides.location_data ?? null,
    description_es: overrides.description_es ?? 'Vehículo de prueba',
    description_en: overrides.description_en ?? 'Test vehicle',
    attributes_json: overrides.attributes_json ?? { mileage: 150000 },
    location_country: overrides.location_country ?? 'ES',
    location_province: overrides.location_province ?? 'Madrid',
    location_region: overrides.location_region ?? 'Comunidad de Madrid',
    status: overrides.status ?? 'published',
    featured: overrides.featured ?? false,
    created_at: overrides.created_at ?? '2024-01-15T10:00:00.000Z',
    updated_at: overrides.updated_at ?? '2024-01-15T10:00:00.000Z',
    vehicle_images: overrides.vehicle_images ?? [createMockImage()],
    subcategories: overrides.subcategories ?? null,
  }
}

/**
 * Creates a mock DealerProfile with sensible defaults.
 */
export function createMockDealer(overrides: Partial<MockDealer> = {}): MockDealer {
  const id = overrides.id ?? nextId()
  return {
    id,
    user_id: overrides.user_id ?? nextId(),
    company_name: overrides.company_name ?? 'Transportes Demo SL',
    slug: overrides.slug ?? `transportes-demo-${id}`,
    bio: overrides.bio ?? null,
    logo_url: overrides.logo_url ?? null,
    phone: overrides.phone ?? '+34 600 000 000',
    email: overrides.email ?? `demo-${id}@transportes.com`,
    website: overrides.website ?? null,
    location: overrides.location ?? 'Madrid',
    theme_primary: overrides.theme_primary ?? '#23424A',
    theme_accent: overrides.theme_accent ?? '#E8941A',
    social_links: overrides.social_links ?? null,
    certifications: overrides.certifications ?? null,
    auto_reply_message: overrides.auto_reply_message ?? null,
    onboarding_completed: overrides.onboarding_completed ?? true,
    created_at: overrides.created_at ?? '2024-01-01T00:00:00.000Z',
    subscription_type: overrides.subscription_type ?? 'premium',
    status: overrides.status ?? 'active',
  }
}

/**
 * Creates a mock Auction with sensible defaults.
 */
export function createMockAuction(overrides: Partial<MockAuction> = {}): MockAuction {
  const now = new Date()
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  return {
    id: overrides.id ?? nextId(),
    vehicle_id: overrides.vehicle_id ?? nextId(),
    dealer_id: overrides.dealer_id ?? nextId(),
    title: overrides.title ?? 'Subasta Volvo FH16',
    description: overrides.description ?? null,
    starting_price: overrides.starting_price ?? 50000,
    reserve_price: overrides.reserve_price ?? 70000,
    current_bid: overrides.current_bid ?? null,
    bid_increment: overrides.bid_increment ?? 500,
    deposit_amount: overrides.deposit_amount ?? 1000,
    buyer_premium_pct: overrides.buyer_premium_pct ?? 5,
    status: overrides.status ?? 'scheduled',
    starts_at: overrides.starts_at ?? now.toISOString(),
    ends_at: overrides.ends_at ?? in7Days.toISOString(),
    created_at: overrides.created_at ?? now.toISOString(),
    updated_at: overrides.updated_at ?? now.toISOString(),
    vehicle: overrides.vehicle,
  }
}

/**
 * Creates a mock Lead with sensible defaults.
 */
export function createMockLead(overrides: Partial<MockLead> = {}): MockLead {
  return {
    id: overrides.id ?? nextId(),
    vehicle_id: overrides.vehicle_id ?? nextId(),
    dealer_id: overrides.dealer_id ?? nextId(),
    user_id: overrides.user_id ?? null,
    buyer_name: overrides.buyer_name ?? 'Juan García',
    buyer_email: overrides.buyer_email ?? 'juan@example.com',
    buyer_phone: overrides.buyer_phone ?? '+34 600 111 222',
    message: overrides.message ?? 'Me interesa el vehículo, ¿está disponible?',
    status: overrides.status ?? 'new',
    source: overrides.source ?? 'web',
    created_at: overrides.created_at ?? '2024-03-01T10:00:00.000Z',
    updated_at: overrides.updated_at ?? '2024-03-01T10:00:00.000Z',
  }
}

/**
 * Creates a mock Subscription with sensible defaults.
 */
export function createMockSubscription(overrides: Partial<MockSubscription> = {}): MockSubscription {
  return {
    id: overrides.id ?? nextId(),
    dealer_id: overrides.dealer_id ?? nextId(),
    plan: overrides.plan ?? 'premium',
    status: overrides.status ?? 'active',
    stripe_subscription_id: overrides.stripe_subscription_id ?? `sub_${nextId()}`,
    current_period_start: overrides.current_period_start ?? '2024-03-01T00:00:00.000Z',
    current_period_end: overrides.current_period_end ?? '2024-04-01T00:00:00.000Z',
    created_at: overrides.created_at ?? '2024-03-01T00:00:00.000Z',
  }
}
