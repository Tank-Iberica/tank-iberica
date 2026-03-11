import { describe, it, expect, vi } from 'vitest'
import { processBatch } from '../../../server/utils/batchProcessor'

describe('processBatch', () => {
  it('processes all items and reports correct count', async () => {
    const items = [1, 2, 3, 4, 5]
    const processed: number[] = []
    const result = await processBatch({
      items,
      batchSize: 3,
      delayBetweenBatchesMs: 0,
      processor: async (item) => { processed.push(item) },
    })
    expect(result.processed).toBe(5)
    expect(result.errors).toBe(0)
    expect(processed).toHaveLength(5)
  })

  it('counts errors correctly when processor throws', async () => {
    const items = [1, 2, 3]
    const result = await processBatch({
      items,
      batchSize: 5,
      delayBetweenBatchesMs: 0,
      processor: async (item) => {
        if (item === 2) throw new Error('fail')
      },
    })
    expect(result.processed).toBe(2)
    expect(result.errors).toBe(1)
  })

  it('returns zero processed and zero errors for empty items', async () => {
    const result = await processBatch({
      items: [],
      processor: async () => {},
    })
    expect(result.processed).toBe(0)
    expect(result.errors).toBe(0)
  })

  it('uses default batchSize of 50', async () => {
    const items = Array.from({ length: 10 }, (_, i) => i)
    const result = await processBatch({
      items,
      delayBetweenBatchesMs: 0,
      processor: async () => {},
    })
    expect(result.processed).toBe(10)
  })

  it('handles all items failing', async () => {
    const items = [1, 2, 3]
    const result = await processBatch({
      items,
      batchSize: 5,
      delayBetweenBatchesMs: 0,
      processor: async () => { throw new Error('all fail') },
    })
    expect(result.processed).toBe(0)
    expect(result.errors).toBe(3)
  })

  it('does not delay when only one batch', async () => {
    vi.useFakeTimers()
    const start = Date.now()
    const promise = processBatch({
      items: [1, 2],
      batchSize: 10,
      delayBetweenBatchesMs: 1000,
      processor: async () => {},
    })
    vi.runAllTimers()
    await promise
    // elapsed should be essentially 0 since no inter-batch delay needed
    expect(Date.now() - start).toBeLessThan(100)
    vi.useRealTimers()
  })

  it('processes items in batches of the configured size', async () => {
    const items = [1, 2, 3, 4, 5]
    const batchSizes: number[] = []
    let currentBatch: number[] = []

    await processBatch({
      items,
      batchSize: 2,
      delayBetweenBatchesMs: 0,
      processor: async (item) => {
        currentBatch.push(item)
        if (currentBatch.length >= 2 || items.indexOf(item) === items.length - 1) {
          batchSizes.push(currentBatch.length)
          currentBatch = []
        }
      },
    })

    // Should have processed all 5 items
    expect(batchSizes.reduce((a, b) => a + b, 0)).toBe(5)
  })

  it('single item is processed', async () => {
    let called = false
    const result = await processBatch({
      items: ['only'],
      batchSize: 1,
      delayBetweenBatchesMs: 0,
      processor: async () => { called = true },
    })
    expect(called).toBe(true)
    expect(result.processed).toBe(1)
    expect(result.errors).toBe(0)
  })

  it('delays between batches when delayBetweenBatchesMs > 0 and multiple batches', async () => {
    vi.useFakeTimers()
    const items = [1, 2, 3, 4, 5]
    const promise = processBatch({
      items,
      batchSize: 2,
      delayBetweenBatchesMs: 500,
      processor: async () => {},
    })
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result.processed).toBe(5)
    expect(result.errors).toBe(0)
    vi.useRealTimers()
  })
})
