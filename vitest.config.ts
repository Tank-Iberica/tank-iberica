import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'nuxt-import-meta-transform',
      enforce: 'pre' as const,
      transform(code: string, id: string) {
        const norm = id.replace(/\\/g, '/')
        // Transform import.meta.client/server/dev in all app/ and server/ source files
        if (!norm.includes('/app/') && !norm.includes('/server/')) return
        if (
          !code.includes('import.meta.client') &&
          !code.includes('import.meta.dev') &&
          !code.includes('import.meta.server')
        )
          return
        return code
          .replace(/import\.meta\.client/g, '(true)')
          .replace(/import\.meta\.server/g, '(false)')
          .replace(/import\.meta\.dev/g, '(true)')
      },
    },
  ],
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/integration/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'json', 'json-summary', 'text-summary'],
      reportsDirectory: './coverage',
      reportOnFailure: true,
      all: true,
      include: [
        'app/composables/**/*.ts',
        'app/utils/**/*.ts',
        'app/components/**/*.vue',
        'app/pages/**/*.vue',
        'app/layouts/**/*.vue',
        'app/middleware/**/*.ts',
        'app/plugins/**/*.ts',
        'server/api/**/*.ts',
        'server/services/**/*.ts',
        'server/utils/**/*.ts',
        'server/middleware/**/*.ts',
        'server/routes/**/*.ts',
      ],
      exclude: [
        '**/*.d.ts',
        'types/**',
        '.nuxt/**',
        '.output/**',
        '**/*.config.ts',
        '**/*.config.js',
      ],
    },
  },
  resolve: {
    alias: {
      '#app': resolve(__dirname, 'node_modules/nuxt/dist/app'),
      '#imports': resolve(__dirname, 'tests/stubs/imports.ts'),
      '#supabase/server': resolve(__dirname, 'tests/stubs/supabase-server.ts'),
      '~~': resolve(__dirname, '.'),
      '@@': resolve(__dirname, '.'),
      '~': resolve(__dirname, 'app'),
      '@': resolve(__dirname, 'app'),
    },
  },
})
