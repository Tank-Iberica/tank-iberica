'use strict'

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow .select("*") in Supabase queries — use explicit column names',
    },
    schema: [],
    messages: {
      noSelectStar: 'Use explicit column names instead of .select("*"). This prevents over-fetching and improves query performance.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'select' &&
          node.arguments.length === 1 &&
          node.arguments[0].type === 'Literal' &&
          node.arguments[0].value === '*'
        ) {
          context.report({ node, messageId: 'noSelectStar' })
        }
      },
    }
  },
}
