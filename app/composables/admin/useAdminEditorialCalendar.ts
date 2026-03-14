/**
 * Composable for the editorial calendar (P6).
 * Fetches scheduled articles, vehicles, and social posts for display
 * in a weekly/monthly content planning view.
 */

export type CalendarView = 'week' | 'month'

export type ContentType = 'article' | 'vehicle' | 'social'

export interface CalendarEvent {
  id: string
  type: ContentType
  title: string
  scheduledAt: Date
  status: string
  url?: string
}

export function useAdminEditorialCalendar() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabaseClient() as any
  const view = ref<CalendarView>('week')
  const referenceDate = ref(new Date())
  const events = ref<CalendarEvent[]>([])
  const loading = ref(false)

  // ── Date range helpers ───────────────────────────────────────────────────

  const dateRange = computed(() => {
    const d = new Date(referenceDate.value)
    if (view.value === 'week') {
      const day = d.getDay()
      const monday = new Date(d)
      monday.setDate(d.getDate() - ((day + 6) % 7))
      monday.setHours(0, 0, 0, 0)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      sunday.setHours(23, 59, 59, 999)
      return { from: monday, to: sunday }
    } else {
      const from = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
      const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
      return { from, to }
    }
  })

  const calendarDays = computed(() => {
    const { from, to } = dateRange.value
    const days: Date[] = []
    const cur = new Date(from)
    while (cur <= to) {
      days.push(new Date(cur))
      cur.setDate(cur.getDate() + 1)
    }
    return days
  })

  // ── Navigation ───────────────────────────────────────────────────────────

  function prev() {
    const d = new Date(referenceDate.value)
    if (view.value === 'week') d.setDate(d.getDate() - 7)
    else d.setMonth(d.getMonth() - 1)
    referenceDate.value = d
  }

  function next() {
    const d = new Date(referenceDate.value)
    if (view.value === 'week') d.setDate(d.getDate() + 7)
    else d.setMonth(d.getMonth() + 1)
    referenceDate.value = d
  }

  function goToday() {
    referenceDate.value = new Date()
  }

  // ── Data fetch ───────────────────────────────────────────────────────────

  async function fetchEvents() {
    loading.value = true
    const { from, to } = dateRange.value
    const fromISO = from.toISOString()
    const toISO = to.toISOString()

    try {
      const [articlesRes, vehiclesRes, socialRes] = await Promise.all([
        supabase
          .from('news')
          .select('id, title_es, scheduled_at, status, slug')
          .in('status', ['scheduled', 'draft'])
          .not('scheduled_at', 'is', null)
          .gte('scheduled_at', fromISO)
          .lte('scheduled_at', toISO)
          .order('scheduled_at'),

        supabase
          .from('vehicles')
          .select('id, title_es, brand, model, scheduled_publish_at, status, slug')
          .eq('status', 'draft')
          .not('scheduled_publish_at', 'is', null)
          .gte('scheduled_publish_at', fromISO)
          .lte('scheduled_publish_at', toISO)
          .order('scheduled_publish_at'),

        supabase
          .from('social_posts')
          .select('id, content, scheduled_at, status, platform')
          .in('status', ['scheduled', 'draft'])
          .not('scheduled_at', 'is', null)
          .gte('scheduled_at', fromISO)
          .lte('scheduled_at', toISO)
          .order('scheduled_at'),
      ])

      const articleEvents: CalendarEvent[] = (articlesRes.data ?? []).map((a: any) => ({
        id: `article-${a.id}`,
        type: 'article' as ContentType,
        title: a.title_es ?? '(sin título)',
        scheduledAt: new Date(a.scheduled_at!),
        status: a.status,
        url: `/admin/noticias/${a.id}`,
      }))

      const vehicleEvents: CalendarEvent[] = (vehiclesRes.data ?? []).map((v: any) => ({
        id: `vehicle-${v.id}`,
        type: 'vehicle' as ContentType,
        title: v.title_es || `${v.brand ?? ''} ${v.model ?? ''}`.trim() || '(sin título)',
        scheduledAt: new Date(v.scheduled_publish_at!),
        status: v.status,
        url: `/admin/vehiculos/${v.id}`,
      }))

      const socialEvents: CalendarEvent[] = (socialRes.data ?? []).map((s: any) => ({
        id: `social-${s.id}`,
        type: 'social' as ContentType,
        title: `${s.platform ?? 'Social'}: ${(s.content as string | null)?.slice(0, 40) ?? ''}…`,
        scheduledAt: new Date(s.scheduled_at!),
        status: s.status,
      }))

      events.value = [...articleEvents, ...vehicleEvents, ...socialEvents].sort(
        (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime(),
      )
    } catch (err) {
      if (import.meta.dev) console.error('[useAdminEditorialCalendar] fetchEvents failed:', err)
      events.value = []
    } finally {
      loading.value = false
    }
  }

  // Events grouped by day key (YYYY-MM-DD)
  const eventsByDay = computed(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const ev of events.value) {
      const key = ev.scheduledAt.toISOString().split('T')[0] ?? ''
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(ev)
    }
    return map
  })

  function eventsForDay(day: Date): CalendarEvent[] {
    const key = day.toISOString().split('T')[0] ?? ''
    return eventsByDay.value.get(key) ?? []
  }

  // ── Auto-reload on range change ──────────────────────────────────────────

  watch([view, dateRange], fetchEvents, { immediate: true })

  return {
    view,
    referenceDate,
    dateRange,
    calendarDays,
    events,
    loading,
    prev,
    next,
    goToday,
    fetchEvents,
    eventsForDay,
  }
}
