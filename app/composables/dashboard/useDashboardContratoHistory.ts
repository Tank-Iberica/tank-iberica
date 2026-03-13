/**
 * useDashboardContratoHistory
 * Manages contract history loading and status updates for the dealer contract tool.
 * Extracted from useDashboardContrato for size reduction (#121).
 */

export type ContractStatus = 'draft' | 'signed' | 'active' | 'expired' | 'cancelled'

export interface ContractRow {
  id: string
  dealer_id: string
  contract_type: string
  contract_date: string
  vehicle_id: string | null
  vehicle_plate: string | null
  vehicle_type: string | null
  client_name: string
  client_doc_number: string | null
  client_address: string | null
  terms: Record<string, unknown>
  pdf_url: string | null
  status: string
  created_at: string | null
  updated_at: string | null
}

export function useDashboardContratoHistory(dealerProfile: Ref<{ id: string } | null>) {
  const { t } = useI18n()
  const supabase = useSupabaseClient()

  const contracts = ref<ContractRow[]>([])
  const loadingHistory = ref(false)
  const historyError = ref<string | null>(null)

  async function loadContractHistory(): Promise<void> {
    const dealer = dealerProfile.value
    if (!dealer) return

    loadingHistory.value = true
    historyError.value = null

    try {
      const { data, error: err } = (await supabase
        .from('dealer_contracts')
        .select(
          'id, dealer_id, contract_type, contract_date, vehicle_id, vehicle_plate, vehicle_type, client_name, client_doc_number, client_address, terms, pdf_url, status, created_at, updated_at',
        )
        .eq('dealer_id', dealer.id)
        .order('created_at', { ascending: false })) as never as {
        data: ContractRow[] | null
        error: { message: string } | null
      }

      if (err) throw new Error(err.message)
      contracts.value = data ?? []
    } catch (err: unknown) {
      historyError.value =
        err instanceof Error ? err.message : t('dashboard.tools.contract.historyError')
    } finally {
      loadingHistory.value = false
    }
  }

  async function updateContractStatus(
    contractId: string,
    newStatus: ContractStatus,
  ): Promise<void> {
    try {
      const { error: err } = (await supabase
        .from('dealer_contracts')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', contractId)) as never as { error: { message: string } | null }

      if (err) throw new Error(err.message)
      await loadContractHistory()
    } catch (err: unknown) {
      historyError.value = err instanceof Error ? err.message : 'Error updating status'
    }
  }

  return {
    contracts,
    loadingHistory,
    historyError,
    loadContractHistory,
    updateContractStatus,
  }
}
