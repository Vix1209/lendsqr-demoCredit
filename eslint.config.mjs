// @ts-check
import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  /**
   * Ignore the config file itself
   */
  {
    ignores: ['eslint.config.mjs'],
  },

  /**
   * Base ESLint recommended rules
   */
  eslint.configs.recommended,

  /**
   * TypeScript recommended + type-aware rules
   */
  ...tseslint.configs.recommendedTypeChecked,

  /**
   * Prettier integration
   * - Turns off conflicting ESLint rules
   * - Runs Prettier as an ESLint rule
   */
  prettierRecommended,

  /**
   * Language & environment setup
   */
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  /**
   * Custom rule overrides
   */
  {
    rules: {
      /**
       * TypeScript relaxations
       */
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',

      /**
       * Async safety (useful for backend)
       */
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-misused-promises': 'off',

      /**
       * Unused vars (underscore-safe)
       */
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      /**
       * Prettier formatting
       */
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
        },
      ],
    },
  },
);
