import { cwd } from 'node:process';
import js from '@eslint/js';
import ts from 'typescript-eslint';
import * as globals from 'globals';
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

  {
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },

  {
    files: ['packages/babel-preset-lynjs/**/*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
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
    files: ['**/*.test.ts', '**/*.jsx.test.js'],
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
