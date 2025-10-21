import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import * as viteTSConfigPaths from 'vite-tsconfig-paths';

console.log('Load package.json...');
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8'));
const VERSION = JSON.stringify(pkg?.version ?? '');
console.log(`LynJS Version: ${VERSION}`);

export default defineConfig({
  define: {
    __LYNJS_DEV__: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',
    __LYNJS_TEST__: process.env.NODE_ENV === 'test',
    __LYNJS_BROWSER__: process.env.NODE_ENV === 'browser',
    __LYNJS_VERSION__: JSON.stringify(pkg?.version ?? ''),
  },

  esbuild: {
    jsx: 'preserve', // disable jsx from being converted by esbuild
  },

  plugins: [viteTSConfigPaths.default()],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  test: {
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules/**', 'dist/**'],
    // environment: 'jsdom',
    browser: {
      enabled: true,
      // headless: true,
      provider: 'playwright',
      instances: [{ browser: 'chromium' }],
    },
  },
});
