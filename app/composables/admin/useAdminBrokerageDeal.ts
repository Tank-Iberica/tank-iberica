/**
 * Admin Brokerage Deal Detail Composable
 * Manages a single deal: status transitions, messages, audit log.
 */
import type { Ref } from 'vue'
import type { Database } from '~~/types/supabase'
import {
  type BrokerageDeal,
  type DealStatus,
  VALID_TRANSITIONS,
  DEAL_STATUSES,
} from '~/composables/admin/useAdminBrokerage'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BrokerageMessage {
  id: string
  deal_id: string
  direction: 'inbound' | 'outbound'
  channel: 'whatsapp' | 'email' | 'platform' | 'phone'
  sender_entity: string
  recipient_entity: string
  content: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface BrokerageAuditEntry {
  id: string
  deal_id: string | null
  actor: string
  action: string
  legal_basis: string | null
  model_version: string | null
  human_override: boolean
  override_reason: string | null
  details: Record<string, unknown>
  created_at: string
}

export type SenderEntity =
  | 'tracciona_ai'
  | 'tracciona_ai_broker'
  | 'tank_ai'
  | 'tank_human'
  | 'buyer'
  | 'seller'
  | 'system'

export type RecipientEntity = 'buyer' | 'seller' | 'tank_human' | 'system'

export interface AddMessagePayload {
  content: string
  direction: 'inbound' | 'outbound'
  channel: 'whatsapp' | 'email' | 'platform' | 'phone'
  sender_entity: SenderEntity
  recipient_entity: RecipientEntity
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const statusMap = new Map(DEAL_STATUSES.map((s) => [s.value, s]))

export function getDealPhase(status: DealStatus): string {
  const def = statusMap.get(status)
  if (!def) return 'unknown'
  return def.group
}

export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    deal_created: 'Deal creado',
    status_changed: 'Estado cambiado',
    message_added: 'Mensaje anadido',
    field_updated: 'Campo actualizado',
    human_assigned: 'Humano asignado',
  }
  return labels[action] ?? action
}

export function getActorLabel(actor: string): string {
  if (actor === 'system') return 'Sistema'
  if (actor.startsWith('tank_human:')) return actor.replace('tank_human:', 'Tank: ')
  const labels: Record<string, string> = {
    tracciona_ai: 'Tracciona IA',
    tracciona_ai_broker: 'Tracciona Broker IA',
    tank_ai: 'Tank IA',
    tank_human: 'Tank Humano',
    buyer: 'Comprador',
    seller: 'Vendedor',
  }
  return labels[actor] ?? actor
}

// ── Composable ────────────────────────────────────────────────────────────────

const DEAL_SELECT = `
  *,
  vehicle:vehicle_id(brand, model, year, slug),
  buyer:buyer_id(email),
  seller_dealer:seller_dealer_id(company_name)
`

/**
 * Composable for admin brokerage deal.
 *
 * @param dealId
 */
