import { describe, it, expect } from 'vitest'
import { CONTACT } from '../../app/utils/contact'

describe('CONTACT constants', () => {
  it('has phone number', () => {
    expect(CONTACT.phone).toBeTruthy()
    expect(CONTACT.phone).toMatch(/^\+/)
  })

  it('has whatsappNumber without plus sign', () => {
    expect(CONTACT.whatsappNumber).toBeTruthy()
    expect(CONTACT.whatsappNumber).not.toContain('+')
  })

  it('has email', () => {
    expect(CONTACT.email).toContain('@')
    expect(CONTACT.email).toContain('tracciona.com')
  })
})
