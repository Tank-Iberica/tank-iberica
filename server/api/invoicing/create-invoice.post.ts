import { createError, defineEventHandler, readBody } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

interface InvoiceRequest {
  dealerId: string
  userId: string
  serviceType: 'subscription' | 'auction_premium' | 'transport' | 'verification' | 'ad'
  amountCents: number
  taxCents?: number
  currency?: string
  stripeInvoiceId?: string
  description?: string
  metadata?: Record<string, unknown>
}

/** VAT rates by EU country (standard rates) */
const EU_VAT_RATES: Record<string, number> = {
  ES: 21,
  PT: 23,
  FR: 20,
  DE: 19,
  IT: 22,
  NL: 21,
  BE: 21,
  AT: 20,
  IE: 23,
  PL: 23,
  SE: 25,
  DK: 25,
  FI: 24,
  CZ: 21,
  RO: 19,
  HU: 27,
  BG: 20,
  HR: 25,
  SK: 20,
  SI: 22,
  LT: 21,
  LV: 21,
  EE: 22,
  CY: 19,
  MT: 18,
  LU: 17,
  GR: 24,
  GB: 20,
}

export default defineEventHandler(async (event) => {
  const body = await readBody<InvoiceRequest>(event)

  // Authentication check
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized: Authentication required',
    })
  }

  if (!body.dealerId || !body.serviceType || !body.amountCents) {
    throw createError({ statusCode: 400, message: 'Missing required fields' })
  }

  const config = useRuntimeConfig()
  const supabaseUrl = config.public?.supabaseUrl || process.env.SUPABASE_URL
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw createError({ statusCode: 500, message: 'Supabase not configured' })
  }

  // Ownership validation: Verify dealerId belongs to authenticated user
  const supabase = serverSupabaseServiceRole(event)
  const { data: dealer, error: dealerError } = await supabase
    .from('dealers')
    .select('id')
    .eq('user_id', user.id)
    .eq('id', body.dealerId)
    .single()

  if (dealerError || !dealer) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: You do not have access to this dealer',
    })
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
  const vatRate = EU_VAT_RATES[taxCountry] || 21
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
          Authorization: `Basic ${Buffer.from(`${quadernoApiKey}:`).toString('base64')}`,
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

  return {
    success: true,
    invoice: inserted?.[0] || invoiceData,
    quadernoConfigured: !!quadernoApiKey,
    vatRate,
    taxCountry,
  }
})
