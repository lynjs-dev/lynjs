// eslint.config.js
import js from '@eslint/js';
import ts from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default [
  // Base JavaScript recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...ts.configs.recommended,

  // Disable rules that conflict with Prettier
  prettier,

  {
    // Common ignore settings
    ignores: [
      'node_modules',
      'dist',
      'coverage',
      '**/*.d.ts',
      '*.config.js',
      '*.config.cjs',
      'packages/**/dist',
      'packages/**/coverage',
    ],

    rules: {
      // Prettier integration: show style issues as warnings only
      'prettier/prettier': 'warn',

      // Error on unused variables, but allow those starting with "_"
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      // Allow "any" but show as a warning
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  {
    // JS, CJS files
    files: ['**/*.js', '**/*.cjs'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
    },
  },

  {
    // TS, TSX files
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: ts.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        // For type-aware linting, specify tsconfig here
        // project: "./tsconfig.json"
      },
    },
  },

  {
    // Relax rules for test files
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
