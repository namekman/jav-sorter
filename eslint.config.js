//  @ts-check
import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    files: ['**/*.{js,ts,tsx}'],
    rules: {
      '@typescript-eslint/array-type': [
        'warn',
        { default: 'array', readonly: 'array' },
      ],
    },
  },
]
