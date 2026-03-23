/**
 * useTransactionHistory — buyer transaction history
 *
 * Fetches vehicles the current user has purchased (sold to them)
 * or reserved, grouped by status for the buyer dashboard.
 */

export interface TransactionRecord {
  id: string
  title: string
  price: number | null
  currency: string | null
  status: 'sold' | 'reserved'
  image: string | null
  slug: string
  dealer_name: string | null
  sold_at: string | null
  reserved_at: string | null
  created_at: string
}

export interface UseTransactionHistory {
  transactions: Ref<TransactionRecord[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  fetch: () => Promise<void>
}

/** Composable for transaction history. */
export function useTransactionHistory(): UseTransactionHistory {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const transactions = ref<TransactionRecord[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetch = async (): Promise<void> => {
    if (!user.value) {
      error.value = 'auth_required'
      return
    }

    loading.value = true
    error.value = null

    try {
      // Vehicles where the buyer_id matches the current user
      // OR vehicles the user reserved
      const { data, error: fetchErr } = await supabase
        .from('vehicles')
        .select(
          `id, title_es, title_en, price, currency, status, images, slug,
           sold_at, reserved_at, created_at,
           dealers!vehicles_dealer_id_fkey (name)`,
        )
        .or(`buyer_id.eq.${user.value.id},reserved_by.eq.${user.value.id}`)
        .in('status', ['sold', 'reserved'] as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .order('sold_at', { ascending: false, nullsFirst: false })
        .order('reserved_at', { ascending: false, nullsFirst: false })
        .limit(50)

      if (fetchErr) {
        error.value = fetchErr.message
        return
      }

      transactions.value = (data ?? []).map((v) => {
        const raw = v as unknown as Record<string, unknown>
        const dealer = raw.dealers as { name: string } | null
        const images = (raw.images as string[] | null) ?? []
        const locale = useI18n().locale.value

        return {
          id: String(raw.id),
          title: String(locale === 'en' ? (raw.title_en ?? raw.title_es) : raw.title_es),
          price: raw.price as number | null,
          currency: raw.currency as string | null,
          status: raw.status as 'sold' | 'reserved',
          image: images[0] ?? null,
          slug: String(raw.slug),
          dealer_name: dealer?.name ?? null,
          sold_at: raw.sold_at as string | null,
          reserved_at: raw.reserved_at as string | null,
          created_at: String(raw.created_at),
        }
      })
    } finally {
      loading.value = false
    }
  }

  return { transactions, loading, error, fetch }
}
