import { defineEventHandler, getHeaders } from 'h3'
import { z } from 'zod'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { safeError } from '../../utils/safeError'
import { validateBody } from '../../utils/validateBody'
import { getIdempotencyKey, checkIdempotency, storeIdempotencyResponse } from '../../utils/idempotency'
import { getVatRate } from '../../utils/vatRates'

const invoiceRequestSchema = z.object({
  dealerId: z.string().uuid(),
  userId: z.string().uuid(),
  serviceType: z.enum(['subscription', 'auction_premium', 'transport', 'verification', 'ad']),
  amountCents: z.number().int().positive().max(10_000_000),
  taxCents: z.number().int().nonnegative().optional(),
  currency: z.string().length(3).optional().default('EUR'),
  stripeInvoiceId: z.string().max(255).optional(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export default defineEventHandler(async (event) => {
  // Authentication check
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Unauthorized: Authentication required')
  }

  const body = await validateBody(event, invoiceRequestSchema)

  const config = useRuntimeConfig()
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !supabaseKey) {
    throw safeError(500, 'Service not configured')
  }

  // Idempotency check — prevent duplicate invoice creation
  const supabase = serverSupabaseServiceRole(event)
  const idempotencyKey = getIdempotencyKey(getHeaders(event))
  if (idempotencyKey) {
    const cached = await checkIdempotency(supabase, idempotencyKey)
    if (cached) return cached
  }

  // Ownership validation: Verify dealerId belongs to authenticated user
  const { data: dealer, error: dealerError } = await supabase
    .from('dealers')
    .select('id')
    .eq('user_id', user.id)
    .eq('id', body.dealerId)
    .single()

  if (dealerError || !dealer) {
    throw safeError(403, 'Forbidden: You do not have access to this dealer')
  }

  // Fetch dealer fiscal data for VAT calculation
  const fiscalRes = await fetch(
    `${supabaseUrl}/rest/v1/dealer_fiscal_data?dealer_id=eq.${body.dealerId}&select=tax_country`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    },
  )
  const fiscalData = await fiscalRes.json()
  const taxCountry = fiscalData?.[0]?.tax_country || 'ES'
  const vatRate = getVatRate(taxCountry)
  const taxCents = body.taxCents ?? Math.round((body.amountCents * vatRate) / 100)

  // Try Quaderno API if configured
  const quadernoApiKey = config.quadernoApiKey || process.env.QUADERNO_API_KEY
  const quadernoApiUrl =
    config.quadernoApiUrl || process.env.QUADERNO_API_URL || 'https://quadernoapp.com/api'
  let pdfUrl: string | null = null

  if (quadernoApiKey) {
    try {
      const quadernoRes = await fetch(`${quadernoApiUrl}/invoices`, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${quadernoApiKey}:`).toString('base64'),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency: body.currency || 'EUR',
          items: [
            {
              description: body.description || `Tracciona ${body.serviceType}`,
              quantity: 1,
              unit_price: (body.amountCents / 100).toFixed(2),
            },
          ],
          payment_method: 'credit_card',
          tag_list: [body.serviceType, 'tracciona'],
        }),
      })

      if (quadernoRes.ok) {
        const quadernoInvoice = await quadernoRes.json()
        pdfUrl = quadernoInvoice?.permalink || null
      }
    } catch {
      // Quaderno integration is optional — don't block invoice creation
    }
  }

  // Insert into local invoices table
  const invoiceData = {
    dealer_id: body.dealerId,
    user_id: user.id,
    stripe_invoice_id: body.stripeInvoiceId || null,
    service_type: body.serviceType,
    amount_cents: body.amountCents,
    tax_cents: taxCents,
    currency: body.currency || 'EUR',
    pdf_url: pdfUrl,
    status: 'paid',
  }

  const insertRes = await fetch(`${supabaseUrl}/rest/v1/invoices`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(invoiceData),
  })

  const inserted = await insertRes.json()

  const response = {
    success: true,
    invoice: inserted?.[0] || invoiceData,
    quadernoConfigured: !!quadernoApiKey,
    vatRate,
    taxCountry,
  }

  if (idempotencyKey) {
    await storeIdempotencyResponse(supabase, idempotencyKey, 'POST /api/invoicing/create-invoice', response)
  }

  return response
})
