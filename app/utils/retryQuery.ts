export async function retryQuery<T>(
  queryFn: () => Promise<T>,
  maxRetries: number = 2,
  delayMs: number = 500,
): Promise<T> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn()
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)))
      }
    }
  }
  throw lastError
}