export function useAdminBrokerageDeal(dealId: Ref<string | null>) {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const deal = ref<BrokerageDeal | null>(null)
  const messages = ref<BrokerageMessage[]>([])
  const auditLog = ref<BrokerageAuditEntry[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  const validNextStatuses = computed<DealStatus[]>(() => {
    if (!deal.value) return []
    return VALID_TRANSITIONS[deal.value.status] ?? []
  })

  const dealPhase = computed(() => {
    if (!deal.value) return 'unknown'
    return getDealPhase(deal.value.status)
  })

  async function fetchDealDetail() {
    if (!dealId.value) return
    loading.value = true
    error.value = null

    try {
      const [dealResult, messagesResult, auditResult] = await Promise.all([
        supabase.from('brokerage_deals').select(DEAL_SELECT).eq('id', dealId.value).single(),
        supabase
          .from('brokerage_messages')
          .select(
            'id, deal_id, direction, channel, sender_entity, recipient_entity, content, metadata, created_at',
          )
          .eq('deal_id', dealId.value)
          .order('created_at', { ascending: true }),
        supabase
          .from('brokerage_audit_log')
          .select(
            'id, deal_id, actor, action, legal_basis, model_version, human_override, override_reason, details, created_at',
          )
          .eq('deal_id', dealId.value)
          .order('created_at', { ascending: false }),
      ])

      if (dealResult.error) throw dealResult.error

      deal.value = dealResult.data as BrokerageDeal
      messages.value = (messagesResult.data as BrokerageMessage[]) || []
      auditLog.value = (auditResult.data as BrokerageAuditEntry[]) || []
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching deal'
    } finally {
      loading.value = false
    }
  }

  async function transitionStatus(newStatus: DealStatus, reason?: string): Promise<boolean> {
    if (!deal.value) return false

    const valid = VALID_TRANSITIONS[deal.value.status] ?? []
    if (!valid.includes(newStatus)) {
      error.value = `Transicion invalida: ${deal.value.status} → ${newStatus}`
      return false
    }

    saving.value = true
    error.value = null

    try {
      const now = new Date().toISOString()
      const updatePayload: Record<string, unknown> = {
        status: newStatus,
        updated_at: now,
      }

      // Set relevant timestamps based on new status
      if (newStatus === 'buyer_qualified') updatePayload.qualified_at = now
      if (newStatus === 'contacting_seller_broker') {
        updatePayload.broker_contacted_at = now
        updatePayload.broker_lock_until = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
      }
      if (newStatus === 'broker_failed') updatePayload.broker_failed_at = now
      if (newStatus === 'contacting_seller_tank') updatePayload.tank_contacted_at = now
      if (newStatus === 'escalated_to_humans') updatePayload.escalated_at = now
      if (newStatus === 'deal_closed') updatePayload.closed_at = now
      if (reason) updatePayload.escalation_reason = reason

      const { error: updateErr } = await supabase
        .from('brokerage_deals')
        .update(updatePayload)
        .eq('id', deal.value.id)

      if (updateErr) throw updateErr

      // Audit log
      await supabase.from('brokerage_audit_log').insert({
        deal_id: deal.value.id,
        actor: `tank_human:${user.value?.email ?? 'admin'}`,
        action: 'status_changed',
        details: {
          from: deal.value.status,
          to: newStatus,
          reason: reason || null,
        },
      })

      // Update local state
      deal.value = { ...deal.value, status: newStatus, ...updatePayload } as BrokerageDeal
      await fetchDealDetail() // Refresh to get updated audit log

      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error updating status'
      return false
    } finally {
      saving.value = false
    }
  }

  async function addMessage(payload: AddMessagePayload): Promise<boolean> {
    if (!deal.value) return false
    saving.value = true
    error.value = null

    try {
      const { error: insertErr } = await supabase.from('brokerage_messages').insert({
        deal_id: deal.value.id,
        direction: payload.direction,
        channel: payload.channel,
        sender_entity: payload.sender_entity,
        recipient_entity: payload.recipient_entity,
        content: payload.content,
      })

      if (insertErr) throw insertErr

      // Audit log
      await supabase.from('brokerage_audit_log').insert({
        deal_id: deal.value.id,
        actor: `tank_human:${user.value?.email ?? 'admin'}`,
        action: 'message_added',
        details: {
          channel: payload.channel,
          direction: payload.direction,
          sender: payload.sender_entity,
        },
      })

      // Refresh messages
      const { data } = await supabase
        .from('brokerage_messages')
        .select(
          'id, deal_id, direction, channel, sender_entity, recipient_entity, content, metadata, created_at',
        )
        .eq('deal_id', deal.value.id)
        .order('created_at', { ascending: true })

      messages.value = (data as BrokerageMessage[]) || []

      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error adding message'
      return false
    } finally {
      saving.value = false
    }
  }

  async function updateDealFields(fields: Record<string, unknown>): Promise<boolean> {
    if (!deal.value) return false
    saving.value = true
    error.value = null

    try {
      const { error: updateErr } = await supabase
        .from('brokerage_deals')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', deal.value.id)

      if (updateErr) throw updateErr

      // Audit log
      await supabase.from('brokerage_audit_log').insert({
        deal_id: deal.value.id,
        actor: `tank_human:${user.value?.email ?? 'admin'}`,
        action: 'field_updated',
        details: { fields_updated: Object.keys(fields) },
      })

      // Refresh
      await fetchDealDetail()
      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error updating deal'
      return false
    } finally {
      saving.value = false
    }
  }

  async function assignHuman(name: string): Promise<boolean> {
    return updateDealFields({ human_assignee: name })
  }

  // Watch dealId to auto-fetch
  watch(dealId, (id) => {
    if (id) fetchDealDetail()
    else {
      deal.value = null
      messages.value = []
      auditLog.value = []
    }
  })

  return {
    deal: readonly(deal),
    messages: readonly(messages),
    auditLog: readonly(auditLog),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    validNextStatuses,
    dealPhase,
    fetchDealDetail,
    transitionStatus,
    addMessage,
    updateDealFields,
    assignHuman,
  }
}
