import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSocialAdminUI } from '../../app/composables/admin/useSocialAdminUI'

// ─── Module mocks ─────────────────────────────────────────────────────────

let mockFetchPosts: ReturnType<typeof vi.fn>
let mockApprovePost: ReturnType<typeof vi.fn>
let mockRejectPost: ReturnType<typeof vi.fn>
let mockPublishPost: ReturnType<typeof vi.fn>
let mockUpdatePostContent: ReturnType<typeof vi.fn>
let mockCreatePendingPosts: ReturnType<typeof vi.fn>
let mockPostsRef: { value: Record<string, unknown>[] }

// ─── Supabase chain helper ─────────────────────────────────────────────────

function makeChainableSupabase(getUserResult = { data: { user: { id: 'admin-1' } } }) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'or', 'eq', 'order', 'gte', 'lte', 'ilike', 'in']
  methods.forEach((m) => {
    chain[m] = () => chain
  })
  chain['limit'] = () => Promise.resolve({ data: [], error: null })

  return {
    from: () => ({ select: () => chain }),
    auth: { getUser: vi.fn().mockResolvedValue(getUserResult) },
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockFetchPosts = vi.fn().mockResolvedValue(undefined)
  mockApprovePost = vi.fn().mockResolvedValue(true)
  mockRejectPost = vi.fn().mockResolvedValue(true)
  mockPublishPost = vi.fn().mockResolvedValue(true)
  mockUpdatePostContent = vi.fn().mockResolvedValue(true)
  mockCreatePendingPosts = vi.fn().mockResolvedValue(['new-id-1', 'new-id-2'])
  mockPostsRef = { value: [] }

  vi.stubGlobal('useSocialPublisher', () => ({
    posts: mockPostsRef,
    loading: { value: false },
    error: { value: null },
    fetchPosts: (...args: unknown[]) => mockFetchPosts(...args),
    approvePost: (...args: unknown[]) => mockApprovePost(...args),
    rejectPost: (...args: unknown[]) => mockRejectPost(...args),
    publishPost: (...args: unknown[]) => mockPublishPost(...args),
    updatePostContent: (...args: unknown[]) => mockUpdatePostContent(...args),
    createPendingPosts: (...args: unknown[]) => mockCreatePendingPosts(...args),
  }))

  vi.stubGlobal('useSupabaseClient', () => makeChainableSupabase())
})

// ─── Fixtures ─────────────────────────────────────────────────────────────

function makePost(overrides: Record<string, unknown> = {}) {
  return {
    id: 'post-1',
    status: 'pending',
    platform: 'linkedin' as const,
    content: { es: 'Contenido en español', en: 'Content in English' },
    vehicles: { brand: 'Volvo', model: 'FH16' },
    created_at: '2026-01-15T12:00:00Z',
    ...overrides,
  }
}

// ─── Initial state ─────────────────────────────────────────────────────────

describe('initial state', () => {
  it('statusFilter starts as "all"', () => {
    const c = useSocialAdminUI()
    expect(c.statusFilter.value).toBe('all')
  })

  it('selectedPost starts as null', () => {
    const c = useSocialAdminUI()
    expect(c.selectedPost.value).toBeNull()
  })

  it('showModal starts as false', () => {
    const c = useSocialAdminUI()
    expect(c.showModal.value).toBe(false)
  })

  it('showGenerateModal starts as false', () => {
    const c = useSocialAdminUI()
    expect(c.showGenerateModal.value).toBe(false)
  })

  it('rejectionReason starts as empty string', () => {
    const c = useSocialAdminUI()
    expect(c.rejectionReason.value).toBe('')
  })

  it('editContent starts as empty string', () => {
    const c = useSocialAdminUI()
    expect(c.editContent.value).toBe('')
  })

  it('actionLoading starts as false', () => {
    const c = useSocialAdminUI()
    expect(c.actionLoading.value).toBe(false)
  })

  it('successMessage starts as null', () => {
    const c = useSocialAdminUI()
    expect(c.successMessage.value).toBeNull()
  })

  it('vehicleSearch starts as empty string', () => {
    const c = useSocialAdminUI()
    expect(c.vehicleSearch.value).toBe('')
  })

  it('selectedVehicle starts as null', () => {
    const c = useSocialAdminUI()
    expect(c.selectedVehicle.value).toBeNull()
  })
})

