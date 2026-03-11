/**
 * Tests for app/components/ui/ShareButtons.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { computed, ref } from 'vue'

// Use real Vue computed/ref so proxyRefs() in the template unwraps correctly
beforeAll(() => {
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('ref', ref)
})

import ShareButtons from '../../../app/components/ui/ShareButtons.vue'

describe('ShareButtons', () => {
  const factory = (props = {}) =>
    shallowMount(ShareButtons, {
      props: { url: 'https://tracciona.com/v/test', title: 'Test Vehicle', ...props },
      global: {
        mocks: { $t: (key: string) => key },
      },
    })

  it('renders share label', () => {
    const w = factory()
    expect(w.find('.share-label').text()).toBe('share.label')
  })

  it('renders WhatsApp link with encoded URL', () => {
    const w = factory()
    const link = w.find('.share-whatsapp')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toContain('wa.me')
    expect(link.attributes('href')).toContain(encodeURIComponent('https://tracciona.com/v/test'))
  })

  it('renders LinkedIn link with encoded URL', () => {
    const w = factory()
    const link = w.find('.share-linkedin')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toContain('linkedin.com/sharing')
    expect(link.attributes('href')).toContain(encodeURIComponent('https://tracciona.com/v/test'))
  })

  it('renders email link with subject and body', () => {
    const w = factory()
    const link = w.find('.share-email')
    expect(link.attributes('href')).toContain('mailto:')
    expect(link.attributes('href')).toContain(encodeURIComponent('Test Vehicle'))
  })

  it('renders copy button', () => {
    const w = factory()
    expect(w.find('.share-copy').exists()).toBe(true)
  })

  it('has aria-labels on all buttons', () => {
    const w = factory()
    expect(w.find('.share-whatsapp').attributes('aria-label')).toBe('share.whatsapp')
    expect(w.find('.share-linkedin').attributes('aria-label')).toBe('share.linkedin')
    expect(w.find('.share-email').attributes('aria-label')).toBe('share.email')
    expect(w.find('.share-copy').attributes('aria-label')).toBe('share.copyLink')
  })

  it('all share links open in new tab with noopener', () => {
    const w = factory()
    const externalLinks = ['.share-whatsapp', '.share-linkedin']
    externalLinks.forEach((sel) => {
      const link = w.find(sel)
      expect(link.attributes('target')).toBe('_blank')
      expect(link.attributes('rel')).toContain('noopener')
    })
  })

  it('copy button calls navigator.clipboard.writeText on click', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    })

    const w = factory()
    await w.find('.share-copy').trigger('click')
    await vi.dynamicImportSettled()

    expect(writeTextMock).toHaveBeenCalledWith('https://tracciona.com/v/test')
  })
})
