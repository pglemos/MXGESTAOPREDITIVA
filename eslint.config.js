import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

// MX Performance — ESLint config (Story 3.11 / UX-015)
// Adiciona jsx-a11y para enforcement WCAG 2.1 AA básico em CI.
// Atomic Design Token Enforcement permanece em scripts/lint-tokens.js.
export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.aiox-core/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'scripts/**',
      'src/types/database.generated.ts',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      'jsx-a11y': jsxA11y,
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      // jsx-a11y — Subset WCAG 2.1 AA (Story 3.11)
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/iframe-has-title': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/no-redundant-roles': 'error',
      // NOTE: Story 3.11 / UX-015 + Blitz 48h 2026-05-28 (Orion):
      // Configuração reconhece Input/Select/Textarea custom como controles válidos.
      // Cleanup pontual no Blitz removeu autoFocus + diretivas eslint-disable mortas.
      'jsx-a11y/label-has-associated-control': ['warn', {
        labelComponents: ['Label'],
        labelAttributes: ['htmlFor'],
        controlComponents: ['Input', 'Select', 'Textarea', 'select', 'input', 'textarea'],
        assert: 'either',
        depth: 4,
      }],
      // Warnings ainda rastreáveis (cleanup gradual via stories OPS dedicadas)
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/no-autofocus': 'warn',

      // TS-eslint relax — não é foco desta story
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-empty': 'off',
      'no-useless-escape': 'off',
      'no-control-regex': 'off',
      'no-prototype-builtins': 'off',
      'prefer-const': 'off',
      'no-case-declarations': 'off',
      'no-undef': 'off',
      'no-useless-assignment': 'off',
      'no-constant-binary-expression': 'off',
      'no-misleading-character-class': 'off',
      'no-empty-pattern': 'off',
    },
  },
);
