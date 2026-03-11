import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSocialPublisher } from '../../app/composables/useSocialPublisher'

// ─── Stubs ────────────────────────────────────────────────────────────────────

function makeChain(data: unknown = [], error: unknown = null) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'or', 'order', 'select', 'update', 'in', 'gte'].forEach((m) => {
    chain[m] = () => chain
  })
  chain.insert = (rows: unknown) => ({
    select: () => ({
      then: (resolve: (v: unknown) => void) => Promise.resolve({ data: rows, error }).then(resolve),
      catch: (reject: (e: unknown) => void) => Promise.resolve({ data: rows, error }).catch(reject),
    }),
  })
  const resolved = { data, error }
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

function stubClient() {
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => makeChain([]),
      update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      insert: (rows: unknown) => ({
        select: () => ({
          then: (resolve: (v: unknown) => void) =>
            Promise.resolve({ data: rows, error: null }).then(resolve),
          catch: (reject: (v: unknown) => void) =>
            Promise.resolve({ data: rows, error: null }).catch(reject),
        }),
      }),
    }),
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  stubClient()
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('posts starts as empty array', () => {
    const c = useSocialPublisher()
    expect(c.posts.value).toHaveLength(0)
  })

  it('loading starts as false', () => {
    const c = useSocialPublisher()
    expect(c.loading.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useSocialPublisher()
    expect(c.error.value).toBeNull()
  })
})

// ─── generatePostContent ──────────────────────────────────────────────────────

describe('generatePostContent (via createPendingPosts)', () => {
  const sampleVehicle = {
    title: 'Volvo FH 2020',
    price_cents: 5000000,
    location: 'Madrid',
    slug: 'volvo-fh-2020',
  }

  it('creates pending posts for 4 platforms', async () => {
    const insertedRows: unknown[] = []
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        insert: (rows: unknown) => {
          const arr = rows as unknown[]
          insertedRows.push(...arr)
          return {
            select: () => ({
              then: (resolve: (v: unknown) => void) =>
                Promise.resolve({ data: arr.map((r, i) => ({ id: `post-${i}` })), error: null }).then(resolve),
              catch: (reject: (v: unknown) => void) =>
                Promise.resolve({ data: [], error: null }).catch(reject),
            }),
          }
        },
      }),
    }))
    const c = useSocialPublisher()
    const ids = await c.createPendingPosts('v-1', sampleVehicle)
    expect(ids).toHaveLength(4)
    expect(insertedRows).toHaveLength(4)
  })

  it('returns empty array on insert error', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        insert: () => ({
          select: () => ({
            then: (resolve: (v: unknown) => void) =>
              Promise.resolve({ data: null, error: new Error('Insert failed') }).then(resolve),
            catch: (reject: (v: unknown) => void) =>
              Promise.resolve({ data: null, error: null }).catch(reject),
          }),
        }),
      }),
    }))
    const c = useSocialPublisher()
    const ids = await c.createPendingPosts('v-1', sampleVehicle)
    expect(ids).toHaveLength(0)
    expect(c.error.value).toBeTruthy()
  })

  it('sets loading to false after createPendingPosts', async () => {
    const c = useSocialPublisher()
    await c.createPendingPosts('v-1', sampleVehicle)
    expect(c.loading.value).toBe(false)
  })
})

// ─── approvePost ──────────────────────────────────────────────────────────────

describe('approvePost', () => {
  it('returns true on success', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }))
    const c = useSocialPublisher()
    const result = await c.approvePost('post-1', 'admin-1')
    expect(result).toBe(true)
  })

  it('returns false and sets error on failure', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        update: () => ({ eq: () => Promise.resolve({ data: null, error: new Error('Update failed') }) }),
      }),
    }))
    const c = useSocialPublisher()
    const result = await c.approvePost('post-1', 'admin-1')
    expect(result).toBe(false)
    expect(c.error.value).toBeTruthy()
  })

  it('sets loading to false after success', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }))
    const c = useSocialPublisher()
    await c.approvePost('post-1', 'admin-1')
    expect(c.loading.value).toBe(false)
  })
})

// ─── rejectPost ───────────────────────────────────────────────────────────────

describe('rejectPost', () => {
  it('returns true on success', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }))
    const c = useSocialPublisher()
    const result = await c.rejectPost('post-1', 'Not suitable')
    expect(result).toBe(true)
  })

  it('returns false on failure', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        update: () => ({ eq: () => Promise.resolve({ data: null, error: new Error('Err') }) }),
      }),
    }))
    const c = useSocialPublisher()
    const result = await c.rejectPost('post-1', 'Not suitable')
    expect(result).toBe(false)
  })
})

