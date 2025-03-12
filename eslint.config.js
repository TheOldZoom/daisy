// eslint.config.js
const tsParser = require('@typescript-eslint/parser')
const tsPlugin = require('@typescript-eslint/eslint-plugin')
const prettierPlugin = require('eslint-plugin-prettier')
const prettierConfig = require('eslint-config-prettier')

module.exports = [
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        browser: true,
        node: true,
        es2021: true,
      },
      parser: tsParser,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      'no-unused-vars': 'warn',

      '@typescript-eslint/no-unused-vars': 'warn',

      'prettier/prettier': 'error',
    },
    files: ['src/**/*.js', 'src/**/*.ts'],
    ignores: ['node_modules/**', 'dist/**'],
  },
  prettierConfig,
]
