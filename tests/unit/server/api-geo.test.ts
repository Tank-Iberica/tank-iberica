import { describe, it, expect, vi, beforeAll } from 'vitest'

const mockGetRequestHeader = vi.fn()
const mockSetResponseHeader = vi.fn()

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getRequestHeader: mockGetRequestHeader,
  setResponseHeader: mockSetResponseHeader,
}))

let handler: Function

describe('GET /api/geo', () => {
  beforeAll(async () => {
    vi.resetModules()
    const mod = await import('../../../server/api/geo.get')
    handler = mod.default as Function
  })

  it('returns country from cf-ipcountry header', () => {
    mockGetRequestHeader.mockReturnValue('ES')
    const result = handler({ node: { req: { headers: {} } } })
    expect(result).toEqual({ country: 'ES' })
  })

  it('returns null when cf-ipcountry header is absent', () => {
    mockGetRequestHeader.mockReturnValue(undefined)
    const result = handler({ node: { req: { headers: {} } } })
    expect(result).toEqual({ country: null })
  })

  it('returns null when header is empty string', () => {
    mockGetRequestHeader.mockReturnValue('')
    const result = handler({ node: { req: { headers: {} } } })
    expect(result).toEqual({ country: null })
  })
})
