import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Atomic Design Token Enforcement is handled by scripts/lint-tokens.js
    // to ensure compliance with MX Performance design tokens.
    rules: {
      // Add project-specific rules here
    }
  }
);
