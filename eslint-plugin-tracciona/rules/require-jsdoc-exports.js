'use strict'

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require JSDoc comments on exported functions in composables and utils',
    },
    schema: [],
    messages: {
      missingJsdoc: 'Exported function "{{name}}" should have a JSDoc comment describing its purpose, parameters, and return value.',
    },
  },
  create(context) {
    const filename = context.filename || context.getFilename()
    // Only enforce in composables/ and utils/
    const isTarget =
      filename.includes('composables/') || filename.includes('composables\\') ||
      filename.includes('utils/') || filename.includes('utils\\')
    if (!isTarget) return {}
    if (filename.includes('.test.') || filename.includes('.spec.')) return {}
    if (filename.includes('node_modules')) return {}

    function hasJsdocBefore(node) {
      const sourceCode = context.sourceCode || context.getSourceCode()
      const comments = sourceCode.getCommentsBefore(node)
      return comments.some(c => c.type === 'Block' && c.value.startsWith('*'))
    }

    return {
      ExportNamedDeclaration(node) {
        if (!node.declaration) return
        const decl = node.declaration

        // export function foo() {}
        if (decl.type === 'FunctionDeclaration' && decl.id) {
          if (!hasJsdocBefore(node)) {
            context.report({
              node,
              messageId: 'missingJsdoc',
              data: { name: decl.id.name },
            })
          }
        }

        // export const foo = () => {}
        if (decl.type === 'VariableDeclaration') {
          for (const declarator of decl.declarations) {
            if (
              declarator.id.type === 'Identifier' &&
              declarator.init &&
              (declarator.init.type === 'ArrowFunctionExpression' ||
               declarator.init.type === 'FunctionExpression')
            ) {
              if (!hasJsdocBefore(node)) {
                context.report({
                  node,
                  messageId: 'missingJsdoc',
                  data: { name: declarator.id.name },
                })
              }
            }
          }
        }
      },
    }
  },
}
