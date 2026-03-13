import { createError, defineEventHandler, getQuery } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

interface InvoiceRow {
  id: string
  dealer_id: string | null
  user_id: string | null
  stripe_invoice_id: string | null
  service_type: string
  amount_cents: number
  tax_cents: number
  currency: string
  pdf_url: string | null
  status: string
  created_at: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !supabaseKey) {
    throw createError({ statusCode: 500, message: 'Service not configured' })
  }

  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized: Authentication required',
    })
  }

  const supabase = serverSupabaseServiceRole(event)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: Unable to verify user permissions',
    })
  }

  let dealerFilter = ''
  if (userData.role !== 'admin') {
    const { data: dealerData, error: dealerError } = await supabase
      .from('dealers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (dealerError || !dealerData) {
      throw createError({
        statusCode: 403,
        message: 'Forbidden: No dealer associated with this user',
      })
    }

    dealerFilter = `&dealer_id=eq.${dealerData.id}`
  }

  const query = getQuery(event)
  const month = query.month as string
  const year = query.year as string
  const format = (query.format as string) || 'csv'

  let dateFilter = ''
  if (month) {
    const startDate = `${month}-01`
    const [y = 0, m = 0] = month.split('-').map(Number)
    const endDate = new Date(y, m, 1).toISOString().split('T')[0]
    dateFilter = `&created_at=gte.${startDate}&created_at=lt.${endDate}`
  } else if (year) {
    dateFilter = `&created_at=gte.${year}-01-01&created_at=lt.${Number(year) + 1}-01-01`
  }

  const res = await fetch(
    `${supabaseUrl}/rest/v1/invoices?select=id,dealer_id,user_id,stripe_invoice_id,service_type,amount_cents,tax_cents,currency,pdf_url,status,created_at&order=created_at.desc${dateFilter}${dealerFilter}`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    },
  )

  const invoices: InvoiceRow[] = await res.json()

  if (!Array.isArray(invoices)) {
    throw createError({ statusCode: 500, message: 'Error fetching invoices' })
  }

  if (format === 'json') {
    const jsonData = invoices.map((inv) => ({
      id: inv.id,
      dealer_id: inv.dealer_id || null,
      user_id: inv.user_id || null,
      stripe_invoice_id: inv.stripe_invoice_id || null,
      service_type: inv.service_type,
      amount: Number(((inv.amount_cents || 0) / 100).toFixed(2)),
      tax: Number(((inv.tax_cents || 0) / 100).toFixed(2)),
      net: Number((((inv.amount_cents || 0) - (inv.tax_cents || 0)) / 100).toFixed(2)),
      currency: inv.currency,
      pdf_url: inv.pdf_url || null,
      status: inv.status,
      date: inv.created_at,
    }))

    event.node.res.setHeader('Content-Type', 'application/json; charset=utf-8')
    event.node.res.setHeader(
      'Content-Disposition',
      `attachment; filename="invoices-${month || year || 'all'}.json"`,
    )
    return jsonData
  }

  const headers = [
    'ID', 'Dealer ID', 'User ID', 'Stripe Invoice', 'Type',
    'Amount (EUR)', 'Tax (EUR)', 'Net (EUR)', 'Currency', 'PDF URL', 'Status', 'Date',
  ]
  const rows = invoices.map((inv) => [
    inv.id, inv.dealer_id || '', inv.user_id || '', inv.stripe_invoice_id || '',
    inv.service_type,
    ((inv.amount_cents || 0) / 100).toFixed(2),
    ((inv.tax_cents || 0) / 100).toFixed(2),
    (((inv.amount_cents || 0) - (inv.tax_cents || 0)) / 100).toFixed(2),
    inv.currency, inv.pdf_url || '', inv.status, inv.created_at,
  ])

  const csv = [
    headers.join(';'),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';'),
    ),
  ].join('\n')

  event.node.res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  event.node.res.setHeader(
    'Content-Disposition',
    `attachment; filename="invoices-${month || year || 'all'}.csv"`,
  )

  return csv
})
