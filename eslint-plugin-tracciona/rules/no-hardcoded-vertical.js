'use strict'

const HARDCODED_PATTERNS = [
  'tracciona',
  'tank-iberica',
  'tank iberica',
  'tankiberica',
  'vehiculos-industriales',
  'vehículos industriales',
]

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded vertical-specific references — use vertical_config from DB',
    },
    schema: [],
    messages: {
      noHardcodedVertical: 'Hardcoded vertical reference "{{value}}" found. Use vertical_config from database instead for multi-vertical support.',
    },
  },
  create(context) {
    const filename = context.filename || context.getFilename()
    // Skip config files, tests, migrations, docs
    if (
      filename.includes('node_modules') ||
      filename.includes('.test.') ||
      filename.includes('.spec.') ||
      filename.includes('migrations') ||
      filename.includes('nuxt.config') ||
      filename.includes('CLAUDE.md') ||
      filename.includes('siteConfig') // siteConfig is the canonical source
    ) {
      return {}
    }

    return {
      Literal(node) {
        if (typeof node.value !== 'string') return
        const lower = node.value.toLowerCase()
        for (const pattern of HARDCODED_PATTERNS) {
          if (lower.includes(pattern)) {
            context.report({
              node,
              messageId: 'noHardcodedVertical',
              data: { value: node.value },
            })
            break
          }
        }
      },
      TemplateLiteral(node) {
        for (const quasi of node.quasis) {
          const lower = quasi.value.raw.toLowerCase()
          for (const pattern of HARDCODED_PATTERNS) {
            if (lower.includes(pattern)) {
              context.report({
                node,
                messageId: 'noHardcodedVertical',
                data: { value: quasi.value.raw.substring(0, 40) },
              })
              return
            }
          }
        }
      },
    }
  },
}
