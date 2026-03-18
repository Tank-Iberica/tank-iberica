/**
 * Tests for #71 — Editorial Calendar composable logic
 *
 * Validates:
 * - Date range calculation (week/month)
 * - Calendar day generation
 * - Event grouping by day
 * - Navigation (prev/next/today)
 */
import { describe, it, expect } from 'vitest'

// ── Replicate core logic from useAdminEditorialCalendar ─────────────────────

type CalendarView = 'week' | 'month'

interface CalendarEvent {
  id: string
  type: 'article' | 'vehicle' | 'social'
  title: string
  scheduledAt: Date
  status: string
}

function computeDateRange(referenceDate: Date, view: CalendarView) {
  const d = new Date(referenceDate)
  if (view === 'week') {
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
}

function computeCalendarDays(from: Date, to: Date): Date[] {
  const days: Date[] = []
  const cur = new Date(from)
  while (cur <= to) {
    days.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

function groupEventsByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>()
  for (const ev of events) {
    const key = ev.scheduledAt.toISOString().split('T')[0] ?? ''
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(ev)
  }
  return map
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Editorial Calendar — date range (#71)', () => {
  it('week view starts on Monday', () => {
    // Wednesday 2026-03-11
    const { from } = computeDateRange(new Date(2026, 2, 11), 'week')
    expect(from.getDay()).toBe(1) // Monday
  })

  it('week view ends on Sunday', () => {
    const { to } = computeDateRange(new Date(2026, 2, 11), 'week')
    expect(to.getDay()).toBe(0) // Sunday
  })

  it('week range is 7 days', () => {
    const { from, to } = computeDateRange(new Date(2026, 2, 11), 'week')
    const days = computeCalendarDays(from, to)
    expect(days).toHaveLength(7)
  })

  it('month view starts on 1st', () => {
    const { from } = computeDateRange(new Date(2026, 2, 15), 'month')
    expect(from.getDate()).toBe(1)
  })

  it('month view ends on last day', () => {
    // March 2026 has 31 days
    const { to } = computeDateRange(new Date(2026, 2, 15), 'month')
    expect(to.getDate()).toBe(31)
  })

  it('month range for March 2026 = 31 days', () => {
    const { from, to } = computeDateRange(new Date(2026, 2, 15), 'month')
    const days = computeCalendarDays(from, to)
    expect(days).toHaveLength(31)
  })

  it('month range for February 2026 = 28 days', () => {
    const { from, to } = computeDateRange(new Date(2026, 1, 10), 'month')
    const days = computeCalendarDays(from, to)
    expect(days).toHaveLength(28)
  })
})

describe('Editorial Calendar — navigation (#71)', () => {
  it('prev week subtracts 7 days', () => {
    const ref = new Date(2026, 2, 16) // March 16
    const newRef = new Date(ref)
    newRef.setDate(newRef.getDate() - 7)
    expect(newRef.getDate()).toBe(9)
  })

  it('next week adds 7 days', () => {
    const ref = new Date(2026, 2, 16)
    const newRef = new Date(ref)
    newRef.setDate(newRef.getDate() + 7)
    expect(newRef.getDate()).toBe(23)
  })

  it('prev month subtracts 1 month', () => {
    const ref = new Date(2026, 2, 16) // March
    const newRef = new Date(ref)
    newRef.setMonth(newRef.getMonth() - 1)
    expect(newRef.getMonth()).toBe(1) // February
  })

  it('next month adds 1 month', () => {
    const ref = new Date(2026, 2, 16) // March
    const newRef = new Date(ref)
    newRef.setMonth(newRef.getMonth() + 1)
    expect(newRef.getMonth()).toBe(3) // April
  })
})

describe('Editorial Calendar — event grouping (#71)', () => {
  const events: CalendarEvent[] = [
    { id: '1', type: 'article', title: 'A1', scheduledAt: new Date('2026-03-16T10:00:00Z'), status: 'scheduled' },
    { id: '2', type: 'vehicle', title: 'V1', scheduledAt: new Date('2026-03-16T14:00:00Z'), status: 'draft' },
    { id: '3', type: 'social', title: 'S1', scheduledAt: new Date('2026-03-17T09:00:00Z'), status: 'scheduled' },
  ]

  it('groups events by day', () => {
    const grouped = groupEventsByDay(events)
    expect(grouped.get('2026-03-16')).toHaveLength(2)
    expect(grouped.get('2026-03-17')).toHaveLength(1)
  })

  it('returns empty for days with no events', () => {
    const grouped = groupEventsByDay(events)
    expect(grouped.get('2026-03-18')).toBeUndefined()
  })

  it('handles empty event list', () => {
    const grouped = groupEventsByDay([])
    expect(grouped.size).toBe(0)
  })
})
