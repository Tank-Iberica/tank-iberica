/**
 * Composable for dealer visit management.
 * Extracts all visit slot / booking CRUD logic from the visitas page.
 * Does NOT call onMounted — the consumer calls init() explicitly.
 */

// ============ TYPES ============

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled'

export interface VisitSlot {
  id: string
  dealer_id: string
  day_of_week: number
  start_time: string
  end_time: string
  max_visitors: number
  created_at: string
}

export interface VisitBooking {
  id: string
  dealer_id: string
  slot_id: string | null
  vehicle_id: string | null
  vehicle_brand: string
  vehicle_model: string
  buyer_name: string
  buyer_email: string | null
  visit_date: string
  visit_time: string
  status: BookingStatus
  notes: string | null
  created_at: string
}

export interface SlotFormData {
  day_of_week: number
  start_time: string
  end_time: string
  max_visitors: number
}

// ============ CONSTANTS ============

export const DAYS_KEYS = [
  'visits.monday',
  'visits.tuesday',
  'visits.wednesday',
  'visits.thursday',
  'visits.friday',
  'visits.saturday',
  'visits.sunday',
] as const

// ============ COMPOSABLE ============

export function useDashboardVisitas() {
  const { t, locale } = useI18n()
  const supabase = useSupabaseClient()
  const { dealerProfile, loadDealer } = useDealerDashboard()

  // ---------- State ----------

  const slots = ref<VisitSlot[]>([])
  const bookings = ref<VisitBooking[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const successMsg = ref<string | null>(null)
  const visitsEnabled = ref(true)

  const slotForm = reactive<SlotFormData>({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '18:00',
    max_visitors: 5,
  })

  // ---------- Computed ----------

  const sortedSlots = computed(() =>
    [...slots.value].sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week
      return a.start_time.localeCompare(b.start_time)
    }),
  )

  const upcomingBookings = computed(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return [...bookings.value]
      .filter((b) => new Date(b.visit_date) >= now || b.status === 'pending')
      .sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime())
  })

  const isSlotFormValid = computed(() => {
    return (
      slotForm.start_time !== '' &&
      slotForm.end_time !== '' &&
      slotForm.start_time < slotForm.end_time &&
      slotForm.max_visitors > 0
    )
  })

  // ---------- Data loading ----------

  async function loadData() {
    loading.value = true
    error.value = null

    try {
      const dealer = dealerProfile.value || (await loadDealer())
      if (!dealer) {
        error.value = t('visits.errorNoDealer')
        return
      }

      // Load visit slots
      const { data: slotsData, error: sErr } = await supabase
        .from('visit_slots')
        .select('*')
        .eq('dealer_id', dealer.id)
        .order('day_of_week', { ascending: true })

      if (sErr) throw sErr
      slots.value = (slotsData || []) as VisitSlot[]

      // Load visit bookings
      const { data: bookingsData, error: bErr } = await supabase
        .from('visit_bookings')
        .select('*, vehicles(brand, model)')
        .eq('dealer_id', dealer.id)
        .order('visit_date', { ascending: false })
        .limit(50)

      if (bErr) throw bErr

      bookings.value = (
        (bookingsData || []) as Array<{
          id: string
          dealer_id: string
          slot_id: string | null
          vehicle_id: string | null
          buyer_name: string
          buyer_email: string | null
          visit_date: string
          visit_time: string
          status: BookingStatus
          notes: string | null
          created_at: string
          vehicles: { brand: string; model: string } | null
        }>
      ).map((b) => ({
        id: b.id,
        dealer_id: b.dealer_id,
        slot_id: b.slot_id,
        vehicle_id: b.vehicle_id,
        vehicle_brand: b.vehicles?.brand || '',
        vehicle_model: b.vehicles?.model || '',
        buyer_name: b.buyer_name,
        buyer_email: b.buyer_email,
        visit_date: b.visit_date,
        visit_time: b.visit_time,
        status: b.status,
        notes: b.notes,
        created_at: b.created_at,
      }))
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || t('visits.errorLoading')
    } finally {
      loading.value = false
    }
  }

  // ---------- Slot CRUD ----------

  async function addSlot() {
    if (!isSlotFormValid.value) return
    saving.value = true
    error.value = null
    successMsg.value = null

    try {
      const dealer = dealerProfile.value
      if (!dealer) throw new Error('Dealer not found')

      const payload = {
        dealer_id: dealer.id,
        day_of_week: slotForm.day_of_week,
        start_time: slotForm.start_time,
        end_time: slotForm.end_time,
        max_visitors: slotForm.max_visitors,
      }

      const { error: err } = await supabase.from('visit_slots').insert(payload as never)
      if (err) throw err

      successMsg.value = t('visits.slotAdded')
      await loadData()
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || t('visits.errorSaving')
    } finally {
      saving.value = false
    }
  }

  async function deleteSlot(slotId: string) {
    saving.value = true
    error.value = null

    try {
      const { error: err } = await supabase.from('visit_slots').delete().eq('id', slotId)

      if (err) throw err

      slots.value = slots.value.filter((s) => s.id !== slotId)
      successMsg.value = t('visits.slotDeleted')
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || t('visits.errorDeleting')
    } finally {
      saving.value = false
    }
  }

  // ---------- Booking actions ----------

  async function updateBookingStatus(bookingId: string, status: BookingStatus) {
    saving.value = true
    error.value = null
    successMsg.value = null

    try {
      const { error: err } = await supabase
        .from('visit_bookings')
        .update({ status, updated_at: new Date().toISOString() } as never)
        .eq('id', bookingId)

      if (err) throw err

      const booking = bookings.value.find((b) => b.id === bookingId)
      if (booking) booking.status = status

      successMsg.value =
        status === 'confirmed' ? t('visits.bookingConfirmed') : t('visits.bookingCancelled')
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || t('visits.errorUpdating')
    } finally {
      saving.value = false
    }
  }

  // ---------- Formatting helpers ----------

  function getDayLabel(dayNum: number): string {
    const key = DAYS_KEYS[dayNum - 1]
    return key ? t(key) : String(dayNum)
  }

  function fmtDate(date: string | null): string {
    if (!date) return '--'
    return new Date(date).toLocaleDateString(locale.value === 'en' ? 'en-GB' : 'es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  function getStatusClass(status: BookingStatus): string {
    switch (status) {
      case 'pending':
        return 'status-pending'
      case 'confirmed':
        return 'status-confirmed'
      case 'cancelled':
        return 'status-cancelled'
      default:
        return ''
    }
  }

  // ---------- Slot form helpers ----------

  function updateSlotFormField(field: keyof SlotFormData, value: string | number) {
    if (field === 'day_of_week' || field === 'max_visitors') {
      slotForm[field] = Number(value)
    } else {
      slotForm[field] = String(value)
    }
  }

  // ---------- Public API ----------

  return {
    // State
    slots,
    bookings,
    loading,
    saving,
    error,
    successMsg,
    visitsEnabled,
    slotForm,

    // Computed
    sortedSlots,
    upcomingBookings,
    isSlotFormValid,

    // Actions
    init: loadData,
    addSlot,
    deleteSlot,
    updateBookingStatus,
    updateSlotFormField,

    // Formatters
    getDayLabel,
    fmtDate,
    getStatusClass,
  }
}
