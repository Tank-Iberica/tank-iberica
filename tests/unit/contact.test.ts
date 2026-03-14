import { describe, it, expect, vi } from 'vitest'

// Stub the composable auto-import used inside getContact()
vi.stubGlobal('useSiteUrl', () => 'https://tracciona.com')

import { getContact } from '../../app/utils/contact'

describe('CONTACT constants (getContact)', () => {
  it('has phone number', () => {
    const contact = getContact()
    expect(contact.phone).toBeTruthy()
    expect(contact.phone).toMatch(/^\+/)
  })

  it('has whatsappNumber without plus sign', () => {
    const contact = getContact()
    expect(contact.whatsappNumber).toBeTruthy()
    expect(contact.whatsappNumber).not.toContain('+')
  })

  it('has email', () => {
    const contact = getContact()
    expect(contact.email).toContain('@')
    expect(contact.email).toContain('tracciona.com')
  })
})
