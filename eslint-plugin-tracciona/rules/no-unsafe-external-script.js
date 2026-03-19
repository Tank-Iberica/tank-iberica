'use strict'

const TRUSTED_DOMAINS = [
  'js.stripe.com',
  'www.googletagmanager.com',
  'www.google-analytics.com',
  'cdn.jsdelivr.net',
  'unpkg.com',
]

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Flag external script URLs that are not in the trusted domains list',
    },
    schema: [],
    messages: {
      untrustedScript: 'External script URL "{{url}}" is not in the trusted domains list. Add it to the allow-list in no-unsafe-external-script rule or use a local copy.',
    },
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value !== 'string') return
        const val = node.value
        if (!val.startsWith('https://') && !val.startsWith('http://')) return
        if (!val.includes('.js') && !val.includes('script')) return

        // Check if it's a known trusted domain
        const isTrusted = TRUSTED_DOMAINS.some(d => val.includes(d))
        if (!isTrusted && (val.endsWith('.js') || val.includes('.js?'))) {
          context.report({
            node,
            messageId: 'untrustedScript',
            data: { url: val.substring(0, 60) },
          })
        }
      },
    }
  },
}
