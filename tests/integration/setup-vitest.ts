/**
 * Vitest setup for integration tests.
 * Ensures DB pool is cleaned up after all tests complete.
 */
import { afterAll } from 'vitest'
import { closePool } from './setup'

afterAll(async () => {
  await closePool()
})
