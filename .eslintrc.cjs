const { configure, presets } = require('eslint-kit')

module.exports = configure({
  presets: [
    presets.node(),
    presets.typescript(),
    presets.prettier(),
    presets.imports({ sort: { newline: true } }),
  ],
  extend: {
    rules: {
      "@typescript-eslint/consistent-type-imports": "error"
    }
  }
})
