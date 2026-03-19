'use strict'

const DEFAULT_MAX = 15

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Warn when a module has too many import statements, suggesting it should be split',
    },
    schema: [
      {
        type: 'object',
        properties: {
          max: { type: 'integer', minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      tooManyDeps: 'This module has {{count}} imports (max: {{max}}). Consider splitting it into smaller, focused modules.',
    },
  },
  create(context) {
    const max = (context.options[0] && context.options[0].max) || DEFAULT_MAX
    const filename = context.filename || context.getFilename()
    if (filename.includes('.test.') || filename.includes('.spec.')) return {}
    if (filename.includes('node_modules')) return {}

    let importCount = 0

    return {
      ImportDeclaration() {
        importCount++
      },
      'Program:exit'(node) {
        if (importCount > max) {
          context.report({
            node,
            messageId: 'tooManyDeps',
            data: { count: String(importCount), max: String(max) },
          })
        }
      },
    }
  },
}
