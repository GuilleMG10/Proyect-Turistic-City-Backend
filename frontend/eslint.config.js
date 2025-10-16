import { defineConfig } from 'eslint/config'
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default defineConfig([
  // ignores globales
  { ignores: ['dist'] },

  // plugins
  {
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@typescript-eslint': tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: globals.browser,
    },
  },

  // reglas base JS
  {
    rules: {
      ...js.configs.recommended.rules,
    },
  },

  // reglas TS/TSX
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactHooks.configs?.recommended?.rules,
      ...reactRefresh.configs?.vite?.rules,
    },
  },
])