export interface CalendarPost {
  id: string
  platform: string
  status: string
  scheduled_at: string | null
  posted_at: string | null
  content: Record<string, string>
  image_url: string | null
  external_post_id: string | null
  vehicle_id: string | null
  vehicle?: {
    id: string
    brand: string
    model: string
    year: number | null
    slug: string
  } | null
  impressions: number
  clicks: number
}

export type CalendarView = 'week' | 'month'

/** Returns ISO date string YYYY-MM-DD for a Date object in local time */
function toLocalDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Returns start of ISO week (Monday) containing `date` */
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day // Monday = 0 offset
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Returns start of month containing `date` */
function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)
}

/** Returns array of `count` consecutive Date objects starting from `start` */
function getDays(start: Date, count: number): Date[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export function useAdminSocialCalendar() {
  const { t: _t } = useI18n()

  // ── State ──────────────────────────────────────────────────────────────────
  const view = ref<CalendarView>('week')
  const currentDate = ref(new Date())
  const posts = ref<CalendarPost[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const reschedulingId = ref<string | null>(null)
  const selectedPost = ref<CalendarPost | null>(null)

  // Drag state
  const draggedPostId = ref<string | null>(null)
  const dragOverDate = ref<string | null>(null) // YYYY-MM-DD

  // ── Computed ───────────────────────────────────────────────────────────────

  const visibleDays = computed<Date[]>(() => {
    if (view.value === 'week') {
      return getDays(getWeekStart(currentDate.value), 7)
    }
    const start = getMonthStart(currentDate.value)
    // Calendar grid starts on the Monday of the week containing the 1st
    const gridStart = getWeekStart(start)
    // Show 5 or 6 complete weeks (35 or 42 days)
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
    const totalCells =
      daysInMonth +
      (gridStart.getDate() !== start.getDate()
        ? start.getDay() === 0
          ? 6
          : start.getDay() - 1
        : 0)
    const weeks = Math.ceil(totalCells / 7)
    return getDays(gridStart, weeks * 7)
  })

  const rangeFrom = computed(() => {
    return visibleDays.value[0]?.toISOString() ?? new Date().toISOString()
  })

  const rangeTo = computed(() => {
    const last = visibleDays.value.at(-1)
    if (!last) return new Date().toISOString()
    const end = new Date(last)
    end.setHours(23, 59, 59, 999)
    return end.toISOString()
  })

  /** Posts indexed by YYYY-MM-DD for fast lookup */
  const postsByDate = computed(() => {
    const map = new Map<string, CalendarPost[]>()
    for (const post of posts.value) {
      const dateStr = post.scheduled_at
        ? toLocalDateStr(new Date(post.scheduled_at))
        : post.posted_at
          ? toLocalDateStr(new Date(post.posted_at))
          : null
      if (!dateStr) continue
      if (!map.has(dateStr)) map.set(dateStr, [])
      map.get(dateStr)!.push(post)
    }
    return map
  })

  const periodLabel = computed(() => {
    if (view.value === 'week') {
      const start = visibleDays.value[0]
      const end = visibleDays.value[6]
      if (!start || !end) return ''
      const fmtOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
      return `${start.toLocaleDateString(undefined, fmtOpts)} – ${end.toLocaleDateString(undefined, { ...fmtOpts, year: 'numeric' })}`
    }
    return currentDate.value.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  })

  // ── Data fetching ──────────────────────────────────────────────────────────

  async function fetchCalendar() {
    loading.value = true
    error.value = null
    try {
      const resp = await $fetch<{ ok: boolean; posts: CalendarPost[]; from: string; to: string }>(
        '/api/social/calendar',
        {
          query: { from: rangeFrom.value, to: rangeTo.value },
        },
      )
      posts.value = resp.posts
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to load calendar'
    } finally {
      loading.value = false
    }
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  function goToToday() {
    currentDate.value = new Date()
    fetchCalendar()
  }

  function goBack() {
    const d = new Date(currentDate.value)
    if (view.value === 'week') d.setDate(d.getDate() - 7)
    else d.setMonth(d.getMonth() - 1)
    currentDate.value = d
    fetchCalendar()
  }

  function goForward() {
    const d = new Date(currentDate.value)
    if (view.value === 'week') d.setDate(d.getDate() + 7)
    else d.setMonth(d.getMonth() + 1)
    currentDate.value = d
    fetchCalendar()
  }

  function switchView(v: CalendarView) {
    view.value = v
    fetchCalendar()
  }

  // ── Drag & Drop ────────────────────────────────────────────────────────────

  function onDragStart(post: CalendarPost) {
    if (post.status === 'posted' || post.status === 'failed') return
    draggedPostId.value = post.id
  }

  function onDragOver(dateStr: string, e: DragEvent) {
    e.preventDefault()
    dragOverDate.value = dateStr
  }

  function onDragLeave() {
    dragOverDate.value = null
  }

  async function onDrop(dateStr: string) {
    dragOverDate.value = null
    if (!draggedPostId.value) return

    // Build ISO datetime from the dropped date (keep current time if already scheduled, else noon)
    const post = posts.value.find((p) => p.id === draggedPostId.value)
    if (!post) return

    const existingTime = post.scheduled_at ? new Date(post.scheduled_at) : null
    const dropDate = new Date(dateStr + 'T12:00:00')

    if (existingTime) {
      dropDate.setHours(existingTime.getHours(), existingTime.getMinutes(), 0, 0)
    }

    draggedPostId.value = null
    await reschedulePost(post.id, dropDate.toISOString())
  }

  function onDragEnd() {
    draggedPostId.value = null
    dragOverDate.value = null
  }

  // ── Rescheduling ───────────────────────────────────────────────────────────

  async function reschedulePost(postId: string, scheduledAt: string | null) {
    reschedulingId.value = postId
    try {
      await $fetch('/api/social/reschedule', {
        method: 'PATCH',
        body: { postId, scheduledAt },
      })
      // Optimistic update
      const idx = posts.value.findIndex((p) => p.id === postId)
      if (idx !== -1) {
        posts.value[idx] = { ...posts.value[idx]!, scheduled_at: scheduledAt }
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to reschedule post'
      // Refresh to restore actual state
      await fetchCalendar()
    } finally {
      reschedulingId.value = null
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function getPostsForDay(dateStr: string): CalendarPost[] {
    return postsByDate.value.get(dateStr) ?? []
  }

  function isToday(date: Date): boolean {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  function isCurrentMonth(date: Date): boolean {
    return date.getMonth() === currentDate.value.getMonth()
  }

  const PLATFORM_COLORS: Record<string, string> = {
    linkedin: '#0077b5',
    facebook: '#1877f2',
    instagram: '#e1306c',
    x: '#000000',
  }

  const STATUS_COLORS: Record<string, string> = {
    draft: '#6b7280',
    pending: '#f59e0b',
    approved: '#3b82f6',
    scheduled: '#8b5cf6',
    posted: '#10b981',
    failed: '#ef4444',
  }

  function getPlatformColor(platform: string): string {
    return PLATFORM_COLORS[platform] ?? '#6b7280'
  }

  function getStatusColor(status: string): string {
    return STATUS_COLORS[status] ?? '#6b7280'
  }

  function getPlatformIcon(platform: string): string {
    const icons: Record<string, string> = {
      linkedin: 'in',
      facebook: 'f',
      instagram: '📸',
      x: '✕',
    }
    return icons[platform] ?? '?'
  }

  function formatPostTime(post: CalendarPost): string {
    const dt = post.scheduled_at ?? post.posted_at
    if (!dt) return ''
    return new Date(dt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  function openPost(post: CalendarPost) {
    selectedPost.value = post
  }

  function closePost() {
    selectedPost.value = null
  }

  const WEEK_DAYS_SHORT = computed(() => {
    // Monday-first, locale-aware
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2024, 0, 1 + i) // Jan 1 2024 was Monday
      return d.toLocaleDateString(undefined, { weekday: 'short' })
    })
  })

  return {
    // State
    view,
    currentDate,
    posts,
    loading,
    error,
    reschedulingId,
    selectedPost,
    draggedPostId,
    dragOverDate,
    // Computed
    visibleDays,
    postsByDate,
    periodLabel,
    WEEK_DAYS_SHORT,
    // Methods
    fetchCalendar,
    goToToday,
    goBack,
    goForward,
    switchView,
    // Drag & Drop
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
    // Actions
    reschedulePost,
    openPost,
    closePost,
    // Helpers
    getPostsForDay,
    isToday,
    isCurrentMonth,
    getPlatformColor,
    getStatusColor,
    getPlatformIcon,
    formatPostTime,
    toLocalDateStr,
  }
}
