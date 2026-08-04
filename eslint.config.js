//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'

export default [
  ...tanstackConfig,

  // Rules of React — https://react.dev/reference/rules
  // The TanStack config ships no React rules, so these are added explicitly.
  reactHooks.configs.flat['recommended-latest'],

  // WCAG 2.2 AA static checks. Catches what a linter can see:
  // missing labels, invalid ARIA, click handlers on non-interactive elements.
  {
    files: ['**/*.{jsx,tsx}'],
    ...jsxA11y.flatConfigs.recommended,
  },

  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  {
    ignores: ['eslint.config.js', 'prettier.config.js'],
  },
]