// ─── filteredPosts / statusCounts ─────────────────────────────────────────

describe('filteredPosts', () => {
  it('returns all posts when statusFilter is "all"', () => {
    mockPostsRef.value = [makePost({ status: 'pending' }), makePost({ id: 'post-2', status: 'approved' })]
    const c = useSocialAdminUI()
    expect(c.filteredPosts.value).toHaveLength(2)
  })

  it('exposes posts from useSocialPublisher', () => {
    mockPostsRef.value = [makePost()]
    const c = useSocialAdminUI()
    expect(c.posts.value).toHaveLength(1)
  })
})

describe('statusCounts', () => {
  it('counts posts by status', () => {
    mockPostsRef.value = [
      makePost({ status: 'pending' }),
      makePost({ id: 'p2', status: 'pending' }),
      makePost({ id: 'p3', status: 'approved' }),
      makePost({ id: 'p4', status: 'posted' }),
    ]
    const c = useSocialAdminUI()
    expect(c.statusCounts.value.all).toBe(4)
    expect(c.statusCounts.value.pending).toBe(2)
    expect(c.statusCounts.value.approved).toBe(1)
    expect(c.statusCounts.value.posted).toBe(1)
    expect(c.statusCounts.value.rejected).toBe(0)
  })
})

// ─── openPostModal / closeModal ────────────────────────────────────────────

describe('openPostModal', () => {
  it('sets selectedPost', () => {
    const post = makePost()
    const c = useSocialAdminUI()
    c.openPostModal(post as never)
    expect(c.selectedPost.value).toBe(post)
  })

  it('sets showModal to true', () => {
    const c = useSocialAdminUI()
    c.openPostModal(makePost() as never)
    expect(c.showModal.value).toBe(true)
  })

  it('sets editContent from post content', () => {
    const c = useSocialAdminUI()
    c.openPostModal(makePost() as never)
    expect(c.editContent.value).toBe('Contenido en español')
  })

  it('resets rejectionReason to empty', () => {
    const c = useSocialAdminUI()
    c.rejectionReason.value = 'old reason'
    c.openPostModal(makePost() as never)
    expect(c.rejectionReason.value).toBe('')
  })
})

describe('closeModal', () => {
  it('sets showModal to false', () => {
    const c = useSocialAdminUI()
    c.openPostModal(makePost() as never)
    c.closeModal()
    expect(c.showModal.value).toBe(false)
  })

  it('clears selectedPost', () => {
    const c = useSocialAdminUI()
    c.openPostModal(makePost() as never)
    c.closeModal()
    expect(c.selectedPost.value).toBeNull()
  })

  it('clears editContent', () => {
    const c = useSocialAdminUI()
    c.openPostModal(makePost() as never)
    c.closeModal()
    expect(c.editContent.value).toBe('')
  })
})

// ─── switchEditLocale ──────────────────────────────────────────────────────

describe('switchEditLocale', () => {
  it('updates editLocale to "en"', () => {
    const c = useSocialAdminUI()
    c.switchEditLocale('en')
    expect(c.editLocale.value).toBe('en')
  })

  it('updates editContent from selectedPost content when switching locale', () => {
    const c = useSocialAdminUI()
    c.selectedPost.value = makePost() as never
    c.switchEditLocale('en')
    expect(c.editContent.value).toBe('Content in English')
  })

  it('sets editContent to empty when selectedPost has no content for locale', () => {
    const c = useSocialAdminUI()
    c.selectedPost.value = makePost({ content: { es: 'Solo español' } }) as never
    c.switchEditLocale('en')
    expect(c.editContent.value).toBe('')
  })
})

