/**
 * Admin Brokerage Composable
 * CRUD operations for brokerage deals in admin panel.
 * Phase 1 = manual deal management (no AI agents).
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type DealStatus =
  | 'qualifying_buyer'
  | 'manual_review'
  | 'buyer_qualified'
  | 'contacting_seller_broker'
  | 'broker_negotiating'
  | 'broker_failed'
  | 'contacting_seller_tank'
  | 'negotiating_seller'
  | 'seller_declined'
  | 'no_margin'
  | 'pending_buyer_confirm'
  | 'escalated_to_humans'
  | 'human_takeover'
  | 'deal_closed'
  | 'deal_cancelled'
  | 'expired'

export type DealMode = 'broker' | 'tank'

export interface BrokerageDeal {
  id: string
  buyer_id: string | null
  buyer_phone: string | null
  buyer_budget_min: number | null
  buyer_budget_max: number | null
  buyer_score: number | null
  buyer_needs: Record<string, unknown>
  buyer_financing: boolean
  vehicle_id: string | null
  seller_id: string | null
  seller_dealer_id: string | null
  seller_phone: string | null
  deal_mode: DealMode
  asking_price: number | null
  offer_price: number | null
  agreed_buy_price: number | null
  agreed_deal_price: number | null
  target_sell_price: number | null
  margin_amount: number | null
  margin_pct: number | null
  broker_commission: number | null
  broker_commission_pct: number | null
  status: DealStatus
  broker_lock_until: string | null
  escalation_reason: string | null
  human_assignee: string | null
  created_at: string
  updated_at: string
  qualified_at: string | null
  broker_contacted_at: string | null
  tank_contacted_at: string | null
  closed_at: string | null
  expires_at: string | null
  // Joined data (from select)
  vehicle?: { brand: string; model: string; year: number | null; slug: string } | null
  buyer?: { email: string } | null
  seller_dealer?: { company_name: string } | null
}

export interface DealFilters {
  statusGroup?: 'all' | 'qualifying' | 'active' | 'closed'
  search?: string
}

export interface CreateDealPayload {
  vehicle_id?: string
  buyer_phone?: string
  buyer_budget_min?: number
  buyer_budget_max?: number
  buyer_financing?: boolean
  buyer_needs?: Record<string, unknown>
  deal_mode?: DealMode
}

// ── Status definitions ────────────────────────────────────────────────────────

export interface DealStatusDef {
  value: DealStatus
  label: string
  color: string
  group: 'qualifying' | 'active' | 'closed'
}

export const DEAL_STATUSES: DealStatusDef[] = [
  {
    value: 'qualifying_buyer',
    label: 'Calificando comprador',
    color: '#8b5cf6',
    group: 'qualifying',
  },
  { value: 'manual_review', label: 'Revision manual', color: '#f59e0b', group: 'qualifying' },
  { value: 'buyer_qualified', label: 'Comprador calificado', color: '#06b6d4', group: 'active' },
  {
    value: 'contacting_seller_broker',
    label: 'Contactando vendedor (broker)',
    color: '#3b82f6',
    group: 'active',
  },
  { value: 'broker_negotiating', label: 'Negociando (broker)', color: '#3b82f6', group: 'active' },
  { value: 'broker_failed', label: 'Broker fallido', color: '#ef4444', group: 'closed' },
  {
    value: 'contacting_seller_tank',
    label: 'Contactando vendedor (Tank)',
    color: '#f97316',
    group: 'active',
  },
  {
    value: 'negotiating_seller',
    label: 'Negociando con vendedor',
    color: '#f97316',
    group: 'active',
  },
  { value: 'seller_declined', label: 'Vendedor rechazo', color: '#ef4444', group: 'closed' },
  { value: 'no_margin', label: 'Sin margen', color: '#ef4444', group: 'closed' },
  {
    value: 'pending_buyer_confirm',
    label: 'Pendiente confirmacion comprador',
    color: '#eab308',
    group: 'active',
  },
  { value: 'escalated_to_humans', label: 'Escalado a humanos', color: '#f59e0b', group: 'active' },
  { value: 'human_takeover', label: 'Gestion humana', color: '#f59e0b', group: 'active' },
  { value: 'deal_closed', label: 'Cerrado', color: '#10b981', group: 'closed' },
  { value: 'deal_cancelled', label: 'Cancelado', color: '#6b7280', group: 'closed' },
  { value: 'expired', label: 'Expirado', color: '#6b7280', group: 'closed' },
]

export const VALID_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  qualifying_buyer: ['manual_review', 'buyer_qualified', 'deal_cancelled'],
  manual_review: ['buyer_qualified', 'deal_cancelled'],
  buyer_qualified: ['contacting_seller_broker', 'deal_cancelled'],
  contacting_seller_broker: ['broker_negotiating', 'broker_failed', 'deal_cancelled'],
  broker_negotiating: ['broker_failed', 'pending_buyer_confirm', 'deal_cancelled'],
  broker_failed: ['contacting_seller_tank', 'deal_cancelled'],
  contacting_seller_tank: ['negotiating_seller', 'deal_cancelled'],
  negotiating_seller: [
    'seller_declined',
    'no_margin',
    'pending_buyer_confirm',
    'deal_cancelled',
    'expired',
  ],
  seller_declined: ['deal_cancelled'],
  no_margin: ['deal_cancelled'],
  pending_buyer_confirm: ['escalated_to_humans', 'deal_cancelled'],
  escalated_to_humans: ['human_takeover', 'deal_cancelled'],
  human_takeover: ['deal_closed', 'deal_cancelled'],
  deal_closed: [],
  deal_cancelled: [],
  expired: [],
}

const STATUS_GROUPS: Record<string, DealStatus[]> = {
  qualifying: ['qualifying_buyer', 'manual_review'],
  active: [
    'buyer_qualified',
    'contacting_seller_broker',
    'broker_negotiating',
    'contacting_seller_tank',
    'negotiating_seller',
    'pending_buyer_confirm',
    'escalated_to_humans',
    'human_takeover',
  ],
  closed: [
    'deal_closed',
    'deal_cancelled',
    'expired',
    'seller_declined',
    'no_margin',
    'broker_failed',
  ],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const statusMap = new Map(DEAL_STATUSES.map((s) => [s.value, s]))

export function getStatusLabel(status: DealStatus): string {
  return statusMap.get(status)?.label ?? status
}

export function getStatusColor(status: DealStatus): string {
  return statusMap.get(status)?.color ?? '#6b7280'
}

export function getValidNextStatuses(current: DealStatus): DealStatus[] {
  return VALID_TRANSITIONS[current] ?? []
}

export function formatDealPrice(amount: number | null): string {
  if (amount == null) return '-'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDealDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function getDealModeLabel(mode: DealMode): string {
  return mode === 'broker' ? 'Broker' : 'Tank'
}

// ── Composable ────────────────────────────────────────────────────────────────

const DEAL_SELECT = `
  *,
  vehicle:vehicle_id(brand, model, year, slug),
  buyer:buyer_id(email),
  seller_dealer:seller_dealer_id(company_name)
`

const PAGE_SIZE = 50

/** Composable for admin brokerage. */
export function useAdminBrokerage() {
  const supabase = useSupabaseClient()

  const deals = ref<BrokerageDeal[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

  // buyer:buyer_id references auth.users — not in public schema types
  const sb = supabase as any // eslint-disable-line @typescript-eslint/no-explicit-any

  async function fetchDeals(filters: DealFilters = {}) {
    loading.value = true
    error.value = null

    try {
      let query = sb
        .from('brokerage_deals')
        .select(DEAL_SELECT, { count: 'exact' })
        .order('created_at', { ascending: false })

      if (filters.statusGroup && filters.statusGroup !== 'all') {
        const statuses = STATUS_GROUPS[filters.statusGroup]
        if (statuses?.length) {
          query = query.in('status', statuses)
        }
      }

      if (filters.search) {
        query = query.or(
          `buyer_phone.ilike.%${filters.search}%,seller_phone.ilike.%${filters.search}%,human_assignee.ilike.%${filters.search}%`,
        )
      }

      const { data, error: err, count } = await query.range(0, PAGE_SIZE - 1)

      if (err) throw err

      deals.value = (data as BrokerageDeal[]) || []
      total.value = count || 0
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching deals'
      deals.value = []
    } finally {
      loading.value = false
    }
  }

  async function createDeal(payload: CreateDealPayload): Promise<string | null> {
    saving.value = true
    error.value = null

    try {
      const { data, error: err } = await sb
        .from('brokerage_deals')
        .insert({
          vehicle_id: payload.vehicle_id || null,
          buyer_phone: payload.buyer_phone || null,
          buyer_budget_min: payload.buyer_budget_min ?? null,
          buyer_budget_max: payload.buyer_budget_max ?? null,
          buyer_financing: payload.buyer_financing ?? false,
          buyer_needs: payload.buyer_needs ?? {},
          deal_mode: payload.deal_mode ?? 'broker',
          status: 'qualifying_buyer',
        })
        .select('id')
        .single()

      if (err) throw err

      const dealId = (data as { id: string }).id

      // Audit log entry for creation
      await sb.from('brokerage_audit_log').insert({
        deal_id: dealId,
        actor: 'system',
        action: 'deal_created',
        details: { payload, source: 'admin_dashboard' },
      })

      return dealId
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error creating deal'
      return null
    } finally {
      saving.value = false
    }
  }

  async function getPendingCount(): Promise<number> {
    try {
      const { count, error: err } = await sb
        .from('brokerage_deals')
        .select('id', { count: 'exact', head: true })
        .in('status', ['qualifying_buyer', 'manual_review', 'escalated_to_humans'])

      if (err) throw err
      return count || 0
    } catch {
      return 0
    }
  }

  return {
    deals: readonly(deals),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    total: readonly(total),
    fetchDeals,
    createDeal,
    getPendingCount,
  }
}
