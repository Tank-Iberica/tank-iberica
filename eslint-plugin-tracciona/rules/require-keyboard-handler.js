'use strict'

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require keyboard event handlers on interactive elements with click handlers',
    },
    schema: [],
    messages: {
      missingKeyboard: 'Element with @click should also have @keydown or @keyup for keyboard accessibility. Add @keydown.enter handler.',
    },
  },
  create() {
    // This rule is a placeholder — Vue template analysis requires
    // vue-eslint-parser which is already configured via @nuxt/eslint-config.
    // The actual keyboard accessibility is enforced by vuejs-accessibility plugin.
    // This rule exists for documentation purposes and future custom logic.
    return {}
  },
}
