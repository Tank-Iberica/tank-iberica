/**
 * POST /api/credits/listing-certificate
 *
 * Generates a publication certificate for a vehicle listing.
 * Costs 1 credit. Returns certificate data for client-side PDF rendering + QR.
 *
 * Body: { vehicleId: string }
 * Returns: { certificateCode, vehicleTitle, slug, dealerName, issuedAt, creditsRemaining }
 *
 * Requires: auth, CSRF, vehicle ownership, ≥1 credit.
 */
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { serverSupabaseUser } from '#supabase/server'
import { verifyCsrf } from '../../utils/verifyCsrf'
import { safeError } from '../../utils/safeError'
import { validateBody } from '../../utils/validateBody'
import { deductUserCredits } from '../../utils/creditService'
import { CREDIT_COSTS } from '../../utils/creditsConfig'

const CERTIFICATE_CREDIT_COST = CREDIT_COSTS.LISTING_CERTIFICATE

const schema = z.object({
  vehicleId: z.string().uuid(),
})

interface VehicleRecord {
  id: string
  brand: string
  model: string
  year: number | null
  slug: string
  dealer_id: string
  status: string
}

interface DealerRecord {
  id: string
  name: string
}

interface CertificateRecord {
  id: string
  certificate_code: string
}

export default defineEventHandler(async (event) => {
  verifyCsrf(event)
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Authentication required')

  const { vehicleId } = await validateBody(event, schema)

  const config = useRuntimeConfig()
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !supabaseKey) throw safeError(500, 'Service not configured')

  const headers: Record<string, string> = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  }

  // 1. Verify vehicle exists and is published
  const vehicleRes = await fetch(
    `${supabaseUrl}/rest/v1/vehicles?id=eq.${vehicleId}&select=id,brand,model,year,slug,dealer_id,status`,
    { headers },
  )
  const vehicles = (await vehicleRes.json()) as VehicleRecord[]
  const vehicle = vehicles[0]
  if (!vehicle) throw safeError(404, 'Vehicle not found')
  if (vehicle.status !== 'published') throw safeError(400, 'Vehicle must be published')

  // 2. Verify the user owns this dealer
  const dealerRes = await fetch(
    `${supabaseUrl}/rest/v1/dealers?id=eq.${vehicle.dealer_id}&user_id=eq.${user.id}&select=id,name`,
    { headers },
  )
  const dealers = (await dealerRes.json()) as DealerRecord[]
  if (dealers.length === 0) throw safeError(403, 'Not authorized')
  const dealerName = dealers[0]?.name ?? ''

  // 3. Deduct 1 credit
  const creditResult = await deductUserCredits(
    user.id,
    CERTIFICATE_CREDIT_COST,
    'Certificado publicación vehículo',
    vehicleId,
  )
  if (!creditResult.success) {
    if (creditResult.reason === 'insufficient') throw safeError(402, 'Insufficient credits')
    throw safeError(500, 'Credit service unavailable')
  }

  // 4. Store certificate record
  const issuedAt = new Date().toISOString()
  const certRes = await fetch(`${supabaseUrl}/rest/v1/listing_certificates`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify({
      vehicle_id: vehicleId,
      user_id: user.id,
      credits_spent: CERTIFICATE_CREDIT_COST,
      issued_at: issuedAt,
    }),
  })
  const certData = (await certRes.json()) as CertificateRecord[]
  const certificateCode = certData[0]?.certificate_code ?? ''

  const vehicleTitle = `${vehicle.brand} ${vehicle.model}${vehicle.year ? ' (' + vehicle.year + ')' : ''}`

  return {
    certificateCode,
    vehicleId,
    vehicleTitle,
    slug: vehicle.slug,
    dealerName,
    issuedAt,
    creditsRemaining: creditResult.newBalance,
  }
})