// ─── fetchPosts ───────────────────────────────────────────────────────────────

describe('fetchPosts', () => {
  it('sets loading to false after completion', async () => {
    const c = useSocialPublisher()
    await c.fetchPosts()
    expect(c.loading.value).toBe(false)
  })

  it('populates posts from DB', async () => {
    const samplePost = {
      id: 'p1', vehicle_id: 'v1', article_id: null, platform: 'linkedin',
      content: { es: 'Hola', en: 'Hello' }, image_url: null, status: 'pending',
      scheduled_at: null, posted_at: null, external_post_id: null,
      impressions: 0, clicks: 0, approved_at: null, approved_by: null,
      rejection_reason: null, created_at: '2026-01-01',
      vehicles: null,
    }
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([samplePost]),
      }),
    }))
    const c = useSocialPublisher()
    await c.fetchPosts()
    expect(c.posts.value).toHaveLength(1)
  })
})

// ─── publishPost ──────────────────────────────────────────────────────────────

describe('publishPost', () => {
  const approvedPost = {
    id: 'post-1', vehicle_id: 'v-1', article_id: null,
    platform: 'linkedin', content: { es: 'Hola', en: 'Hello' },
    image_url: null, status: 'approved',
    scheduled_at: null, posted_at: null, external_post_id: null,
    impressions: 0, clicks: 0, approved_at: '2026-01-01',
    approved_by: 'admin-1', rejection_reason: null, created_at: '2026-01-01',
  }

  function publishClient(postData: Record<string, unknown> | null, opts: { fetchErr?: Error; updateErr?: Error } = {}) {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'vertical_config') {
          const c: Record<string, unknown> = {}
          c.select = () => c; c.eq = () => c
          c.single = () => Promise.resolve({ data: { value: {} }, error: null })
          return c
        }
        return {
          select: () => {
            const s: Record<string, unknown> = {}
            s.eq = () => s; s.order = () => s
            s.single = () => Promise.resolve({ data: postData, error: opts.fetchErr || null })
            s.then = (r: (v: unknown) => void) => Promise.resolve({ data: [], error: null }).then(r)
            s.catch = (r: (v: unknown) => void) => Promise.resolve({ data: [], error: null }).catch(r)
            return s
          },
          update: () => ({
            eq: () => Promise.resolve({ data: null, error: opts.updateErr || null }),
          }),
        }
      },
    }))
  }

  it('publishes approved post successfully', async () => {
    publishClient(approvedPost)
    const c = useSocialPublisher()
    expect(await c.publishPost('post-1')).toBe(true)
    expect(c.loading.value).toBe(false)
  })

  it('fails when post status is not approved', async () => {
    publishClient({ ...approvedPost, status: 'pending' })
    const c = useSocialPublisher()
    expect(await c.publishPost('post-1')).toBe(false)
    expect(c.error.value).toContain('approved')
  })

  it('fails when post fetch returns error', async () => {
    publishClient(null, { fetchErr: new Error('Not found') })
    const c = useSocialPublisher()
    expect(await c.publishPost('post-1')).toBe(false)
    expect(c.error.value).toBe('Not found')
  })

  it('fails when post is null', async () => {
    publishClient(null)
    const c = useSocialPublisher()
    expect(await c.publishPost('post-1')).toBe(false)
    expect(c.error.value).toBe('Post not found')
  })

  it('fails when update after publish errors', async () => {
    publishClient(approvedPost, { updateErr: new Error('Update failed') })
    const c = useSocialPublisher()
    expect(await c.publishPost('post-1')).toBe(false)
    expect(c.error.value).toBe('Update failed')
  })

  it('uses es content fallback to en', async () => {
    publishClient({ ...approvedPost, content: { es: '', en: 'English' } })
    const c = useSocialPublisher()
    await c.publishPost('post-1')
    expect(c.loading.value).toBe(false)
  })
})

// ─── fetchPosts with filters ─────────────────────────────────────────────────

