// eslint.config.js
import { cwd } from 'node:process';
import js from '@eslint/js';
import ts from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';

export default [
  // 1) JS 권장
  js.configs.recommended,

  // 2) TS 권장(타입기반 규칙은 꺼둔 기본 recommended)
  ...ts.configs.recommended,

  // 3) Prettier와 충돌하는 규칙 끄기
  prettier,

  // 4) 전역 ignore & 공통 룰
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/*.d.ts',
      'docs/.astro/**',
      // 필요 시 설정 파일 전역 무시도 가능:
      // '**/*.config.js', '**/*.config.cjs', '**/*.config.mjs',
    ],
  },
  {
    plugins: { prettier: eslintPluginPrettier },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // 5) 타입 인지 없이 빠른 TS 린트
  {
    files: ['{src,packages/*}/**/*.{ts,tsx}'],
    languageOptions: {
      parser: ts.parser,
      parserOptions: {
        project: [
          './tsconfig.json', // 루트
          './packages/*/tsconfig.json', // 모든 패키지
        ],
        tsconfigRootDir: cwd(),
      },
    },
  },

  // 6) 테스트 파일 ESLint 적용 완화
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },

  // 7) Node 환경이 필요한 설정 파일들만 별도 적용
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
