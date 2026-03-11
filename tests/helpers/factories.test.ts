import { describe, it, expect, beforeEach } from 'vitest'
import {
  createMockVehicle,
  createMockDealer,
  createMockAuction,
  createMockLead,
  createMockSubscription,
  createMockImage,
  resetFactoryCounter,
} from './factories'

beforeEach(() => {
  resetFactoryCounter()
})

// ── createMockImage ───────────────────────────────────────────────────────────

describe('createMockImage', () => {
  it('returns object with required fields', () => {
    const img = createMockImage()
    expect(img).toMatchObject({
      id: expect.any(String),
      url: expect.any(String),
      position: expect.any(Number),
    })
  })

  it('applies overrides', () => {
    const img = createMockImage({ position: 3, alt_text: 'test' })
    expect(img.position).toBe(3)
    expect(img.alt_text).toBe('test')
  })
})

// ── createMockVehicle ────────────────────────────────────────────────────────

describe('createMockVehicle', () => {
  it('returns a vehicle with all required fields', () => {
    const v = createMockVehicle()
    expect(v.id).toBeDefined()
    expect(v.slug).toBeDefined()
    expect(v.brand).toBe('Volvo')
    expect(v.model).toBe('FH16')
    expect(v.status).toBe('published')
    expect(v.category).toBe('venta')
    expect(v.vehicle_images).toHaveLength(1)
  })

  it('applies field overrides', () => {
    const v = createMockVehicle({ brand: 'MAN', model: 'TGX', price: 99000, year: 2023 })
    expect(v.brand).toBe('MAN')
    expect(v.model).toBe('TGX')
    expect(v.price).toBe(99000)
    expect(v.year).toBe(2023)
  })

  it('overrides vehicle_images', () => {
    const imgs = [createMockImage(), createMockImage()]
    const v = createMockVehicle({ vehicle_images: imgs })
    expect(v.vehicle_images).toHaveLength(2)
  })

  it('generates unique IDs for each call', () => {
    const a = createMockVehicle()
    const b = createMockVehicle()
    expect(a.id).not.toBe(b.id)
  })

  it('respects explicit id override', () => {
    const v = createMockVehicle({ id: 'custom-id' })
    expect(v.id).toBe('custom-id')
  })

  it('builds slug from brand and model by default', () => {
    const v = createMockVehicle({ brand: 'Scania', model: 'R500' })
    expect(v.slug).toMatch(/scania/)
    expect(v.slug).toMatch(/r500/)
  })

  it('status defaults to published', () => {
    expect(createMockVehicle().status).toBe('published')
  })

  it('can override status to archived', () => {
    const v = createMockVehicle({ status: 'archived' })
    expect(v.status).toBe('archived')
  })
})

// ── createMockDealer ─────────────────────────────────────────────────────────

describe('createMockDealer', () => {
  it('returns a dealer with all required fields', () => {
    const d = createMockDealer()
    expect(d.id).toBeDefined()
    expect(d.user_id).toBeDefined()
    expect(d.company_name).toBe('Transportes Demo SL')
    expect(d.onboarding_completed).toBe(true)
  })

  it('applies overrides', () => {
    const d = createMockDealer({ company_name: 'ACME Trucks', subscription_type: 'founding' })
    expect(d.company_name).toBe('ACME Trucks')
    expect(d.subscription_type).toBe('founding')
  })

  it('generates unique IDs per call', () => {
    const a = createMockDealer()
    const b = createMockDealer()
    expect(a.id).not.toBe(b.id)
  })
})

// ── createMockAuction ────────────────────────────────────────────────────────

describe('createMockAuction', () => {
  it('returns an auction with required fields', () => {
    const a = createMockAuction()
    expect(a.id).toBeDefined()
    expect(a.starting_price).toBe(50000)
    expect(a.status).toBe('scheduled')
    expect(a.bid_increment).toBe(500)
    expect(a.buyer_premium_pct).toBe(5)
  })

  it('applies overrides', () => {
    const a = createMockAuction({ status: 'active', current_bid: 55000 })
    expect(a.status).toBe('active')
    expect(a.current_bid).toBe(55000)
  })

  it('ends_at is after starts_at by default', () => {
    const a = createMockAuction()
    expect(new Date(a.ends_at).getTime()).toBeGreaterThan(new Date(a.starts_at).getTime())
  })
})

// ── createMockLead ───────────────────────────────────────────────────────────

describe('createMockLead', () => {
  it('returns a lead with required fields', () => {
    const l = createMockLead()
    expect(l.id).toBeDefined()
    expect(l.buyer_name).toBe('Juan García')
    expect(l.status).toBe('new')
    expect(l.source).toBe('web')
  })

  it('applies overrides', () => {
    const l = createMockLead({ status: 'contacted', buyer_email: 'other@test.com' })
    expect(l.status).toBe('contacted')
    expect(l.buyer_email).toBe('other@test.com')
  })
})

// ── createMockSubscription ───────────────────────────────────────────────────

describe('createMockSubscription', () => {
  it('returns a subscription with required fields', () => {
    const s = createMockSubscription()
    expect(s.id).toBeDefined()
    expect(s.plan).toBe('premium')
    expect(s.status).toBe('active')
    expect(s.stripe_subscription_id).toMatch(/^sub_/)
  })

  it('applies overrides', () => {
    const s = createMockSubscription({ plan: 'basic', status: 'canceled' })
    expect(s.plan).toBe('basic')
    expect(s.status).toBe('canceled')
  })
})

// ── resetFactoryCounter ──────────────────────────────────────────────────────

describe('resetFactoryCounter', () => {
  it('resets IDs to mock-id-1 after reset', () => {
    createMockVehicle()
    createMockVehicle()
    resetFactoryCounter()
    const v = createMockVehicle()
    expect(v.id).toBe('mock-id-1')
  })
})