// ─── openGenerateModal / closeGenerateModal ────────────────────────────────

describe('openGenerateModal', () => {
  it('sets showGenerateModal to true', () => {
    const c = useSocialAdminUI()
    c.openGenerateModal()
    expect(c.showGenerateModal.value).toBe(true)
  })

  it('resets vehicleSearch to empty', () => {
    const c = useSocialAdminUI()
    c.vehicleSearch.value = 'volvo'
    c.openGenerateModal()
    expect(c.vehicleSearch.value).toBe('')
  })

  it('clears selectedVehicle', () => {
    const c = useSocialAdminUI()
    c.selectedVehicle.value = { id: 'v1' } as never
    c.openGenerateModal()
    expect(c.selectedVehicle.value).toBeNull()
  })
})

describe('closeGenerateModal', () => {
  it('sets showGenerateModal to false', () => {
    const c = useSocialAdminUI()
    c.openGenerateModal()
    c.closeGenerateModal()
    expect(c.showGenerateModal.value).toBe(false)
  })

  it('clears selectedVehicle', () => {
    const c = useSocialAdminUI()
    c.selectedVehicle.value = { id: 'v1' } as never
    c.closeGenerateModal()
    expect(c.selectedVehicle.value).toBeNull()
  })
})

// ─── handleApprove ────────────────────────────────────────────────────────

describe('handleApprove', () => {
  it('calls approvePost with postId and userId', async () => {
    const c = useSocialAdminUI()
    await c.handleApprove('post-1')
    expect(mockApprovePost).toHaveBeenCalledWith('post-1', 'admin-1')
  })

  it('sets successMessage after successful approval', async () => {
    const c = useSocialAdminUI()
    await c.handleApprove('post-1')
    expect(c.successMessage.value).toBeTruthy()
  })

  it('calls fetchPosts to refresh after approval', async () => {
    const c = useSocialAdminUI()
    await c.handleApprove('post-1')
    expect(mockFetchPosts).toHaveBeenCalled()
  })

  it('does not call approvePost when getUser returns null', async () => {
    vi.stubGlobal('useSupabaseClient', () => makeChainableSupabase({ data: { user: null } }))
    const c = useSocialAdminUI()
    await c.handleApprove('post-1')
    expect(mockApprovePost).not.toHaveBeenCalled()
  })
})

// ─── handleReject ─────────────────────────────────────────────────────────

describe('handleReject', () => {
  it('calls rejectPost with postId and reason', async () => {
    const c = useSocialAdminUI()
    c.rejectionReason.value = 'Contenido inapropiado'
    await c.handleReject('post-1')
    expect(mockRejectPost).toHaveBeenCalledWith('post-1', 'Contenido inapropiado')
  })

  it('does not call rejectPost when rejectionReason is empty', async () => {
    const c = useSocialAdminUI()
    c.rejectionReason.value = ''
    await c.handleReject('post-1')
    expect(mockRejectPost).not.toHaveBeenCalled()
  })

  it('sets successMessage after successful rejection', async () => {
    const c = useSocialAdminUI()
    c.rejectionReason.value = 'Contenido inapropiado'
    await c.handleReject('post-1')
    expect(c.successMessage.value).toBeTruthy()
  })
})

// ─── handlePublish ────────────────────────────────────────────────────────

describe('handlePublish', () => {
  it('calls publishPost with postId', async () => {
    const c = useSocialAdminUI()
    await c.handlePublish('post-1')
    expect(mockPublishPost).toHaveBeenCalledWith('post-1')
  })

  it('sets successMessage after publishing', async () => {
    const c = useSocialAdminUI()
    await c.handlePublish('post-1')
    expect(c.successMessage.value).toBeTruthy()
  })
})

// ─── handleSaveContent ────────────────────────────────────────────────────

