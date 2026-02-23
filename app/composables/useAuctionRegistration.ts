import { ref, computed } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'

export type IdType = 'dni' | 'nie' | 'cif' | 'passport'
export type DepositStatus = 'pending' | 'held' | 'captured' | 'released' | 'forfeited'
export type RegistrationStatus = 'pending' | 'approved' | 'rejected'

export interface AuctionRegistration {
  id: string
  auction_id: string
  user_id: string
  deposit_paid: boolean
  registered_at: string
  id_type: IdType | null
  id_number: string | null
  id_document_url: string | null
  company_name: string | null
  transport_license_url: string | null
  additional_docs: Record<string, unknown>
  stripe_payment_intent_id: string | null
  deposit_cents: number
  deposit_status: DepositStatus
  status: RegistrationStatus
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
}

export interface RegistrationFormData {
  id_type: IdType
  id_number: string
  id_document_url: string | null
  company_name: string | null
  transport_license_url: string | null
}

export function useAuctionRegistration(auctionId: string) {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const registration = ref<AuctionRegistration | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isRegistered = computed(() => registration.value !== null)
  const isApproved = computed(() => registration.value?.status === 'approved')
  const canBid = computed(
    () =>
      registration.value?.status === 'approved' && registration.value?.deposit_status === 'held',
  )

  // Fetch current user's registration for this auction
  async function fetchRegistration() {
    if (!user.value) return
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('auction_registrations')
        .select('*')
        .eq('auction_id', auctionId)
        .eq('user_id', user.value.id)
        .maybeSingle()

      if (err) throw err
      registration.value = data as unknown as AuctionRegistration | null
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error'
    } finally {
      loading.value = false
    }
  }

  // Submit registration (without deposit yet)
  async function submitRegistration(form: RegistrationFormData): Promise<boolean> {
    if (!user.value) {
      error.value = 'Debes iniciar sesión'
      return false
    }
    loading.value = true
    error.value = null
    try {
      const { error: err } = await supabase.from('auction_registrations').insert({
        auction_id: auctionId,
        user_id: user.value.id,
        id_type: form.id_type,
        id_number: form.id_number,
        id_document_url: form.id_document_url,
        company_name: form.company_name,
        transport_license_url: form.transport_license_url,
        deposit_paid: false,
        status: 'pending',
        deposit_status: 'pending',
        deposit_cents: 0,
      })

      if (err) throw err
      await fetchRegistration()
      return true
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error en el registro'
      return false
    } finally {
      loading.value = false
    }
  }

  // Initiate deposit via server route (Stripe PaymentIntent manual capture)
  async function initiateDeposit(): Promise<string | null> {
    if (!registration.value) {
      error.value = 'Debes registrarte primero'
      return null
    }
    loading.value = true
    error.value = null
    try {
      const response = await $fetch('/api/auction-deposit', {
        method: 'POST',
        body: {
          auctionId,
          registrationId: registration.value.id,
        },
      })

      return (response as { clientSecret: string }).clientSecret
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error al crear el depósito'
      return null
    } finally {
      loading.value = false
    }
  }

  // Admin: approve registration
  async function approveRegistration(regId: string): Promise<boolean> {
    error.value = null
    try {
      const { error: err } = await supabase
        .from('auction_registrations')
        .update({
          status: 'approved',
          approved_by: user.value?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', regId)

      if (err) throw err
      return true
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error'
      return false
    }
  }

  // Admin: reject registration
  async function rejectRegistration(regId: string, reason: string): Promise<boolean> {
    error.value = null
    try {
      const { error: err } = await supabase
        .from('auction_registrations')
        .update({
          status: 'rejected',
          rejection_reason: reason,
        })
        .eq('id', regId)

      if (err) throw err
      return true
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error'
      return false
    }
  }

  // Admin: fetch all registrations for an auction
  async function fetchAllRegistrations(forAuctionId: string): Promise<AuctionRegistration[]> {
    const { data, error: err } = await supabase
      .from('auction_registrations')
      .select('*')
      .eq('auction_id', forAuctionId)
      .order('registered_at', { ascending: false })

    if (err) {
      error.value = err.message
      return []
    }
    return (data as unknown as AuctionRegistration[]) || []
  }

  return {
    registration,
    loading,
    error,
    isRegistered,
    isApproved,
    canBid,
    fetchRegistration,
    submitRegistration,
    initiateDeposit,
    approveRegistration,
    rejectRegistration,
    fetchAllRegistrations,
  }
}