describe('fetchPosts filters', () => {
  it('applies status filter', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({ select: () => makeChain([{ id: 'p1' }]) }),
    }))
    const c = useSocialPublisher()
    await c.fetchPosts({ status: 'pending' })
    expect(c.posts.value).toHaveLength(1)
  })

  it('applies platform filter', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({ select: () => makeChain([{ id: 'p1' }]) }),
    }))
    const c = useSocialPublisher()
    await c.fetchPosts({ platform: 'linkedin' })
    expect(c.posts.value).toHaveLength(1)
  })

  it('applies both filters', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({ select: () => makeChain([]) }),
    }))
    const c = useSocialPublisher()
    await c.fetchPosts({ status: 'posted', platform: 'x' })
    expect(c.posts.value).toHaveLength(0)
  })

  it('sets error and empties posts on failure', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({ select: () => makeChain(null, new Error('Fetch failed')) }),
    }))
    const c = useSocialPublisher()
    await c.fetchPosts()
    expect(c.error.value).toBe('Fetch failed')
    expect(c.posts.value).toHaveLength(0)
  })
})

// ─── fetchPostsByVehicle ─────────────────────────────────────────────────────

describe('fetchPostsByVehicle', () => {
  it('returns posts for vehicle', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({ select: () => makeChain([{ id: 'p1' }, { id: 'p2' }]) }),
    }))
    const c = useSocialPublisher()
    const result = await c.fetchPostsByVehicle('v-1')
    expect(result).toHaveLength(2)
    expect(c.loading.value).toBe(false)
  })

  it('returns empty and sets error on failure', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({ select: () => makeChain(null, new Error('Err')) }),
    }))
    const c = useSocialPublisher()
    const result = await c.fetchPostsByVehicle('v-1')
    expect(result).toHaveLength(0)
    expect(c.error.value).toBe('Err')
  })
})

// ─── updatePostContent ───────────────────────────────────────────────────────

describe('updatePostContent', () => {
  it('returns true on success', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({ update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }),
    }))
    const c = useSocialPublisher()
    expect(await c.updatePostContent('p1', { es: 'New' })).toBe(true)
    expect(c.loading.value).toBe(false)
  })

  it('returns false on failure', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({ update: () => ({ eq: () => Promise.resolve({ data: null, error: new Error('Fail') }) }) }),
    }))
    const c = useSocialPublisher()
    expect(await c.updatePostContent('p1', { es: 'X' })).toBe(false)
    expect(c.error.value).toBe('Fail')
  })
})

// ─── generatePostContent ─────────────────────────────────────────────────────

describe('generatePostContent', () => {
  const vehicle = { title: 'Volvo FH', price_cents: 5000000, location: 'Madrid', slug: 'volvo-fh' }

  it('LinkedIn ES', () => {
    const c = useSocialPublisher()
    const content = c.generatePostContent(vehicle, 'linkedin', 'es')
    expect(content).toContain('Nuevo en Tracciona')
    expect(content).toContain('#vehiculosindustriales')
  })

  it('LinkedIn EN', () => {
    const c = useSocialPublisher()
    const content = c.generatePostContent(vehicle, 'linkedin', 'en')
    expect(content).toContain('New on Tracciona')
    expect(content).toContain('#industrialvehicles')
  })

  it('Facebook ES', () => {
    const c = useSocialPublisher()
    expect(c.generatePostContent(vehicle, 'facebook', 'es')).toContain('Nuevo vehiculo')
  })

  it('Facebook EN', () => {
    const c = useSocialPublisher()
    expect(c.generatePostContent(vehicle, 'facebook', 'en')).toContain('New vehicle')
  })

  it('Instagram ES', () => {
    const c = useSocialPublisher()
    const content = c.generatePostContent(vehicle, 'instagram', 'es')
    expect(content).toContain('disponible en Tracciona')
    expect(content).toContain('#vehiculosindustriales')
  })

  it('Instagram EN', () => {
    const c = useSocialPublisher()
    expect(c.generatePostContent(vehicle, 'instagram', 'en')).toContain('available on Tracciona')
  })

  it('X ES', () => {
    const c = useSocialPublisher()
    const content = c.generatePostContent(vehicle, 'x', 'es')
    expect(content).toContain('Volvo FH')
    expect(content).toContain('vehiculo/volvo-fh')
  })

  it('X EN', () => {
    const c = useSocialPublisher()
    expect(c.generatePostContent(vehicle, 'x', 'en')).toContain('Volvo FH')
  })

  it('defaults to es locale', () => {
    const c = useSocialPublisher()
    expect(c.generatePostContent(vehicle, 'linkedin')).toContain('#vehiculosindustriales')
  })

  it('uses dash for empty location', () => {
    const c = useSocialPublisher()
    const content = c.generatePostContent({ ...vehicle, location: '' }, 'linkedin', 'es')
    expect(content).toContain(' -')
  })
})
