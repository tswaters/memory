import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import eslintJs from '@eslint/js'
import eslintReact from '@eslint-react/eslint-plugin'

export default defineConfig([
  globalIgnores(['**/dist']),
  {
    files: ['**/*.{mjs,js,jsx}'],
    extends: [eslintJs.configs.recommended],
    rules: {
      'no-unused-vars': 'warn',
      radix: 'warn',
    },
  },
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: {
      sourceType: 'module',
    },
  },
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [eslintReact.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.browser,
        APP_VERSION: false,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      '@eslint-react/rules-of-hooks': 'error',
      '@eslint-react/exhaustive-deps': 'warn',
    },
  },
])
