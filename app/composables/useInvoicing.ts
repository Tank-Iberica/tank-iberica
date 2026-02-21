/**
 * useInvoicing — Invoice management composable for dealers
 */
export function useInvoicing() {
  const supabase = useSupabaseClient()

  const invoices = ref<
    Array<{
      id: string
      service_type: string
      amount_cents: number
      tax_cents: number
      currency: string
      pdf_url: string | null
      status: string
      created_at: string
      stripe_invoice_id: string | null
    }>
  >([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadInvoices(dealerId: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('invoices')
        .select(
          'id, service_type, amount_cents, tax_cents, currency, pdf_url, status, created_at, stripe_invoice_id',
        )
        .eq('dealer_id', dealerId)
        .order('created_at', { ascending: false })

      if (err) throw err
      invoices.value = (data || []) as typeof invoices.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading invoices'
    } finally {
      loading.value = false
    }
  }

  function formatAmount(cents: number, currency = 'EUR'): string {
    if (!cents) return '-'
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(cents / 100)
  }

  const totalAmount = computed(() =>
    invoices.value.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.amount_cents, 0),
  )

  const totalTax = computed(() =>
    invoices.value
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + (i.tax_cents || 0), 0),
  )

  return {
    invoices: readonly(invoices),
    loading: readonly(loading),
    error: readonly(error),
    loadInvoices,
    formatAmount,
    totalAmount,
    totalTax,
  }
}
