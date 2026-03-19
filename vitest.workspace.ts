import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  // Unit tests — happy-dom, no DB required
  {
    extends: './vitest.config.ts',
    test: {
      name: 'unit',
      include: ['tests/unit/**/*.test.ts', 'tests/security/**/*.test.ts'],
    },
  },
  // Integration tests — node env, requires TEST_DATABASE_URL
  {
    test: {
      name: 'integration',
      environment: 'node',
      include: ['tests/integration/**/*.test.ts'],
      setupFiles: ['tests/integration/setup-vitest.ts'],
      testTimeout: 30_000,
    },
  },
])
