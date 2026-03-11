import { describe, it, expect, beforeEach } from 'vitest'
import {
  checkSessionBinding,
  removeSessionBinding,
  getSessionBindingStoreSize,
  clearSessionBindingStore,
} from '../../../server/utils/sessionBinding'

describe('sessionBinding', () => {
  beforeEach(() => {
    clearSessionBindingStore()
  })

  it('allows first request for a session', () => {
    expect(checkSessionBinding('sess-1', '1.2.3.4', 'Mozilla/5.0')).toBe('ok')
    expect(getSessionBindingStoreSize()).toBe(1)
  })

  it('allows same IP and UA', () => {
    checkSessionBinding('sess-1', '1.2.3.4', 'Mozilla/5.0')
    expect(checkSessionBinding('sess-1', '1.2.3.4', 'Mozilla/5.0')).toBe('ok')
  })

  it('allows IP-only change (VPN, mobile network)', () => {
    checkSessionBinding('sess-1', '1.2.3.4', 'Mozilla/5.0')
    expect(checkSessionBinding('sess-1', '5.6.7.8', 'Mozilla/5.0')).toBe('ok')
  })

  it('allows UA-only change (browser update)', () => {
    checkSessionBinding('sess-1', '1.2.3.4', 'Mozilla/5.0')
    expect(checkSessionBinding('sess-1', '1.2.3.4', 'Mozilla/6.0 Updated')).toBe('ok')
  })

  it('flags suspicious when both IP and UA change simultaneously', () => {
    checkSessionBinding('sess-1', '1.2.3.4', 'Mozilla/5.0')
    expect(checkSessionBinding('sess-1', '9.9.9.9', 'Totally Different Browser')).toBe('suspicious')
  })

  it('allows gradual changes (IP changes, then later UA changes)', () => {
    checkSessionBinding('sess-1', '1.2.3.4', 'Mozilla/5.0')
    // IP changes
    expect(checkSessionBinding('sess-1', '5.6.7.8', 'Mozilla/5.0')).toBe('ok')
    // Then UA changes (IP is now 5.6.7.8)
    expect(checkSessionBinding('sess-1', '5.6.7.8', 'New Browser')).toBe('ok')
  })

  it('tracks separate sessions independently', () => {
    checkSessionBinding('sess-1', '1.2.3.4', 'Browser A')
    checkSessionBinding('sess-2', '5.6.7.8', 'Browser B')
    // sess-1 with different IP but same UA → ok
    expect(checkSessionBinding('sess-1', '9.9.9.9', 'Browser A')).toBe('ok')
    // sess-2 with both different → suspicious
    expect(checkSessionBinding('sess-2', '1.1.1.1', 'Browser A')).toBe('suspicious')
  })

  it('removeSessionBinding deletes the entry', () => {
    checkSessionBinding('sess-1', '1.2.3.4', 'Mozilla/5.0')
    expect(getSessionBindingStoreSize()).toBe(1)
    removeSessionBinding('sess-1')
    expect(getSessionBindingStoreSize()).toBe(0)
  })

  it('after removal, next request creates fresh fingerprint', () => {
    checkSessionBinding('sess-1', '1.2.3.4', 'Mozilla/5.0')
    removeSessionBinding('sess-1')
    // Same session ID but completely different fingerprint → ok (fresh start)
    expect(checkSessionBinding('sess-1', '9.9.9.9', 'Completely New')).toBe('ok')
  })

  it('clearSessionBindingStore clears all', () => {
    checkSessionBinding('a', '1.1.1.1', 'A')
    checkSessionBinding('b', '2.2.2.2', 'B')
    clearSessionBindingStore()
    expect(getSessionBindingStoreSize()).toBe(0)
  })
})