describe('handleSaveContent', () => {
  it('calls updatePostContent with merged content', async () => {
    const c = useSocialAdminUI()
    c.selectedPost.value = makePost() as never
    c.editLocale.value = 'es'
    c.editContent.value = 'Nuevo contenido editado'
    await c.handleSaveContent()
    expect(mockUpdatePostContent).toHaveBeenCalledWith(
      'post-1',
      expect.objectContaining({ es: 'Nuevo contenido editado' }),
    )
  })

  it('does nothing when selectedPost is null', async () => {
    const c = useSocialAdminUI()
    c.selectedPost.value = null
    await c.handleSaveContent()
    expect(mockUpdatePostContent).not.toHaveBeenCalled()
  })
})

// ─── refreshPosts ─────────────────────────────────────────────────────────

describe('refreshPosts', () => {
  it('calls fetchPosts with empty filters when statusFilter is "all"', async () => {
    const c = useSocialAdminUI()
    await c.refreshPosts()
    expect(mockFetchPosts).toHaveBeenCalledWith({})
  })

  it('calls fetchPosts with status filter when statusFilter is set', async () => {
    const c = useSocialAdminUI()
    c.statusFilter.value = 'pending'
    await c.refreshPosts()
    expect(mockFetchPosts).toHaveBeenCalledWith({ status: 'pending' })
  })
})

// ─── Helper functions ─────────────────────────────────────────────────────

describe('getVehicleTitle', () => {
  it('returns brand + model from post vehicles', () => {
    const c = useSocialAdminUI()
    const post = makePost({ vehicles: { brand: 'Volvo', model: 'FH16' } })
    expect(c.getVehicleTitle(post as never)).toBe('Volvo FH16')
  })

  it('returns "-" when post has no vehicles', () => {
    const c = useSocialAdminUI()
    const post = makePost({ vehicles: null })
    expect(c.getVehicleTitle(post as never)).toBe('-')
  })
})

describe('truncateContent', () => {
  it('returns content truncated to maxLen', () => {
    const c = useSocialAdminUI()
    const post = makePost({ content: { es: 'A'.repeat(200) } })
    const result = c.truncateContent(post as never, 50)
    expect(result.length).toBeLessThanOrEqual(53) // 50 + "..."
  })

  it('returns full content when shorter than maxLen', () => {
    const c = useSocialAdminUI()
    const post = makePost({ content: { es: 'Short text' } })
    expect(c.truncateContent(post as never, 100)).toBe('Short text')
  })
})

describe('formatDate', () => {
  it('returns "-" for null date', () => {
    const c = useSocialAdminUI()
    expect(c.formatDate(null)).toBe('-')
  })

  it('returns formatted date string for valid date', () => {
    const c = useSocialAdminUI()
    const result = c.formatDate('2026-01-15T12:00:00Z')
    expect(typeof result).toBe('string')
    expect(result).not.toBe('-')
  })
})

describe('getPlatformLabel', () => {
  it('returns "LinkedIn" for "linkedin"', () => {
    const c = useSocialAdminUI()
    expect(c.getPlatformLabel('linkedin')).toBe('LinkedIn')
  })

  it('returns "Facebook" for "facebook"', () => {
    const c = useSocialAdminUI()
    expect(c.getPlatformLabel('facebook')).toBe('Facebook')
  })

  it('returns "X" for "x"', () => {
    const c = useSocialAdminUI()
    expect(c.getPlatformLabel('x')).toBe('X')
  })
})

describe('getPlatformClass', () => {
  it('returns "platform-linkedin" for linkedin', () => {
    const c = useSocialAdminUI()
    expect(c.getPlatformClass('linkedin')).toBe('platform-linkedin')
  })
})

describe('getStatusClass', () => {
  it('returns "status-pending" for pending', () => {
    const c = useSocialAdminUI()
    expect(c.getStatusClass('pending')).toBe('status-pending')
  })

  it('returns "status-approved" for approved', () => {
    const c = useSocialAdminUI()
    expect(c.getStatusClass('approved')).toBe('status-approved')
  })

  it('returns "status-pending" for unknown status', () => {
    const c = useSocialAdminUI()
    expect(c.getStatusClass('unknown')).toBe('status-pending')
  })
})
