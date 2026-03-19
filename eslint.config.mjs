import { createConfigForNuxt } from '@nuxt/eslint-config/flat'
import vueA11y from 'eslint-plugin-vuejs-accessibility'
import tracciona from './eslint-plugin-tracciona/index.js'

export default createConfigForNuxt({
  features: {
    tooling: true,
  },
})
  .append(vueA11y.configs['flat/recommended'])
  // ── Tracciona custom rules ──────────────────────────────────────────────
  .append({
    plugins: { tracciona: { rules: tracciona.rules } },
  })
  // no-select-star: prevent .select('*') in Supabase queries
  .append({
    files: ['server/**/*.ts', 'app/**/*.ts', 'app/**/*.vue'],
    ignores: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      'tracciona/no-select-star': 'warn',
    },
  })
  // no-hardcoded-vertical: prevent vertical-specific references
  .append({
    files: ['server/**/*.ts', 'app/**/*.ts', 'app/**/*.vue'],
    ignores: ['**/*.test.ts', '**/siteConfig.*', '**/nuxt.config.*', '**/migrations/**'],
    rules: {
      'tracciona/no-hardcoded-vertical': 'warn',
    },
  })
  // require-jsdoc-exports: enforce JSDoc on exported composables/utils
  .append({
    files: ['app/composables/**/*.ts', 'app/utils/**/*.ts', 'server/utils/**/*.ts'],
    ignores: ['**/*.test.ts', '**/*.d.ts'],
    rules: {
      'tracciona/require-jsdoc-exports': 'warn',
    },
  })
  // max-module-deps: warn when a module has too many imports
  .append({
    files: ['app/composables/**/*.ts', 'server/utils/**/*.ts', 'server/services/**/*.ts'],
    ignores: ['**/*.test.ts'],
    rules: {
      'tracciona/max-module-deps': ['warn', { max: 15 }],
    },
  })
  // Enforce structured logging: no raw console.error/warn in server code.
  // Use logger from server/utils/logger.ts instead.
  .append({
    files: ['server/**/*.ts'],
    ignores: ['server/utils/logger.ts', 'server/**/*.test.ts'],
    rules: {
      'no-console': ['error', { allow: ['info'] }],
    },
  })
  // Exclude k6 load test files (JavaScript, not TypeScript, uses k6 globals)
  // and internal tooling / agent worktrees / build artifacts
  .append({
    ignores: [
      'tests/load/**',
      '.claude/**',
      '.claude/worktrees/**',
      'Tracciona-agent-c/**',
      '.pdf-build/**',
    ],
  })
  // Relax strict TypeScript rules in test files — mocks and stubs legitimately use any/Function
  .append({
    files: ['tests/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-dynamic-delete': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-useless-constructor': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'import/first': 'off',
      'no-undef': 'off',
      'no-useless-escape': 'off',
      'regexp/no-useless-escape': 'off',
      'regexp/strict': 'off',
      'unicorn/escape-case': 'off',
      'unicorn/prefer-number-properties': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  })
  .append({
    ignores: ['docs/**'],
    rules: {
      // Warn instead of error during migration — promote to error once baseline is clean
      'vuejs-accessibility/alt-text': 'warn',
      'vuejs-accessibility/anchor-has-content': 'warn',
      'vuejs-accessibility/aria-props': 'error',
      'vuejs-accessibility/aria-role': 'error',
      'vuejs-accessibility/aria-unsupported-elements': 'error',
      'vuejs-accessibility/click-events-have-key-events': 'warn',
      'vuejs-accessibility/form-control-has-label': 'warn',
      'vuejs-accessibility/heading-has-content': 'warn',
      'vuejs-accessibility/interactive-supports-focus': 'warn',
      'vuejs-accessibility/label-has-for': 'warn',
      'vuejs-accessibility/media-has-caption': 'warn',
      'vuejs-accessibility/mouse-events-have-key-events': 'warn',
      'vuejs-accessibility/no-access-key': 'error',
      'vuejs-accessibility/no-autofocus': 'warn',
      'vuejs-accessibility/no-distracting-elements': 'error',
      'vuejs-accessibility/no-onchange': 'warn',
      'vuejs-accessibility/no-redundant-roles': 'warn',
      'vuejs-accessibility/no-static-element-interactions': 'warn',
      'vuejs-accessibility/role-has-required-aria-props': 'error',
      'vuejs-accessibility/tabindex-no-positive': 'error',
    },
  })
