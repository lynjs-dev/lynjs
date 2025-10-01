import { cwd } from 'node:process';
import js from '@eslint/js';
import ts from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  prettier,

  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/*.d.ts', 'docs/.astro/**'],
  },
  {
    plugins: { prettier: eslintPluginPrettier },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'off', // allow @ts-ignore
    },
  },

  // Fast TS linting without type information
  {
    files: ['{src,packages/src}/**/*.{ts,tsx}'],
    languageOptions: {
      parser: ts.parser,
      parserOptions: {
        project: [
          './tsconfig.json', // root tsconfig
          './packages/*/tsconfig.json', // tsconfig for each package
        ],
        tsconfigRootDir: cwd(),
      },
    },
  },

  // Relax linting rules for test files
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },

  // Apply Node-specific globals only for config files
  {
    files: ['*.config.cjs', '*.config.mjs', '*.config.ts', '.releaserc.cjs', 'commitlint.config.cjs'],
    languageOptions: {
      globals: {
        module: 'readonly',
        process: 'readonly',
        require: 'readonly',
      },
    },
  },
];
