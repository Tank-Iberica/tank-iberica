import { createConfigForNuxt } from '@nuxt/eslint-config/flat'
import vueA11y from 'eslint-plugin-vuejs-accessibility'

export default createConfigForNuxt({
  features: {
    tooling: true,
  },
})
  .append(vueA11y.configs['flat/recommended'])
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
