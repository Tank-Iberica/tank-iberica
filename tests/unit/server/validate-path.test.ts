import { describe, it, expect } from 'vitest'
import { isSafeSlug, isSafeFilename, isPrivateHost } from '../../../server/utils/validatePath'

// ── isSafeSlug ──────────────────────────────────────────────────────────────

describe('isSafeSlug', () => {
  it('allows valid slugs', () => {
    expect(isSafeSlug('volvo-fh-2022')).toBe(true)
    expect(isSafeSlug('iveco-daily')).toBe(true)
    expect(isSafeSlug('abc123')).toBe(true)
    expect(isSafeSlug('a1')).toBe(true)
    expect(isSafeSlug('123abc')).toBe(true)
    expect(isSafeSlug('mercedes-benz-actros-2021')).toBe(true)
  })

  it('rejects single character slugs', () => {
    expect(isSafeSlug('a')).toBe(false)
    expect(isSafeSlug('1')).toBe(false)
  })

  it('rejects slugs starting with hyphen', () => {
    expect(isSafeSlug('-volvo')).toBe(false)
    expect(isSafeSlug('-abc')).toBe(false)
  })

  it('rejects slugs ending with hyphen', () => {
    expect(isSafeSlug('volvo-')).toBe(false)
    expect(isSafeSlug('abc-')).toBe(false)
  })

  it('rejects slugs with uppercase letters', () => {
    expect(isSafeSlug('Volvo-FH')).toBe(false)
    expect(isSafeSlug('ABC')).toBe(false)
  })

  it('rejects slugs with spaces', () => {
    expect(isSafeSlug('volvo fh')).toBe(false)
    expect(isSafeSlug('volvo fh 2022')).toBe(false)
  })

  it('rejects slugs with path separators', () => {
    expect(isSafeSlug('volvo/fh')).toBe(false)
    expect(isSafeSlug('volvo\\fh')).toBe(false)
  })

  it('rejects slugs with path traversal sequences', () => {
    expect(isSafeSlug('../etc/passwd')).toBe(false)
    expect(isSafeSlug('foo/../bar')).toBe(false)
    expect(isSafeSlug('..')).toBe(false)
  })

  it('rejects slugs with null bytes', () => {
    expect(isSafeSlug('volvo\0fh')).toBe(false)
  })

  it('rejects slugs with special characters', () => {
    expect(isSafeSlug('volvo@fh')).toBe(false)
    expect(isSafeSlug('volvo#fh')).toBe(false)
    expect(isSafeSlug('volvo.fh')).toBe(false)
    expect(isSafeSlug('volvo_fh')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isSafeSlug('')).toBe(false)
  })
})

// ── isSafeFilename ──────────────────────────────────────────────────────────

describe('isSafeFilename', () => {
  it('allows valid filenames', () => {
    expect(isSafeFilename('image.jpg')).toBe(true)
    expect(isSafeFilename('photo_001.png')).toBe(true)
    expect(isSafeFilename('document.pdf')).toBe(true)
    expect(isSafeFilename('truck-photo-2024.jpeg')).toBe(true)
    expect(isSafeFilename('file.txt')).toBe(true)
  })

  it('rejects empty filename', () => {
    expect(isSafeFilename('')).toBe(false)
  })

  it('rejects filenames with forward slash', () => {
    expect(isSafeFilename('etc/passwd')).toBe(false)
    expect(isSafeFilename('foo/bar.jpg')).toBe(false)
  })

  it('rejects filenames with backslash', () => {
    expect(isSafeFilename('windows\\system32')).toBe(false)
    expect(isSafeFilename('path\\file.txt')).toBe(false)
  })

  it('rejects filenames with null bytes', () => {
    expect(isSafeFilename('file\0.jpg')).toBe(false)
    expect(isSafeFilename('\0secret')).toBe(false)
  })

  it('rejects path traversal sequences', () => {
    expect(isSafeFilename('../etc/passwd')).toBe(false)
    expect(isSafeFilename('..\\config')).toBe(false)
    expect(isSafeFilename('../../secret.txt')).toBe(false)
  })

  it('rejects filenames starting with dot', () => {
    expect(isSafeFilename('.env')).toBe(false)
    expect(isSafeFilename('.htaccess')).toBe(false)
    expect(isSafeFilename('.ssh')).toBe(false)
  })

  it('rejects filenames exceeding 255 characters', () => {
    expect(isSafeFilename('a'.repeat(256))).toBe(false)
    expect(isSafeFilename('a'.repeat(256) + '.jpg')).toBe(false)
  })

  it('allows filenames at exactly 255 characters', () => {
    expect(isSafeFilename('a'.repeat(255))).toBe(true)
  })

  it('allows filenames with underscores and hyphens', () => {
    expect(isSafeFilename('my_file-name.jpg')).toBe(true)
    expect(isSafeFilename('photo-001_final.png')).toBe(true)
  })
})

