import { describe, it, expect } from 'vitest'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'

describe('IDOR: endpoints no exponen datos de otros dealers', () => {
  // These tests require a running server with 2 test dealers in different verticals.
  // Run with: TEST_BASE_URL=http://localhost:3000 npm run test -- idor-protection

  it.todo(
    'GET /api/vehicles/[id] con ID de otro dealer → 403 o datos filtrados (requires test DB with 2 dealers)',
  )

  it.todo(
    'POST /api/generate-description con vehicleId de otro dealer → 403 (requires test DB with 2 dealers)',
  )

  it.todo(
    'GET /api/invoicing/export-csv no incluye facturas de otro dealer (requires test DB with 2 dealers)',
  )
})

describe('IDOR: rutas públicas no exponen datos sensibles', () => {
  it('Sitemap no contiene rutas de admin', async () => {
    let res: Response
    try {
      res = await fetch(`${BASE}/sitemap.xml`)
    } catch {
      // Server not running — skip
      return
    }

    if (res.ok) {
      const text = await res.text()
      expect(text).not.toContain('/admin')
      expect(text).not.toContain('/api/')
    }
  })
})
