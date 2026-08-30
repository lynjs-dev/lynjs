import js from '@eslint/js';
import ts from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';

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
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/*.d.ts',
      '**/tmp/**',
      // 설정 파일 전역 무시(원하면 유지)
      // '**/*.config.js',
      // '**/*.config.cjs',
      // '**/*.config.mjs',
    ],
  },

  {
    plugins: { prettier: eslintPluginPrettier },
    rules: {
      // Prettier integration: show style issues as warnings only
      'prettier/prettier': 'error',

      // Error on unused variables, but allow those starting with "_"
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      // Allow "any" but show as a warning
      '@typescript-eslint/no-explicit-any': 'warn',
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
