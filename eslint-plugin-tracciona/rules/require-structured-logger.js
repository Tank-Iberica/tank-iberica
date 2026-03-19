'use strict'

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce use of structured logger instead of console.* in server code',
    },
    schema: [],
    messages: {
      useLogger: 'Use `logger` from server/utils/logger.ts instead of console.{{method}}(). Structured logging provides context, levels, and filtering.',
    },
  },
  create(context) {
    const filename = context.filename || context.getFilename()
    // Only enforce in server/ code, not in utils/logger.ts itself
    if (!filename.includes('server/') && !filename.includes('server\\')) return {}
    if (filename.includes('logger.ts') || filename.includes('logger.js')) return {}
    if (filename.includes('.test.') || filename.includes('.spec.')) return {}

    return {
      MemberExpression(node) {
        if (
          node.object.type === 'Identifier' &&
          node.object.name === 'console' &&
          node.property.type === 'Identifier' &&
          ['log', 'error', 'warn', 'debug'].includes(node.property.name)
        ) {
          context.report({
            node,
            messageId: 'useLogger',
            data: { method: node.property.name },
          })
        }
      },
    }
  },
}
