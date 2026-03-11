import { describe, it, expect, vi } from 'vitest'
import { retryQuery } from '../../app/utils/retryQuery'

describe('retryQuery', () => {
  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const result = await retryQuery(fn, 0, 0)
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries after failure and succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockResolvedValue('ok')
    const result = await retryQuery(fn, 2, 0)
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('throws after exhausting retries (maxRetries=0 = 1 attempt)', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'))
    await expect(retryQuery(fn, 0, 0)).rejects.toThrow('always fails')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries maxRetries+1 times total', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'))
    await expect(retryQuery(fn, 2, 0)).rejects.toThrow()
    expect(fn).toHaveBeenCalledTimes(3) // 1 initial + 2 retries
  })

  it('passes generic type through', async () => {
    const fn = vi.fn().mockResolvedValue(42)
    const result = await retryQuery<number>(fn, 0, 0)
    expect(result).toBe(42)
  })

  it('succeeds on last retry', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('final')
    const result = await retryQuery(fn, 2, 0)
    expect(result).toBe('final')
    expect(fn).toHaveBeenCalledTimes(3)
  })
})
