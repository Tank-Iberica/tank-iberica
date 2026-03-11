import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockGetHeader, mockSetResponseStatus } = vi.hoisted(() => ({
  mockGetHeader: vi.fn(),
  mockSetResponseStatus: vi.fn(),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getHeader: mockGetHeader,
  setResponseStatus: mockSetResponseStatus,
}))

vi.mock('~~/server/utils/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}))

import handler from '../../../server/middleware/bot-detection'

function makeEvent(url: string, method = 'GET') {
  return {
    method,
    node: { req: { url } },
  } as any
}

describe('bot-detection middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetHeader.mockReturnValue(undefined)
  })

  it('skips non-API paths', () => {
    const result = handler(makeEvent('/about'))
    expect(mockSetResponseStatus).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('skips /api/health (allowed path)', () => {
    mockGetHeader.mockReturnValue('sqlmap/1.0')
    const result = handler(makeEvent('/api/health'))
    expect(mockSetResponseStatus).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('skips /api/infra/csp-report', () => {
    mockGetHeader.mockReturnValue('nikto')
    const result = handler(makeEvent('/api/infra/csp-report'))
    expect(mockSetResponseStatus).not.toHaveBeenCalled()
  })

  it('blocks sqlmap scanner', () => {
    mockGetHeader.mockImplementation((_, header: string) =>
      header === 'user-agent' ? 'sqlmap/1.7.12' : undefined,
    )
    const result = handler(makeEvent('/api/vehicles'))
    expect(mockSetResponseStatus).toHaveBeenCalledWith(expect.anything(), 403)
    expect(result).toEqual({ error: 'Forbidden' })
  })

  it('blocks nikto scanner', () => {
    mockGetHeader.mockImplementation((_, header: string) =>
      header === 'user-agent' ? 'Nikto/2.1.6' : undefined,
    )
    handler(makeEvent('/api/vehicles'))
    expect(mockSetResponseStatus).toHaveBeenCalledWith(expect.anything(), 403)
  })

  it('blocks gobuster', () => {
    mockGetHeader.mockImplementation((_, header: string) =>
      header === 'user-agent' ? 'gobuster/3.1.0' : undefined,
    )
    handler(makeEvent('/api/catalog'))
    expect(mockSetResponseStatus).toHaveBeenCalledWith(expect.anything(), 403)
  })

  it('blocks nuclei scanner', () => {
    mockGetHeader.mockImplementation((_, header: string) =>
      header === 'user-agent' ? 'nuclei/2.9.1' : undefined,
    )
    handler(makeEvent('/api/catalog'))
    expect(mockSetResponseStatus).toHaveBeenCalledWith(expect.anything(), 403)
  })

  it('allows normal browser UA', () => {
    mockGetHeader.mockImplementation((_, header: string) =>
      header === 'user-agent'
        ? 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0'
        : undefined,
    )
    const result = handler(makeEvent('/api/vehicles'))
    expect(mockSetResponseStatus).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('allows empty UA (logs but does not block)', () => {
    mockGetHeader.mockReturnValue(undefined)
    const result = handler(makeEvent('/api/vehicles'))
    expect(mockSetResponseStatus).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('blocks case-insensitive: SQLMAP uppercase', () => {
    mockGetHeader.mockImplementation((_, header: string) =>
      header === 'user-agent' ? 'SQLMAP/1.0' : undefined,
    )
    handler(makeEvent('/api/test'))
    expect(mockSetResponseStatus).toHaveBeenCalledWith(expect.anything(), 403)
  })

  it('skips /api/whatsapp/webhook', () => {
    mockGetHeader.mockImplementation((_, header: string) =>
      header === 'user-agent' ? 'masscan' : undefined,
    )
    const result = handler(makeEvent('/api/whatsapp/webhook'))
    expect(mockSetResponseStatus).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })
})
