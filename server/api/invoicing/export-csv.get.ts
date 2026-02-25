import { createError, defineEventHandler, getQuery } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabaseUrl = config.public?.supabaseUrl || process.env.SUPABASE_URL
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw createError({ statusCode: 500, message: 'Supabase not configured' })
  }

  // Authentication check
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized: Authentication required',
    })
  }

  // Authorization check: Get user role and dealer_id if applicable
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
    // Non-admin users can only export their own dealer's invoices
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
  const month = query.month as string // format: YYYY-MM
  const year = query.year as string // format: YYYY

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
    `${supabaseUrl}/rest/v1/invoices?select=id,dealer_id,user_id,stripe_invoice_id,service_type,amount_cents,tax_cents,currency,status,created_at&order=created_at.desc${dateFilter}${dealerFilter}`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    },
  )

  const invoices = await res.json()

  if (!Array.isArray(invoices)) {
    throw createError({ statusCode: 500, message: 'Error fetching invoices' })
  }

  // Build CSV
  const headers = [
    'ID',
    'Dealer ID',
    'User ID',
    'Stripe Invoice',
    'Type',
    'Amount (EUR)',
    'Tax (EUR)',
    'Currency',
    'Status',
    'Date',
  ]
  const rows = invoices.map((inv: Record<string, unknown>) => [
    inv.id,
    inv.dealer_id || '',
    inv.user_id || '',
    inv.stripe_invoice_id || '',
    inv.service_type,
    ((inv.amount_cents as number) / 100).toFixed(2),
    (((inv.tax_cents as number) || 0) / 100).toFixed(2),
    inv.currency,
    inv.status,
    inv.created_at,
  ])

  const csv = [
    headers.join(';'),
    ...rows.map((row: unknown[]) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'),
    ),
  ].join('\n')

  event.node.res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  event.node.res.setHeader(
    'Content-Disposition',
    `attachment; filename="invoices-${month || year || 'all'}.csv"`,
  )

  return csv
})