// ── isPrivateHost ───────────────────────────────────────────────────────────

describe('isPrivateHost', () => {
  // Loopback
  it('detects localhost (case-insensitive)', () => {
    expect(isPrivateHost('localhost')).toBe(true)
    expect(isPrivateHost('LOCALHOST')).toBe(true)
    expect(isPrivateHost('Localhost')).toBe(true)
  })

  it('detects loopback 127.x.x.x', () => {
    expect(isPrivateHost('127.0.0.1')).toBe(true)
    expect(isPrivateHost('127.255.255.255')).toBe(true)
    expect(isPrivateHost('127.0.0.0')).toBe(true)
  })

  // Class A private (10.x.x.x)
  it('detects class A private (10.x.x.x)', () => {
    expect(isPrivateHost('10.0.0.1')).toBe(true)
    expect(isPrivateHost('10.255.255.255')).toBe(true)
    expect(isPrivateHost('10.100.50.25')).toBe(true)
  })

  // Class B private (172.16-31.x.x)
  it('detects class B private (172.16-31.x.x)', () => {
    expect(isPrivateHost('172.16.0.1')).toBe(true)
    expect(isPrivateHost('172.31.255.255')).toBe(true)
    expect(isPrivateHost('172.20.10.5')).toBe(true)
  })

  it('does NOT flag 172.15.x.x (below range)', () => {
    expect(isPrivateHost('172.15.0.1')).toBe(false)
  })

  it('does NOT flag 172.32.x.x (above range)', () => {
    expect(isPrivateHost('172.32.0.1')).toBe(false)
  })

  // Class C private (192.168.x.x)
  it('detects class C private (192.168.x.x)', () => {
    expect(isPrivateHost('192.168.1.1')).toBe(true)
    expect(isPrivateHost('192.168.0.0')).toBe(true)
    expect(isPrivateHost('192.168.254.254')).toBe(true)
  })

  // Link-local
  it('detects link-local (169.254.x.x)', () => {
    expect(isPrivateHost('169.254.1.1')).toBe(true)
    expect(isPrivateHost('169.254.0.0')).toBe(true)
  })

  // APIPA
  it('detects unspecified address (0.0.0.0)', () => {
    expect(isPrivateHost('0.0.0.0')).toBe(true)
  })

  // IPv6
  it('detects IPv6 loopback (::1)', () => {
    expect(isPrivateHost('::1')).toBe(true)
  })

  it('detects ULA IPv6 (fc00:, fe80:)', () => {
    expect(isPrivateHost('fc00::1')).toBe(true)
    expect(isPrivateHost('FC00::1')).toBe(true)
    expect(isPrivateHost('fe80::1')).toBe(true)
    expect(isPrivateHost('FE80::1')).toBe(true)
  })

  // Public IPs — should return false
  it('allows public IPs', () => {
    expect(isPrivateHost('8.8.8.8')).toBe(false)
    expect(isPrivateHost('1.1.1.1')).toBe(false)
    expect(isPrivateHost('203.0.113.1')).toBe(false)
    expect(isPrivateHost('93.184.216.34')).toBe(false)
  })

  it('allows public domain names', () => {
    expect(isPrivateHost('example.com')).toBe(false)
    expect(isPrivateHost('tracciona.com')).toBe(false)
    expect(isPrivateHost('api.cloudflare.com')).toBe(false)
  })
})
