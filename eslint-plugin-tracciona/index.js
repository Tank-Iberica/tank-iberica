'use strict'

const noSelectStar = require('./rules/no-select-star')
const noHardcodedVertical = require('./rules/no-hardcoded-vertical')
const requireStructuredLogger = require('./rules/require-structured-logger')
const requireJsdocExports = require('./rules/require-jsdoc-exports')
const requireKeyboardHandler = require('./rules/require-keyboard-handler')
const noUnsafeExternalScript = require('./rules/no-unsafe-external-script')
const maxModuleDeps = require('./rules/max-module-deps')
const requireAutocomplete = require('./rules/require-autocomplete')

module.exports = {
  rules: {
    'no-select-star': noSelectStar,
    'no-hardcoded-vertical': noHardcodedVertical,
    'require-structured-logger': requireStructuredLogger,
    'require-jsdoc-exports': requireJsdocExports,
    'require-keyboard-handler': requireKeyboardHandler,
    'no-unsafe-external-script': noUnsafeExternalScript,
    'max-module-deps': maxModuleDeps,
    'require-autocomplete': requireAutocomplete,
  },
}
