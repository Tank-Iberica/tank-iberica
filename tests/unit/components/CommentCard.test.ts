/**
 * Tests for app/components/admin/comentarios/CommentCard.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import CommentCard from '../../../app/components/admin/comentarios/CommentCard.vue'

const baseComment = {
  id: 'c-1',
  article_id: 'a-1',
  author_name: 'Juan',
  author_email: 'juan@test.com',
  content: 'Great article!',
  status: 'pending' as const,
  parent_id: null as string | null,
  created_at: '2026-01-01T00:00:00Z',
}

const statusColors = {
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  spam: '#f97316',
}

const statusLabels = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  spam: 'Spam',
}

describe('CommentCard', () => {
  const factory = (overrides: Partial<typeof baseComment> = {}, extra: { isExpanded?: boolean; actionLoading?: string | null } = {}) =>
    shallowMount(CommentCard, {
      props: {
        comment: { ...baseComment, ...overrides },
        isExpanded: extra.isExpanded ?? false,
        actionLoading: extra.actionLoading ?? null,
        statusColors,
        statusLabels,
      },
    })

  it('renders author name and avatar', () => {
    const w = factory()
    expect(w.find('.author-name').text()).toBe('Juan')
    expect(w.find('.author-avatar').text()).toBe('J')
  })

  it('renders author email', () => {
    const w = factory()
    expect(w.find('.author-email').text()).toBe('juan@test.com')
  })

  it('hides email when not provided', () => {
    const w = factory({ author_email: undefined })
    expect(w.find('.author-email').exists()).toBe(false)
  })

  it('displays comment content', () => {
    const w = factory()
    expect(w.find('.comment-content').text()).toBe('Great article!')
  })

  it('shows status badge with correct label', () => {
    const w = factory({ status: 'approved' })
    expect(w.find('.status-badge').text()).toBe('Aprobado')
  })

  it('applies pending CSS class for pending comments', () => {
    const w = factory({ status: 'pending' })
    expect(w.find('.comment-card').classes()).toContain('comment-pending')
  })

  it('does not apply pending class for approved comments', () => {
    const w = factory({ status: 'approved' })
    expect(w.find('.comment-card').classes()).not.toContain('comment-pending')
  })

  it('shows reply indicator for replies', () => {
    const w = factory({ parent_id: 'parent-1' })
    expect(w.find('.reply-indicator').exists()).toBe(true)
  })

  it('hides reply indicator for top-level comments', () => {
    const w = factory({ parent_id: null })
    expect(w.find('.reply-indicator').exists()).toBe(false)
  })

  it('shows expand button for long content', () => {
    const w = factory({ content: 'X'.repeat(201) })
    expect(w.find('.expand-btn').exists()).toBe(true)
  })

  it('hides expand button for short content', () => {
    const w = factory({ content: 'Short' })
    expect(w.find('.expand-btn').exists()).toBe(false)
  })

  it('emits toggleExpand on expand button click', async () => {
    const w = factory({ content: 'X'.repeat(201) })
    await w.find('.expand-btn').trigger('click')
    expect(w.emitted('toggleExpand')).toEqual([['c-1']])
  })

  it('applies content-expanded class when expanded', () => {
    const w = factory({}, { isExpanded: true })
    expect(w.find('.comment-content').classes()).toContain('content-expanded')
  })

  // ── Action buttons ──

  it('shows approve button for non-approved comments', () => {
    const w = factory({ status: 'pending' })
    expect(w.find('.action-approve').exists()).toBe(true)
  })

  it('hides approve button for approved comments', () => {
    const w = factory({ status: 'approved' })
    expect(w.find('.action-approve').exists()).toBe(false)
  })

  it('shows reject button for non-rejected comments', () => {
    const w = factory({ status: 'pending' })
    expect(w.find('.action-reject').exists()).toBe(true)
  })

  it('hides reject button for rejected comments', () => {
    const w = factory({ status: 'rejected' })
    expect(w.find('.action-reject').exists()).toBe(false)
  })

  it('emits updateStatus on approve click', async () => {
    const w = factory({ status: 'pending' })
    await w.find('.action-approve').trigger('click')
    expect(w.emitted('updateStatus')).toEqual([['c-1', 'approved']])
  })

  it('emits updateStatus on reject click', async () => {
    const w = factory({ status: 'pending' })
    await w.find('.action-reject').trigger('click')
    expect(w.emitted('updateStatus')).toEqual([['c-1', 'rejected']])
  })

  it('emits confirmDelete on delete click', async () => {
    const w = factory()
    await w.find('.action-delete').trigger('click')
    const emitted = w.emitted('confirmDelete')
    expect(emitted).toHaveLength(1)
    expect(emitted![0][0]).toMatchObject({ id: 'c-1' })
  })

  it('disables action buttons when loading', () => {
    const w = factory({}, { actionLoading: 'c-1' })
    const buttons = w.findAll('.action-btn')
    buttons.forEach((btn) => {
      expect(btn.attributes('disabled')).toBeDefined()
    })
  })

  it('uses fallback for missing author name', () => {
    const w = factory({ author_name: undefined })
    expect(w.find('.author-name').text()).toBe('admin.comments.anonymous')
    expect(w.find('.author-avatar').text()).toBe('A')
  })

  it('emits updateStatus with spam on spam click', async () => {
    const w = factory({ status: 'pending' })
    await w.find('.action-spam').trigger('click')
    expect(w.emitted('updateStatus')).toEqual([['c-1', 'spam']])
  })
})
