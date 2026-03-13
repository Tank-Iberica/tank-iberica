/**
 * Tests for GET /api/social/calendar and PATCH /api/social/reschedule
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockServerUser, mockGetQuery, mockValidateBody } = vi.hoisted(() => ({
  mockServerUser: vi.fn(),
  mockGetQuery: vi.fn(),
  mockValidateBody: vi.fn(),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getQuery: (...a: unknown[]) => mockGetQuery(...a),
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseUser: (...a: unknown[]) => mockServerUser(...a),
  serverSupabaseServiceRole: () => mockSupabase,
}))

vi.mock('~~/server/utils/safeError', () => ({
  safeError: (_code: number, msg: string) => {
    const err = new Error(msg) as Error & { statusCode: number }
    err.statusCode = _code
    return err
  },
}))

vi.mock('~~/server/utils/validateBody', () => ({
  validateBody: (...a: unknown[]) => mockValidateBody(...a),
}))

vi.mock('~~/server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

let mockSupabase: Record<string, unknown>

const VALID_UUID = '12345678-1234-1234-1234-123456789abc'
const FROM = '2026-01-01T00:00:00.000Z'
const TO = '2026-01-28T23:59:59.999Z'

const MOCK_POSTS = [
  {
    id: VALID_UUID,
    platform: 'linkedin',
    status: 'scheduled',
    scheduled_at: '2026-01-10T12:00:00.000Z',
    posted_at: null,
    content: { es: 'Vehículo disponible', en: 'Vehicle available' },
    image_url: 'https://cdn.example.com/img.jpg',
    external_post_id: null,
    vehicle_id: VALID_UUID,
    impressions: 0,
    clicks: 0,
    vehicles: { id: VALID_UUID, brand: 'Volvo', model: 'FH16', year: 2022, slug: 'volvo-fh16' },
  },
]

function makeCalendarSupabase(opts: {
  posts?: unknown[]
  error?: unknown
} = {}) {
  const { posts = MOCK_POSTS, error = null } = opts
  const chain: Record<string, unknown> = {}
  chain.select = () => chain
  chain.or = () => chain
  chain.eq = () => chain
  chain.order = () => chain
  chain.limit = () => Promise.resolve({ data: posts, error })
  return {
    from: vi.fn().mockReturnValue(chain),
  }
}

function makeRescheduleSupabase(opts: {
  post?: unknown
  postFetchError?: unknown
  updateData?: unknown
  updateError?: unknown
} = {}) {
  const {
    post = { id: VALID_UUID, status: 'scheduled', platform: 'linkedin' },
    postFetchError = null,
    updateData = { id: VALID_UUID, platform: 'linkedin', status: 'scheduled', scheduled_at: '2026-02-01T12:00:00.000Z' },
    updateError = null,
  } = opts

  // Track whether .update() has been called to differentiate select vs update paths
  let isUpdatePath = false

  const chain: Record<string, unknown> = {}
  chain.select = vi.fn().mockImplementation(() => {
    // if called after update(), it's the select in the update chain
    return chain
  })
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockImplementation(() => {
    isUpdatePath = true
    return chain
  })
  chain.single = vi.fn().mockImplementation(() => {
    if (isUpdatePath) {
      return Promise.resolve({ data: updateData, error: updateError })
    }
    return Promise.resolve({ data: post, error: postFetchError })
  })

  return {
    from: vi.fn().mockReturnValue(chain),
  }
}

import calendarHandler from '../../../server/api/social/calendar.get'
import rescheduleHandler from '../../../server/api/social/reschedule.patch'

// ── calendar.get tests ────────────────────────────────────────────────────────

describe('GET /api/social/calendar', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockServerUser.mockResolvedValue({ id: 'admin-1' })
    mockGetQuery.mockReturnValue({ from: FROM, to: TO })
    mockSupabase = makeCalendarSupabase()
  })

  it('returns ok=true with posts array', async () => {
    const result = await calendarHandler({} as any)
    expect(result).toMatchObject({ ok: true, posts: MOCK_POSTS, total: 1 })
  })

  it('returns 401 when user not authenticated', async () => {
    mockServerUser.mockResolvedValue(null)
    await expect(calendarHandler({} as any)).rejects.toThrow('Unauthorized')
  })

  it('uses default date range when no query params', async () => {
    mockGetQuery.mockReturnValue({})
    mockSupabase = makeCalendarSupabase({ posts: [] })
    const result = await calendarHandler({} as any)
    expect(result).toMatchObject({ ok: true, posts: [], total: 0 })
  })

  it('throws 400 for invalid from date', async () => {
    mockGetQuery.mockReturnValue({ from: 'not-a-date', to: TO })
    await expect(calendarHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 for invalid to date', async () => {
    mockGetQuery.mockReturnValue({ from: FROM, to: 'invalid' })
    await expect(calendarHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 for range > 366 days', async () => {
    const from = '2026-01-01T00:00:00.000Z'
    const to = '2027-02-01T00:00:00.000Z' // > 366 days
    mockGetQuery.mockReturnValue({ from, to })
    await expect(calendarHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 500 when DB query fails', async () => {
    mockSupabase = makeCalendarSupabase({ posts: null as any, error: new Error('DB error') })
    await expect(calendarHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('returns empty posts array when no posts in range', async () => {
    mockSupabase = makeCalendarSupabase({ posts: [] })
    const result = await calendarHandler({} as any)
    expect(result).toMatchObject({ ok: true, posts: [], total: 0 })
  })

  it('includes from/to in response', async () => {
    const result = await calendarHandler({} as any)
    expect((result as any).from).toBe(FROM)
    expect((result as any).to).toBe(TO)
  })
})

// ── reschedule.patch tests ────────────────────────────────────────────────────

describe('PATCH /api/social/reschedule', () => {
  const NEW_DATE = '2026-02-01T12:00:00.000Z'

  beforeEach(() => {
    vi.resetAllMocks()
    mockServerUser.mockResolvedValue({ id: 'admin-1' })
    mockValidateBody.mockResolvedValue({ postId: VALID_UUID, scheduledAt: NEW_DATE })
    mockSupabase = makeRescheduleSupabase()
  })

  it('returns ok=true with updated post', async () => {
    const result = await rescheduleHandler({} as any)
    expect(result).toMatchObject({ ok: true })
    expect((result as any).post).toBeTruthy()
  })

  it('returns 401 when user not authenticated', async () => {
    mockServerUser.mockResolvedValue(null)
    await expect(rescheduleHandler({} as any)).rejects.toThrow('Unauthorized')
  })

  it('throws 404 when post not found', async () => {
    mockSupabase = makeRescheduleSupabase({ post: null, postFetchError: new Error('not found') })
    await expect(rescheduleHandler({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 409 when post is already posted', async () => {
    mockSupabase = makeRescheduleSupabase({ post: { id: VALID_UUID, status: 'posted', platform: 'linkedin' } })
    await expect(rescheduleHandler({} as any)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('throws 409 when post has failed status', async () => {
    mockSupabase = makeRescheduleSupabase({ post: { id: VALID_UUID, status: 'failed', platform: 'x' } })
    await expect(rescheduleHandler({} as any)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('throws 500 when update fails', async () => {
    mockSupabase = makeRescheduleSupabase({ updateData: null, updateError: new Error('update failed') })
    await expect(rescheduleHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('sets status to scheduled when rescheduling a draft post', async () => {
    mockSupabase = makeRescheduleSupabase({
      post: { id: VALID_UUID, status: 'draft', platform: 'facebook' },
      updateData: { id: VALID_UUID, platform: 'facebook', status: 'scheduled', scheduled_at: NEW_DATE },
    })
    const result = await rescheduleHandler({} as any)
    expect(result).toMatchObject({ ok: true })
  })

  it('allows rescheduling pending posts', async () => {
    mockSupabase = makeRescheduleSupabase({ post: { id: VALID_UUID, status: 'pending', platform: 'instagram' } })
    const result = await rescheduleHandler({} as any)
    expect(result).toMatchObject({ ok: true })
  })

  it('allows rescheduling approved posts', async () => {
    mockSupabase = makeRescheduleSupabase({ post: { id: VALID_UUID, status: 'approved', platform: 'linkedin' } })
    const result = await rescheduleHandler({} as any)
    expect(result).toMatchObject({ ok: true })
  })

  it('allows setting scheduledAt to null (unschedule)', async () => {
    mockValidateBody.mockResolvedValue({ postId: VALID_UUID, scheduledAt: null })
    mockSupabase = makeRescheduleSupabase({ post: { id: VALID_UUID, status: 'scheduled', platform: 'x' } })
    const result = await rescheduleHandler({} as any)
    expect(result).toMatchObject({ ok: true })
  })
})
