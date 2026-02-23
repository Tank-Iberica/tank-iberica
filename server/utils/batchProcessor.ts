/**
 * Process items in batches with configurable size and delay.
 * Prevents overloading DB with too many sequential requests.
 */
export async function processBatch<T>({
  items,
  batchSize = 50,
  delayBetweenBatchesMs = 100,
  processor,
}: {
  items: T[]
  batchSize?: number
  delayBetweenBatchesMs?: number
  processor: (item: T) => Promise<void>
}): Promise<{ processed: number; errors: number }> {
  let processed = 0
  let errors = 0

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)

    await Promise.allSettled(
      batch.map(async (item) => {
        try {
          await processor(item)
          processed++
        } catch {
          errors++
        }
      }),
    )

    if (i + batchSize < items.length && delayBetweenBatchesMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatchesMs))
    }
  }

  return { processed, errors }
}
