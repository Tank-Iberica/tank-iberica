'use strict'

// Input types that don't benefit from autocomplete
const EXEMPT_TYPES = new Set([
  'hidden',
  'submit',
  'button',
  'reset',
  'image',
  'file',
  'range',
  'color',
  'checkbox',
  'radio',
])

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require autocomplete attribute on input elements for better UX and accessibility',
    },
    schema: [],
    messages: {
      missingAutocomplete:
        'Input element should have an autocomplete attribute. Add autocomplete="off" if not applicable.',
    },
  },
  create(context) {
    // Only applies to .vue files parsed by vue-eslint-parser
    const sourceCode = context.sourceCode ?? context.getSourceCode()
    if (!sourceCode.parserServices?.defineTemplateBodyVisitor) {
      return {}
    }

    return sourceCode.parserServices.defineTemplateBodyVisitor({
      VElement(node) {
        if (node.name !== 'input') return

        // Check if type is exempt
        const typeAttr = node.startTag.attributes.find(
          (attr) =>
            attr.directive === false && attr.key && attr.key.name === 'type',
        )
        if (typeAttr && typeAttr.value && EXEMPT_TYPES.has(typeAttr.value.value)) {
          return
        }

        // Check for dynamic :type that resolves to exempt
        // (can't statically analyze, skip)

        // Check if autocomplete attribute exists (static or dynamic)
        const hasAutocomplete = node.startTag.attributes.some((attr) => {
          if (attr.directive === false) {
            return attr.key && attr.key.name === 'autocomplete'
          }
          // :autocomplete or v-bind:autocomplete
          if (
            attr.directive === true &&
            attr.key &&
            attr.key.name &&
            attr.key.name.name === 'bind' &&
            attr.key.argument &&
            attr.key.argument.name === 'autocomplete'
          ) {
            return true
          }
          return false
        })

        if (!hasAutocomplete) {
          context.report({
            node: node.startTag,
            messageId: 'missingAutocomplete',
          })
        }
      },
    })
  },
}
